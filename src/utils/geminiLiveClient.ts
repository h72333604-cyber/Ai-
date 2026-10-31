/**
 * Gemini Live Client
 * Real-time low-latency bidirectional voice client for Gemini Live API
 * Handles 16kHz input audio capture and 24kHz gapless output PCM playback
 */

export interface GeminiLiveCallbacks {
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening') => void;
  onInputTranscript?: (text: string) => void;
  onOutputTranscript?: (text: string) => void;
  onInterrupted?: () => void;
  onError?: (err: string) => void;
  onAudioLevel?: (level: number) => void;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private callbacks: GeminiLiveCallbacks = {};
  private isConnected = false;

  constructor(callbacks: GeminiLiveCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    this.callbacks.onStatusChange?.('connecting');

    try {
      // Connect WebSocket to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.isConnected = true;
        this.callbacks.onStatusChange?.('connected');
        await this.startMicCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.inputTranscript) {
            this.callbacks.onInputTranscript?.(msg.inputTranscript);
          }

          if (msg.outputTranscript) {
            this.callbacks.onOutputTranscript?.(msg.outputTranscript);
          }

          if (msg.audio) {
            this.callbacks.onStatusChange?.('speaking');
            this.playAudioChunk(msg.audio);
          }

          if (msg.interrupted) {
            this.handleInterruption();
          }

          if (msg.error) {
            this.callbacks.onError?.(msg.error);
          }
        } catch (e) {
          console.error('Error handling Gemini Live message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket Live Error:', e);
        this.callbacks.onError?.('خطأ في اتصال القناة الصوتية المباشرة');
      };

      this.ws.onclose = () => {
        this.stop();
      };
    } catch (err: any) {
      console.error('Failed to start Gemini Live:', err);
      this.callbacks.onError?.(err?.message || 'تعذر تشغيل الصوت المباشر');
      this.stop();
    }
  }

  private async startMicCapture() {
    try {
      // Input AudioContext at 16kHz required by Gemini Live
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioCtx.destination);

      this.callbacks.onStatusChange?.('listening');

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        this.callbacks.onAudioLevel?.(Math.min(1, avg * 8));

        // Convert Float32 to 16-bit PCM little-endian
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);
        this.ws.send(JSON.stringify({ audio: base64Audio }));
      };
    } catch (err) {
      console.error('Mic capture error:', err);
      this.callbacks.onError?.('تعذر الوصول إلى الميكروفون لالتقاط الصوت');
    }
  }

  private playAudioChunk(base64Data: string) {
    try {
      if (!this.outputAudioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        // Output at 24kHz required by Gemini Live
        this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      }

      if (this.outputAudioCtx.state === 'suspended') {
        this.outputAudioCtx.resume().catch(() => {});
      }

      const pcmData = this.base64ToInt16Array(base64Data);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);

      // Gapless scheduling
      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.04;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        if (this.activeSources.length === 0) {
          this.callbacks.onStatusChange?.('listening');
        }
      };
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }

  private handleInterruption() {
    this.callbacks.onInterrupted?.();
    this.activeSources.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
    this.callbacks.onStatusChange?.('listening');
  }

  sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  stop() {
    this.isConnected = false;

    // Stop mic stream
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }

    // Stop output audio
    this.handleInterruption();
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }

    // Close WebSocket
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.callbacks.onStatusChange?.('disconnected');
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToInt16Array(base64: string): Int16Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }
}
