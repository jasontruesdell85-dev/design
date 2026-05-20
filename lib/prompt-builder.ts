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
  const name = input.deceasedName?.trim() || "In Loving Memory";
  const dates = input.memorialDates?.trim() || "";
  const message = input.quoteOrMessage?.trim() || "";
  const textLines = [name, dates, message].filter(Boolean).join(" | ");

  return [
    `Create a ${tone} memorial portrait scene.`,
    `Composition orientation: ${input.orientation || "portrait"}.`,
    `Theme details: ${input.hobbiesInterestsPlaces || "gentle natural memorial motifs"}.`,
    `Color direction: ${input.colors || "warm neutrals with soft contrast"}.`,
    `Faith/spiritual references: ${input.religiousOrSpiritualElements || "subtle and optional"}.`,
    `Visual style: ${style}.`,
    `Render memorial text directly in the design using this exact content: ${textLines}.`,
    "Text must be readable, centered, and elegant with high contrast against the background.",
    "Keep all text fully inside the image bounds with generous margins. No clipping, truncation, or text running off the canvas.",
    "Place text in the lower third, leave the face area unobstructed, and keep text to 3 lines max.",
    "Keep a safe bottom margin under the last text line (at least 12% of image height).",
    "Do not add any product mockup frame, border, wood panel edge, acrylic edge, stand, or physical plaque/candle container.",
    "Output only a flat full-bleed artwork image.",
    `General instructions: ${input.generalInstructions || "none"}.`,
    "Avoid horror, gore, fantasy death imagery, gimmicky effects, or visually busy compositions.",
    "Not cartoonish unless explicitly requested."
  ].join("\n");
}
