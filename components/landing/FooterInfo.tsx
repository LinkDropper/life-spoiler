import Image from "next/image";

import styles from "./FooterInfo.module.css";

export const FooterInfo = () => {
  return (
    <section className={styles.container}>
      <Image
        src="/images/landing/logo.png"
        alt="인생스포 로고"
        width={87}
        height={32}
        className={styles.logo}
      />
      <p className={styles.businessInfo}>
        대표: 윤재혁
        <br />
        사업자등록번호: 123-45-67890
        <br />
        통신판매번호: 2026-서울노원-1503
        <br />
        서울시 버드나루로 12길 8<br />
        ttja@gmail.com
        <br />
        070-8094-3030
      </p>
      <div className={styles.links}>
        <a href="/terms">이용약관</a>
        <span className={styles.divider}>|</span>
        <a href="/privacy">개인정보 처리방침</a>
      </div>
    </section>
  );
};
