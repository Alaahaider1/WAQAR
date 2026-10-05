import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Terms of Service" };

const S = { b: { fontFamily: "'DM Sans', system-ui, sans-serif" } } as const;

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of" titleItalic="Service" subtitle="The terms and conditions governing use of our website and services." />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            ["Acceptance of Terms", "By accessing and using this website, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our website."],
            ["Orders and Payment", "All orders are subject to availability and confirmation of the order price. Payment must be received in full before an order is dispatched."],
            ["Shipping and Delivery", "Delivery times are estimates only. We are not responsible for delays caused by circumstances beyond our control, including customs processing for international orders."],
            ["Returns and Refunds", "Unopened products may be returned within 30 days of delivery for a full refund. Please refer to our FAQ page for complete return instructions."],
            ["Intellectual Property", "All content on this website, including text, images, and logos, is the property of WAQAR and is protected by applicable intellectual property laws."],
            ["Limitation of Liability", "WAQAR shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website."],
            ["Contact Us", "For questions regarding these Terms of Service, please contact us at hello@waqar.com."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300, color: "#1A1A18", marginBottom: 10 }}>{title}</h2>
              <p style={{ ...S.b, fontSize: 14, color: "#6B6B63", lineHeight: 1.8, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
