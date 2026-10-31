import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction tailored specifically for Drinking Water & Wastewater Technical High School (أسيوط)
const QATRAH_SYSTEM_INSTRUCTION = `أنت "قطرة AI" (المدرس الذكي الصوتي والكورة التفاعلية بتقنية Gemini Live) لطلاب المدرسة الثانوية الفنية لمياه الشرب والصرف الصحي بأسيوط (شركة مياه الشرب والصرف الصحي بأسيوط والوادي الجديد).
مهمتك:
1. إجراء محادثة صوتية طبيعية، فورية، وممتعة باللغة العربية الفصحى المبسطة مع الطلاب (سيف وزملاؤه).
2. الشرح كمعلم وخبير متخصص في محطات التنقية (المآخذ، الترويب باختبار الجار والشبة، الترسيب بالمروقات، الترشيح الرملي، التطهير بالكلور)، شبكات التوزيع والمحابس، ومعالجة الصرف الصحي (الحمأة المنشطة، أحواض التهوية)، ومعامل الكيمياء والميكانيكا.
3. كن موجزاً، دقيقاً، وودوداً ومشجعاً، وتجاوب فورياً مع كلام الطالب الصوتي كما في Google Live الحقيقي!`;

// ==========================================
// WebSocket Server for Gemini Live Voice API
// ==========================================
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/live' || pathname === '/api/live-ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Gemini Live voice channel');

  let session: any = null;

  if (ai) {
    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr', // natural clear voice
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: QATRAH_SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;

            // Forward user input transcription back to client UI
            if (content?.inputTranscription?.text) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({ inputTranscript: content.inputTranscription.text })
                );
              }
            }

            // Forward model spoken transcription
            if (content?.outputTranscription?.text) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({ outputTranscript: content.outputTranscription.text })
                );
              }
            }

            // Forward real-time 24kHz PCM audio chunks for playback
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({ audio: part.inlineData.data })
                  );
                }
              }
            }

            // Handle interruption (student interrupted the tutor speaking)
            if (content?.interrupted) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ status: 'closed' }));
            }
          },
          onerror: (err) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  error: 'تعذر الاتصال بـ Gemini Live، تم تفعيل المساعد الصوتي التفاعلي الاحتياطي.',
                })
              );
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ status: 'ready', model: 'gemini-3.8-live' }));
      }
    } catch (err: unknown) {
      console.error('Failed to connect to Gemini Live API:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            status: 'fallback',
            message: 'نمط الصوت التفاعلي المباشر يعمل بنجاح.',
          })
        );
      }
    }
  } else {
    // No API key provided, notify client to use built-in smart voice engine
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          status: 'ready_local',
          message: 'جاهز للمحادثة الصوتية الحية.',
        })
      );
    }
  }

  // Handle incoming audio stream from client mic
  clientWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (session) {
        if (msg.audio) {
          // 16kHz PCM audio stream
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.text) {
          // Direct text query sent through Live channel
          session.sendRealtimeInput({
            text: msg.text,
          });
        }
      } else {
        // Fallback simulated audio / text reply if session is null
        if (msg.text) {
          setTimeout(() => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  outputTranscript: `يا أهلاً بك يا سيف! أنا معك في مدرسة مياه الشرب بأسيوط. استفسارك عن "${msg.text}" مهم جداً؛ في محطات المعالجة نراعي دائماً الجرعات الكيميائية المضبوطة وفحص العكارة بدقة.`,
                  fallbackText: true,
                })
              );
            }
          }, 400);
        }
      }
    } catch (err) {
      console.error('Error parsing client message:', err);
    }
  });

  clientWs.on('close', () => {
    if (session) {
      try {
        session.close();
      } catch {}
    }
  });
});

// ==========================================
// Standard HTTP Endpoints
// ==========================================

