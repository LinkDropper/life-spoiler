import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

type TranslateFn = (key: string, values?: Record<string, string>) => string;

export const getRelationshipLabel = (
  type: CompatibilityRelationshipType,
  t: TranslateFn
): string => {
  const labels: Record<CompatibilityRelationshipType, string> = {
    lover: t("relationshipTypes.lover", { default: "연인" }),
    some: t("relationshipTypes.some", { default: "썸" }),
    friend: t("relationshipTypes.friend", {
      default: "친구",
    }),
    colleague: t("relationshipTypes.colleague", {
      default: "동료",
    }),
    family: t("relationshipTypes.family", { default: "가족" }),
    ex_partner: t("relationshipTypes.ex_partner", {
      default: "전남친/전여친",
    }),
    ex_spouse: t("relationshipTypes.ex_spouse", {
      default: "전남편/전아내",
    }),
    cat_owner: t("relationshipTypes.cat_owner", {
      default: "집사/고양이",
    }),
    dog_owner: t("relationshipTypes.dog_owner", {
      default: "집사/강아지",
    }),
    custom: t("relationshipTypes.custom", { default: "기타" }),
  };
  return labels[type];
};
