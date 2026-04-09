import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Header } from "@/components/face-spoiler/Header";
import { createAuthClient } from "@/libs/supabase";

import { FaceProfileListClient } from "./_components/FaceProfileListClient";
import styles from "./page.module.css";

import type { FaceProfileRow } from "@/libs/supabase/types";

export interface ProfileLatestReport {
  shareId: string;
  paidAt: string | null;
}

export interface FaceProfileWithReport extends FaceProfileRow {
  latestReport: ProfileLatestReport | null;
}

interface FaceReportSummary {
  share_id: string;
  paid_at: string | null;
  face_profile_id: string;
  created_at: string;
}

export default async function FaceSpoilerProfilesPage() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/face-spoiler/login");
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from("face_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Error fetching face profiles:", profilesError);
  }

  const profiles = (profilesData ?? []) as FaceProfileRow[];

  if (profiles.length === 0) {
    redirect("/face-spoiler/profiles/new");
  }

  // 프로필별 최신 리포트 조회 (created_at DESC, 첫 번째가 최신)
  const { data: reportsData, error: reportsError } = await supabase
    .from("face_reports")
    .select("share_id, paid_at, face_profile_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (reportsError) {
    console.error("Error fetching face reports:", reportsError);
  }

  const reports = (reportsData ?? []) as FaceReportSummary[];
  const latestReportByProfile = new Map<string, ProfileLatestReport>();
  for (const report of reports) {
    if (!latestReportByProfile.has(report.face_profile_id)) {
      latestReportByProfile.set(report.face_profile_id, {
        shareId: report.share_id,
        paidAt: report.paid_at,
      });
    }
  }

  const profilesWithReport: FaceProfileWithReport[] = profiles.map(
    (profile) => ({
      ...profile,
      latestReport: latestReportByProfile.get(profile.id) ?? null,
    })
  );

  const t = await getTranslations("faceSpoiler.profiles");

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>
          {t("pageTitle", { default: "프로필 선택" })}
        </h1>
        <FaceProfileListClient initialProfiles={profilesWithReport} />
      </main>
    </div>
  );
}
