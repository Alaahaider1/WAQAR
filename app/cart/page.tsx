import type { Metadata } from "next";
import { CartClient } from "./CartClient";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your selected fragrances before checkout.",
};

export default function CartPage() {
  return <CartClient />;
}
