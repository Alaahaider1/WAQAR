/**
 * Domain types — shaped for the application layer.
 *
 * These extend or reshape DB row types into the forms used by repositories,
 * services, and the UI. They are the contract between the backend and
 * the frontend — if the DB schema changes, only repositories need updating.
 */

import type {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  ProductStatus,
  CouponStatus,
  DiscountType,
  ReviewStatus,
  FragranceNoteType,
  NewsletterStatus,
  ContactMessageStatus,
  AuditAction,
  InventoryMovementReason,
} from './database';

// Re-export enums so consumers import only from domain, not database
export type {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  ProductStatus,
  CouponStatus,
  DiscountType,
  ReviewStatus,
  FragranceNoteType,
  NewsletterStatus,
  ContactMessageStatus,
  AuditAction,
  InventoryMovementReason,
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'super_admin';
  emailConfirmed: boolean;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: 'customer' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  concentration: string | null;
  price: number;
  compareAtPrice: number | null;
  isDefault: boolean;
  isActive: boolean;
  availableQuantity: number;
  allowBackorder: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  cloudinaryId: string | null;
}

/** Full product — used on product detail page and admin */
export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  category: Category;
  description: string | null;
  longDescription: string | null;
  ingredients: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
  fragranceNotes: FragranceNotes;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

/** Listing card — used in product grid, no full variants/notes needed */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  categorySlug: string;
  categoryName: string;
  basePrice: number;
  compareAtPrice: number | null;
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  defaultVariantId: string | null;
  defaultVariantSize: string | null;
  defaultVariantPrice: number | null;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  availableQuantity: number;
  allowBackorder: boolean;
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export interface InventoryLevel {
  variantId: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderThreshold: number;
  allowBackorder: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

// ---------------------------------------------------------------------------
// Commerce
// ---------------------------------------------------------------------------

export interface Address {
  fullName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  countryCode: string;
}

export interface SavedAddress extends Address {
  id: string;
  isDefault: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  status: CouponStatus;
  validFrom: string;
  validUntil: string | null;
}

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  variantSize: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  coupon: Coupon | null;
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface OrderItem {
  id: string;
  variantId: string | null;
  productId: string | null;
  productName: string;
  variantSku: string;
  variantSize: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  couponCode: string | null;
  shippingAddress: Address;
  billingAddress: Address | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingProvider: string | null;
  shipmentId: string | null;
  shippingStatus: string | null;
  estimatedDelivery: string | null;
  customerNotes: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/** Order list item — for order history table */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  currency: string;
  itemCount: number;
  customerName: string | null;
  customerEmail: string | null;
  paymentProvider: PaymentProvider | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  productId: string;
  userId: string;
  authorName: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface UgcVideo {
  id: string;
  videoUrl: string;
  storagePath: string;
  customerName: string | null;
  caption: string | null;
  position: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fields intentionally serialized into the public storefront. */
export interface PublicUgcVideo {
  videoUrl: string;
  customerName: string | null;
  caption: string | null;
}

/** Fields required by the admin UI; storage paths and audit timestamps stay server-side. */
export interface AdminUgcVideo {
  id: string;
  videoUrl: string;
  customerName: string | null;
  caption: string | null;
  position: number;
  isVisible: boolean;
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export interface WishlistItem {
  id: string;
  productId: string;
  product: ProductSummary;
  addedAt: string;
}

// ---------------------------------------------------------------------------
// Customer feedback screenshots
// ---------------------------------------------------------------------------

export interface CustomerFeedbackImage {
  id: string;
  imageUrl: string;
  storagePath: string;
  position: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Site Settings
// ---------------------------------------------------------------------------

export interface SiteSettings {
  storeName: string;
  storeEmail: string;
  storeCurrency: string;
  storeCurrencySymbol: string;
  taxRate: number;
  taxIncluded: boolean;
  shippingFreeThreshold: number;
  shippingStandardRate: number;
  shippingExpressRate: number;
  shippingStandardDays: string;
  shippingExpressDays: string;
  shippingProvider: string;
  shippingApiKey: string;
  shippingBaseUrl: string;
  shippingEnvironment: string;
  shippingEnabled: boolean;
  socialInstagram: string;
  socialTwitter: string;
  socialFacebook: string;
  metaPixelEnabled: boolean;
  metaPixelId: string;
  tikTokPixelEnabled: boolean;
  tikTokPixelId: string;
  maintenanceMode: boolean;
  allowReviews: boolean;
  requirePurchaseForReview: boolean;
  vodafoneCashNumber: string;
  orangeCashNumber: string;
  etisalatCashNumber: string;
  wePayNumber: string;
  instaPayAccount: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface ProductFilters {
  categorySlug?: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: ProductStatus;
  tags?: string[];
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
