/**
 * Admin Coupons — Server Component fetches data, passes to client.
 */
import { createServerClient } from "@/src/lib/supabase/server";
import { CouponsClient } from "./CouponsClient";

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  minimum_order_value: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  status: string;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
};

function getCouponRowKey(coupon: CouponRow): string {
  const id = coupon.id?.trim();
  if (id) return id;

  const code = coupon.code?.trim();
  const createdAt = coupon.created_at?.trim() || coupon.valid_from?.trim() || "unknown";
  if (code) return `${code}-${createdAt}`;

  return `${coupon.status || "coupon"}-${createdAt}`;
}

export default async function AdminCouponsPage() {
  const supabase = await createServerClient();
  const { data: coupons, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load coupons: ${error.message}`);
  }

  const initialCoupons = (coupons ?? []).map((coupon: CouponRow) => ({
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    minimum_order_value: Number(coupon.minimum_order_value ?? 0),
    maximum_discount: coupon.maximum_discount == null ? null : Number(coupon.maximum_discount),
    usage_limit: coupon.usage_limit == null ? null : coupon.usage_limit,
    usage_count: coupon.usage_count ?? 0,
    per_user_limit: coupon.per_user_limit ?? 1,
    status: coupon.status as "active" | "draft" | "expired" | "disabled",
    valid_from: coupon.valid_from,
    valid_until: coupon.valid_until,
    created_at: coupon.created_at,
    rowKey: getCouponRowKey(coupon),
  }));

  return <CouponsClient initialCoupons={initialCoupons} />;
}
