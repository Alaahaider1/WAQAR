import type { Metadata } from "next";
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
import { createServerClient } from '@/src/lib/supabase/server';
import { UgcVideoRepository } from '@/src/repositories/ugc-video.repository';
import { CustomerFeedbackRepository } from '@/src/repositories/customer-feedback.repository';

export const metadata: Metadata = {
  title: "WAQAR — Luxury Perfumery",
  description:
    "Discover WAQAR's collection of luxury fragrances. Crafted from the rarest natural ingredients since 1987.",
};

export default async function HomePage() {
  const db = await createServerClient();
  const [ugcVideos, customerFeedback] = await Promise.all([
    new UgcVideoRepository(db).findVisible(),
    new CustomerFeedbackRepository(db).findVisible(),
  ]);
  return (
    <>
      <HeroSection />
      <FeaturedCategories />
      <BestSellers />
      <NewArrivals />
      <BrandStory />
      <WhyChooseUs />
      <UgcVideoTestimonials videos={ugcVideos} />
      <CustomerFeedback images={customerFeedback} />
      <FAQPreview />
      <Newsletter />
    </>
  );
}
