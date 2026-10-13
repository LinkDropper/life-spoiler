"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import styles from "./FAQSection.module.css";

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({ id, question, answer, isOpen, onToggle }: FAQItemProps) => {
  const answerId = `faq-answer-${id}`;
  return (
    <div className={styles.faqItem}>
      <button
        type="button"
        className={styles.questionButton}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={answerId}
      >
        <span className={styles.questionText}>{question}</span>
        <span
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}
          aria-hidden="true"
        >
          ›
        </span>
      </button>
      {/* 접힌 상태에서도 답변을 HTML에 남겨둔다. JS를 실행하지 않는 검색·AI 크롤러가
          답변을 읽을 수 있어야 하므로 조건부 렌더링 대신 CSS로만 숨긴다. */}
      <div
        className={`${styles.answer} ${isOpen ? "" : styles.answerCollapsed}`}
        id={answerId}
        role="region"
      >
        <p className={styles.answerText}>{answer}</p>
      </div>
    </div>
  );
};

export const FAQSection = () => {
  const t = useTranslations("landing.faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems = [
    { key: "q1" },
    { key: "q2" },
    { key: "q3" },
    { key: "q4" },
    { key: "q5" },
  ];

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
            id={item.key}
            question={t(`items.${item.key}.question`, { default: "" })}
            answer={t(`items.${item.key}.answer`, { default: "" })}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
      <Link href="/ziwei-doushu" className={styles.moreLink}>
        {t("moreLink")} ›
      </Link>
    </section>
  );
};
