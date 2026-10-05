import type { Metadata } from "next";
import { Suspense } from 'react';
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { BestSellers } from "@/components/home/BestSellers";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BrandStory } from "@/components/home/BrandStory";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { UgcVideoTestimonials } from "@/components/home/UgcVideoTestimonials";
import { CustomerFeedback } from '@/components/home/CustomerFeedback';
import { FAQPreview } from "@/components/home/FAQPreview";
import { Newsletter } from "@/components/home/Newsletter";
import { fetchPublicCustomerFeedback, fetchPublicUgcVideos } from '@/lib/catalog/server';

export const metadata: Metadata = {
  title: "WAQAR — Luxury Perfumery",
  description:
    "Discover WAQAR's collection of luxury fragrances. Crafted from the rarest natural ingredients since 1987.",
};

async function HomeSocialProof() {
  const [ugcVideos, customerFeedback] = await Promise.all([
    fetchPublicUgcVideos(),
    fetchPublicCustomerFeedback(),
  ]);
  return <>
    <UgcVideoTestimonials videos={ugcVideos} />
    <CustomerFeedback images={customerFeedback} />
  </>;
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCategories />
      <BestSellers />
      <NewArrivals />
      <BrandStory />
      <WhyChooseUs />
      <Suspense fallback={null}>
        <HomeSocialProof />
      </Suspense>
      <FAQPreview />
      <Newsletter />
    </>
  );
}
