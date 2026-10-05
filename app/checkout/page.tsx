import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Securely complete your order.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
