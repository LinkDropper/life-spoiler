"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  getFortuneHref,
  getProfileSetupHref,
  hasFortuneAccess,
  type PaidFortuneRouteType,
} from "@/libs/fortune/navigation";
import type { ProfileWithFortunes } from "@/libs/stores/profile";

import styles from "./SpoilerShelf.module.css";

interface ShelfItem {
  key: "lifetime" | "yearly2027" | "compatibility" | "pastLife" | "faceReading";
  /** 프로필별 운세면 운세 종류, 아니면(궁합·관상) 고정 경로 */
  target: { fortune: PaidFortuneRouteType } | { href: string };
  image: string;
  /** 이미지마다 여백이 달라 시각 크기를 맞추기 위한 배율 */
  scale: number;
  masked?: boolean;
}

/** 2026 올해 운세는 연말이라 진열장에서 내리고 홈 맨 끝 "지난 운세"(PastFortunes)로 옮겼다 */
const SHELF_ITEMS: ShelfItem[] = [
  {
    key: "lifetime",
    target: { fortune: "lifetime" },
    image: "lifetime",
    scale: 1.1,
  },
  {
    key: "yearly2027",
    target: { fortune: "yearly_2027" },
    image: "next",
    scale: 1.45,
  },
  {
    key: "compatibility",
    target: { href: "/compatibility" },
    image: "compat",
    scale: 0.8,
  },
  {
    key: "pastLife",
    target: { fortune: "past-life" },
    image: "past",
    scale: 1,
  },
  {
    key: "faceReading",
    target: { href: "/face-spoiler/profiles" },
    image: "face",
    scale: 0.85,
    masked: true,
  },
];

interface SpoilerShelfProps {
  /** 홈에서 고른 프로필. 없으면 운세 칸은 프로필 입력으로 이어진다 */
  profile: ProfileWithFortunes | undefined;
}

const resolveItem = (
  { target }: ShelfItem,
  profile: ProfileWithFortunes | undefined
): { href: string; isOwned: boolean } => {
  if ("href" in target) return { href: target.href, isOwned: false };
  if (!profile) {
    return { href: getProfileSetupHref(target.fortune), isOwned: false };
  }

  return {
    href: getFortuneHref(profile, target.fortune),
    isOwned: hasFortuneAccess(profile, target.fortune),
  };
};

/**
 * 홈 — 상자 없이 오브젝트만 놓인 3열 진열장. 모든 로케일에서 노출한다.
 * 고른 프로필이 이미 가진 운세는 진열장 조명이 켜지고 "다시 보기"가 붙는다.
 */
export const SpoilerShelf = ({ profile }: SpoilerShelfProps) => {
  const t = useTranslations("home");

  return (
    <ul className={styles.shelf}>
      {SHELF_ITEMS.map((item) => {
        const { key, image, scale, masked } = item;
        const { href, isOwned } = resolveItem(item, profile);

        return (
          <li key={key}>
            <Link
              href={href}
              className={
                isOwned ? `${styles.cell} ${styles.owned}` : styles.cell
              }
            >
              {isOwned && <i className={styles.lamp} aria-hidden="true" />}
              <span className={styles.stage}>
                <Image
                  src={`/images/home/objects/${image}.png`}
                  alt=""
                  width={88}
                  height={88}
                  className={masked ? styles.masked : styles.image}
                  style={{ transform: `scale(${scale})` }}
                />
              </span>
              <span className={styles.name}>{t(`${key}.title`)}</span>
              {isOwned ? (
                <span className={styles.ownedBadge}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className={styles.visuallyHidden}>
                    {t("shelf.ownedLabel")}
                  </span>
                  {t("shelf.rewatch")}
                </span>
              ) : (
                <span className={styles.line}>{t(`${key}.subtitle`)}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
