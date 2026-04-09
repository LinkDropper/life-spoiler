"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStatus } from "@/libs/stores/user";

import styles from "./Hero.module.css";

const HERO_IMAGES = [
  "/face-spoiler/hero-image.png",
  "/face-spoiler/hero-image-1.png",
  "/face-spoiler/hero-image-2.png",
  "/face-spoiler/hero-image-3.png",
  "/face-spoiler/hero-image-4.png",
];

export const Hero = () => {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const t = useTranslations("faceSpoiler.hero");
  const [currentImage, setCurrentImage] = useState(HERO_IMAGES[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
    setCurrentImage(HERO_IMAGES[randomIndex]);
  }, []);

  const handleStartClick = () => {
    if (authStatus === "loading") {
      return;
    }

    if (authStatus !== "authenticated") {
      router.push("/face-spoiler/login");
      return;
    }

    router.push("/face-spoiler/profiles");
  };

  return (
    <section className={styles.hero}>
      <div className={styles.imageArea}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={t("imageAlt", { default: "관상 이미지" })}
          className={styles.heroImage}
        />
      </div>
      <div className={styles.glowBackground}></div>
      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.titleText}>관상스포</span>
        </h1>
        <p className={styles.subtitle}>
          {t("subtitle", { default: "사진 한 장으로 보는 나의 관상 리포트" })}
        </p>
        <button className={styles.ctaButton} onClick={handleStartClick}>
          {t("cta", { default: "지금 시작하기" })}
        </button>
      </div>
    </section>
  );
};
