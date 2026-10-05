/**
 * Zod v4 validation schemas for WAQAR.
 *
 * Zod v4 changes from v3:
 *  - { required_error, invalid_type_error } replaced with plain message string
 *  - z.string({ required_error: 'x' }) → z.string().min(1, 'x')  (or just add .describe())
 *  - z.coerce.number({ invalid_type_error: 'x' }) → z.coerce.number()
 */

import { z } from 'zod';
import { ValidationError } from '@/src/lib/errors';
import type { ZodSchema } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid('Invalid ID format');

const slugSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');

const priceSchema = z.coerce
  .number()
  .nonnegative('Price cannot be negative')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

const optionalUrl = z.string().url('Must be a valid URL').optional().or(z.literal(''));

const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .regex(/^[A-Z]{2}$/, 'Country code must be uppercase ISO 3166-1 alpha-2');

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;

export const UpdatePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  addressLine1: z.string().min(5, 'Please enter a full address').max(255).trim(),
  addressLine2: z.string().max(255).trim().optional().or(z.literal('')),
  city: z.string().min(2, 'Please enter a city').max(100).trim(),
  state: z.string().max(100).trim().optional().or(z.literal('')),
  postalCode: z.string().max(20).trim().optional().or(z.literal('')),
  countryCode: countryCodeSchema,
  isDefault: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof AddressSchema>;

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export const CategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  slug: slugSchema.optional(),
  description: z.string().max(500).trim().optional().or(z.literal('')),
  imageUrl: optionalUrl,
  position: z.coerce.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
});
export type CategoryInput = z.infer<typeof CategorySchema>;

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export const ProductVariantSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100).toUpperCase().trim(),
  size: z.string().min(1, 'Size is required').max(50).trim(),
  concentration: z.string().max(50).trim().optional().or(z.literal('')),
  price: priceSchema.positive('Price must be greater than zero'),
  compareAtPrice: priceSchema.optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  position: z.coerce.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;

export const ProductImageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  altText: z.string().max(255).trim().optional().or(z.literal('')),
  position: z.coerce.number().int().nonnegative().optional().default(0),
  cloudinaryId: z.string().optional().or(z.literal('')),
});
export type ProductImageInput = z.infer<typeof ProductImageSchema>;

export const FragranceNoteSchema = z.object({
  type: z.enum(['top', 'heart', 'base']),
  name: z.string().min(1, 'Note name is required').max(100).trim(),
  position: z.coerce.number().int().nonnegative().optional().default(0),
});
export type FragranceNoteInput = z.infer<typeof FragranceNoteSchema>;

export const ProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).trim(),
  slug: slugSchema.optional(),
  subtitle: z.string().max(255).trim().optional().or(z.literal('')),
  categoryId: uuidSchema,
  description: z.string().max(500).trim().optional().or(z.literal('')),
  longDescription: z.string().trim().optional().or(z.literal('')),
  ingredients: z.string().max(2000).trim().optional().or(z.literal('')),
  basePrice: priceSchema.positive('Price must be greater than zero'),
  compareAtPrice: priceSchema.optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  isBestSeller: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  seoTitle: z.string().max(70).trim().optional().or(z.literal('')),
  seoDescription: z.string().max(160).trim().optional().or(z.literal('')),
  variants: z.array(ProductVariantSchema).min(1, 'At least one variant is required'),
  images: z.array(ProductImageSchema).optional().default([]),
  fragranceNotes: z.array(FragranceNoteSchema).optional().default([]),
  tagIds: z.array(uuidSchema).optional().default([]),
});
export type ProductInput = z.infer<typeof ProductSchema>;

export const UpdateProductSchema = ProductSchema.partial().extend({
  variants: z.array(ProductVariantSchema).optional(),
});
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// ---------------------------------------------------------------------------
// Coupon
// ---------------------------------------------------------------------------

