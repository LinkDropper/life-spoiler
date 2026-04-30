import crypto from "crypto";

export const computeImageHash = (buffer: ArrayBuffer): string => {
  return crypto.createHash("sha256").update(Buffer.from(buffer)).digest("hex");
};
