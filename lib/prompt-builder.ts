type PromptInput = {
  productName?: string;
  material?: string;
  orientation?: string;
  deceasedName?: string;
  memorialDates?: string;
  themeStyle?: string;
  colors?: string;
  religiousOrSpiritualElements?: string;
  hobbiesInterestsPlaces?: string;
  quoteOrMessage?: string;
  generalInstructions?: string;
};

export function buildMemorialPrompt(input: PromptInput) {
  const tone = "tasteful, warm, premium, peaceful, and respectful memorial artwork";
  const style = input.themeStyle?.trim() || "realistic painterly";

  return [
    `Create a ${tone} memorial portrait scene.`,
    `Composition orientation: ${input.orientation || "portrait"}.`,
    `Theme details: ${input.hobbiesInterestsPlaces || "gentle natural memorial motifs"}.`,
    `Color direction: ${input.colors || "warm neutrals with soft contrast"}.`,
    `Faith/spiritual references: ${input.religiousOrSpiritualElements || "subtle and optional"}.`,
    `Visual style: ${style}.`,
    "Do not render any text, lettering, monograms, dates, signatures, logos, or watermarks in the image.",
    "Reserve a clean, low-detail lower area for text overlay (bottom 30% of the image).",
    "Do not add any product mockup frame, border, wood panel edge, acrylic edge, stand, or physical plaque/candle container.",
    "Output only a flat full-bleed artwork image.",
    `General instructions: ${input.generalInstructions || "none"}.`,
    "Avoid horror, gore, fantasy death imagery, gimmicky effects, or visually busy compositions.",
    "Not cartoonish unless explicitly requested."
  ].join("\n");
}
