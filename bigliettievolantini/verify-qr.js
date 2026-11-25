// Rasterizza i QR SVG a varie dimensioni (anche piccole, come stampati) e li decodifica con jsQR.
const sharp = require('C:/workspace/social-image-generator/node_modules/sharp');
const jsQR = require('C:/workspace/opengate/node_modules/jsqr');
const path = require('path');
const files = process.argv.slice(2).length ? process.argv.slice(2) : ['qr-sito.svg', 'qr-whatsapp.svg'];
(async () => {
  let ok = true;
  for (const f of files) {
    for (const px of [110, 160, 240, 400, 700, 1100]) {
      const { data, info } = await sharp(path.join(__dirname, f), { density: 3000 })
        .resize(px, px).flatten({ background: '#fff' }).extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#fff' })
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const r = jsQR(new Uint8ClampedArray(data), info.width, info.height);
      console.log(f, px + 'px', r ? 'LETTO -> ' + r.data : 'NON LETTO');
      if (!r) ok = false;
    }
  }
  process.exit(ok ? 0 : 1);
})();
