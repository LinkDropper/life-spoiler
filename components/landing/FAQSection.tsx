"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import styles from "./FAQSection.module.css";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  return (
    <div className={styles.faqItem}>
      <button
        type="button"
        className={styles.questionButton}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.questionText}>{question}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>
          ›
        </span>
      </button>
      {isOpen && (
        <div className={styles.answer}>
          <p className={styles.answerText}>{answer}</p>
        </div>
      )}
    </div>
  );
};

export const FAQSection = () => {
  const t = useTranslations("landing.faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems = [{ key: "q1" }, { key: "q2" }, { key: "q3" }, { key: "q4" }];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>
        {t("title", { default: "자주 묻는 질문" })}
      </h2>
      <div className={styles.faqList}>
        {faqItems.map((item, index) => (
          <FAQItem
            key={item.key}
            question={t(`items.${item.key}.question`, { default: "" })}
            answer={t(`items.${item.key}.answer`, { default: "" })}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </section>
  );
};
