// components/homepage/Testimonials.tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import styles from './Testimonials.module.css';
import { FaQuoteLeft } from 'react-icons/fa';
import { motion, Variants } from 'framer-motion'; // ১. Framer Motion ইম্পোর্ট করুন

// Dummy data for testimonials
const testimonials = [
  {
    quote: "ABC Academy has given my child the confidence and skills to excel in life. The teachers are incredibly supportive.",
    author: "— A Proud Parent"
  },
  {
    quote: "The best years of my life were spent here. I am grateful for the lifelong friendships and knowledge I gained.",
    author: "— An Alumnus, Batch of 2018"
  },
  {
    quote: "A perfect blend of academics, sports, and cultural activities. My daughter loves going to school every day.",
    author: "— S. Ahmed, Parent"
  }
];

export default function Testimonials() {
  
  // ২. অ্যানিমেশনের জন্য ভ্যারিয়েন্ট
  const textReveal: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.8 } }
  };

  const sliderReveal: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
  };

  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        <motion.h2
          className={styles.title}
          variants={textReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
        >
          What People Say
        </motion.h2>
        
        <motion.div
          variants={sliderReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className={styles.swiper}
          >
            {testimonials.map((item, index) => (
              <SwiperSlide key={index} className={styles.slide}>
                <FaQuoteLeft className={styles.quoteIcon} />
                <p className={styles.quoteText}>{item.quote}</p>
                <p className={styles.authorText}>{item.author}</p>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
        
        <motion.div
          className={styles.finalQuote}
          variants={textReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.8 }}
        >
          <p>“Education is the most powerful weapon which you can use to change the world.”</p>
          <span>— Nelson Mandela</span>
        </motion.div>
      </div>
    </section>
  );
}