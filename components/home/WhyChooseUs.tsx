"use client";

import { Leaf, Award, PackageCheck, Truck } from "lucide-react";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/FadeIn";

const pillars = [
  {
    Icon: Leaf,
    title: "Natural Ingredients",
    description: "Over 95% of our ingredients are natural. We source from ethical farms and sustainable harvests across 18 countries.",
  },
  {
    Icon: Award,
    title: "Master Craftsmanship",
    description: "Each fragrance is composed by one of our three master perfumers, each with over twenty years of experience.",
  },
  {
    Icon: PackageCheck,
    title: "No Compromise",
    description: "We never use synthetic shortcuts. Every ingredient is evaluated for quality before a single drop enters our studio.",
  },
  {
    Icon: Truck,
    title: "Delivered Beautifully",
    description: "Every order ships in our signature ivory box, hand-wrapped in tissue and sealed with a wax stamp.",
  },
];

export function WhyChooseUs() {
  return (
    <section style={{ backgroundColor: "rgba(237,232,220,0.35)" }}>
      <GoldDivider />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
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
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 40,
          }}
        >
          {pillars.map(({ Icon, title, description }) => (
            <StaggerItem key={title}>
              <div style={{ display: "flex", flexDirection: "column" }}>
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
