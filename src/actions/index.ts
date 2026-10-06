/**
 * Server action exports.
 *
 * All server actions are "use server" and can only run on the server.
 * Import specific action files to avoid bundling unused actions.
 */

export {
  signUpAction,
  signInAction,
  signOutAction,
  requestPasswordResetAction,
  updatePasswordAction,
} from './auth.actions';

export {
  createProductAction,
  updateProductAction,
  updateProductStatusAction,
  deleteProductAction,
} from './product.actions';

export {
  placeOrderAction,
  updateOrderStatusAction,
  cancelOrderAction,
} from './order.actions';

export {
  submitReviewAction,
  updateReviewStatusAction,
  deleteReviewAction,
} from './review.actions';

export {
  subscribeNewsletterAction,
  submitContactMessageAction,
} from './newsletter.actions';

export {
  getPublicSettingsAction,
  getAdminSettingsAction,
  updateAdminProfileAction,
  updateSiteSettingsAction,
} from './settings.actions';

export {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from './category.actions';

export { createUgcVideoUploadTargetAction, createUgcVideoAction, updateUgcVideoAction, deleteUgcVideoAction } from './ugc-video.actions';
export { getAdminCustomerFeedbackAction, createCustomerFeedbackAction, updateCustomerFeedbackAction, moveCustomerFeedbackAction, deleteCustomerFeedbackAction } from './customer-feedback.actions';

export {
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
  validateCouponAction,
  updateCouponStatusAction,
} from './coupon.actions';

export {
  activateCustomerAction,
  deactivateCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
} from './customer.actions';
