'use client';

/** Browser-safe Meta Pixel event helpers for storefront interactions. */
type MetaPixelParameters = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function track(event: string, parameters?: MetaPixelParameters): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', event, parameters);
}

export function trackAddToCart(parameters?: MetaPixelParameters): void {
  track('AddToCart', parameters);
}

export function trackPurchase(parameters?: MetaPixelParameters): void {
  track('Purchase', parameters);
}

export function trackInitiateCheckout(parameters?: MetaPixelParameters): void {
  track('InitiateCheckout', parameters);
}

export function trackViewContent(parameters?: MetaPixelParameters): void {
  track('ViewContent', parameters);
}
