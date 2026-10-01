import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node.js PNG generator with CRC32 and zlib
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, drawFn) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const rawData = Buffer.alloc(height * (1 + stride));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + stride);
    rawData[rowOffset] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, makeChunk('IHDR', ihdr), idatChunk, iendChunk]);
}

// Icon generator with sleek dark emerald palette (#0a0f1d with #10b981 and #34d399 soundwaves)
function drawAppIcon(isMaskable) {
  return (x, y, w, h) => {
    const nx = (x / w) * 2 - 1; // -1 to 1
    const ny = (y / h) * 2 - 1;
    const dist = Math.sqrt(nx * nx + ny * ny);

    // Background gradient: dark rich obsidian to deep emerald
    const bgGrad = (ny + 1) * 0.5;
    let r = Math.round(11 + bgGrad * 5);
    let g = Math.round(17 + bgGrad * 35);
    let b = Math.round(26 + bgGrad * 20);
    let a = 255;

    // Safe zone scaling if maskable
    const scale = isMaskable ? 0.65 : 0.8;
    const sx = nx / scale;
    const sy = ny / scale;

    // Inner glowing rounded squircle backdrop
    const squircleDist = Math.pow(Math.abs(sx), 3.2) + Math.pow(Math.abs(sy), 3.2);
    if (squircleDist < 0.95) {
      const glow = Math.max(0, 1 - squircleDist);
      r = Math.min(255, Math.round(r + 14 * glow));
      g = Math.min(255, Math.round(g + 95 * glow));
      b = Math.min(255, Math.round(b + 55 * glow));
    }

    // Sound wave bars centered
    // 5 vertical voice bars representing sound synthesis
    const bars = [
      { cx: -0.5, h: 0.28 },
      { cx: -0.25, h: 0.55 },
      { cx: 0.0, h: 0.72 },
      { cx: 0.25, h: 0.52 },
      { cx: 0.5, h: 0.3 }
    ];

    const barWidth = 0.1;
    for (const bar of bars) {
      const dx = Math.abs(sx - bar.cx);
      const dy = Math.abs(sy);
      if (dx < barWidth && dy < bar.h) {
        // Rounded caps
        const capY = Math.max(0, dy - (bar.h - barWidth));
        const cornerDist = Math.sqrt(dx * dx + capY * capY);
        if (cornerDist < barWidth || dy < (bar.h - barWidth)) {
          // Emerald glowing wave color
          const vGrad = 1 - (sy + bar.h) / (2 * bar.h);
          r = Math.round(52 + vGrad * 50);
          g = Math.round(211 + vGrad * 30);
          b = Math.round(153 - vGrad * 20);
          a = 255;
        }
      }
    }

    // Central microphone capsule accent
    const micDist = Math.sqrt(sx * sx + (sy + 0.05) * (sy + 0.05));
    if (micDist < 0.14) {
      r = 255;
      g = 255;
      b = 255;
      a = 255;
    }

    return [r, g, b, a];
  };
}

const outDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate icons
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, drawAppIcon(false)));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, drawAppIcon(false)));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, drawAppIcon(true)));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, drawAppIcon(false)));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPng(64, 64, drawAppIcon(false)));

// Also create public/icon.svg
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  <rect x="32" y="32" width="448" height="448" rx="86" fill="none" stroke="#10b981" stroke-opacity="0.25" stroke-width="3"/>
  <g filter="url(#glow)" fill="url(#barGrad)">
    <rect x="120" y="196" width="38" height="120" rx="19"/>
    <rect x="180" y="126" width="38" height="260" rx="19"/>
    <rect x="240" y="86" width="38" height="340" rx="19"/>
    <rect x="300" y="136" width="38" height="240" rx="19"/>
    <rect x="360" y="186" width="38" height="140" rx="19"/>
  </g>
  <circle cx="259" cy="256" r="28" fill="#ffffff" />
</svg>`;
fs.writeFileSync(path.join(outDir, 'icon.svg'), svgIcon);
console.log('PWA icons created successfully in public/');
