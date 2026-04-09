import { redirect } from "next/navigation";

import { Header } from "@/components/face-spoiler/Header";
import { PhotoUploader } from "@/components/face-spoiler/PhotoUploader";
import { createAuthClient } from "@/libs/supabase";

interface PageProps {
  searchParams: Promise<{ profileId?: string }>;
}

export default async function FaceSpoilerUploadPage({
  searchParams,
}: PageProps) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/face-spoiler/login");
  }

  const { profileId } = await searchParams;

  if (!profileId) {
    redirect("/face-spoiler/profiles");
  }

  // 프로필 소유권 검증 (RLS 기반)
  const { data: profile } = await supabase
    .from("face_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/face-spoiler/profiles");
  }

  return (
    <>
      <Header />
      <div className="container">
        <PhotoUploader profileId={profileId} />
      </div>
    </>
  );
}
