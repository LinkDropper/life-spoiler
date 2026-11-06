"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing/HeaderClient";

import { splitArticleTitle } from "./article-title";
import styles from "./PolicyLayout.module.css";

export type PolicyKind = "terms" | "privacy";

export interface PolicyIndexItem {
  id: string;
  title: string;
}

interface PolicyLayoutProps {
  kind: PolicyKind;
  title: string;
  /** 제목 아래 한 줄(적용일 칩, 머리 문단 등) */
  lead?: React.ReactNode;
  /** 조항 바로 가기 목록 */
  articles: PolicyIndexItem[];
  closeButtonText: string;
  children: React.ReactNode;
}

const TABS: { kind: PolicyKind; href: string }[] = [
  { kind: "terms", href: "/policy/terms" },
  { kind: "privacy", href: "/policy/privacy" },
];

/**
 * 이용약관·개인정보 처리방침 = 상영관 입구의 이용 규정과 관객 정보 안내문 (2026-11-06).
 * 법률 문장은 그대로 두고, 두 문서 전환 탭 · 조항 바로 가기 · 문서 끝 닫기만 더한다.
 */
export const PolicyLayout = ({
  kind,
  title,
  lead,
  articles,
  closeButtonText,
  children,
}: PolicyLayoutProps) => {
  const router = useRouter();
  const t = useTranslations("policy.common");

  // 링크로 바로 들어와 돌아갈 곳이 없으면 홈으로
  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <nav className={styles.tabs} aria-label={t("tabsAria")}>
          {TABS.map((tab) => (
            <Link
              key={tab.kind}
              href={tab.href}
              className={`${styles.tab} ${tab.kind === kind ? styles.tabActive : ""}`}
              aria-current={tab.kind === kind ? "page" : undefined}
            >
              {t(`${tab.kind}Tab`)}
            </Link>
          ))}
        </nav>

        <header className={styles.header}>
          <span className={styles.kicker}>{t(`${kind}Kicker`)}</span>
          <h1 className={styles.title}>{title}</h1>
          {lead}
        </header>

        <nav className={styles.index} aria-labelledby="policy-index-label">
          <span id="policy-index-label" className={styles.indexLabel}>
            {t("indexLabel")}
          </span>
          <ol className={styles.indexList}>
            {articles.map((article) => {
              const { number, name } = splitArticleTitle(article.title);
              return (
                <li key={article.id}>
                  <a href={`#${article.id}`} className={styles.indexLink}>
                    {number && <span className={styles.indexNo}>{number}</span>}
                    <span>{name}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className={styles.body}>{children}</div>

        <button type="button" className={styles.close} onClick={handleClose}>
          {closeButtonText}
        </button>
      </main>
    </div>
  );
};

interface PolicyArticleProps {
  id: string;
  title: string;
  /** 번호 목록 앞의 머리 문단 */
  lead?: string;
  /** 번호 목록 항목 */
  items?: React.ReactNode[];
  /** 목록 뒤에 붙는 칸(연락처, 쿠키 안내 등) */
  children?: React.ReactNode;
}

/** 조항 하나: "제n조" 꼬리표 + 이름(h2) + 머리 문단 + 번호 목록 */
export const PolicyArticle = ({
  id,
  title,
  lead,
  items,
  children,
}: PolicyArticleProps) => {
  const { number, name } = splitArticleTitle(title);

  return (
    <section id={id} className={styles.article} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.articleHead}>
        {number && <span className={styles.articleNo}>{number}</span>}
        <span className={styles.articleName}>{name}</span>
      </h2>
      {lead && <p className={styles.paragraph}>{lead}</p>}
      {items && items.length > 0 && (
        <ol className={styles.items}>
          {items.map((item, index) => (
            <li key={index} className={styles.item}>
              {item}
            </li>
          ))}
        </ol>
      )}
      {children}
    </section>
  );
};

/** 하위 목록(예: 보유 기간의 법령별 항목) */
export const PolicySubList = ({ items }: { items: string[] }) => (
  <ul className={styles.subItems}>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

/** 제목 아래 칩(예: 적용일) */
export const PolicyChip = ({ children }: { children: React.ReactNode }) => (
  <span className={styles.chip}>{children}</span>
);

/** 제목 아래 머리 문단 */
export const PolicyLead = ({ children }: { children: React.ReactNode }) => (
  <p className={styles.paragraph}>{children}</p>
);

/** 본문 아래 칸: 연락처·쿠키 안내·적용일 등 */
export const PolicyBox = ({
  tone = "default",
  children,
}: {
  tone?: "default" | "notice" | "contact";
  children: React.ReactNode;
}) => (
  <div className={`${styles.box} ${styles[`box_${tone}`]}`}>{children}</div>
);
