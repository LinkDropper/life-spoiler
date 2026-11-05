"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Image from "next/image";

import { ConfirmSheet } from "@/components/common/sheet";
import { HeaderClient } from "@/components/landing";
import {
  CompatibilityCard,
  NewCompatibilityCard,
} from "@/components/compatibility";
import { getRelationshipLabel } from "@/components/compatibility/utils";
import { useAuthStatus } from "@/libs/stores/user";
import { showToast } from "@/libs/toast";

import { useCompatibilityList, useCompatibilityDelete } from "./hooks";
import styles from "./page.module.css";

export default function CompatibilityPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const t = useTranslations("compatibility");
  const tCard = useTranslations("compatibility.card");
  const tDelete = useTranslations("compatibility.deleteModal");

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

  // 삭제 실패는 열려 있는 시트 안에 남긴다(시트 뒤 토스트는 놓치기 쉽다)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );
  const deleteTargetPair = pairs.find((pair) => pair.id === deleteTargetId);
  const deleteTargetLabel = deleteTargetPair
    ? [
        `${deleteTargetPair.profile_a.name} × ${deleteTargetPair.profile_b.name}`,
        deleteTargetPair.relationship_type
          ? getRelationshipLabel(deleteTargetPair.relationship_type, tCard)
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

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
      showToast({
        kind: "notice",
        message: t("selectPair", { default: "궁합을 선택해주세요." }),
      });
      return;
    }
    const selectedPair = pairs.find((p) => p.id === selectedPairId);
    const path = selectedPair?.paid_at
      ? `/compatibility/${selectedPairId}/fortune/result`
      : `/compatibility/${selectedPairId}/fortune/preview`;
    router.push(path);
  }, [selectedPairId, pairs, router, t]);

  const onDeleteClick = useCallback(
    (pairId: string) => {
      setDeleteErrorMessage(null);
      handleDeleteClick(pairId);
    },
    [handleDeleteClick]
  );

  const onDeleteConfirm = useCallback(async () => {
    setDeleteErrorMessage(null);
    const success = await handleDeleteConfirm();
    if (!success) {
      setDeleteErrorMessage(
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
              onDelete={() => onDeleteClick(pair.id)}
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

      <ConfirmSheet
        isOpen={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        onConfirm={onDeleteConfirm}
        eyebrow="DELETE"
        title={tDelete("title", { default: "정말 삭제하시겠어요?" })}
        description={tDelete("description", {
          default:
            "삭제 후에는 복구가 불가능합니다. 선택한 궁합의 운세 기록도 모두 삭제됩니다.",
        })}
        targetLabel={tDelete("target", { default: "삭제할 궁합" })}
        targetValue={deleteTargetLabel}
        cancelLabel={tDelete("cancel", { default: "취소" })}
        confirmLabel={tDelete("delete", { default: "삭제하기" })}
        busyLabel={tDelete("deleting", { default: "삭제 중..." })}
        isBusy={isDeleting}
        errorMessage={deleteErrorMessage}
      />
    </div>
  );
}
