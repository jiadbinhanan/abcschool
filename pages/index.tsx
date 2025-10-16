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
  const logoUrl = `${siteUrl}/public/logo.jpg`;
  const ogImageUrl = `${siteUrl}/og-image.png`;

  return (
    <div className="page-wrapper">
      <Head>
        {/* 🔹 SEO Title and Description */}
        <title>ABC Academy — A Demo School Management Website by Developer Jiad</title>
        <meta
          name="description"
          content="ABC Academy is a demo website created by Developer Jiad as a concept project. It showcases the full design and features of his school management system, developed for demonstration purposes."
        />
        <meta
          name="keywords"
          content="ABC Academy, school website demo, school management system, Developer Jiad, education web app, student portal, teacher dashboard"
        />
        <meta name="author" content="Developer Jiad" />

        {/* 🔹 Favicon */}
        <link rel="icon" href={logoUrl} type="image/jpeg" />
        <link rel="shortcut icon" href={logoUrl} type="image/jpeg" />

        {/* 🔹 Open Graph Meta Tags */}
        <meta property="og:title" content="ABC Academy — Demo School Website by Developer Jiad" />
        <meta
          property="og:description"
          content="Explore the full demo of ABC Academy — a school management website concept created by Developer Jiad for educational institutions."
        />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />

        {/* 🔹 Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ABC Academy — Demo School Website by Developer Jiad" />
        <meta
          name="twitter:description"
          content="A complete school management website demo built by Developer Jiad. Experience the design, dashboard, and student management features."
        />
        <meta name="twitter:image" content={ogImageUrl} />

        {/* 🔹 Viewport & Charset */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>

      {/* Page Layout */}
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