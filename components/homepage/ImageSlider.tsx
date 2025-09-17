// components/homepage/ImageSlider.tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import styles from './ImageSlider.module.css';

// এই ছবিগুলো আপনার public ফোল্ডারে রাখতে হবে
const images = [
  '/slider/image1.jpg',
  '/slider/image2.jpg',
  '/slider/image3.jpg',
  '/slider/image4.jpg'
];

export default function ImageSlider() {
  return (
    <div className={styles.sliderContainer}>
      <Swiper
        modules={[Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        effect="fade"
      >
        {images.map((src, index) => (
          <SwiperSlide key={index}>
            <img src={src} alt={`School Image ${index + 1}`} className={styles.slideImage} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}