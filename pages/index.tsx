// pages/index.tsx
import Head from 'next/head';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ImageSlider from '../components/homepage/ImageSlider';
import HeroSection from '../components/homepage/HeroSection';
import WelcomeMessage from '../components/homepage/WelcomeMessage';
import Highlights from '../components/homepage/Highlights';
import Academics from '../components/homepage/Academics';
import QuickLinks from '../components/homepage/QuickLinks';
import PhotoGallery from '../components/homepage/PhotoGallery';
import Testimonials from '../components/homepage/Testimonials';

export default function HomePage() {
  const siteUrl = 'https://abcschool-one.vercel.app'; // আপনার লাইভ URL
  const imageUrl = `${siteUrl}/og-image.png`; // আপনার সোশ্যাল মিডিয়া কার্ডের ছবি

  return (
    <div>
      <Head>
        <title>ABC Academy - Education for a Bright Future</title>
        <meta name="description" content="Established in 1990, ABC Academy has been a center of excellence in academics, sports, and cultural activities." />
        
        {/* --- Open Graph Tags (Facebook, WhatsApp, etc.) --- */}
        <meta property="og:title" content="ABC Academy" />
        <meta property="og:description" content="Shaping young minds for a brighter tomorrow." />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />

        {/* --- Twitter Card Tags --- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ABC Academy" />
        <meta name="twitter:description" content="Join ABC Academy for a holistic education." />
        <meta name="twitter:image" content={imageUrl} />
      </Head>

      <Header />
      <main>
        <ImageSlider />
        <HeroSection />
        <WelcomeMessage />
        <Highlights />
        <Academics />
        <QuickLinks />
        <PhotoGallery />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}