import type { Product as DomainProduct } from '@/src/types/domain';
import type { ProductInput } from '@/src/validations';
import type { ProductFormData } from '@/components/admin/ProductForm';

function parseNotes(csv: string, type: 'top' | 'heart' | 'base') {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, position) => ({ type, name, position }));
}

export function formToProductInput(
  form: ProductFormData,
  categoryId: string,
  existingSlug?: string
): ProductInput {
  const compareAt =
    form.originalPrice && form.originalPrice > form.price ? form.originalPrice : null;
  const gallery = form.gallery.length ? form.gallery : form.image ? [form.image] : [];

  return {
    name: form.name.trim(),
    ...(existingSlug ? { slug: existingSlug } : {}),
    subtitle: form.subtitle,
    categoryId,
    description: form.description,
    longDescription: form.longDescription,
    ingredients: form.ingredients,
    basePrice: form.price,
    compareAtPrice: compareAt,
    status: form.status,
    isBestSeller: form.isBestSeller,
    isNew: form.isNew,
    isFeatured: form.isFeatured,
    variants: [
      {
        sku: form.sku.trim().toUpperCase(),
        size: form.size,
        price: form.price,
        compareAtPrice: compareAt,
        isDefault: true,
        position: 0,
        isActive: true,
      },
    ],
    images: gallery.map((url, idx) => ({
      url,
      altText: idx === 0 ? form.name : '',
      position: idx,
    })),
    fragranceNotes: [
      ...parseNotes(form.noteTop, 'top'),
      ...parseNotes(form.noteHeart, 'heart'),
      ...parseNotes(form.noteBase, 'base'),
    ],
    tagIds: [],
  };
}

export function domainToFormData(product: DomainProduct, stock: number): ProductFormData {
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const price = defaultVariant?.price ?? product.basePrice;
  const compareAt = product.compareAtPrice ?? defaultVariant?.compareAtPrice ?? undefined;
  const discount =
    compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return {
    name: product.name,
    subtitle: product.subtitle ?? '',
    description: product.description ?? '',
    longDescription: product.longDescription ?? '',
    category: product.category.slug as ProductFormData['category'],
    price,
    originalPrice: compareAt ?? undefined,
    discount,
    stock,
    sku: defaultVariant?.sku ?? '',
    size: defaultVariant?.size ?? '50ml',
    image: product.images[0]?.url ?? '',
    gallery: product.images.map((img) => img.url),
    noteTop: product.fragranceNotes.top.join(', '),
    noteHeart: product.fragranceNotes.heart.join(', '),
    noteBase: product.fragranceNotes.base.join(', '),
    ingredients: product.ingredients ?? '',
    isBestSeller: product.isBestSeller,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    status: product.status === 'archived' ? 'draft' : product.status,
    inStock: stock > 0 || (defaultVariant?.allowBackorder ?? false),
    tags: product.tags.map((t) => t.slug),
  };
}
