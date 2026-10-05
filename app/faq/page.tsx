import type { Metadata } from "next";
import { FAQClient } from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to your most common questions about WAQAR fragrances, shipping, returns, and care.",
};

export default function FAQPage() {
  return <FAQClient />;
}
