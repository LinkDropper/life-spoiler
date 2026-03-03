"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import styles from "./ReviewSection.module.css";

interface ReviewItem {
  key: string;
  name: string;
  content: string;
}

interface ReviewCarouselProps {
  reviews: ReviewItem[];
}

export const ReviewCarousel = ({ reviews }: ReviewCarouselProps) => {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "center" }, [
    Autoplay({ delay: 2000, stopOnInteraction: true }),
  ]);

  return (
    <div className={styles.viewport} ref={emblaRef}>
      <ul className={styles.list}>
        {reviews.map((review) => (
          <li key={review.key} className={styles.slide}>
            <div className={styles.card}>
              <span className={styles.name}>{review.name}</span>
              <p className={styles.content}>{review.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
