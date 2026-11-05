import styles from "./screen.module.css";

interface ActIntertitleProps {
  id: string;
  act: string;
  title: string;
  sub?: string;
}

/** 막이 시작될 때의 레터박스 자막 화면 */
export const ActIntertitle = ({ id, act, title, sub }: ActIntertitleProps) => (
  <div id={id} className={styles.intertitle} data-scene={id}>
    <div className={styles.intertitleInner}>
      <span className={styles.intertitleAct}>{act}</span>
      <h2 className={styles.intertitleTitle}>{title}</h2>
      {sub && <span className={styles.intertitleSub}>{sub}</span>}
    </div>
  </div>
);
