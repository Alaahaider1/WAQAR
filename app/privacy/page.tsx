import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Privacy Policy" };

const S = { b: { fontFamily: "'DM Sans', system-ui, sans-serif" } } as const;

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy" titleItalic="Policy" subtitle="How we collect, use, and protect your information." />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            ["Information We Collect", "We collect information you provide directly to us, such as when you create an account, place an order, or contact our support team. This includes your name, email address, shipping address, and payment information."],
            ["How We Use Your Information", "We use the information we collect to process orders, communicate with you about your purchases, send marketing communications you have opted into, and improve our products and services."],
            ["Data Security", "We implement industry-standard security measures, including SSL encryption, to protect your personal information from unauthorized access, disclosure, or destruction."],
            ["Your Rights", "You have the right to access, correct, or delete your personal information at any time. Contact our support team to exercise these rights."],
            ["Cookies", "We use cookies to enhance your browsing experience, remember your preferences, and analyse site traffic. You can control cookie settings through your browser."],
            ["Contact Us", "If you have questions about this Privacy Policy, please contact us at hello@waqar.com."],
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
