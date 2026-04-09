import { Footer } from "@/components/face-spoiler/Footer";
import { Header } from "@/components/face-spoiler/Header";
import { Hero } from "@/components/face-spoiler/Hero";

export default function FaceSpoilerPage() {
  return (
    <>
      <Header />
      <div className="container">
        <Hero />
        <Footer />
      </div>
    </>
  );
}