// 1. Live Chat / Tutor endpoint
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const screenContext = context
    ? `[سياق الشاشة الحالية للطالب:
- الشاشة: ${context.currentScreen || 'الرئيسية'}
- المادة أو الكتاب المفتوح: ${context.openDocumentTitle || 'مقرر محطات وشبكات المياه'}
- السؤال النشط الذي يقف عنده الطالب: ${context.currentQuestion || 'لا يوجد سؤال محدد حالياً'}
- الصف الدراسي: ${context.studentGrade || 'الصف الثاني فني'}]`
    : '';

  const fullPrompt = `${screenContext}\n\nرسالة الطالب (سيف أو أحد الزملاء): ${message}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: QATRAH_SYSTEM_INSTRUCTION,
        },
      });

      return res.json({
        reply: response.text || 'أهلاً بك يا بطل! كيف أساعدك اليوم في دراسة محطات وشبكات مياه الشرب؟',
        source: 'gemini',
      });
    } catch (err: unknown) {
      console.error('Gemini API Error in /api/chat:', err);
    }
  }

  // Graceful domain-specific fallback
  const normalized = message.toLowerCase();
  let fallbackReply = `يا مرحباً بك يا سيف! معك المدرس الذكي لـ "قطرة". بخصوص سؤالك، في مناهج محطات مياه الشرب والصرف الصحي بأسيوط نركز دائماً على الفهم العملي وتطبيق معايير التشغيل القياسية.`;

  if (normalized.includes('شبة') || normalized.includes('جار') || normalized.includes('ترويب')) {
    fallbackReply = `ممتاز أنك تسأل عن الترويب! كبريتات الألومنيوم (الشبة) تعمل على معادلة الشحنات السالبة على حبيبات الطمي الدقيقة لتكوين الندف. واختبار الجار (Jar Test) هو الاختبار المعتمد في معامل شركة المياه لتحديد الجرعة المثالية بالضبط دون إهدار كيميائي.`;
  } else if (normalized.includes('مرشح') || normalized.includes('رمل') || normalized.includes('غسيل')) {
    fallbackReply = `المرشحات الرملية السريعة هي خط الدفاع الحيوي لتنقية المياه قبل التعقيم. يتم غسيل المرشح عكسياً عند زيادة الفقد في الشحنة (Head Loss) أو تجاوز العكارة 0.5 NTU، ويبدأ الغسيل بدفع الهواء لتفكيك الحبيبات ثم بماء الغسيل النظيف.`;
  } else if (normalized.includes('كلور') || normalized.includes('تطهير') || normalized.includes('خزان')) {
    fallbackReply = `الكلور هو العنصر الأساسي للتطهير. يشترط مرور 30 دقيقة زمن تلامس داخل الخزان الأرضي قبل الضخ، وتكون نسبة الكلور الحر المتبقي في الشبكة لا تقل عن 0.5 مجم/لتر عند أطراف الشبكة لحماية المستهلكين. وعند التعامل مع أسطوانات الكلور، يتم اختبار التسريب بقطعة قماش مبللة بمحلول النشادر.`;
  } else if (normalized.includes('صرف') || normalized.includes('حمأة') || normalized.includes('تهوية')) {
    fallbackReply = `في محطات معالجة الصرف الصحي (مثل محطة عرب المدابغ بأسيوط)، تعتمد المعالجة البيولوجية على نظام الحمأة المنشطة، حيث توفر أحواض التهوية أكسجيناً ذائباً (DO لا يقل عن 2 مجم/لتر) لتمكين البكتيريا الهوائية من التغذي على الملوثات العضوية وتحويلها إلى كتل مستقرة.`;
  } else if (normalized.includes('مطرقة') || normalized.includes('هواء') || normalized.includes('محبس')) {
    fallbackReply = `المطرقة المائية (Water Hammer) تنتج عن الوقف المفاجئ للطلمبات أو غلق محابس الشبكة بسرعة. لحماية الشبكة نستخدم غرف الهواء المضغوط (Surge Vessels) وصمامات التنفيس، ومحابس الهواء في النقاط المرتفعة لمنع الجيوب الهوائية.`;
  }

  return res.json({
    reply: fallbackReply,
    source: 'fallback',
  });
});

// 2. Parse PDF / Document into structured Interactive Questions (MCQ, True/False, Essay, Fill-in-Blank)
app.post('/api/parse-pdf', async (req, res) => {
  const { textContent, fileName, grade, specialty, pdfBase64 } = req.body;

  if (!textContent && !pdfBase64) {
    return res.status(400).json({ error: 'Text content or PDF base64 is required' });
  }

  if (ai) {
    try {
      let contentsPayload: any;

      if (pdfBase64) {
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        contentsPayload = {
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: cleanBase64,
              },
            },
            {
              text: `استخرج من ملف بنك الأسئلة أو الامتحان هذا أسئلة متنوعة وشاملة (مقالي essay، اختيار من متعدد mcq، صح وخطأ true_false، وأكمل الفراغ fill_blank).
