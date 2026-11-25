// QR "di marca" per biglietti e volantini A2Digital.
// Moduli arrotondati navy su bianco, occhi personalizzati, badge centrale (correzione H = 30%).
// Ogni QR viene poi DECODIFICATO con jsQR per essere sicuri che si legga.
const QR = require('C:/workspace/social-image-generator/node_modules/qrcode');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const NAVY = '#0a1a3a';
const WA_NUM = '393717518758';
const WA_TXT = 'Ciao! Vorrei prenotare una consulenza gratuita.';

const JOBS = [
  { file: 'qr-sito.svg', url: 'https://www.a2digital.it', badge: 'a2', ec: 'H' },
  { file: 'qr-whatsapp.svg', url: `https://wa.me/${WA_NUM}?text=${encodeURIComponent(WA_TXT)}`, badge: 'wa', ec: 'Q', hole: 0.2 },
  { file: 'qr-demo.svg', url: 'https://www.a2digital.it/#laboratorio', badge: 'none', ec: 'M', hole: 0 },
];

const WA_PATH = fs.readFileSync(path.join(DIR, 'whatsapp-glyph.txt'), 'utf8').trim();
const emblem = 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, '..', 'assets', 'img', 'emblema-a2.png')).toString('base64');

function build({ url, badge, ec, hole: holeK = 0.22 }) {
  const qr = QR.create(url, { errorCorrectionLevel: ec });
  const n = qr.modules.size, d = qr.modules.data;
  const M = 3; // quiet zone (moduli) - il riquadro bianco della grafica aggiunge altro margine
  const S = n + M * 2;
  const at = (x, y) => x >= 0 && y >= 0 && x < n && y < n && d[y * n + x];
  const inFinder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

  // zona centrale libera per il badge (circa 22% del lato, dispari)
  let hole = Math.round(n * holeK); if (hole && hole % 2 === 0) hole++;
  const c0 = (n - hole) / 2, c1 = c0 + hole;
  const inHole = (x, y) => hole > 0 && x >= c0 - 0.5 && x < c1 + 0.5 && y >= c0 - 0.5 && y < c1 + 0.5;

  let dots = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!at(x, y) || inFinder(x, y) || inHole(x, y)) continue;
    // modulo "fuso" con i vicini: rettangoli arrotondati che si collegano in orizzontale/verticale
    const X = x + M, Y = y + M;
    dots += `<rect x="${X}" y="${Y}" width="1.02" height="1.02" rx="0.3"/>`;
    if (at(x + 1, y) && !inFinder(x + 1, y) && !inHole(x + 1, y)) dots += `<rect x="${X + 0.5}" y="${Y}" width="1.02" height="1.02"/>`;
    if (at(x, y + 1) && !inFinder(x, y + 1) && !inHole(x, y + 1)) dots += `<rect x="${X}" y="${Y + 0.5}" width="1.02" height="1.02"/>`;
  }
  const eye = (fx, fy) => {
    const X = fx + M, Y = fy + M;
    return `<path fill-rule="evenodd" d="M${X + 1.2} ${Y}h4.6a1.2 1.2 0 0 1 1.2 1.2v4.6a1.2 1.2 0 0 1-1.2 1.2h-4.6a1.2 1.2 0 0 1-1.2-1.2v-4.6a1.2 1.2 0 0 1 1.2-1.2zM${X + 1.5} ${Y + 1}h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5z"/>` +
      `<rect x="${X + 2}" y="${Y + 2}" width="3" height="3" rx="0.6"/>`;
  };
  const eyes = eye(0, 0) + eye(n - 7, 0) + eye(0, n - 7);

  const bx = c0 + M + 0.35, bs = hole - 0.7;
  if (badge === 'none') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" shape-rendering="geometricPrecision"><rect width="${S}" height="${S}" fill="#fff"/><g fill="${NAVY}">${dots}${eyes}</g></svg>`;
  let badgeSvg = `<rect x="${bx}" y="${bx}" width="${bs}" height="${bs}" rx="${bs * 0.26}" fill="${NAVY}"/>`;
  if (badge === 'a2') {
    const iw = bs * 0.72, ih = iw * 530 / 1100;
    badgeSvg += `<image href="${emblem}" x="${bx + (bs - iw) / 2}" y="${bx + (bs - ih) / 2}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet"/>`;
  } else if (badge === 'wa') {
    // glifo WhatsApp in oro su badge navy: coerente con il resto della grafica
    const g = bs * 0.66;
    badgeSvg += `<defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c1"/><stop offset=".4" stop-color="#f3cd6a"/><stop offset="1" stop-color="#d4a23a"/></linearGradient></defs>` +
      `<g transform="translate(${bx + (bs - g) / 2} ${bx + (bs - g) / 2}) scale(${g / 24})"><path fill="url(#wg)" d="${WA_PATH}"/></g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" shape-rendering="geometricPrecision">` +
    `<rect width="${S}" height="${S}" fill="#fff"/>` +
    `<g fill="${NAVY}">${dots}${eyes}</g>${badgeSvg}</svg>`;
}

(async () => {
  for (const j of JOBS) {
    fs.writeFileSync(path.join(DIR, j.file), build(j));
    console.log('OK', j.file, '->', j.url);
  }
})();
