// components/homepage/Testimonials.tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import styles from './Testimonials.module.css';
import { FaQuoteLeft } from 'react-icons/fa';

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
  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>What People Say</h2>
        
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
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
        
        <div className={styles.finalQuote}>
          <p>“Education is the most powerful weapon which you can use to change the world.”</p>
          <span>— Nelson Mandela</span>
        </div>
      </div>
    </section>
  );
}