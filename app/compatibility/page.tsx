"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { LineupCard } from "@/components/compatibility/LineupCard";
import {
  ScreenSheet,
  SheetAction,
} from "@/components/fortune/screen/ScreenSheet";
import { HeaderClient } from "@/components/landing";
import { DeleteConfirmModal } from "@/components/profile";
import { useAuthStatus } from "@/libs/stores/user";

import { useCompatibilityDelete, useCompatibilityList } from "./hooks";
import styles from "./page.module.css";

const SETUP_HREF = "/compatibility/setup";

/**
 * 궁합 목록 = 공동 주연작 라인업 (2026-11-06).
 * 카드를 누르면 바로 상영(소장 = 본편, 아니면 예고편). 삭제는 카드의 ⋯ 안에.
 * 하나도 없으면 빈 배역 칸 두 개와 "캐스팅 시작하기".
 */
export default function CompatibilityPage() {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const t = useTranslations("compatibility.lineup");
  const tCompat = useTranslations("compatibility");

  const { items, isLoading, fetchPairs, removePair } = useCompatibilityList();
  const {
    deleteTargetId,
    isDeleting,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useCompatibilityDelete(removePair);
  const [manageId, setManageId] = useState<string | null>(null);
  const managed = items.find((item) => item.id === manageId);

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

  const handleDeleteFromSheet = useCallback(() => {
    if (!manageId) return;
    setManageId(null);
    handleDeleteClick(manageId);
  }, [manageId, handleDeleteClick]);

  const onDeleteConfirm = useCallback(async () => {
    const success = await handleDeleteConfirm();
    if (!success) {
      alert(tCompat("deleteError"));
    }
  }, [handleDeleteConfirm, tCompat]);

  const isPending =
    authStatus === "loading" || authStatus === "unauthenticated" || isLoading;

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <header className={styles.head}>
          <span className={styles.kicker}>CO-STARRING LINEUP</span>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.desc}>
            {isPending || items.length > 0 ? t("desc") : t("emptyDesc")}
          </p>
        </header>

        {isPending ? (
          <p className={styles.status} role="status">
            {t("loading")}
          </p>
        ) : items.length === 0 ? (
          <section className={styles.empty}>
            <div className={styles.emptySlots} aria-hidden="true">
              <span className={`${styles.emptySlot} ${styles.slotA}`}>
                <span>+</span>LEAD A
              </span>
              <span className={styles.emptyTimes}>×</span>
              <span className={`${styles.emptySlot} ${styles.slotB}`}>
                <span>+</span>LEAD B
              </span>
            </div>
            <b className={styles.emptyTitle}>{t("emptyTitle")}</b>
            <p className={styles.emptyBody}>{t("emptyBody")}</p>
            <Link href={SETUP_HREF} className={styles.primaryLink}>
              {t("emptyCta")}
            </Link>
          </section>
        ) : (
          <>
            <Link href={SETUP_HREF} className={styles.newCard}>
              <span className={styles.newIcon} aria-hidden="true">
                +
              </span>
              <span className={styles.newText}>
                <b>{t("newTitle")}</b>
                <span>{t("newDesc")}</span>
              </span>
            </Link>
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id}>
                  <LineupCard item={item} onMore={() => setManageId(item.id)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <ScreenSheet
        isOpen={Boolean(managed)}
        onClose={() => setManageId(null)}
        eyebrow="MANAGE"
        title={
          managed
            ? t("manageTitle", { a: managed.nameA, b: managed.nameB })
            : ""
        }
      >
        <SheetAction
          icon={<Trash2 size={22} />}
          label={t("delete")}
          sub={t("deleteSub")}
          onClick={handleDeleteFromSheet}
        />
      </ScreenSheet>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
        description={tCompat("deleteModal.description")}
      />
    </div>
  );
}
