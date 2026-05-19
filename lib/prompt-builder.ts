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
    `Create a ${tone} background for ${input.productName ?? "a memorial product"}${input.material ? ` made for ${input.material}` : ""}.`,
    `Composition orientation: ${input.orientation || "portrait"}.`,
    `Theme details: ${input.hobbiesInterestsPlaces || "gentle natural memorial motifs"}.`,
    `Color direction: ${input.colors || "warm neutrals with soft contrast"}.`,
    `Faith/spiritual references: ${input.religiousOrSpiritualElements || "subtle and optional"}.`,
    `Visual style: ${style}.`,
    `Layout awareness only (do not render readable text): name ${input.deceasedName || ""}, dates ${input.memorialDates || ""}, message ${input.quoteOrMessage || ""}.`,
    `General instructions: ${input.generalInstructions || "none"}.`,
    "Leave clean negative space for overlaid memorial text.",
    "Do not include readable text in the generated image.",
    "Avoid horror, gore, fantasy death imagery, gimmicky effects, or visually busy compositions.",
    "Not cartoonish unless explicitly requested."
  ].join("\n");
}
