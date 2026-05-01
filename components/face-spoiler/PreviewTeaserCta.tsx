import { PreviewLockedChips } from "./PreviewLockedChips";
import styles from "./PreviewTeaserCta.module.css";

interface PreviewTeaserCtaProps {
  /** 골드 헤드라인 (예: "지금 보신 건 예고편이에요"). */
  headline: string;
  /** 서브 설명 카피. */
  description: string;
  /** 결제 후 해제되는 섹션 라벨들. */
  lockedLabels: string[];
}

export const PreviewTeaserCta = ({
  headline,
  description,
  lockedLabels,
}: PreviewTeaserCtaProps) => {
  return (
    <section
      className={styles.section}
      aria-labelledby="preview-teaser-headline"
    >
      <h2 id="preview-teaser-headline" className={styles.headline}>
        {headline}
      </h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.chipsWrap}>
        <PreviewLockedChips labels={lockedLabels} />
      </div>
    </section>
  );
};
