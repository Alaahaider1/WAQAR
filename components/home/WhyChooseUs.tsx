"use client";

import { Leaf, Award, PackageCheck, Truck } from "lucide-react";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/FadeIn";

const pillars = [
  {
    Icon: Leaf,
    title: "Up to 90% Scent Match",
    description: "We strive to deliver fragrances that closely match the scent profile of their inspirations.",
  },
  {
    Icon: Award,
    title: "Carefully Tested Before Selection",
    description: "Every fragrance goes through multiple tests and comparisons before being selected.",
  },
  {
    Icon: Truck,
    title: "Shipping in 2–5 Days",
    description: "Your Waqar order will be delivered within 2–5 days, so you can enjoy your fragrance without a long wait.",
  },
  {
    Icon: PackageCheck,
    title: "Return Guarantee",
    description: "Shop with confidence with Waqar’s return guarantee, subject to our return policy.",
  },
];

export function WhyChooseUs() {
  return (
    <section style={{ backgroundColor: "rgba(237,232,220,0.35)" }}>
      <GoldDivider />

      <div className="why-choose-us-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        {/* Header */}
        <FadeIn style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 12 }}>
            The WAQAR Promise
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.1, margin: "0 auto", maxWidth: 480 }}>
            Why Discerning Noses <em>Choose Us</em>
          </h2>
        </FadeIn>

        {/* Pillars */}
        <StaggerContainer
          className="why-choose-us-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 40,
          }}
        >
          {pillars.map(({ Icon, title, description }) => (
            <StaggerItem key={title}>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Icon size={22} strokeWidth={1.2} style={{ color: "#B8965A", marginBottom: 16 }} />
                <div style={{ width: 32, height: 1, backgroundColor: "#B8965A", opacity: 0.45, marginBottom: 16 }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 300, color: "#1A1A18", marginBottom: 12 }}>
                  {title}
                </h3>
                <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.8, margin: 0 }}>
                  {description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
