import Image from "next/image";
import { getTranslations } from "next-intl/server";

import styles from "./Header.module.css";

export const Header = async () => {
  const t = await getTranslations("landing.header");

  return (
    <header className={styles.header}>
      <Image
        src="/images/landing/logo.png"
        alt={t("logoAlt", { default: "인생스포 로고" })}
        width={87}
        height={32}
        priority
        quality={100}
      />
      <button
        type="button"
        className={styles.menuButton}
        aria-label={t("menuAriaLabel", { default: "메뉴" })}
      >
        <Image
          src="/images/landing/menu-icon.svg"
          alt=""
          width={24}
          height={24}
        />
      </button>
    </header>
  );
};
