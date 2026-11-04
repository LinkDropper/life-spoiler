import { getTranslations } from "next-intl/server";

import styles from "./FaceSpoilerGuide.module.css";

export interface FaceSpoilerGuideStep {
  title: string;
  body: string;
}

export interface FaceSpoilerGuideFaq {
  q: string;
  a: string;
}

/**
 * 관상스포 랜딩의 서비스 안내(진행 방식·리포트 구성·사진 처리·FAQ).
 *
 * Hero는 클라이언트 컴포넌트라 서버 HTML에 본문이 거의 없었다. JS를 실행하지 않는
 * 검색엔진·AI 크롤러도 서비스 내용을 읽고 인용할 수 있도록 서버 컴포넌트로 렌더링한다.
 * FAQ 문구는 page.tsx의 FAQPage JSON-LD와 같은 번역 키를 쓴다.
 */
export const FaceSpoilerGuide = async () => {
  const t = await getTranslations("faceSpoiler.landing");

  const steps = t.raw("steps") as FaceSpoilerGuideStep[];
  const contents = t.raw("contents") as string[];
  const faq = t.raw("faq") as FaceSpoilerGuideFaq[];

  return (
    <section className={styles.guide} aria-label={t("ariaLabel")}>
      <div className={styles.block}>
        <h2 className={styles.heading}>{t("howTitle")}</h2>
        <ol className={styles.steps}>
          {steps.map(({ title, body }, index) => (
            <li key={title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3 className={styles.stepTitle}>{title}</h3>
                <p className={styles.text}>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.block}>
        <h2 className={styles.heading}>{t("contentsTitle")}</h2>
        <ul className={styles.list}>
          {contents.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className={styles.block}>
        <h2 className={styles.heading}>{t("animalsTitle")}</h2>
        <p className={styles.text}>{t("animalsBody")}</p>
      </div>

      <div className={styles.block}>
        <h2 className={styles.heading}>{t("privacyTitle")}</h2>
        <p className={styles.text}>{t("privacyBody")}</p>
      </div>

      <div className={styles.block}>
        <h2 className={styles.heading}>{t("faqTitle")}</h2>
        <dl className={styles.faq}>
          {faq.map(({ q, a }) => (
            <div key={q} className={styles.faqItem}>
              <dt className={styles.question}>{q}</dt>
              <dd className={styles.text}>{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
