"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Banknote, ChevronDown, ShoppingBag, ArrowLeft, Lock } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useCatalogProducts } from "@/lib/catalog/CatalogProvider";
import { formatPrice } from "@/lib/utils/formatPrice";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { placeOrderAction } from "@/src/actions/order.actions";
import {
  CHECKOUT_ATTEMPT_REUSED_MESSAGE,
  clearCheckoutAttemptId,
  getOrCreateCheckoutAttemptId,
  replaceCheckoutAttemptId,
} from "@/src/lib/security/checkout-attempt";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

type Field = { label: string; name: string; type?: string; placeholder: string; half?: boolean };

const CUSTOMER_FIELDS: Field[] = [
  { label: "First Name", name: "firstName", placeholder: "أحمد", half: true },
  { label: "Last Name", name: "lastName", placeholder: "محمد", half: true },
  { label: "Email Address", name: "email", type: "email", placeholder: "ahmed@example.com" },
  { label: "Phone Number", name: "phone", type: "tel", placeholder: "01012345678" },
];

const SHIPPING_FIELDS: Field[] = [
  { label: "Street Address", name: "address", placeholder: "شارع التحرير، الدقي" },
  { label: "Apartment / Suite", name: "apt", placeholder: "شقة 12" },
  { label: "City", name: "city", placeholder: "القاهرة", half: true },
  { label: "State / Region", name: "state", placeholder: "الجيزة", half: true },
  { label: "Postal Code", name: "zip", placeholder: "12345", half: true },
  { label: "Country", name: "country", placeholder: "مصر", half: true },
];

function FormField({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ gridColumn: field.half ? "span 1" : "span 2", display: "flex", flexDirection: "column", gap: 6 }} className={field.half ? "" : "full-col"}>
      <label style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: error ? "#cc4444" : "#6B6B63" }}>{field.label}</label>
      <input
        type={field.type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={field.placeholder}
        style={{ padding: "11px 14px", border: `1px solid ${error ? "#cc4444" : focused ? "#B8965A" : "#EDE8DC"}`, backgroundColor: "#FAFAF7", ...S.body, fontSize: 13, color: "#1A1A18", outline: "none", transition: "border-color 0.2s" }}
      />
      {error && <p style={{ ...S.body, fontSize: 11, color: "#cc4444", margin: 0 }}>{error}</p>}
    </div>
  );
}

