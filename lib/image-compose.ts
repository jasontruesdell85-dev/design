import sharp from "sharp";
import { getProductSpec } from "@/lib/product-specs";

type OverlayInput = {
  productId: string;
  orientation?: string;
  deceasedName?: string;
  memorialDates?: string;
  quoteOrMessage?: string;
  typography?: {
    nameFont?: string;
    bodyFont?: string;
  };
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fitFontSize(text: string, maxChars: number, maxSize: number, minSize: number) {
  if (!text) return minSize;
  const ratio = Math.min(1, maxChars / text.length);
  return Math.max(minSize, Math.floor(maxSize * ratio));
}

export async function composeArtwork(base: Buffer, input: OverlayInput) {
  const spec = getProductSpec(input.productId);
  const portrait = (input.orientation || spec.defaultOrientation) === "portrait";
  const width = portrait ? spec.width : spec.height;
  const height = portrait ? spec.height : spec.width;
  const resized = await sharp(base).resize(width, height, { fit: "cover", position: "center" }).png().toBuffer();

  const name = esc((input.deceasedName || "").trim());
  const dates = esc((input.memorialDates || "").trim());
  const rawQuote = (input.quoteOrMessage || "").trim();
  const quote = esc(rawQuote.length > 42 ? `${rawQuote.slice(0, 39)}...` : rawQuote);

  const nameFont = input.typography?.nameFont || "'Brush Script MT', 'Lucida Handwriting', cursive";
  const bodyFont = input.typography?.bodyFont || "Arial, Helvetica, sans-serif";

  const nameSize = fitFontSize(name, 18, Math.floor(width * 0.09), Math.floor(width * 0.055));
  const datesSize = fitFontSize(dates, 20, Math.floor(width * 0.05), Math.floor(width * 0.035));
  const quoteSize = fitFontSize(quote, 28, Math.floor(width * 0.05), Math.floor(width * 0.032));

  const bottomPad = Math.floor(height * 0.08);
  const leftPad = Math.floor(width * 0.08);
  const textWidth = width - leftPad * 2;
  const footerTop = Math.floor(height * 0.66);

  const nameY = footerTop + Math.floor(height * 0.11);
  const datesY = nameY + Math.floor(height * 0.065);
  const quoteY = datesY + Math.floor(height * 0.06);
  const maxQuoteY = height - bottomPad;
  const safeQuoteY = Math.min(quoteY, maxQuoteY);

  const overlaySvg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(10,12,18,0.00)" />
        <stop offset="40%" stop-color="rgba(10,12,18,0.35)" />
        <stop offset="100%" stop-color="rgba(10,12,18,0.68)" />
      </linearGradient>
    </defs>
    <rect x="0" y="${Math.floor(height * 0.58)}" width="${width}" height="${Math.ceil(height * 0.42)}" fill="url(#fade)" />
    ${name ? `<text x="${width / 2}" y="${nameY}" text-anchor="middle" fill="#f4ead7" font-family="${nameFont}" font-size="${nameSize}" letter-spacing="1.2">${name}</text>` : ""}
    ${dates ? `<text x="${width / 2}" y="${datesY}" text-anchor="middle" fill="#efe3cf" font-family="${bodyFont}" font-size="${datesSize}" letter-spacing="1.0">${dates}</text>` : ""}
    ${quote ? `<text x="${width / 2}" y="${safeQuoteY}" text-anchor="middle" fill="#eadcc4" font-family="${bodyFont}" font-size="${quoteSize}" letter-spacing="0.8">${quote}</text>` : ""}
  </svg>`;

  return sharp(resized).composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }]).png().toBuffer();
}

export async function composeMockup(artwork: Buffer, productId: string) {
  const spec = getProductSpec(productId);
  const w = 1500;
  const h = 1900;
  const plateW = productId === "glass_candle" ? 760 : 980;
  const plateH = productId === "glass_candle" ? 1180 : 1280;
  const x = Math.round((w - plateW) / 2);
  const y = 250;

  const background = productId === "wooden_plaque"
    ? `<rect x='120' y='170' width='1260' height='1460' rx='28' fill='#8f6746'/><rect x='140' y='190' width='1220' height='1420' rx='22' fill='#c49a73' opacity='0.55'/>`
    : productId === "glass_plaque"
      ? `<rect x='220' y='180' width='1060' height='1400' rx='36' fill='rgba(228,241,246,0.30)' stroke='rgba(255,255,255,0.7)' stroke-width='6'/><circle cx='270' cy='230' r='16' fill='rgba(255,255,255,0.9)'/><circle cx='1230' cy='230' r='16' fill='rgba(255,255,255,0.9)'/><circle cx='270' cy='1530' r='16' fill='rgba(255,255,255,0.9)'/><circle cx='1230' cy='1530' r='16' fill='rgba(255,255,255,0.9)'/>`
      : `<rect x='350' y='210' width='800' height='1380' rx='120' fill='rgba(241,244,247,0.45)' stroke='rgba(255,255,255,0.55)' stroke-width='5'/><ellipse cx='750' cy='250' rx='360' ry='90' fill='rgba(255,255,255,0.32)'/><ellipse cx='750' cy='320' rx='310' ry='70' fill='rgba(245,234,205,0.45)'/>`;

  const svg = `<svg width='${w}' height='${h}' xmlns='http://www.w3.org/2000/svg'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#efe5d8'/><stop offset='100%' stop-color='#d8c8b4'/>
      </linearGradient>
      <filter id='shadow' x='-20%' y='-20%' width='140%' height='140%'>
        <feDropShadow dx='0' dy='10' stdDeviation='18' flood-color='#000' flood-opacity='0.25'/>
      </filter>
    </defs>
    <rect width='100%' height='100%' fill='url(#bg)'/>
    ${background}
    <rect x='${x - 4}' y='${y - 4}' width='${plateW + 8}' height='${plateH + 8}' rx='16' fill='rgba(12,10,8,0.22)' filter='url(#shadow)'/>
  </svg>`;

  const fitted = await sharp(artwork).resize(plateW, plateH, { fit: "cover" }).png().toBuffer();
  return sharp(Buffer.from(svg)).composite([{ input: fitted, left: x, top: y }]).png().toBuffer();
}
