import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FaceProfileForm } from "@/components/face-spoiler/FaceProfileForm";
import { Header } from "@/components/face-spoiler/Header";
import { createAuthClient } from "@/libs/supabase";

import styles from "./page.module.css";

export default async function FaceSpoilerNewProfilePage() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/face-spoiler/login");
  }

  const t = await getTranslations("faceSpoiler.profiles");

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>
          {t("newPageTitle", { default: "새 프로필 만들기" })}
        </h1>
        <FaceProfileForm />
      </main>
    </div>
  );
}
