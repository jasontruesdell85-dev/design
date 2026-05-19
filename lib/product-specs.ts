export type ProductSpec = {
  productId: string;
  label: string;
  width: number;
  height: number;
  defaultOrientation: "portrait" | "landscape";
  textBox: { x: number; y: number; width: number; height: number };
};

const SPECS: Record<string, ProductSpec> = {
  wooden_plaque: {
    productId: "wooden_plaque",
    label: "Wooden plaque",
    width: 3900,
    height: 4950,
    defaultOrientation: "portrait",
    textBox: { x: 300, y: 3300, width: 3300, height: 1300 }
  },
  glass_plaque: {
    productId: "glass_plaque",
    label: "Glass plaque",
    width: 3900,
    height: 4950,
    defaultOrientation: "portrait",
    textBox: { x: 320, y: 3320, width: 3260, height: 1280 }
  },
  glass_candle: {
    productId: "glass_candle",
    label: "Glass candle",
    width: 2400,
    height: 1200,
    defaultOrientation: "landscape",
    textBox: { x: 240, y: 720, width: 1920, height: 380 }
  }
};

export function getProductSpec(productId: string): ProductSpec {
  return SPECS[productId] ?? SPECS.wooden_plaque;
}
