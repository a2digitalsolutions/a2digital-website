# Biglietti da visita e volantini A5 · A2Digital Solutions

Grafica coerente con www.a2digital.it (navy & oro, font Sora / Inter / Michroma presi da ../assets).

## Cosa mandare in tipografia
| Prodotto | File di stampa (CMYK, vettoriale) | Formato finito | Con abbondanza |
|---|---|---|---|
| Biglietto da visita fronte/retro | `biglietto/A2Digital-Biglietto-STAMPA.pdf` | 85 x 55 mm | 89 x 59 mm (2 mm per lato) |
| Volantino A5 fronte/retro | `volantino/A2Digital-Volantino-A5-STAMPA.pdf` | 148 x 210 mm | 152 x 214 mm (2 mm per lato) |

- Nei PDF STAMPA sono dichiarati TrimBox (rifilo) e BleedBox (abbondanza).
- Per stampatori online che chiedono immagini (es. VistaPrint): `*-FRONTE-300dpi.jpg/.png` e `*-RETRO-300dpi.jpg/.png` (full-bleed, 300 DPI).
- `*-RGB.pdf`: stesso PDF in RGB, se lo stampatore lo preferisce.
- `anteprima-*.png`: come appare al formato finito (per WhatsApp/social).

## QR
- `qr-sito.svg` -> https://www.a2digital.it (biglietto retro, volantino fronte)
- `qr-whatsapp.svg` -> WhatsApp +39 371 751 8758 con messaggio «Ciao! Vorrei prenotare una consulenza gratuita.» (volantino retro, icona WhatsApp al centro)
- `qr-demo.svg` -> https://www.a2digital.it/#laboratorio (mini QR su «Provalo adesso», volantino retro)

## Loghi prodotti (`loghi/`)
Sartonero e OpenGate copiati dai rispettivi progetti; FarmacoFacile e iVoucher disegnati qui. Icona WhatsApp ufficiale in `whatsapp-glyph.txt`.
- Entrambi verificati con decoder (`node verify-qr.js`), anche ritagliati dal PDF finale.

## Rigenerare
```
node gen-qr.js && node verify-qr.js
node render.js biglietto
node render.js volantino
```
Sorgenti: `biglietto.html`, `volantino.html` (aperti nel browser sono anche animati).
