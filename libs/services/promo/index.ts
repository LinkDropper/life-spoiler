export {
  validatePromoCode,
  applyPromoCode,
  getPromoCodeInfo,
  getUserPromoUsages,
  hasPromoAppliedToProfile,
} from "./core";

export { PromoError } from "./errors";
export type { PromoErrorCode, PromoErrorDetails } from "./errors";

export type {
  ValidateCodeRequest,
  ValidateCodeResult,
  ApplyCodeRequest,
  ApplyCodeResult,
  PromoCodeInfo,
  UserPromoUsage,
  PromoCodeRow,
  PromoCodeUsageRow,
} from "./types";