export const CouponSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(50)
      .toUpperCase()
      .trim()
      .regex(/^[A-Z0-9_-]+$/, 'Code must contain only letters, numbers, hyphens, or underscores'),
    description: z.string().max(255).trim().optional().or(z.literal('')),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.coerce.number().positive('Discount value must be positive'),
    minimumOrderValue: z.coerce.number().nonnegative().optional().default(0),
    maximumDiscount: z.coerce.number().positive().optional().nullable(),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    perUserLimit: z.coerce.number().int().positive().optional().default(1),
    status: z.enum(['active', 'draft', 'expired', 'disabled']).optional().default('active'),
    validFrom: z.string().datetime({ message: 'Must be a valid date-time' }).optional(),
    validUntil: z.string().datetime({ message: 'Must be a valid date-time' }).optional().nullable(),
  })
  .refine(
    (d) => d.discountType !== 'percentage' || d.discountValue <= 100,
    { message: 'Percentage discount cannot exceed 100%', path: ['discountValue'] }
  )
  .refine(
    (d) => !d.validFrom || !d.validUntil || new Date(d.validUntil) > new Date(d.validFrom),
    { message: 'Expiry date must be after the start date', path: ['validUntil'] }
  );
export type CouponInput = z.infer<typeof CouponSchema>;

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export const PlaceOrderSchema = z.object({
  cartId: uuidSchema,
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  shippingMethod: z.enum(['standard', 'express']).optional().default('standard'),
  couponCode: z.string().max(50).trim().optional().or(z.literal('')),
  customerNotes: z.string().max(500).trim().optional().or(z.literal('')),
  paymentProvider: z.enum([
    'stripe', 'paypal', 'vodafone_cash', 'etisalat_cash',
    'orange_cash', 'we_pay', 'instapay', 'cash_on_delivery', 'other',
  ]),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  orderId: uuidSchema,
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  trackingNumber: z.string().max(100).trim().optional().or(z.literal('')),
  trackingUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().max(500).trim().optional().or(z.literal('')),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export const ReviewSchema = z.object({
  productId: uuidSchema,
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(120).trim().optional().or(z.literal('')),
  body: z.string().min(10, 'Review must be at least 10 characters').max(2000).trim(),
});
export type ReviewInput = z.infer<typeof ReviewSchema>;

// ---------------------------------------------------------------------------
// Newsletter / Contact
// ---------------------------------------------------------------------------

export const NewsletterSubscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  source: z.string().max(50).optional().or(z.literal('')),
});
export type NewsletterSubscribeInput = z.infer<typeof NewsletterSubscribeSchema>;

export const ContactMessageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  subject: z.string().max(200).trim().optional().or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000).trim(),
});
export type ContactMessageInput = z.infer<typeof ContactMessageSchema>;

// ---------------------------------------------------------------------------
// Cloudinary
// ---------------------------------------------------------------------------

export const ImageUploadSchema = z.object({
  folder: z.string().regex(/^[a-z0-9/_-]+$/, 'Folder must be lowercase alphanumeric with slashes or hyphens'),
  allowedFormats: z.array(z.enum(['jpg', 'jpeg', 'png', 'webp', 'avif'])).optional().default(['jpg', 'jpeg', 'png', 'webp']),
  maxBytes: z.number().int().positive().optional().default(10 * 1024 * 1024),
});
export type ImageUploadInput = z.infer<typeof ImageUploadSchema>;

export const UgcVideoSchema = z.object({
  videoUrl: z.string().url('A hosted video URL is required'),
  customerName: z.string().max(100).trim().optional().or(z.literal('')),
  caption: z.string().max(280).trim().optional().or(z.literal('')),
  position: z.coerce.number().int().nonnegative().optional().default(0),
  isVisible: z.boolean().optional().default(true),
});
export type UgcVideoInput = z.infer<typeof UgcVideoSchema>;

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    const firstError = result.error.issues[0]?.message ?? 'Validation failed';
    throw new ValidationError(firstError, fieldErrors);
  }
  return result.data;
}
