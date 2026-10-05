"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Tag, Truck, Check } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useCatalogProducts } from "@/lib/catalog/CatalogProvider";
import { formatPrice } from "@/lib/utils/formatPrice";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn } from "@/components/ui/FadeIn";
import { validateCouponAction } from "@/src/actions/coupon.actions";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;



export function CartClient() {
  const { items: storedItems, removeItem, updateQuantity } = useCartStore();
  const catalogProducts = useCatalogProducts();
  const productsById = new Map(catalogProducts.map((product) => [product.id, product]));
  const items = storedItems.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon?.discountAmount ?? 0;
  const shipping = subtotal >= 150 ? 0 : 12;
  const total = subtotal - discount + shipping;

  const handleApplyCoupon = async () => {
    setCouponError("");
    setCouponLoading(true);
    const code = coupon.trim().toUpperCase();
    const result = await validateCouponAction({ code, subtotal });
    setCouponLoading(false);

    if (!result.success || !result.data) {
      setCouponError("Invalid coupon code.");
      return;
    }

    setAppliedCoupon({
      code: result.data.code,
      discountAmount: result.data.discountAmount,
      label: result.data.discountType === "percentage"
        ? `${Math.round(result.data.discountValue)}% off`
        : `${formatPrice(result.data.discountAmount)} off`,
    });
    setCoupon("");
  };

  /* ── Empty State ── */
  if (items.length === 0) {
    return (
      <>
        <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px 48px" }}>
            <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 14 }}>Your Bag</p>
            <h1 style={{ ...S.display, fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.05, margin: 0 }}>Shopping Cart</h1>
          </div>
          <GoldDivider />
        </div>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "100px 40px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <ShoppingBag size={28} strokeWidth={1} style={{ color: "#B8965A" }} />
          </div>
          <h2 style={{ ...S.display, fontSize: 32, fontWeight: 300, color: "#1A1A18", marginBottom: 12 }}>Your cart is empty</h2>
          <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.75, marginBottom: 36 }}>
            You haven&apos;t added any fragrances yet. Explore our collections to find your perfect scent.
          </p>
          <Link href="/products"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "13px 32px", textDecoration: "none", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#6B6B63")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1A1A18")}
          >
            Explore Collections <ArrowRight size={12} />
          </Link>
        </div>
        <GoldDivider />
      </>
    );
  }

  /* ── Filled Cart ── */
  return (
    <>
      {/* Header */}
      <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px 48px" }}>
          <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 14 }}>Your Bag</p>
          <h1 style={{ ...S.display, fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.05, margin: 0 }}>Shopping Cart</h1>
        </div>
        <GoldDivider />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 40px 80px" }}>
        <div style={{ display: "grid", gap: 56, alignItems: "flex-start" }} className="cart-layout">

          {/* ── Items ── */}
          <div>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 128px 80px 32px", gap: 16, paddingBottom: 14, borderBottom: "1px solid #EDE8DC", marginBottom: 4 }} className="cart-cols">
              {["Product", "Quantity", "Price", ""].map((h) => (
                <span key={h} style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63" }}>{h}</span>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 128px 80px 32px", gap: 16, padding: "22px 0", borderBottom: "1px solid #EDE8DC", alignItems: "center" }} className="cart-row">

                    {/* Product */}
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <Link href={`/products/${item.product.id}`} style={{ position: "relative", width: 76, height: 76, flexShrink: 0, backgroundColor: "#F5F0E8", display: "block" }}>
                        <Image src={item.product.image} alt={item.product.name} fill style={{ objectFit: "cover" }} sizes="76px" />
                      </Link>
                      <div>
                        <Link href={`/products/${item.product.id}`} style={{ textDecoration: "none" }}>
                          <p style={{ ...S.display, fontSize: 17, fontWeight: 300, color: "#1A1A18", margin: "0 0 3px", lineHeight: 1.2 }}>{item.product.name}</p>
                        </Link>
                        <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6B63", margin: 0 }}>{item.product.subtitle} · {item.product.size}</p>
                      </div>
                    </div>

                    {/* Qty */}
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #EDE8DC", width: 128 }}>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ width: 36, height: 38, background: "none", border: "none", cursor: "pointer", color: "#6B6B63", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Minus size={11} strokeWidth={1.5} />
                      </button>
                      <span style={{ flex: 1, textAlign: "center", ...S.mono, fontSize: 12, color: "#1A1A18", borderLeft: "1px solid #EDE8DC", borderRight: "1px solid #EDE8DC", lineHeight: "38px" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ width: 36, height: 38, background: "none", border: "none", cursor: "pointer", color: "#6B6B63", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Plus size={11} strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Price */}
                    <div>
                      <p style={{ ...S.mono, fontSize: 13, color: "#1A1A18", margin: 0, textAlign: "right" }}>{formatPrice(item.product.price * item.quantity)}</p>
                      {item.quantity > 1 && <p style={{ ...S.mono, fontSize: 9, color: "#6B6B63", marginTop: 2, textAlign: "right" }}>{formatPrice(item.product.price)} ea.</p>}
                    </div>

                    {/* Remove */}
                    <button onClick={() => removeItem(item.product.id)}
                      style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#6B6B63", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#1A1A18")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#6B6B63")}
                    >
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div style={{ marginTop: 28 }}>
              <Link href="/products"
                style={{ ...S.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1A1A18")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B6B63")}
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Summary ── */}
          <FadeIn direction="right">
            <div style={{ backgroundColor: "#F5F0E8", padding: "28px 28px 24px" }}>
              <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 20 }}>Order Summary</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...S.body, fontSize: 13, color: "#6B6B63" }}>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span style={{ ...S.mono, fontSize: 13, color: "#1A1A18" }}>{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ ...S.body, fontSize: 13, color: "#B8965A", display: "flex", alignItems: "center", gap: 5 }}>
                      <Check size={11} /> {appliedCoupon.code} ({appliedCoupon.label})
                    </span>
                    <span style={{ ...S.mono, fontSize: 13, color: "#B8965A" }}>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ ...S.body, fontSize: 13, color: "#6B6B63", display: "flex", alignItems: "center", gap: 6 }}>
                    <Truck size={12} strokeWidth={1.5} style={{ color: shipping === 0 ? "#B8965A" : "#6B6B63" }} />
                    Shipping
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ ...S.mono, fontSize: 13, color: shipping === 0 ? "#B8965A" : "#1A1A18", display: "block" }}>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                    {subtotal > 0 && subtotal < 150 && <span style={{ ...S.mono, fontSize: 9, color: "#B8965A", display: "block", marginTop: 2 }}>Add {formatPrice(150 - subtotal)} for free shipping</span>}
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", margin: "16px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <span style={{ ...S.display, fontSize: 18, color: "#1A1A18" }}>Total</span>
                <span style={{ ...S.display, fontSize: 24, fontWeight: 300, color: "#1A1A18" }}>{formatPrice(total)}</span>
              </div>

              {/* Coupon field */}
              {!appliedCoupon && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <Tag size={11} strokeWidth={1.5} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6B6B63", pointerEvents: "none" }} />
                      <input
                        type="text"
                        value={coupon}
                        onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        placeholder="Coupon code"
                        style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30, paddingRight: 10, paddingTop: 9, paddingBottom: 9, border: `1px solid ${couponError ? "#cc4444" : "#EDE8DC"}`, backgroundColor: "#FAFAF7", ...S.mono, fontSize: 10, letterSpacing: "0.1em", color: "#1A1A18", outline: "none" }}
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!coupon.trim() || couponLoading}
                      style={{ padding: "9px 14px", backgroundColor: "#1A1A18", color: "#FAFAF7", border: "none", cursor: coupon.trim() ? "pointer" : "not-allowed", ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", opacity: coupon.trim() ? 1 : 0.4, flexShrink: 0, transition: "opacity 0.2s" }}
                    >
                      {couponLoading ? "…" : "Apply"}
                    </button>
                  </div>
                  {couponError && <p style={{ ...S.body, fontSize: 11, color: "#cc4444", marginTop: 5, margin: "5px 0 0" }}>{couponError}</p>}
                </div>
              )}

              {/* Checkout CTA */}
              <Link href="/checkout"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "14px", textDecoration: "none", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14, transition: "background-color 0.3s" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#6B6B63")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1A1A18")}
              >
                Proceed to Checkout <ArrowRight size={12} />
              </Link>

              {/* Payment badges */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                {["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay"].map((m) => (
                  <span key={m} style={{ ...S.mono, fontSize: 8, letterSpacing: "0.08em", color: "#6B6B63", border: "1px solid #EDE8DC", padding: "2px 7px", backgroundColor: "#FAFAF7" }}>{m}</span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <GoldDivider />
      <style>{`
        .cart-layout { grid-template-columns: 1fr 380px; }
        @media (max-width: 1024px) { .cart-layout { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) {
          .cart-cols { display: none !important; }
          .cart-row { grid-template-columns: 1fr auto !important; gap: 12px !important; }
        }
      `}</style>
    </>
  );
}
