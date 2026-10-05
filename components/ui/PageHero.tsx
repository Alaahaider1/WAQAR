import { GoldDivider } from "@/components/ui/GoldDivider";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  titleItalic?: string;
  subtitle?: string;
  center?: boolean;
};

export function PageHero({ eyebrow, title, titleItalic, subtitle, center }: PageHeroProps) {
  return (
    <div style={{ backgroundColor: "#FAFAF7", paddingTop: 96 }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: center ? "56px 40px 48px" : "56px 40px 48px",
          textAlign: center ? "center" : undefined,
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#6B6B63",
            marginBottom: 14,
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
            fontWeight: 300,
            color: "#1A1A18",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {title}
          {titleItalic && (
            <>
              {" "}
              <em style={{ fontStyle: "italic" }}>{titleItalic}</em>
            </>
          )}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 14,
              color: "#6B6B63",
              lineHeight: 1.8,
              marginTop: 16,
              maxWidth: center ? 480 : 560,
              margin: center ? "16px auto 0" : "16px 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <GoldDivider />
    </div>
  );
}
