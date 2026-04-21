import styles from "./SignatureHookCard.module.css";

interface SignatureHookCardProps {
  /** "phrase" = 자주 듣는 말, "misread" = 자주 받는 오해 */
  variant: "phrase" | "misread";
  /** 상단에 띄울 짧은 라벨 (예: "자주 듣는 말") */
  label: string;
  /** 본문 카피 */
  content: string;
}

const ICON: Record<SignatureHookCardProps["variant"], string> = {
  phrase: "💬",
  misread: "🔍",
};

export const SignatureHookCard = ({
  variant,
  label,
  content,
}: SignatureHookCardProps) => (
  <div
    className={`${styles.card} ${variant === "misread" ? styles.misread : styles.phrase}`}
  >
    <div className={styles.head}>
      <span className={styles.icon} aria-hidden="true">
        {ICON[variant]}
      </span>
      <span className={styles.label}>{label}</span>
    </div>
    <p className={styles.content}>{content}</p>
  </div>
);
