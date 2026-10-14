/**
 * 예고 키워드 "색"의 견본(스와치) hex.
 *
 * 슬러그(`df-kc-{오행}-{n}`)는 append-only 계약이라 슬러그 기준으로 매핑한다.
 * 견본은 보조 시각 정보일 뿐이고, 색 이름 텍스트가 항상 함께 노출된다(색만으로 전달 금지).
 * 매핑에 없는 슬러그는 견본 없이 이름만 보여준다.
 */
const COLOR_SWATCHES: Record<string, string> = {
  "df-kc-wood-1": "#2e8b57",
  "df-kc-wood-2": "#9acd32",
  "df-kc-wood-3": "#7fddc0",
  "df-kc-wood-4": "#808000",
  "df-kc-fire-1": "#ff8c1a",
  "df-kc-fire-2": "#e0302f",
  "df-kc-fire-3": "#ff9ec4",
  "df-kc-fire-4": "#ff7f6e",
  "df-kc-earth-1": "#ffd93b",
  "df-kc-earth-2": "#8b5a2b",
  "df-kc-earth-3": "#e8d5b5",
  "df-kc-earth-4": "#c68a3c",
  "df-kc-metal-1": "#fafafa",
  "df-kc-metal-2": "#9a9aa3",
  "df-kc-metal-3": "#c9ced6",
  "df-kc-metal-4": "#fff8e1",
  "df-kc-water-1": "#1f2f6b",
  "df-kc-water-2": "#14141a",
  "df-kc-water-3": "#1b4f9c",
  "df-kc-water-4": "#2a3f8f",
};

export const getColorSwatch = (slug: string | undefined): string | undefined =>
  slug ? COLOR_SWATCHES[slug] : undefined;
