import { NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";

import type {
  CompatibilityPairInsert,
  CompatibilityPairRow,
  CompatibilityRelationshipType,
  ProfileRow,
} from "@/libs/supabase/types";

export interface CompatibilityPairWithProfiles extends CompatibilityPairRow {
  profile_a: Pick<ProfileRow, "id" | "name">;
  profile_b: Pick<ProfileRow, "id" | "name">;
}

export const GET = async () => {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { data: pairs, error: pairsError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("compatibility_pairs") as any)
        .select(
          "*, profile_a:profiles!compatibility_pairs_profile_a_id_fkey(id, name), profile_b:profiles!compatibility_pairs_profile_b_id_fkey(id, name)"
        )
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

    if (pairsError) {
      return NextResponse.json(
        { error: "궁합 목록을 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pairs: pairs as CompatibilityPairWithProfiles[],
    });
  } catch (error) {
    console.error("GET /api/compatibility error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};

interface CompatibilityCreateRequest {
  profileAId: string;
  profileBId: string;
  relationshipType: CompatibilityRelationshipType;
  relationshipTypeCustom?: string;
}

export const POST = async (request: Request) => {
  try {
    const supabase = await createAuthClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const body: CompatibilityCreateRequest = await request.json();

    const pairData: CompatibilityPairInsert = {
      user_id: authUser.id,
      profile_a_id: body.profileAId,
      profile_b_id: body.profileBId,
      relationship_type: body.relationshipType,
      relationship_type_custom:
        body.relationshipType === "custom" ? body.relationshipTypeCustom : null,
    };

    const { data: pair, error: insertError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("compatibility_pairs") as any)
        .insert(pairData)
        .select("id")
        .single();

    if (insertError) {
      return NextResponse.json(
        { error: "궁합 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, pairId: pair.id });
  } catch (error) {
    console.error("POST /api/compatibility error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
