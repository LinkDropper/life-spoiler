"use client";

import { useRouter } from "next/navigation";

import styles from "./PolicyLayout.module.css";
import { HeaderClient } from "../landing/HeaderClient";

interface PolicyLayoutProps {
  title: string;
  children: React.ReactNode;
  closeButtonText?: string;
}

export const PolicyLayout = ({
  title,
  children,
  closeButtonText = "닫기",
}: PolicyLayoutProps) => {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <HeaderClient />

      <main className={styles.content}>
        <h1 className={styles.sectionTitle}>{title}</h1>
        <div className={styles.body}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <button className={styles.closeButton} onClick={handleClose}>
          {closeButtonText}
        </button>
      </footer>
    </div>
  );
};
