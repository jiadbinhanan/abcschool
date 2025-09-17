// pages/index.tsx
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ImageSlider from '../components/homepage/ImageSlider';
import HeroSection from '../components/homepage/HeroSection';
import WelcomeMessage from '../components/homepage/WelcomeMessage';
import Highlights from '../components/homepage/Highlights';
import Academics from '../components/homepage/Academics'; // 1. Import Academics
import QuickLinks from '../components/homepage/QuickLinks';
import PhotoGallery from '../components/homepage/PhotoGallery';
import Testimonials from '../components/homepage/Testimonials'; // 1. Import Testimonials

export default function HomePage() {
  return (
    <div>
      <Header />
      <main>
        <ImageSlider />
        <HeroSection />
        <WelcomeMessage />
        <Highlights />
        <Academics /> {/* 2. Add the Academics component here */}
        <QuickLinks />
        <PhotoGallery />
        <Testimonials />

      </main>
      <Footer />
    </div>
  );
}