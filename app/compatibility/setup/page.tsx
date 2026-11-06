"use client";

import { ArrowLeftRight, ChevronLeft, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { getRelationshipLabel } from "@/components/compatibility";
import { HeaderClient } from "@/components/landing";
import { toCompatibilityGenre } from "@/libs/fortune/compatibility-screen";
import { NEW_PROFILE_TOKEN } from "@/libs/profile/setup-redirect";
import {
  useIsProfilesLoading,
  useProfileActions,
  useProfiles,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";
import { showToast } from "@/libs/toast";
import type {
  CompatibilityRelationshipType,
  ProfileRow,
} from "@/libs/supabase/types";

import { CastingSheet, type CastingSlot } from "./CastingSheet";
import { formatProfileLine } from "./utils";
import styles from "./page.module.css";

const RELATIONSHIP_TYPES: CompatibilityRelationshipType[] = [
  "lover",
  "some",
  "friend",
  "colleague",
  "family",
  "ex_partner",
  "ex_spouse",
  "cat_owner",
  "dog_owner",
  "custom",
];

const PET_RELATIONSHIP_TYPES: CompatibilityRelationshipType[] = [
  "cat_owner",
  "dog_owner",
];

const CUSTOM_MAX_LENGTH = 20;

/**
 * 궁합 만들기 = 공동 주연 캐스팅 (2026-11-06).
 * LEAD A · LEAD B 칸을 배우 고르기 시트로 하나씩 채우고, 관계를 고르면 그 관계가 장르가 된다.
 * 저장하면 목록으로 돌아가지 않고 새 궁합의 예고편으로 바로 간다.
 * 새 배우 프로필을 만들고 돌아오면(?a=&b=) 그 칸에 바로 앉는다.
 */
export default function CompatibilitySetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const t = useTranslations("compatibility.casting");
  const tCard = useTranslations("compatibility.card");
  const tC = useTranslations("fortune.screen.compatibility");
  const tProfile = useTranslations("profiles.card");

  const profiles = useProfiles();
  const isProfilesLoading = useIsProfilesLoading();
  const { fetchProfiles } = useProfileActions();

  const [cast, setCast] = useState<Record<CastingSlot, string | null>>({
    a: searchParams.get("a") || null,
    b: searchParams.get("b") || null,
  });
  const [pickingSlot, setPickingSlot] = useState<CastingSlot | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<CompatibilityRelationshipType>("lover");
  const [relationshipCustom, setRelationshipCustom] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfiles(true);
    }
  }, [authStatus, fetchProfiles]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  // 새 프로필을 만들고 돌아온 주소(?a=&b=)는 한 번 읽고 지운다
  useEffect(() => {
    if (searchParams.get("a") || searchParams.get("b")) {
      router.replace("/compatibility/setup", { scroll: false });
    }
  }, [searchParams, router]);

  const findProfile = (id: string | null): ProfileRow | undefined =>
    id ? profiles.find((profile) => profile.id === id) : undefined;
  const leadA = findProfile(cast.a);
  const leadB = findProfile(cast.b);
  const isPet = PET_RELATIONSHIP_TYPES.includes(relationshipType);
  const genre = toCompatibilityGenre(relationshipType);

  const handleCast = useCallback((slot: CastingSlot, profileId: string) => {
    setCast((prev) => ({ ...prev, [slot]: profileId }));
    setPickingSlot(null);
  }, []);

  const handleSwap = () => {
    setCast((prev) => ({ a: prev.b, b: prev.a }));
  };

  const handleNewProfile = useCallback(
    (slot: CastingSlot) => {
      const next = { ...cast, [slot]: NEW_PROFILE_TOKEN };
      const back = `/compatibility/setup?a=${next.a ?? ""}&b=${next.b ?? ""}`;
      router.push(`/profile/setup?redirect=${encodeURIComponent(back)}`);
    },
    [cast, router]
  );

  const isReady =
    Boolean(leadA && leadB) &&
    (relationshipType !== "custom" || relationshipCustom.trim().length > 0);

  const handleSubmit = async () => {
    if (!isReady || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileAId: cast.a,
          profileBId: cast.b,
          relationshipType,
          ...(relationshipType === "custom"
            ? { relationshipTypeCustom: relationshipCustom.trim() }
            : {}),
        }),
      });
      const data: { pairId?: string } = await response.json();
      if (!response.ok || !data.pairId) {
        throw new Error("Failed to create compatibility pair");
      }
      // 저장하면 새 궁합의 예고편으로 바로 (상영관 전환이 덮는다)
      router.push(`/compatibility/${data.pairId}/fortune/preview`);
    } catch {
      showToast({ kind: "error", message: t("createError") });
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (slot: CastingSlot): string | null => {
    if (!isPet) return null;
    if (slot === "a") return t("petOwner");
    return relationshipType === "cat_owner" ? t("petCat") : t("petDog");
  };

  const toProfileLine = (profile: ProfileRow) =>
    formatProfileLine(profile, {
      solar: tProfile("solar"),
      lunar: tProfile("lunar"),
      male: tProfile("male"),
      female: tProfile("female"),
      timeUnknown: tProfile("timeUnknown"),
    });

  const renderSlot = (slot: CastingSlot, profile: ProfileRow | undefined) => {
    const label = slot === "a" ? "LEAD A" : "LEAD B";
    const role = getRoleLabel(slot);
    const slotClass = slot === "a" ? styles.slotA : styles.slotB;

    if (!profile) {
      return (
        <button
          type="button"
          className={`${styles.slot} ${styles.slotEmpty} ${slotClass}`}
          onClick={() => setPickingSlot(slot)}
          aria-haspopup="dialog"
        >
          <span className={styles.slotPlus} aria-hidden="true">
            <Plus size={24} />
          </span>
          <span className={styles.slotLabel}>
            {label}
            {role && ` · ${role}`}
          </span>
          <b className={styles.slotCta}>{t("pickActor")}</b>
        </button>
      );
    }

    return (
      <button
        type="button"
        className={`${styles.slot} ${styles.slotFilled} ${slotClass}`}
        onClick={() => setPickingSlot(slot)}
        aria-haspopup="dialog"
        aria-label={t("slotAria", { label, name: profile.name })}
      >
        <span className={styles.monogram} aria-hidden="true">
          {profile.name.slice(0, 1)}
        </span>
        <span className={styles.slotLabel}>
          {label}
          {role && ` · ${role}`}
        </span>
        <b className={styles.slotName}>{profile.name}</b>
        <span className={styles.slotSub}>{toProfileLine(profile)}</span>
        <span className={styles.slotChange}>{t("change")}</span>
      </button>
    );
  };

  if (
    authStatus === "loading" ||
    authStatus === "unauthenticated" ||
    isProfilesLoading
  ) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <p className={styles.status} role="status">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <header className={styles.head}>
          <span className={styles.kicker}>CASTING</span>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.desc}>{t("desc")}</p>
        </header>

        <section className={styles.step} aria-labelledby="casting-step-1">
          <span id="casting-step-1" className={styles.stepLabel}>
            {t("step1")}
          </span>
          <div className={styles.slots}>
            {renderSlot("a", leadA)}
            <span className={styles.times} aria-hidden="true">
              ×
            </span>
            {renderSlot("b", leadB)}
          </div>
          {leadA && leadB && (
            <button type="button" className={styles.swap} onClick={handleSwap}>
              <ArrowLeftRight size={16} aria-hidden="true" />
              {t("swap")}
            </button>
          )}
        </section>

        <section className={styles.step} aria-labelledby="casting-step-2">
          <span id="casting-step-2" className={styles.stepLabel}>
            {t("step2")}
          </span>
          <div
            className={styles.genres}
            role="radiogroup"
            aria-labelledby="casting-step-2"
          >
            {RELATIONSHIP_TYPES.map((type) => {
              const isSelected = type === relationshipType;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.genre} ${isSelected ? styles.genreOn : ""}`}
                  onClick={() => setRelationshipType(type)}
                >
                  <b>
                    {type === "custom"
                      ? t("customRelation")
                      : getRelationshipLabel(type, tCard)}
                  </b>
                  <span>{tC(`genre.${toCompatibilityGenre(type)}`)}</span>
                </button>
              );
            })}
          </div>
          {relationshipType === "custom" && (
            <label className={styles.customField}>
              <span className={styles.srOnly}>{t("customPlaceholder")}</span>
              <input
                type="text"
                value={relationshipCustom}
                onChange={(event) =>
                  setRelationshipCustom(
                    event.target.value.slice(0, CUSTOM_MAX_LENGTH)
                  )
                }
                placeholder={t("customPlaceholder")}
                maxLength={CUSTOM_MAX_LENGTH}
                className={styles.customInput}
              />
            </label>
          )}
        </section>

        {leadA && leadB && (
          <div className={styles.billing} aria-live="polite">
            <span className={styles.billingCol}>
              <span>NOW CASTING</span>
              <b>
                <span className={styles.nameA}>{leadA.name}</span> ×{" "}
                <span className={styles.nameB}>{leadB.name}</span>
              </b>
            </span>
            <span className={`${styles.billingCol} ${styles.billingRight}`}>
              <span>GENRE</span>
              <b className={styles.billingGenre}>{tC(`genre.${genre}`)}</b>
            </span>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push("/compatibility")}
          aria-label={t("back")}
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleSubmit}
          disabled={!isReady || isSubmitting}
        >
          {isSubmitting
            ? t("submitting")
            : leadA && leadB
              ? t("submit")
              : t("needTwo")}
        </button>
      </footer>

      <CastingSheet
        slot={pickingSlot}
        profiles={profiles}
        cast={cast}
        roleLabel={pickingSlot ? getRoleLabel(pickingSlot) : null}
        toProfileLine={toProfileLine}
        onCast={handleCast}
        onNewProfile={handleNewProfile}
        onClose={() => setPickingSlot(null)}
      />
    </div>
  );
}
