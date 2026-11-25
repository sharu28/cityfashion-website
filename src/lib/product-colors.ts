import swatchData from "../../data/color-swatches.json";

export type ColorOption = {
  name: string;
  /** Garment colour measured from the photo, or a colour guessed from the name, or null. */
  hex: string | null;
  /** Small fabric crop from the colour's photo, shown in a circle. */
  swatch: string | null;
  /** The photo that shows this colour, if there is one. */
  image: string | null;
  /** Print name shared by several colours, e.g. "Dotted Leaf". Empty when the style has no prints. */
  group: string;
};

export type ColorGroup = { name: string; options: ColorOption[] };

const swatches = swatchData as Record<string, Record<string, { hex: string; swatch: string }>>;

/** Plain colour words. Used to split "Olive Grey Dotted Leaf" into colour "Olive Grey" and print "Dotted Leaf". */
const colorWords: Record<string, string> = {
  black: "#1c1c1c",
  white: "#f4f2ee",
  ivory: "#efe9dc",
  cream: "#ece2cc",
  beige: "#d8c6a5",
  tan: "#b9956b",
  camel: "#b07f4f",
  brown: "#6b4430",
  taupe: "#8b7d70",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  charcoal: "#3a3a3c",
  silver: "#b8b8b8",
  navy: "#1f2a4d",
  blue: "#2f5da8",
  royal: "#2443a0",
  sky: "#7fb2df",
  steel: "#5f7a96",
  aqua: "#5fc4c4",
  teal: "#1f6f6f",
  turquoise: "#2fb3b0",
  green: "#2f6b3a",
  sage: "#8fa58a",
  olive: "#6b6a35",
  lime: "#9cc44a",
  mint: "#a8dcc0",
  yellow: "#e4c13a",
  mustard: "#c99a2e",
  gold: "#c9a24a",
  orange: "#e07a2f",
  rust: "#a4492a",
  coral: "#e8735f",
  peach: "#f2b293",
  red: "#b3262b",
  deep: "",
  wine: "#6e1f33",
  maroon: "#6a1d2b",
  burgundy: "#6a1d2b",
  pink: "#e48aa6",
  blush: "#f0c3c0",
  rose: "#d77a8f",
  magenta: "#b0246f",
  mauve: "#a07a92",
  lavender: "#b6a6d6",
  lilac: "#c3a6d6",
  purple: "#5e3473",
  plum: "#5a2a4a",
  violet: "#6e44a0",
  pastel: "",
  light: "",
  dark: "",
  soft: "",
  pale: "",
  muted: "",
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function splitName(name: string) {
  const words = name.split(/[\s/]+/).filter(Boolean);
  let index = 0;
  while (index < words.length && words[index].toLowerCase() in colorWords) index += 1;
  const colorPart = words.slice(0, index);
  const print = words.slice(index).join(" ");
  return { colorPart, print };
}

function guessHex(name: string) {
  const { colorPart } = splitName(name);
  // The last real colour word wins: "Royal Blue" -> blue family, "Olive Grey" -> grey.
  for (let i = colorPart.length - 1; i >= 0; i -= 1) {
    const hex = colorWords[colorPart[i].toLowerCase()];
    if (hex) return hex;
  }
  return null;
}

/** File name of a photo without the number and style prefix: "03-d3502-maroon-dotted-leaf.webp" -> "maroon-dotted-leaf". */
function photoKey(image: string) {
  const file = image.split("/").pop() ?? image;
  return file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d+-/, "")
    .replace(/^d[0-9a-z]+-(\d+-)?/i, "");
}

const closeUpLabels: Array<[RegExp, string]> = [
  [/-(neckline|collar)$/, "Neckline"],
  [/-print-sleeve$/, "Print and sleeve"],
  [/-back$/, "Back"],
];

/** Photo that shows a colour: the first photo whose name starts with the colour, but not a close-up. */
function imageFor(name: string, images: string[]) {
  const key = slug(name.split("/")[0]);
  return (
    images.find((image) => {
      const photo = photoKey(image);
      return photo.startsWith(key) && !closeUpLabels.some(([pattern]) => pattern.test(photo));
    }) ?? null
  );
}

export function colorOptions(product: { slug: string; colors: string[]; images: string[] }): ColorOption[] {
  const measured = swatches[product.slug] ?? {};
  const options = product.colors.map((name) => ({
    name,
    hex: measured[name]?.hex ?? guessHex(name),
    swatch: measured[name]?.swatch ?? null,
    image: imageFor(name, product.images),
    group: splitName(name).print,
  }));

  // Only group when several colours share a print; otherwise the names are just colours.
  const counts = new Map<string, number>();
  for (const option of options) counts.set(option.group, (counts.get(option.group) ?? 0) + 1);
  const hasPrints = options.length >= 6 && [...counts.values()].some((count) => count > 1) && counts.size > 1 && counts.size < options.length;
  return hasPrints ? options : options.map((option) => ({ ...option, group: "" }));
}

export function groupColorOptions(options: ColorOption[]): ColorGroup[] {
  const groups: ColorGroup[] = [];
  for (const option of options) {
    const group = groups.find((entry) => entry.name === option.group);
    if (group) group.options.push(option);
    else groups.push({ name: option.group, options: [option] });
  }
  return groups;
}

/** Short caption for a gallery photo: "Back · Green Tropical", "Maroon Dotted Leaf", or "". */
export function photoCaption(image: string, colors: string[]) {
  let key = photoKey(image);
  let label = "";
  for (const [pattern, text] of closeUpLabels) {
    if (pattern.test(key)) {
      label = text;
      key = key.replace(pattern, "");
      break;
    }
  }
  // Longest match first, so "green-lotus" is not read as plain "Green".
  const color = [...colors]
    .sort((a, b) => b.length - a.length)
    .find((name) => key.startsWith(slug(name.split("/")[0])));
  if (!color) return label;
  return label ? `${label} · ${color}` : color;
}
