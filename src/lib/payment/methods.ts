export type PaymentMethodId = "card" | "vodafone" | "etisalat" | "orange" | "wepay" | "instapay" | "cod";

export const paymentMethodLabels: Record<PaymentMethodId, string> = {
  card: "Credit / Debit Card",
  vodafone: "Vodafone Cash",
  etisalat: "Etisalat Cash",
  orange: "Orange Cash",
  wepay: "WE Pay",
  instapay: "InstaPay",
  cod: "Cash on Delivery",
};

export const placeholderPaymentDetails: Record<Exclude<PaymentMethodId, "card" | "cod">, { label: string; value: string }> = {
  vodafone: { label: "Vodafone Cash", value: "010XXXXXXXX" },
  etisalat: { label: "Etisalat Cash", value: "Placeholder" },
  orange: { label: "Orange Cash", value: "Placeholder" },
  wepay: { label: "WE Pay", value: "Placeholder" },
  instapay: { label: "InstaPay", value: "waqar@instapay" },
};

export function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return paymentMethodLabels.cod;
  return paymentMethodLabels[method as PaymentMethodId] ?? method;
}

export function getPlaceholderPaymentDetails(method: string | null | undefined) {
  if (!method) return null;
  return placeholderPaymentDetails[method as Exclude<PaymentMethodId, "card" | "cod">] ?? null;
}
