import type { Metadata } from "next";
import { connection } from 'next/server';
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/Toast";
import { CatalogProvider } from "@/lib/catalog/CatalogProvider";
import { fetchStorefrontCatalog } from "@/lib/catalog/server";
import { getPublicSettingsAction } from "@/src/actions/settings.actions";

export const metadata: Metadata = {
  title: {
    default: "WAQAR — Luxury Perfumery",
    template: "%s | WAQAR",
  },
  description:
    "Discover WAQAR's collection of luxury fragrances. Each perfume is crafted with the rarest natural ingredients for an unparalleled sensory experience.",
  keywords: ["perfume", "fragrance", "luxury", "French", "eau de parfum"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "WAQAR",
    title: "WAQAR — Luxury Perfumery",
    description:
      "Luxury fragrances crafted with the rarest natural ingredients.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render per request while keeping the shared storefront data explicitly cached.
  // This prevents build workers from issuing the live catalog query in parallel.
  await connection();
  const [products, settingsResult] = await Promise.all([
    fetchStorefrontCatalog(),
    getPublicSettingsAction(),
  ]);
  const pixelId = settingsResult.success ? settingsResult.data.metaPixelId?.trim() : undefined;
  const metaPixelEnabled = settingsResult.success && settingsResult.data.metaPixelEnabled === true && /^\d+$/.test(pixelId ?? "");
  const tikTokPixelId = settingsResult.success ? settingsResult.data.tikTokPixelId?.trim() : undefined;
  const tikTokPixelEnabled = settingsResult.success && settingsResult.data.tikTokPixelEnabled === true && /^\d+$/.test(tikTokPixelId ?? "");

  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body className="min-h-screen flex flex-col bg-ivory text-charcoal antialiased">
        <CatalogProvider products={products}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastContainer />
          {metaPixelEnabled && pixelId && (
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', ${JSON.stringify(pixelId)});fbq('track', 'PageView');`,
              }}
            />
          )}
          {tikTokPixelEnabled && tikTokPixelId && (
            <Script
              id="tiktok-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','convert'];ttq.setAndDefer=function(t,a){t[a]=function(){t.push([a].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++){ttq.setAndDefer(ttq,ttq.methods[i])}ttq.load=function(t){var c=d.createElement('script');c.type='text/javascript';c.async=true;c.src='https://analytics.tiktok.com/i18n/pixel/events.js';c.onload=function(){window.ttq.track('PageView')};var n=d.getElementsByTagName('script')[0];n.parentNode.insertBefore(c,n);ttq._init=function(){ttq._init=undefined;ttq.load(t)}};ttq._init();ttq.load(${JSON.stringify(tikTokPixelId)})}(window,document,'ttq');`,
              }}
            />
          )}
        </CatalogProvider>
      </body>
    </html>
  );
}
