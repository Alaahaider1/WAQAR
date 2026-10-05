"use client";

import { Star } from "lucide-react";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

// Static review data seeded per product
const REVIEW_POOL = [
  { name: "Mohamed Yassen", location: "المنيا,تلة", rating: 5, text: "يا صديقي اقسم بالله طلعت بعروسه من الشبكه وان شاءالله قريب قوي هاخد الخطوه تسلم ايدك ع البرفيوم التوب ده كنت فين من زمان😂😂😂❤️", date: "March 2025" },
  { name: "Mohamed Yassen", location: "المنيا,تلة", rating: 5, text: "يا صديقي اقسم بالله طلعت بعروسه من الشبكه وان شاءالله قريب قوي هاخد الخطوه تسلم ايدك ع البرفيوم التوب ده كنت فين من زمان😂😂😂❤️", date: "March 2025" },
{
  name: "Sohila Waleed",
  location: "المنيا, المنيا",
  rating: 5,
  text: `بجد بجد مشوفتش احلي من دة برفن 😂💙

يعني ثبات وغير أن ريحه جديدة مش تقليديه خالص وعجبت كل الي شمها والله بجد نا مبيعجبنيش العجب بس فعلا حاجه تحفه 😹💙💙

يعني بوكس شيك وبرفن تحفه وتيست كمان وسعر لذيذ خالص مستنيه بقا أطلب واحد تاني يكون جامد كد 💙`,
  date: "March 2025",
}];

type Props = {
  rating: number;
  reviewCount: number;
  productId: string;
};

export function ProductReviews({ rating, reviewCount, productId }: Props) {
  // Deterministically pick 3 reviews based on product id
  const seed = productId.charCodeAt(0) + productId.charCodeAt(1);
  const reviews = REVIEW_POOL.slice(seed % 3, (seed % 3) + 3);

  const bars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 6 : star === 2 ? 3 : 1,
  }));

  return (
    <div className="product-reviews">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 8 }}>Customer Reviews</p>
          <h2 style={{ ...S.display, fontSize: 28, fontWeight: 300, color: "#1A1A18", margin: 0 }}>
            What Our Customers Say
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} strokeWidth={0} fill={i < Math.floor(rating) ? "#B8965A" : "#EDE8DC"} />
            ))}
          </div>
          <p style={{ ...S.display, fontSize: 22, fontWeight: 300, color: "#1A1A18", margin: 0 }}>{rating} / 5</p>
          <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", color: "#6B6B63" }}>Based on {reviewCount} reviews</p>
        </div>
      </div>

      {/* Rating bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40, maxWidth: 380 }}>
        {bars.map(({ star, pct }) => (
          <div key={star} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 2, width: 70, flexShrink: 0 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={9} strokeWidth={0} fill={i < star ? "#B8965A" : "#EDE8DC"} />
              ))}
            </div>
            <div style={{ flex: 1, height: 4, backgroundColor: "#EDE8DC", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: "#B8965A", transition: "width 0.6s ease" }} />
            </div>
            <span style={{ ...S.mono, fontSize: 9, color: "#6B6B63", width: 28, textAlign: "right" }}>{pct}%</span>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", marginBottom: 40 }} />

      {/* Review cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {reviews.map((review, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Stars + date */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={11} strokeWidth={0} fill={j < review.rating ? "#B8965A" : "#EDE8DC"} />
                ))}
              </div>
              <span style={{ ...S.mono, fontSize: 9, letterSpacing: "0.1em", color: "#6B6B63" }}>{review.date}</span>
            </div>
            {/* Text */}
            <p style={{ ...S.body, fontSize: 14, color: "#1A1A18", lineHeight: 1.75, margin: 0 }}>
              &ldquo;{review.text}&rdquo;
            </p>
            {/* Author */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#EDE8DC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ ...S.mono, fontSize: 9, color: "#6B6B63" }}>{review.name.split(" ").map(w => w[0]).join("")}</span>
              </div>
              <div>
                <p style={{ ...S.body, fontSize: 12, fontWeight: 500, color: "#1A1A18", margin: 0 }}>{review.name}</p>
                <p style={{ ...S.mono, fontSize: 9, color: "#6B6B63", marginTop: 2, letterSpacing: "0.1em" }}>{review.location}</p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#B8965A" }} />
                <span style={{ ...S.mono, fontSize: 9, color: "#6B6B63", letterSpacing: "0.1em" }}>Verified Purchase</span>
              </div>
            </div>
            <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC" }} />
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 520px) {
          .product-reviews, .product-reviews > * { min-width: 0; max-width: 100%; }
          .product-reviews p, .product-reviews span { overflow-wrap: anywhere; }
        }
      `}</style>
    </div>
  );
}
