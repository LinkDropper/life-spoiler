"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import styles from "./SpoilerShelf.module.css";

interface ShelfItem {
  key:
    | "lifetime"
    | "yearly"
    | "yearly2027"
    | "compatibility"
    | "pastLife"
    | "faceReading";
  href: string;
  image: string;
  /** 이미지마다 여백이 달라 시각 크기를 맞추기 위한 배율 */
  scale: number;
  masked?: boolean;
}

const SHELF_ITEMS: ShelfItem[] = [
  {
    key: "lifetime",
    href: "/profiles?type=lifetime",
    image: "lifetime",
    scale: 1.1,
  },
  {
    key: "yearly",
    href: "/profiles?type=yearly",
    image: "yearly",
    scale: 1.45,
  },
  {
    key: "yearly2027",
    href: "/profiles?type=yearly_2027",
    image: "next",
    scale: 1.45,
  },
  {
    key: "compatibility",
    href: "/compatibility",
    image: "compat",
    scale: 0.8,
  },
  {
    key: "pastLife",
    href: "/profiles?type=past-life",
    image: "past",
    scale: 1,
  },
  {
    key: "faceReading",
    href: "/face-spoiler/profiles",
    image: "face",
    scale: 0.85,
    masked: true,
  },
];

/** 홈 — 상자 없이 오브젝트만 놓인 3열 진열장. 모든 로케일에서 노출한다. */
export const SpoilerShelf = () => {
  const t = useTranslations("home");

  return (
    <ul className={styles.shelf}>
      {SHELF_ITEMS.map(({ key, href, image, scale, masked }) => (
        <li key={key}>
          <Link href={href} className={styles.cell}>
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
            <span className={styles.line}>{t(`${key}.subtitle`)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};
