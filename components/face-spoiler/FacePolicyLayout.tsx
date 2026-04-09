"use client";

import { useRouter } from "next/navigation";

import { Header } from "./Header";
import styles from "./FacePolicyLayout.module.css";

interface FacePolicyLayoutProps {
  title: string;
  closeButtonText: string;
  children: React.ReactNode;
}

export const FacePolicyLayout = ({
  title,
  closeButtonText,
  children,
}: FacePolicyLayoutProps) => {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.content}>
        <h1 className={styles.sectionTitle}>{title}</h1>
        <div className={styles.body}>{children}</div>
      </main>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
        >
          {closeButtonText}
        </button>
      </footer>
    </div>
  );
};
