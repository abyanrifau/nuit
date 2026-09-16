import { Hero } from "@/components/Hero";
import { Concepts } from "@/components/Concepts";
import { Studio } from "@/components/Studio";
import { Services } from "@/components/Services";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <>
      {/* 01 Hero */}
      <Hero />

      {/* 02 Concepts */}
      <Concepts />

      {/* 03 Who we are */}
      <Studio />

      {/* 04 Our services */}
      <Services />

      {/* 05 Call to action */}
      <Contact />
    </>
  );
}
