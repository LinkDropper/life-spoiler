"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Image from "next/image";

import { HeaderClient } from "@/components/landing";
import {
  CompatibilityCard,
  NewCompatibilityCard,
} from "@/components/compatibility";
import { DeleteConfirmModal } from "@/components/profile";
import { useAuthStatus } from "@/libs/stores/user";

import { useCompatibilityList, useCompatibilityDelete } from "./hooks";
import styles from "./page.module.css";

export default function CompatibilityPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const t = useTranslations("compatibility");

  const {
    pairs,
    isLoading,
    selectedPairId,
    handlePairSelect,
    fetchPairs,
    removePair,
  } = useCompatibilityList();

  const {
    deleteTargetId,
    isDeleting,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useCompatibilityDelete(removePair);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchPairs();
    }
  }, [authStatus, fetchPairs]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  const handleBack = useCallback(() => {
    router.push("/home");
  }, [router]);

  const handleNewPair = useCallback(() => {
    router.push("/compatibility/setup");
  }, [router]);

  const handleViewFortune = useCallback(() => {
    if (!selectedPairId) {
      alert(t("selectPair", { default: "궁합을 선택해주세요." }));
      return;
    }
    const selectedPair = pairs.find((p) => p.id === selectedPairId);
    const path = selectedPair?.paid_at
      ? `/compatibility/${selectedPairId}/fortune/result`
      : `/compatibility/${selectedPairId}/fortune/preview`;
    router.push(path);
  }, [selectedPairId, pairs, router, t]);

  const onDeleteConfirm = useCallback(async () => {
    const success = await handleDeleteConfirm();
    if (!success) {
      alert(
        t("deleteError", {
          default: "궁합 삭제에 실패했습니다. 다시 시도해주세요.",
        })
      );
    }
  }, [handleDeleteConfirm, t]);

  if (
    authStatus === "loading" ||
    isLoading ||
    authStatus === "unauthenticated"
  ) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <div className={styles.loading}>
          {t("loading", { default: "로딩 중..." })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <div className={styles.pairList}>
          {pairs.map((pair) => (
            <CompatibilityCard
              key={pair.id}
              nameA={pair.profile_a.name}
              nameB={pair.profile_b.name}
              score={pair.score}
              relationshipType={pair.relationship_type}
              isSelected={pair.id === selectedPairId}
              onSelect={() => handlePairSelect(pair.id)}
              onDelete={() => handleDeleteClick(pair.id)}
            />
          ))}
          <NewCompatibilityCard onClick={handleNewPair} />
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label={t("back", { default: "뒤로가기" })}
        >
          <Image
            src="/images/common/back-button.svg"
            alt=""
            width={52}
            height={52}
          />
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleViewFortune}
          disabled={!selectedPairId}
        >
          {t("viewFortune", { default: "궁합 운세 보기" })}
        </button>
      </footer>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
