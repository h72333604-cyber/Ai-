import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function generatePNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Scanlines: (1 byte filter + width * 4 bytes RGBA) * height
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height * 0.54;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      const dx = (x - cx) / radius;
      const dy = (y - cy) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Droplet shape logic:
      // Drop tip at top (x=cx, y=height*0.18), round body at center-bottom
      const ny = y / height;
      const nx = (x - cx) / (width * 0.5);
      const dropCurve = (ny >= 0.18 && ny <= 0.88) && (
        (ny < 0.55 && Math.abs(nx) <= (ny - 0.18) * 1.1) ||
        (ny >= 0.55 && (nx * nx + Math.pow((ny - 0.6) * 1.6, 2) <= 0.22))
      );

      if (isMaskable) {
        // Full background with dark cyan/slate gradient
        const bgRatio = y / height;
        const r = Math.round(2 + bgRatio * 10);
        const g = Math.round(15 + bgRatio * 30);
        const b = Math.round(40 + bgRatio * 70);

        if (dropCurve) {
          // Bright cyan gradient inside droplet
          const dropGlow = 1 - Math.min(1, Math.abs(nx) * 1.5);
          rawData[pxOffset] = Math.round(6 + dropGlow * 30);
          rawData[pxOffset + 1] = Math.round(182 + dropGlow * 50);
          rawData[pxOffset + 2] = Math.round(212 + dropGlow * 40);
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Circle background with subtle glow
        if (dist <= 1.0) {
          if (dropCurve) {
            // Bright droplet
            rawData[pxOffset] = 34;
            rawData[pxOffset + 1] = 211;
            rawData[pxOffset + 2] = 238;
            rawData[pxOffset + 3] = 255;
          } else {
            // Radial cyan gradient circle
            const t = dist;
            rawData[pxOffset] = Math.round(3 + (1 - t) * 15);
            rawData[pxOffset + 1] = Math.round(70 + (1 - t) * 60);
            rawData[pxOffset + 2] = Math.round(140 + (1 - t) * 80);
            rawData[pxOffset + 3] = 255;
          }
        } else if (dist <= 1.04) {
          // Antialiased edge
          const alpha = Math.max(0, Math.min(255, Math.round((1.04 - dist) / 0.04 * 255)));
          rawData[pxOffset] = 14;
          rawData[pxOffset + 1] = 116;
          rawData[pxOffset + 2] = 144;
          rawData[pxOffset + 3] = alpha;
        } else {
          // Transparent
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter 0
  ihdrData[12] = 0; // Interlace 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons in /public...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, true));

// Also generate icon.svg
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
    <linearGradient id="drop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a5f3fc"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="210" stroke="#38bdf8" stroke-width="4" stroke-opacity="0.3"/>
  <path d="M256 96 C256 96 144 260 144 336 C144 402 194 440 256 440 C318 440 368 402 368 336 C368 260 256 96 256 96 Z" fill="url(#drop)" filter="url(#glow)"/>
  <path d="M220 280 C220 240 256 160 256 160 C256 160 292 240 292 280 C292 310 275 330 256 330 C237 330 220 310 220 280 Z" fill="#ffffff" opacity="0.35"/>
  <text x="256" y="380" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="2">قطرة AI</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

console.log('All icons generated successfully!');
