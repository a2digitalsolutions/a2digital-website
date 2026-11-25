// Render di stampa per biglietto e volantino A2Digital.
// Uso: node render.js biglietto|volantino [--preview]
//  --preview : solo PNG di anteprima (veloce, per lavorarci)
// Output per ogni prodotto, in ./<prodotto>/ :
//  - A2Digital-<Nome>-STAMPA.pdf   PDF vettoriale CMYK con abbondanza (da mandare in tipografia)
//  - A2Digital-<Nome>-RGB.pdf      stesso PDF in RGB (per stampatori online che vogliono RGB)
//  - A2Digital-<Nome>-FRONTE/RETRO-300dpi.jpg/.png   immagini full-bleed a 300 DPI (es. VistaPrint)
//  - anteprima-fronte/retro.png    anteprime al formato finito (senza abbondanza)
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const puppeteer = require('C:/workspace/social-image-generator/node_modules/puppeteer-core');
const sharp = require('C:/workspace/social-image-generator/node_modules/sharp');

const SPECS = {
  biglietto: { html: 'biglietto.html', name: 'Biglietto', w: 89, h: 59, bleed: 2 },
  volantino: { html: 'volantino.html', name: 'Volantino-A5', w: 152, h: 214, bleed: 2 },
};
const which = process.argv[2];
const PREVIEW = process.argv.includes('--preview');
const S = SPECS[which];
if (!S) { console.error('uso: node render.js biglietto|volantino [--preview]'); process.exit(1); }

const DIR = __dirname;
const OUT = path.join(DIR, which);
fs.mkdirSync(OUT, { recursive: true });
const URL = 'file:///' + path.join(DIR, S.html).split(path.sep).join('/');
const DPI = 300, DSF = DPI / 96;
const px = mm => Math.round(mm / 25.4 * DPI);
const GS = 'C:/Program Files/gs/gs10.07.0/bin/gswin64c.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1000, deviceScaleFactor: DSF });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(async () => { document.documentElement.classList.add('render'); await document.fonts.ready; });
  await new Promise(r => setTimeout(r, 600));

  // controllo overflow (elementi marcati .fit che non devono traboccare)
  const over = await page.evaluate(() => [...document.querySelectorAll('.fit')].map(e => ({ id: e.id || e.className, over: Math.round((e.scrollHeight - e.clientHeight) * 100) / 100 })).filter(x => x.over > 0.5));
  if (over.length) console.warn('ATTENZIONE overflow:', JSON.stringify(over));

  const b = S.bleed;
  for (const [id, label] of [['fronte', 'FRONTE'], ['retro', 'RETRO']]) {
    const el = await page.$('#' + id);
    const buf = await el.screenshot({ type: 'png' });
    const full = sharp(buf).resize(px(S.w), px(S.h), { fit: 'fill' }).withMetadata({ density: DPI });
    const fullBuf = await full.png().toBuffer();
    // anteprima al formato finito (rifilata)
    await sharp(fullBuf).extract({ left: px(b), top: px(b), width: px(S.w - 2 * b), height: px(S.h - 2 * b) })
      .resize({ width: which === 'biglietto' ? 1200 : 1400 }).png().toFile(path.join(OUT, `anteprima-${id}.png`));
    if (!PREVIEW) {
      await sharp(fullBuf).withMetadata({ density: DPI }).jpeg({ quality: 100, chromaSubsampling: '4:4:4' }).toFile(path.join(OUT, `A2Digital-${S.name}-${label}-300dpi.jpg`));
      await sharp(fullBuf).withMetadata({ density: DPI }).png({ compressionLevel: 9 }).toFile(path.join(OUT, `A2Digital-${S.name}-${label}-300dpi.png`));
    }
  }

  if (!PREVIEW) {
    const rgb = path.join(OUT, `A2Digital-${S.name}-RGB.pdf`);
    await page.pdf({ path: rgb, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const cmyk = path.join(OUT, `A2Digital-${S.name}-STAMPA.pdf`);
    // conversione CMYK + TrimBox/BleedBox (abbondanza dichiarata nel PDF)
    // TrimBox calcolato sul MediaBox reale prodotto da Chrome (arrotondato ai pixel)
    const mb = fs.readFileSync(rgb, 'latin1').match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/);
    const W = +mb[1], H = +mb[2], bp = b / 25.4 * 72;
    const trim = `[${bp.toFixed(2)} ${bp.toFixed(2)} ${(W - bp).toFixed(2)} ${(H - bp).toFixed(2)}]`;
    const bleed = `[0 0 ${W} ${H}]`;
    execFileSync(GS, ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.6',
      '-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK', '-dPDFSETTINGS=/prepress',
      '-dAutoRotatePages=/None', '-dDownsampleColorImages=false', '-dDownsampleGrayImages=false',
      `-sOutputFile=${cmyk}`,
      '-c', `<< /EndPage { exch pop 0 eq { [ {ThisPage} << /TrimBox ${trim} /BleedBox ${bleed} >> /PUT pdfmark true } { false } ifelse } >> setpagedevice`,
      '-f', rgb]);
    console.log('PDF:', path.basename(rgb), '+', path.basename(cmyk));
  }
  await browser.close();
  console.log('OK', which, PREVIEW ? '(anteprima)' : '');
})().catch(e => { console.error(e); process.exit(1); });