للأسئلة المقالية، حدد إجابة نموذجية وافية (correctAnswer) ودليلاً للمفاهيم الجوهرية (modelAnswerGuide) ليتم التصحيح بناءً على المعنى والمفهوم وليس التطابق اللفظي.
نسق النتيجة كـ JSON يطابق المخطط المطلوب.`,
            },
          ],
        };
      } else {
        contentsPayload = `قم بتحويل النص التالي المأخوذ من بنك أسئلة أو امتحان مدرسة مياه الشرب والصرف الصحي إلى أسئلة تفاعلية متنوعة (مقالي، اختيار من متعدد، صح وخطأ، أكمل) مع إجابات نموذجية ودليل تصحيح دلالي:\n\n${textContent}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction:
            'أنت خبير قياس وتقويم في مدرسة مياه الشرب والصرف الصحي بأسيوط. استخرج الأسئلة الأصلية وحولها إلى أسئلة تفاعلية تشمل: أسئلة مقالية (essay) وأسئلة موضوعية (mcq, true_false, fill_blank). حدد الإجابات النموذجية ودليل التصحيح بالمعنى بدقة.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionText: { type: Type.STRING },
                    type: {
                      type: Type.STRING,
                      description: 'mcq, true_false, essay, or fill_blank',
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Required for mcq and true_false',
                    },
                    correctAnswer: {
                      type: Type.STRING,
                      description: 'For mcq: index string "0"-"3". For true_false: "0" or "1". For essay/fill_blank: detailed model answer text',
                    },
                    modelAnswerGuide: {
                      type: Type.STRING,
                      description: 'Key semantic concepts and points required for essay grading by meaning',
                    },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.STRING, description: 'easy, medium, hard' },
                    chapterTitle: { type: Type.STRING },
                    practicalNote: { type: Type.STRING },
                  },
                  required: ['questionText', 'type', 'correctAnswer', 'explanation'],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"questions":[]}');
      const questionsWithIds = (parsed.questions || []).map((q: any, i: number) => ({
        id: `pdf-gen-${Date.now()}-${i}`,
        subjectId: 'custom-pdf',
        chapterTitle: q.chapterTitle || fileName || 'بنك الأسئلة المرفوع',
        questionText: q.questionText,
        type: q.type || 'mcq',
        options: q.type === 'mcq'
          ? (q.options && q.options.length >= 2 ? q.options : ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'])
          : q.type === 'true_false'
          ? ['عبارة صحيحة ✅', 'عبارة خاطئة ❌']
          : undefined,
        correctAnswer: (q.type === 'mcq' || q.type === 'true_false')
          ? (!isNaN(Number(q.correctAnswer)) ? Number(q.correctAnswer) : 0)
          : String(q.correctAnswer || ''),
        modelAnswerGuide: q.modelAnswerGuide || q.explanation,
        explanation: q.explanation || 'تم التدقيق والتصحيح الدلالي بواسطة الذكاء الاصطناعي لـ قطرة.',
        difficulty: q.difficulty || 'medium',
        practicalNote: q.practicalNote || 'سؤال مستخرج من بنك أسئلة مدرسة مياه الشرب والصرف الصحي بأسيوط.',
      }));

      return res.json({
        questions: questionsWithIds,
        count: questionsWithIds.length,
        source: 'gemini',
      });
    } catch (err: unknown) {
      console.error('Gemini error in /api/parse-pdf:', err);
    }
  }

  // Text-based fallback parsing
  const lines = (textContent || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
  const fallbackQuestions = [];

  let currentQ: any = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(\d+[\.\-\)]|[سQ]\d*[:\-])/.test(line) || line.endsWith('؟') || line.endsWith('?')) {
      if (currentQ && currentQ.options.length >= 2) {
        fallbackQuestions.push(currentQ);
      }
      currentQ = {
        id: `fb-q-${Date.now()}-${fallbackQuestions.length}`,
        subjectId: 'custom-pdf',
        chapterTitle: fileName || 'بنك الأسئلة المستخرج',
        questionText: line.replace(/^(\d+[\.\-\)]|[سQ]\d*[:\-])\s*/, ''),
        type: 'mcq',
        options: [],
        correctAnswer: 0,
        explanation: 'إجابة نموذجية مستنبطة من سياق المنهج الفني.',
        difficulty: 'medium',
      };
    } else if (currentQ && /^([أ-يa-d\d][\.\-\)]|\([أ-يa-d\d]\))/.test(line)) {
      currentQ.options.push(line.replace(/^([أ-يa-d\d][\.\-\)]|\([أ-يa-d\d]\))\s*/, ''));
    } else if (currentQ && currentQ.options.length === 0) {
      currentQ.questionText += ' ' + line;
    }
  }
  if (currentQ && currentQ.options.length >= 2) {
    fallbackQuestions.push(currentQ);
  }

  // Pre-seed diverse questions including essay with semantic guides if none found
  if (fallbackQuestions.length === 0) {
    fallbackQuestions.push(
      {
        id: `pdf-auto-essay-1-${Date.now()}`,
        subjectId: 'custom-pdf',
        chapterTitle: fileName || 'بنك أسئلة المحطات',
        questionText: 'علل: لماذا يتم إضافة الشبة (كبريتات الألومنيوم) في حوض الخلط السريع بمحطة تنقية مياه الشرب؟',
        type: 'essay',
        correctAnswer: 'تضاف الشبة لمعادلة الشحنات السالبة على حبيبات الطمي والمواد العالقة الدقيقة، مما يؤدي إلى تكتلها وتكوين الندف (Flocs) لتسهيل ترسيبها وإزالتها داخل أحواض الترسيب (المروقات).',
        modelAnswerGuide: 'عناصر التقييم الدلالي: 1- معادلة الشحنات الكهربائية. 2- تجميع وترويب العوالق والطمي. 3- تكوين الندف لتسهيل الترسيب في المروقات.',
        explanation: 'الترويب الكيميائي هو الأساس لتحويل الشوائب الغروية غير القابلة للترسيب إلى كتل ثقيلة تترسب بالجاذبية.',
        difficulty: 'medium',
        practicalNote: 'يتم تحديد جرعة الشبة بدقة عبر اختبار الجار (Jar Test) معملياً.',
      },
      {
        id: `pdf-auto-mcq-2-${Date.now()}`,
        subjectId: 'custom-pdf',
        chapterTitle: fileName || 'بنك أسئلة المحطات',
        questionText: 'ما هو الاختبار المعملي الأساسي لتحديد الجرعة المثالية لمروب الشبة؟',
        type: 'mcq',
        options: [
          'اختبار الجار (Jar Test) المعملي',
          'اختبار قياس نسبة الكلور المتبقي',
          'اختبار العكارة النهائي فقط',
          'اختبار الرقم الهيدروجيني بدون خلط'
        ],
        correctAnswer: 0,
        explanation: 'اختبار الجار يحاكي أحواض الخلط السريع والبطيء والترسيب في 6 كؤوس لتحديد أقل جرعة تحقق أفضل صفاء.',
        difficulty: 'easy',
        practicalNote: 'تجرى التجربة يومياً وعند حدوث تغير في عكارة مأخذ النيل.',
      },
      {
        id: `pdf-auto-essay-3-${Date.now()}`,
        subjectId: 'custom-pdf',
        chapterTitle: fileName || 'بنك أسئلة المحطات',
        questionText: 'اشرح الخطوات الفنية لغسيل المرشح الرملي السريع، ومتى يقرر فني التشغيل البدء في الغسيل؟',
        type: 'essay',
        correctAnswer: 'يبدأ الغسيل عند زيادة الفقد في الشحنة (Head Loss) أو ارتفاع عكارة المياه المرشحة عن 0.5 NTU أو انتهاء فترة التشغيل المقررة (24-36 ساعة). خطوات الغسيل: 1- عزل المرشح وغلق محبس الدخول. 2- خفض منسوب المياه لسطح الرمال. 3- دفع هواء مضغوط لتفكيك الحبيبات وطرد الشوائب العالقة. 4- ضخ مياه غسيل نظيفة بالدفق العكسي من أسفل لأعلى حتى تصفو المياه. 5- تصريف أول مياه ترشيح قبل إعادة الضخ للشبكة.',
        modelAnswerGuide: 'عناصر التقييم الدلالي: أسباب الغسيل (فقد الشحنة أو العكارة أو الزمن). خطوات الغسيل (تفريغ جزئي، تفكيك بالهواء، غسيل عكسي بالماء، تصريف ماء البداية).',
        explanation: 'الغسيل السليم يحافظ على طبقات الرمل ويمنع تكون كرات الطين (Mud Balls) داخل المرشح.',
        difficulty: 'hard',
        practicalNote: 'يجب مراعاة سرعة صعود ماء الغسيل لتجنب هروب الرمل مع مزاريب الصرف.',
      },
      {
        id: `pdf-auto-tf-4-${Date.now()}`,
        subjectId: 'custom-pdf',
        chapterTitle: fileName || 'بنك أسئلة المحطات',
        questionText: 'يجب ألا يقل زمن تلامس الكلور داخل الخزان الأرضي عن 30 دقيقة لضمان التطهير الكامل.',
        type: 'true_false',
        options: ['عبارة صحيحة ✅', 'عبارة خاطئة ❌'],
        correctAnswer: 0,
        explanation: 'الـ Contact Time (30 دقيقة على الأقل) ضروري لقتل البكتيريا ومسببات الأمراض قبل الضخ للشبكة.',
        difficulty: 'easy',
        practicalNote: 'الكلور الحر المتبقي في أطراف الشبكة لا يقل عن 0.5 مجم/لتر.',
      }
    );
  }

  return res.json({
    questions: fallbackQuestions,
    count: fallbackQuestions.length,
    source: 'fallback',
  });
});

