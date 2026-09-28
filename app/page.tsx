import type { Metadata } from "next";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { PricingPreview } from "@/components/home/PricingPreview";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { ServicesList } from "@/components/home/ServicesList";
import { Why } from "@/components/home/Why";
import { WorkGallery } from "@/components/home/WorkGallery";
import { process, services } from "@/data/studio";
import { work } from "@/data/work";
import { SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <WorkGallery items={work} />
      <Why />
      <ServicesList items={services} />
      <ProcessSteps steps={process} />
      <PricingPreview />
      <FinalCta prism />
    </>
  );
}
