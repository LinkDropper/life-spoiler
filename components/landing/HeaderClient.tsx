"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import styles from "./Header.module.css";
import { useUser } from "@/libs/stores/user";

export const HeaderClient = () => {
  const t = useTranslations("landing.header");
  const router = useRouter();

  const user = useUser();

  const handleLogoClick = () => {
    if (user?.id) {
      router.push("/profiles");
      return;
    }
    router.push("/");
  };

  return (
    <header className={styles.header}>
      <Image
        src="/images/landing/logo.png"
        alt={t("logoAlt", { default: "인생스포 로고" })}
        width={87}
        height={32}
        priority
        quality={100}
        onClick={handleLogoClick}
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
