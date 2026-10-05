/**
 * Repository exports.
 *
 * @example
 *   import { ProductRepository, CategoryRepository } from '@/src/repositories'
 *   import { createServerClient } from '@/src/lib/supabase'
 *
 *   const db = await createServerClient()
 *   const products = new ProductRepository(db)
 *   const result = await products.findBestSellers()
 */

export { BaseRepository } from './base';
export { ProductRepository } from './product.repository';
export { CategoryRepository } from './category.repository';
export { OrderRepository } from './order.repository';
export { CustomerRepository } from './customer.repository';
export { WishlistRepository } from './wishlist.repository';
export { ReviewRepository } from './review.repository';
export { CustomerFeedbackRepository } from './customer-feedback.repository';
export { UgcVideoRepository } from './ugc-video.repository';
export { SiteSettingsRepository } from './site-settings.repository';
