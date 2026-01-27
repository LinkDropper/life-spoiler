const OG_IMAGE_MAP: Record<string, string> = {
  ko: "/images/open-graph.png",
  ja: "/images/open-graph-ja.png",
};
const DEFAULT_OG_IMAGE = "/images/open-graph-en.png";

export const getOpenGraphImage = (locale: string): string => {
  return OG_IMAGE_MAP[locale] ?? DEFAULT_OG_IMAGE;
};
