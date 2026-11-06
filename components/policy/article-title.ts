/**
 * 조항 제목을 번호와 이름으로 나눈다.
 * "제1조 (목적)" · "Article 1 (Purpose)" · "第1条（目的）" → { number: "제1조", name: "목적" }
 * 꼴이 다르면 제목 전체를 이름으로 둔다.
 */
const ARTICLE_TITLE_PATTERN = /^(.+?)\s*[(（](.+)[)）]$/;

export const splitArticleTitle = (
  title: string
): { number: string | null; name: string } => {
  const match = ARTICLE_TITLE_PATTERN.exec(title);
  if (!match) {
    return { number: null, name: title };
  }
  return { number: match[1], name: match[2] };
};
