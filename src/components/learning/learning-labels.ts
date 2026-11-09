import type { MistakeKind } from "@/lib/learning/events";

export const categoryLabels: Record<MistakeKind, string> = {
  distribution: "Distributive property",
  combine_like_terms: "Combining like terms",
  sign_or_balance: "Signs and balance",
  arithmetic: "Arithmetic",
  unsupported_step: "Other non-equivalent steps",
};
