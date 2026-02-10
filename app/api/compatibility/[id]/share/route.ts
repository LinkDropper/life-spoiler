import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/libs/supabase/client";
import type { Database, CompatibilityPairRow } from "@/libs/supabase/types";
import type { CompatibilityResult } from "@/libs/hooks/compatibility/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseDB = SupabaseClient<Database>;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: pairId } = await context.params;

    const supabase = createServerClient() as SupabaseDB;

    const { data: pairData, error: pairError } = await supabase
      .from("compatibility_pairs")
      .select("*")
      .eq("id", pairId)
      .single<CompatibilityPairRow>();

    if (pairError || !pairData) {
      return NextResponse.json(
        { success: false, error: "궁합 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!pairData.paid_at) {
      return NextResponse.json(
        { success: false, error: "결제되지 않은 궁합입니다." },
        { status: 404 }
      );
    }

    if (!pairData.result) {
      return NextResponse.json(
        { success: false, error: "궁합 결과가 없습니다." },
        { status: 404 }
      );
    }

    const result = pairData.result as unknown as CompatibilityResult;

    return NextResponse.json({
      success: true,
      data: {
        result,
        score: pairData.score,
        relationshipType: pairData.relationship_type,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/compatibility/[id]/share:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