export function CheckoutClient() {
  const { items: storedItems, clearCart } = useCartStore();
  const catalogProducts = useCatalogProducts();
  const productsById = new Map(catalogProducts.flatMap((product) => [
    [product.databaseId, product] as const,
    [product.id, product] as const, // resolve legacy carts that stored slugs
  ]));
  const items = storedItems.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState<"card" | "vodafone" | "etisalat" | "orange" | "wepay" | "instapay" | "cod">("card");
  const [orderOpen, setOrderOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitting = useRef(false);
  const checkoutAttemptId = useRef<string | null>(null);
  const checkoutAttemptFingerprint = useRef<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 150 ? 0 : 12;
  const total = subtotal + shipping;

  const set = (name: string, val: string) => {
    setSubmitError("");
    setValues((v) => ({ ...v, [name]: val }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const validate = () => {
    const required = ["firstName", "lastName", "address", "city", "country"];
    const newErrors: Record<string, string> = {};
    required.forEach((f) => { if (!values[f]?.trim()) newErrors[f] = "This field is required"; });
    const email = values.email?.trim();
    if (email && !/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (payment === "card") {
      return;
    }

    if (submitting.current || !validate()) return;

    submitting.current = true;
    setLoading(true);
    setSubmitError("");
    try {
      const requestFingerprint = JSON.stringify({
        firstName: values.firstName?.trim() ?? "",
        lastName: values.lastName?.trim() ?? "",
        email: values.email?.trim() ?? "",
        phone: values.phone ?? "",
        address: values.address?.trim() ?? "",
        apt: values.apt ?? "",
        city: values.city?.trim() ?? "",
        state: values.state ?? "",
        zip: values.zip ?? "",
        country: values.country?.trim() ?? "",
        payment,
        items: items.map((item) => [item.product.databaseId, item.quantity] as const).sort(([a], [b]) => a.localeCompare(b)),
      });
      let storage: Storage | null = null;
      try { storage = window.sessionStorage; } catch { /* Storage may be disabled by the browser. */ }
      if (checkoutAttemptFingerprint.current && checkoutAttemptFingerprint.current !== requestFingerprint) {
        checkoutAttemptId.current = storage
          ? replaceCheckoutAttemptId(storage)
          : crypto.randomUUID();
      } else if (!checkoutAttemptId.current) {
        checkoutAttemptId.current = storage
          ? getOrCreateCheckoutAttemptId(storage)
          : crypto.randomUUID();
      }
      checkoutAttemptFingerprint.current = requestFingerprint;

      const result = await placeOrderAction({
        checkoutAttemptId: checkoutAttemptId.current,
        firstName: values.firstName || "",
        lastName: values.lastName || "",
        email: values.email || "",
        phone: values.phone || "",
        address: values.address || "",
        apt: values.apt || "",
        city: values.city || "",
        state: values.state || "",
        zip: values.zip || "",
        country: values.country || "",
        paymentMethod: payment,
        items: items.map((item) => ({
          id: item.product.databaseId,
          quantity: item.quantity,
        })),
      });

      if (!result.success) {
        if (result.error === CHECKOUT_ATTEMPT_REUSED_MESSAGE) {
          try {
            const storage = window.sessionStorage;
            checkoutAttemptId.current = replaceCheckoutAttemptId(storage);
          } catch {
            checkoutAttemptId.current = crypto.randomUUID();
          }
          checkoutAttemptFingerprint.current = requestFingerprint;
        }
        setSubmitError(result.error);
        return;
      }

      clearCart();
      checkoutAttemptId.current = null;
      checkoutAttemptFingerprint.current = null;
      try { clearCheckoutAttemptId(window.sessionStorage); } catch { /* Safe to continue after order creation. */ }
      const params = new URLSearchParams({
        orderNumber: result.data.orderNumber,
        accessToken: result.data.proofAccessToken,
        total: String(result.data.total),
        method: result.data.paymentMethod,
      });

      const destination = result.data.paymentMethod === "cod"
        ? `/checkout/confirmation?${params.toString()}`
        : `/checkout/payment-instructions?${params.toString()}`;

      router.push(destination);
    } catch {
      setSubmitError("We couldn't reach the checkout service. Please try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <>
        <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
          <GoldDivider />
        </div>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "100px 40px", textAlign: "center" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}
            style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid #B8965A", backgroundColor: "rgba(184,150,90,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <Check size={32} strokeWidth={1.5} style={{ color: "#B8965A" }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 12 }}>Order Confirmed</p>
            <h1 style={{ ...S.display, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, color: "#1A1A18", marginBottom: 16 }}>
              Merci, {values.firstName || "Dear Customer"}
            </h1>
            <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.8, marginBottom: 12 }}>
              Your order has been received and is being prepared with great care.
              {values.email?.trim() && <> A confirmation email has been sent to <strong style={{ color: "#1A1A18" }}>{values.email}</strong>.</>}
            </p>
            <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.8, marginBottom: 40 }}>
              Estimated delivery: <strong style={{ color: "#1A1A18" }}>3–5 business days</strong>
            </p>
            <div style={{ width: 48, height: 1, backgroundColor: "#B8965A", opacity: 0.5, margin: "0 auto 36px" }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" style={{ padding: "12px 28px", backgroundColor: "#1A1A18", color: "#FAFAF7", textDecoration: "none", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Return Home
              </Link>
              <Link href="/products" style={{ padding: "12px 28px", border: "1px solid #1A1A18", color: "#1A1A18", textDecoration: "none", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
        <GoldDivider />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}><GoldDivider /></div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "100px 40px", textAlign: "center" }}>
          <ShoppingBag size={40} strokeWidth={1} style={{ color: "#EDE8DC", marginBottom: 20 }} />
          <h2 style={{ ...S.display, fontSize: 28, fontWeight: 300, color: "#1A1A18", marginBottom: 16 }}>Your cart is empty</h2>
          <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "12px 28px", textDecoration: "none", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Browse Collections
          </Link>
        </div>
        <GoldDivider />
      </>
    );
  }

  return (
    <>
      <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px 48px" }}>
          <Link href="/cart" style={{ display: "inline-flex", alignItems: "center", gap: 6, ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", textDecoration: "none", marginBottom: 20 }}>
            <ArrowLeft size={11} /> Back to Cart
          </Link>
          <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 14 }}>Secure Checkout</p>
          <h1 style={{ ...S.display, fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.05, margin: 0 }}>Complete Your Order</h1>
        </div>
        <GoldDivider />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 40px 80px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 56, alignItems: "flex-start" }} className="checkout-layout">

            {/* Left: Forms */}
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

              {/* Customer Info */}
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#1A1A18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ ...S.mono, fontSize: 11, color: "#FAFAF7" }}>1</span>
                  </div>
                  <h2 style={{ ...S.display, fontSize: 22, fontWeight: 300, color: "#1A1A18", margin: 0 }}>Customer Information</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }} className="form-grid">
                  {CUSTOMER_FIELDS.map((f) => (
                    <FormField key={f.name} field={f} value={values[f.name] ?? ""} error={errors[f.name]} onChange={(v) => set(f.name, v)} />
                  ))}
                </div>
              </section>

              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC" }} />

              {/* Shipping */}
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#1A1A18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ ...S.mono, fontSize: 11, color: "#FAFAF7" }}>2</span>
                  </div>
                  <h2 style={{ ...S.display, fontSize: 22, fontWeight: 300, color: "#1A1A18", margin: 0 }}>Shipping Address</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }} className="form-grid">
                  {SHIPPING_FIELDS.map((f) => (
                    <FormField key={f.name} field={f} value={values[f.name] ?? ""} error={errors[f.name]} onChange={(v) => set(f.name, v)} />
                  ))}
                </div>
              </section>

              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC" }} />

              {/* Payment */}
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#1A1A18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ ...S.mono, fontSize: 11, color: "#FAFAF7" }}>3</span>
                  </div>
                  <h2 style={{ ...S.display, fontSize: 22, fontWeight: 300, color: "#1A1A18", margin: 0 }}>Payment Method</h2>
                </div>

                {/* Payment method grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="payment-grid">
                  {[
                    {
                      id: "card" as const,
                      label: "Credit / Debit Card",
                      sub: "Visa · Mastercard · Amex",
                      logo: (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {/* Visa */}
                          <div style={{ width: 38, height: 24, backgroundColor: "#1A1F71", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "#FAFAF7", fontStyle: "italic", letterSpacing: "0.02em" }}>VISA</span>
                          </div>
                          {/* Mastercard */}
                          <div style={{ width: 38, height: 24, backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
                            <div style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: "#EB001B", opacity: 0.9 }} />
                            <div style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: "#F79E1B", opacity: 0.9, marginLeft: -5 }} />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "vodafone" as const,
                      label: "Vodafone Cash",
                      sub: "Pay via Vodafone wallet",
                      logo: (
                        <div style={{ width: 38, height: 24, backgroundColor: "#E60000", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, fontWeight: 700, color: "#FAFAF7", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>VF Cash</span>
                        </div>
                      ),
                    },
                    {
                      id: "etisalat" as const,
                      label: "Etisalat Cash",
                      sub: "Pay via e& wallet",
                      logo: (
                        <div style={{ width: 38, height: 24, backgroundColor: "#00A651", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, fontWeight: 700, color: "#FAFAF7", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>e& Cash</span>
                        </div>
                      ),
                    },
                    {
                      id: "orange" as const,
                      label: "Orange Cash",
                      sub: "Pay via Orange wallet",
                      logo: (
                        <div style={{ width: 38, height: 24, backgroundColor: "#FF6600", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, fontWeight: 700, color: "#FAFAF7", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>Orange</span>
                        </div>
                      ),
                    },
                    {
                      id: "wepay" as const,
                      label: "WE Pay",
                      sub: "Pay via Telecom Egypt",
                      logo: (
                        <div style={{ width: 38, height: 24, backgroundColor: "#003087", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700, color: "#FAFAF7", letterSpacing: "0.02em" }}>WE</span>
                        </div>
                      ),
                    },
                    {
                      id: "instapay" as const,
                      label: "InstaPay",
                      sub: "Instant bank transfer",
                      logo: (
                        <div style={{ width: 38, height: 24, background: "linear-gradient(135deg, #6C3CE1 0%, #9B5DE5 100%)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 7.5, fontWeight: 700, color: "#FAFAF7", letterSpacing: "0.01em", whiteSpace: "nowrap" }}>InstaPay</span>
                        </div>
                      ),
                    },
                    {
                      id: "cod" as const,
                      label: "Cash on Delivery",
                      sub: "Pay when order arrives",
                      logo: (
                        <div style={{ width: 38, height: 24, backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Banknote size={14} strokeWidth={1.5} style={{ color: "#B8965A" }} />
                        </div>
                      ),
                    },
                  ].map(({ id, label, sub, logo }) => {
                    const active = payment === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSubmitError("");
                          setPayment(id);
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "14px 16px",
                          border: `1px solid ${active ? "#B8965A" : "#EDE8DC"}`,
                          backgroundColor: active ? "rgba(184,150,90,0.04)" : "#FAFAF7",
                          cursor: "pointer", textAlign: "left",
                          transition: "border-color 0.2s, background-color 0.2s",
                        }}
                      >
                        {/* Radio dot */}
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? "#B8965A" : "#EDE8DC"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color 0.2s" }}>
                          {active && <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#B8965A" }} />}
                        </div>
                        {/* Logo */}
                        <div style={{ flexShrink: 0 }}>{logo}</div>
                        {/* Text */}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ ...S.body, fontSize: 12, fontWeight: 500, color: "#1A1A18", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
                          <p style={{ ...S.mono, fontSize: 8, letterSpacing: "0.08em", color: "#6B6B63", marginTop: 2, whiteSpace: "nowrap" }}>{sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Card fields — shown only when card is selected */}
                <AnimatePresence>
                  {payment === "card" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                      <div style={{ marginTop: 16, padding: "16px 18px", backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC" }}>
                        <p style={{ ...S.body, fontSize: 13, color: "#1A1A18", margin: "0 0 4px", fontWeight: 500 }}>Online card payment is coming soon.</p>
                        <p style={{ ...S.body, fontSize: 12, color: "#6B6B63", margin: 0, lineHeight: 1.7 }}>
                          Checkout is temporarily unavailable for card payments while this phase is being finalized.
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {/* Mobile wallet instruction */}
                  {(payment === "vodafone" || payment === "etisalat" || payment === "orange" || payment === "wepay" || payment === "instapay") && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                      <div style={{ marginTop: 14, padding: "14px 16px", backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC" }}>
                        <p style={{ ...S.body, fontSize: 13, color: "#1A1A18", margin: "0 0 4px", fontWeight: 500 }}>Payment instructions</p>
                        <p style={{ ...S.body, fontSize: 12, color: "#6B6B63", margin: 0, lineHeight: 1.7 }}>
                          After placing your order, you will receive payment details and a reference number to complete your transfer via your {payment === "vodafone" ? "Vodafone Cash" : payment === "etisalat" ? "e& Cash" : payment === "orange" ? "Orange Cash" : payment === "wepay" ? "WE Pay" : "InstaPay"} app.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || payment === "card"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "16px 32px", border: "none", cursor: loading || payment === "card" ? "not-allowed" : "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: loading || payment === "card" ? 0.7 : 1, transition: "opacity 0.3s, background-color 0.3s" }}
                onMouseEnter={e => !loading && payment !== "card" && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#6B6B63")}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1A18")}
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ width: 14, height: 14, border: "1.5px solid rgba(250,250,247,0.4)", borderTopColor: "#FAFAF7", borderRadius: "50%" }} />
                ) : (
                  <><Lock size={13} strokeWidth={1.5} /> Place Order · {formatPrice(total)}</>
                )}
              </button>
              {submitError && (
                <p role="alert" style={{ ...S.body, fontSize: 12, lineHeight: 1.6, color: "#cc4444", margin: "12px 0 0" }}>
                  {submitError}
                </p>
              )}
              <p style={{ ...S.body, fontSize: 11, color: "#6B6B63", display: "flex", alignItems: "center", gap: 5, marginTop: -28 }}>
                <Lock size={10} strokeWidth={1.5} /> SSL encrypted. Your payment information is secure.
              </p>
            </div>

            {/* Right: Order Summary */}
            <div style={{ backgroundColor: "#F5F0E8", padding: "28px 24px", position: "sticky", top: 100 }}>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setOrderOpen((v) => !v)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", marginBottom: orderOpen ? 20 : 0 }}
              >
                <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", margin: 0 }}>Order Summary ({items.length} items)</p>
                <motion.div animate={{ rotate: orderOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} strokeWidth={1.5} style={{ color: "#6B6B63" }} />
                </motion.div>
              </button>

              <AnimatePresence>
                {orderOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                      {items.map((item) => (
                        <div key={item.product.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ position: "relative", width: 52, height: 52, backgroundColor: "#FAFAF7", flexShrink: 0 }}>
                            <Image src={item.product.image} alt={item.product.name} fill style={{ objectFit: "cover" }} sizes="52px" />
                            <span style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", backgroundColor: "#1A1A18", color: "#FAFAF7", ...S.mono, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.quantity}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ ...S.body, fontSize: 12, fontWeight: 500, color: "#1A1A18", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product.name}</p>
                            <p style={{ ...S.mono, fontSize: 9, color: "#6B6B63", margin: 0 }}>{item.product.size}</p>
                          </div>
                          <span style={{ ...S.mono, fontSize: 12, color: "#1A1A18", flexShrink: 0 }}>{formatPrice(item.product.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", margin: "0 0 16px" }} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...S.body, fontSize: 13, color: "#6B6B63" }}>Subtotal</span>
                  <span style={{ ...S.mono, fontSize: 13, color: "#1A1A18" }}>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...S.body, fontSize: 13, color: "#6B6B63" }}>Shipping</span>
                  <span style={{ ...S.mono, fontSize: 13, color: shipping === 0 ? "#B8965A" : "#1A1A18" }}>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
              </div>

              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ ...S.display, fontSize: 18, color: "#1A1A18" }}>Total</span>
                <span style={{ ...S.display, fontSize: 22, fontWeight: 300, color: "#1A1A18" }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <GoldDivider />
      <style>{`
        .checkout-layout { grid-template-columns: 1fr 420px; }
        .form-grid { grid-template-columns: 1fr 1fr; }
        .full-col { grid-column: span 2 !important; }
        .payment-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 1024px) { .checkout-layout { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr !important; } .full-col { grid-column: span 1 !important; } .payment-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