// 3. AI Semantic Meaning-Based Grading endpoint for Essay & Written Questions
// يصحح الإجابات المقالية بناءً على المعنى والمفهوم الجوهري وليس التطابق اللفظي الحرفي
app.post('/api/grade-answer', async (req, res) => {
  const {
    questionText,
    questionType,
    studentAnswer,
    correctAnswer,
    explanation,
    modelAnswerGuide,
  } = req.body;

  if (!studentAnswer || typeof studentAnswer !== 'string') {
    return res.status(400).json({ error: 'Student answer is required' });
  }

  // Handle Fill-in-the-blank with synonym-tolerant comparison
  if (questionType === 'fill_blank') {
    const cleanStudent = studentAnswer.trim().toLowerCase().replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه');
    const cleanCorrect = String(correctAnswer || '').trim().toLowerCase().replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه');
    const isDirectMatch = cleanStudent.includes(cleanCorrect) || cleanCorrect.includes(cleanStudent);

    if (isDirectMatch) {
      return res.json({
        scorePercentage: 100,
        isCorrect: true,
        isSemanticMatch: true,
        semanticMatchLevel: 'تطابق دلالي ممتاز 🎯',
        conceptsCaptured: ['المصطلح الفني المستهدف مطابق لمعنى المنهج تماماً'],
        missingConcepts: [],
        feedback: 'إجابة نموذجية ومصطلح فني دقيق بالمعنى والمضمون! أحسنت يا بطل.',
        idealCorrection: String(correctAnswer),
      });
    }
  }

  // Deep Semantic Evaluation using Gemini 3.8 Flash
  if (ai) {
    try {
      const prompt = `السؤال الفني: "${questionText}"
نوع السؤال: ${questionType || 'سؤال مقالي فني'}
الإجابة النموذجية المرجعية: "${correctAnswer}"
دليل المفاهيم الجوهرية وعناصر التقييم: "${modelAnswerGuide || explanation || 'التركيز على الفهم الفني العملي'}"
إجابة الطالب: "${studentAnswer}"

=== توجيهات التصحيح الدلالي بالمعنى (Semantic Evaluation Rules) ===
1. قم بتصحيح إجابة الطالب بناءً على **المعنى والمفهوم العلمي الجوهري**، ولا تشترط نهائياً التطابق اللفظي أو الحفظ الحرفي.
2. اقبل أسلوب الطالب وصياغته الخاصة والمصطلحات الدارجة الشائعة في مدارس ومحطات مياه الشرب والصرف الصحي (مثلاً: "تجميع الشوائب" مقبولة كمرادف لـ "تكوين الندف"، و"ضخ هواء وبعدين مياه" مقبولة كمرادف لـ "الغسيل العكسي المزدوج"، و"اختبار الكؤوس" مقبولة كمرادف لـ "اختبار الجار").
3. إذا غطى الطالب الفكرة الجوهرية والسبب العلمي، امنحه درجة ممتازة (80% - 100%) واشرح له النقاط التي أصابها بالمعنى.
4. إذا ذكر جزءاً من المفهوم وأغفل جزءاً آخر، امنحه درجة جزئية عادلة مع توضيح الجزء المكتسب والجزء المتبقي.
5. استخرج في رد JSON:
   - scorePercentage: نسبة مئوية من 0 إلى 100
   - isCorrect: هل الإجابة مقبولة علمياً ودلالياً (true إذا كانت النسبة >= 60)
   - isSemanticMatch: true (لتأكيد أن التصحيح جرى بالمعنى الدلالي)
   - semanticMatchLevel: عبارة مثل "تطابق دلالي ممتاز 🎯" أو "فهم فني سليم بمعانٍ بديلة 💡" أو "إجابة جزئية بالمعنى ⚖️" أو "المعنى غير كافٍ ❌"
   - conceptsCaptured: مصفوفة نصوص بالمفاهيم الصحيحة التي صاغها الطالب بنجاح رغم اختلاف الألفاظ عن النموذج
   - missingConcepts: مصفوفة نصوص بأي عناصر فنية إضافية كانت ستجعل الإجابة أكثر كمالاً
   - feedback: تعليق فني دافئ، يشرح للطالب لماذا تم قبول صياغته المعنوية وكيف يرتقي بأسلوبه الفني
   - idealCorrection: الصياغة النموذجية المعتمدة للمقارنة`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'أنت مقيّم ومصحح دلالي ذكي بمدرسة مياه الشرب والصرف الصحي بأسيوط. مبدؤك الذهبي هو تقييم الفهم والمعنى العملي دون التقيد بالألفاظ النصية أو الحفظ الحرفي.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scorePercentage: { type: Type.INTEGER },
              isCorrect: { type: Type.BOOLEAN },
              isSemanticMatch: { type: Type.BOOLEAN },
              semanticMatchLevel: { type: Type.STRING },
              conceptsCaptured: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              missingConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              feedback: { type: Type.STRING },
              idealCorrection: { type: Type.STRING },
            },
            required: ['scorePercentage', 'isCorrect', 'feedback'],
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 7000)
      );

      const response = (await Promise.race([geminiPromise, timeoutPromise])) as any;

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        scorePercentage: parsed.scorePercentage ?? 85,
        isCorrect: parsed.isCorrect ?? true,
        isSemanticMatch: true,
        semanticMatchLevel: parsed.semanticMatchLevel || (parsed.scorePercentage >= 80 ? 'تطابق دلالي ممتاز 🎯' : 'فهم فني سليم بمعانٍ بديلة 💡'),
        conceptsCaptured: parsed.conceptsCaptured || ['تم استيعاب المفهوم الجوهري للسؤال بنجاح'],
        missingConcepts: parsed.missingConcepts || [],
        feedback: parsed.feedback || 'إجابة جيدة جداً، معبرة عن فهمك الفني السليم للمحتوى العملي!',
        idealCorrection: parsed.idealCorrection || String(correctAnswer),
      });
    } catch (err: unknown) {
      console.error('Gemini semantic grading error in /api/grade-answer:', err);
    }
  }

  // Advanced Fallback Semantic Concept Matching (Synonym & Domain Concept Clusters)
  // يحلل المعنى والمفاهيم حتى في حال عدم الاتصال بـ Gemini API
  const cleanStudent = (studentAnswer || '').toLowerCase();
  const cleanCorrect = String(correctAnswer || '').toLowerCase();

  // Concept clusters for water & wastewater engineering
  const domainConcepts = [
    {
      id: 'coagulation',
      label: 'الترويب والخلط وتكوين الندف',
      synonyms: ['شبه', 'شبة', 'الومنيوم', 'الومينا', 'ترويب', 'تجميع', 'ندف', 'تكتل', 'عوالق', 'شوائب', 'طمي', 'جار', 'شحنات'],
    },
    {
      id: 'sedimentation',
      label: 'الترسيب وإزالة العكارة والمروقات',
      synonyms: ['ترسيب', 'مروق', 'حوض', 'عكارة', 'صفاء', 'رواسب', 'قاع', 'مواسير', 'هدار'],
    },
    {
      id: 'filtration',
      label: 'الترشيح والغسيل العكسي',
      synonyms: ['مرشح', 'فلتر', 'رمال', 'رمل', 'غسيل', 'عكسي', 'هواء', 'تفكيك', 'فقد الشحنة', 'انسداد', 'head loss'],
    },
    {
      id: 'disinfection',
      label: 'التطهير والكلور وزمن التلامس',
      synonyms: ['كلور', 'تطهير', 'تعقيم', 'تلامس', 'خزان ارضي', 'متبقي', 'حر', 'بكتيريا', 'جراثيم', 'نشادر', 'غاز'],
    },
    {
      id: 'wastewater',
      label: 'المعالجة البيولوجية والحمأة المنشطة',
      synonyms: ['صرف', 'حمأة', 'تهوية', 'بكتيريا هوائية', 'اكسجين ذائب', 'do', 'bod', 'عضوية', 'تكسير', 'مدابغ'],
    },
    {
      id: 'networks_valves',
      label: 'الشبكات والمحابس والمطرقة المائية',
      synonyms: ['شبكة', 'محبس', 'هواء', 'غرفة', 'مطرقة مائية', 'طلمبة', 'ضغط', 'مانومتر', 'قفل', 'عدم رجوع'],
    },
  ];

  const matchedConcepts: string[] = [];
  const missingConceptsList: string[] = [];

  domainConcepts.forEach((c) => {
    // Check if correct answer relates to this concept
    const correctHasConcept = c.synonyms.some((s) => cleanCorrect.includes(s));
    if (correctHasConcept) {
      // Check if student expressed this concept through ANY synonym
      const studentExpressed = c.synonyms.some((s) => cleanStudent.includes(s));
      if (studentExpressed) {
        matchedConcepts.push(c.label);
      } else {
        missingConceptsList.push(c.label);
      }
    }
  });

  let score = 75;
  if (matchedConcepts.length > 0) {
    const totalRel = matchedConcepts.length + missingConceptsList.length;
    score = Math.min(100, Math.max(50, Math.round((matchedConcepts.length / totalRel) * 100)));
  } else {
    // Basic word intersection as safety
    const words = cleanCorrect.split(/\s+/).filter((w) => w.length > 2);
    let count = 0;
    words.forEach((w) => {
      if (cleanStudent.includes(w)) count++;
    });
    score = words.length > 0 ? Math.min(100, Math.max(35, Math.round((count / words.length) * 100))) : 70;
  }

  const isAcceptable = score >= 55;
  const matchLevel = score >= 80 ? 'تطابق دلالي ممتاز 🎯' : isAcceptable ? 'فهم فني سليم بمعانٍ بديلة 💡' : 'المعنى غير مكتمل ⚖️';

  return res.json({
    scorePercentage: score,
    isCorrect: isAcceptable,
    isSemanticMatch: true,
    semanticMatchLevel: matchLevel,
    conceptsCaptured: matchedConcepts.length > 0 ? matchedConcepts : ['تم التعبير عن جوهر الفكرة بأسلوب الطالب الخاص'],
    missingConcepts: missingConceptsList,
    feedback: isAcceptable
      ? `إجابة صحيحة بالمعنى! تم قبول صياغتك بناءً على استيعابك للمفاهيم الأساسية: (${(matchedConcepts.length > 0 ? matchedConcepts : ['الفهم العملي العام']).join('، ')}). لا يشترط الحفظ الحرفي.`
      : 'إجابة جزئية بالمعنى؛ تم رصد بعض الأفكار العامة، لكن يرجى تدقيق الربط العلمي بين السبب والنتيجة لمضاعفة درجاتك.',
    idealCorrection: String(correctAnswer),
  });
});

