"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useUser, useAuthStatus } from "@/libs/stores/user";

import styles from "./CTAButton.module.css";

export const CTAButton = () => {
  const router = useRouter();
  const user = useUser();
  const authStatus = useAuthStatus();

  const handleClick = () => {
    if (authStatus !== "authenticated" || !user) {
      router.push("/login");
      return;
    }

    if (user.profileCompleted) {
      router.push("/profiles");
    } else {
      router.push("/profile/setup");
    }
  };

  return (
    <button type="button" className={styles.button} onClick={handleClick}>
      <span className={styles.text}>인생 스포일러 확인하기</span>
      <Image
        src="/images/landing/arrow-right.svg"
        alt=""
        width={24}
        height={24}
      />
    </button>
  );
};
