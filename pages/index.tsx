import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/homepage/HeroSection';
import WelcomeMessage from '../components/homepage/WelcomeMessage';
import Highlights from '../components/homepage/Highlights';
import Academics from '../components/homepage/Academics';
import QuickLinks from '../components/homepage/QuickLinks';
import PhotoGallery from '../components/homepage/PhotoGallery';
import Testimonials from '../components/homepage/Testimonials';

export type Notice = {
  id: number;
  title: string;
  notice_date: string;
  details: string | null;
};

type HomePageProps = {
  notices: Notice[];
};

export default function HomePage({ notices }: HomePageProps) {
  const siteUrl = 'https://abcschool-one.vercel.app';
  const imageUrl = `${siteUrl}/og-image.png`;

  return (
    // সম্পূর্ণ পেজটিকে এই div দিয়ে মোড়ানো হয়েছে
    <div className="page-wrapper">
      <Head>
        <title>ABC Academy - Education for a Bright Future</title>
        <meta name="description" content="Established in 1990, ABC Academy has been a center of excellence in academics, sports, and cultural activities." />
        <meta property="og:title" content="ABC Academy" />
        <meta property="og:description" content="Shaping young minds for a brighter tomorrow." />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ABC Academy" />
        <meta name="twitter:description" content="Join ABC Academy for a holistic education." />
        <meta name="twitter:image" content={imageUrl} />
      </Head>

      <Header />
      <main>
        <HeroSection />
        <section id="about">
          <WelcomeMessage />
        </section>
        <section id="notices">
          <Highlights notices={notices} />
        </section>
        <section id="academics">
          <Academics />
        </section>
        <section id="links">
          <QuickLinks />
        </section>
        <section id="gallery">
          <PhotoGallery />
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
      </main>
      <div id="contact">
        <Footer />
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const { data: notices, error } = await supabase
    .from('notices')
    .select('id, title, notice_date, details')
    .order('notice_date', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching notices:', error.message);
    return {
      props: {
        notices: [],
      },
    };
  }

  return {
    props: {
      notices: notices || [],
    },
  };
}