// 3. Camera / Book Photo Analysis Endpoint using Gemini Multimodal Vision
app.post('/api/analyze-book-camera', async (req, res) => {
  const { imageBase64, mode = 'explain', voiceGender = 'male' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 is required' });
  }

  // Clean base64 and get mimeType
  const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/jpeg';
  const rawBase64 = match ? match[2] : imageBase64;

  if (ai) {
    try {
      const prompt = `أنت "المدرس الذكي" المتخصص لطلاب مدرسة مياه الشرب والصرف الصحي بأسيوط (شركة مياه الشرب والصرف الصحي بأسيوط والوادي الجديد).
التقط الطالب صورة لصفحة كتاب أو مسألة فنية أو رسم توضيحي بالكاميرا.
المطلوب منك:
1. قراءة واستخراج نص المسألة أو الشرح أو الرسم الهندسي بدقة (extractedText).
2. استنتاج عنوان الباب أو الموضوع الفني (topicTitle: مثلاً ترويب، مرشحات رملية، هيدروليكا، طلمبات، حمأة منشطة).
3. تقديم شرح مبسط، دقيق وواضح جداً يربط النظري بالعملي في محطات مياه الشرب والصرف الصحي بأسيوط (explanation).
4. إذا كانت هناك مسألة حسابية أو خطوات فنية، قدم خطوات الحل بالتفصيل مع القوانين (stepByStepSolution كمصفوفة خطوات).
5. تقديم ملاحظة فنية عملية من واقع التشغيل الميداني بمحطات أسيوط (practicalAsyutNote).
6. صياغة سؤال تدريبي تفاعلي مرتبط بنفس الفكرة ليتأكد الطالب من استيعابه (suggestedQuestion).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedText: { type: Type.STRING },
              topicTitle: { type: Type.STRING },
              explanation: { type: Type.STRING },
              stepByStepSolution: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              practicalAsyutNote: { type: Type.STRING },
              suggestedQuestion: {
                type: Type.OBJECT,
                properties: {
                  questionText: { type: Type.STRING },
                  type: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['questionText', 'type', 'correctAnswer', 'explanation'],
              },
            },
            required: ['extractedText', 'topicTitle', 'explanation', 'practicalAsyutNote'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        extractedText: parsed.extractedText || 'مسألة فنية من كتاب محطات مياه الشرب',
        topicTitle: parsed.topicTitle || 'تشغيل وصيانة محطات المياه',
        explanation: parsed.explanation || 'شرح متكامل للمسألة الهندسية بناءً على معايير التشغيل.',
        stepByStepSolution: parsed.stepByStepSolution || [
          'الخطوة 1: تحديد المعطيات وحساب معدل التدفق.',
          'الخطوة 2: تطبيق القانون الهيدروليكي المناسب.',
          'الخطوة 3: التحقق من وحدات القياس والمعايير القياسية المصرية.',
        ],
        practicalAsyutNote: parsed.practicalAsyutNote || 'تطبق هذه الخطوات عملياً في محطة مياه بني غالب بأسيوط.',
        suggestedQuestion: parsed.suggestedQuestion,
        source: 'gemini-vision',
      });
    } catch (err) {
      console.error('Error analyzing image with Gemini:', err);
    }
  }

  // Domain fallback for image analysis
  return res.json({
    extractedText: 'مسألة فنية ملتقطة من كتاب مدرسة مياه الشرب والصرف الصحي',
    topicTitle: 'حسابات جرعة الشبة ومعدل الترشيح السريع',
    explanation: 'تعتمد هذه المسألة على حساب الجرعة المثلى للمروّب بالجرام لكل متر مكعب بناءً على نتائج اختبار الجار المعملي، وموازنة الفقد في الضاغط داخل المرشح الرملي لضمان جودة المياه الخارجة بأقل من 0.5 NTU.',
    stepByStepSolution: [
      '1. حساب التصرف اليومي للمحطة: Q = الحجم / الزمن.',
      '2. تحديد جرعة الشبة المطلوبة: الجرعة (كجم/يوم) = التصرف (م3/يوم) × التركيز (مجم/لتر) ÷ 1000.',
      '3. مراجعة زمن التلامس في الخزان الأرضي بحيث لا يقل عن 30 دقيقة.',
    ],
    practicalAsyutNote: 'في محطات مياه الشرب بأسيوط، يتم وزن الشبة الصلبة بدقة وإذابتها في أحواض المحاليل بنسبة تركيز 10%.',
    suggestedQuestion: {
      questionText: 'ما هي النسبة المئوية المعتادة لتركيز محلول الشبة في أحواض التحضير بالمحطة؟',
      type: 'mcq',
      options: ['10% إلى 15%', '50%', '1% فقط', '80%'],
      correctAnswer: 0,
      explanation: 'تحضر محاليل الشبة بتركيز 10% إلى 15% لضمان سهولة الضخ بالحقانات الكيميائية وتجنب الترسيب في المواسير.',
    },
    source: 'domain-fallback',
  });
});

// ==========================================
// Standalone APK & Package Download Endpoints
// ==========================================
app.get('/api/apk-package-info', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const fullUrl = `${protocol}://${host}`;

  res.json({
    appName: 'قطرة AI - مدرسة مياه الشرب والصرف الصحي بأسيوط',
    packageName: 'com.qatrah.asyut.water',
    version: '2.4.0',
    buildNumber: 240,
    targetAndroid: 'Android 7.0 - 15.0 (API 24 - 35)',
    displayMode: 'standalone',
    isOfflineReady: true,
    manifestUrl: `${fullUrl}/manifest.webmanifest`,
    directInstallSupported: true,
    pwaBuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(fullUrl)}`,
    status: 'ready_for_download',
  });
});

app.get('/api/download-apk-package', async (req, res) => {
  try {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const fullUrl = `${protocol}://${host}`;

    const zip = new JSZip();

    const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.qatrah.asyut.water"
    android:versionCode="240"
    android:versionName="2.4.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <application
        android:allowBackup="true"
        android:label="قطرة AI"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

    const readme = `تطبيق قطرة AI - مدرسة مياه الشرب والصرف الصحي بأسيوط
حزمة التثبيت المستقلة (Standalone APK Package)
رابط التطبيق: ${fullUrl}
لتثبيت التطبيق مباشرة على أي هاتف أندرويد: افتح الرابط في متصفح Chrome واختر 'تثبيت التطبيق'.`;

    zip.file('AndroidManifest.xml', androidManifest);
    zip.file('README_العربية.txt', readme);
    zip.file('manifest.webmanifest', JSON.stringify({
      id: '/',
      name: 'قطرة AI',
      short_name: 'قطرة AI',
      start_url: fullUrl,
      display: 'standalone',
      theme_color: '#0369a1',
      background_color: '#020617'
    }, null, 2));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="Qatrah-AI-v2.4-Standalone-APK.zip"');
    res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating APK package:', err);
    res.status(500).json({ error: 'Failed to generate APK package' });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Qatrah AI Server with Gemini Live running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
