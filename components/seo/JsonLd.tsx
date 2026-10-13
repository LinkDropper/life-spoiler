interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * schema.org 구조화 데이터를 서버 HTML에 직접 렌더링한다.
 * JS를 실행하지 않는 AI 크롤러도 읽을 수 있어야 하므로 반드시 서버 컴포넌트에서 쓴다.
 * `<`를 이스케이프해 문자열 안의 `</script>`로 태그가 조기 종료되는 것을 막는다.
 */
export const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);
