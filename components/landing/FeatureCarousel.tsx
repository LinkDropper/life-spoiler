"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

import styles from "./FeatureSection.module.css";

interface FeatureItem {
  key: string;
  title: string;
  question: string;
  description: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

interface FeatureCarouselProps {
  features: FeatureItem[];
}

export const FeatureCarousel = ({ features }: FeatureCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className={styles.viewport} ref={emblaRef}>
        <ul className={styles.list}>
          {features.map((feature) => (
            <li key={feature.key} className={styles.slide}>
              <div className={styles.card}>
                <div className={styles.imageWrapper}>
                  <Image
                    src={feature.image.src}
                    alt={feature.image.alt}
                    width={feature.image.width}
                    height={feature.image.height}
                    className={styles.featureImage}
                  />
                </div>
                <h3 className={styles.title}>{feature.title}</h3>
                <p className={styles.question}>{feature.question}</p>
                <p className={styles.description}>{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.dots}>
        {features.map((feature, index) => (
          <button
            key={feature.key}
            className={`${styles.dot} ${index === selectedIndex ? styles.dotActive : ""}`}
            aria-label={`Slide ${index + 1}`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};
