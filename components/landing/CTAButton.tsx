import Image from "next/image";
import Link from "next/link";

import styles from "./CTAButton.module.css";

export const CTAButton = () => {
  return (
    <Link href="/login" className={styles.button}>
      <span className={styles.text}>인생 스포일러 확인하기</span>
      <Image
        src="/images/landing/arrow-right.svg"
        alt=""
        width={24}
        height={24}
      />
    </Link>
  );
};
