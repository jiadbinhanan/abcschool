// components/homepage/PhotoGallery.tsx
import { useState } from 'react';
import Image from 'next/image';
import styles from './PhotoGallery.module.css';
import { FiX } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion'; // ১. Framer Motion ইম্পোর্ট করুন

const images = [
  { src: '/gallery/gallery1.jpg', alt: 'Annual Function' },
  { src: '/gallery/gallery2.jpg', alt: 'Sports Day' },
  { src: '/gallery/gallery3.jpg', alt: 'Classroom Activities' },
  { src: '/gallery/gallery4.jpg', alt: 'Educational Tour' },
  { src: '/gallery/gallery5.jpg', alt: 'Science Exhibition' },
  { src: '/gallery/gallery6.jpg', alt: 'Art & Craft' },
];

export default function PhotoGallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openLightbox = (src: string) => setSelectedImage(src);
  const closeLightbox = () => setSelectedImage(null);

  // ২. অ্যানিমেশনের জন্য ভ্যারিয়েন্ট তৈরি করা হয়েছে
  const titleReveal: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };
  
  const slideFromLeft: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
  };

  const slideFromRight: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
  };

  return (
    <section className={styles.gallerySection}>
      <div className={styles.container}>
        <motion.h2
          className={styles.title}
          variants={titleReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
        >
          Our Gallery
        </motion.h2>
        <motion.p
          className={styles.subtitle}
          variants={titleReveal}
          initial="hidden"
          whileInView="visible"
          transition={{ delay: 0.2 }}
          viewport={{ once: false, amount: 0.5 }}
        >
          A Glimpse into Life at ABC Academy
        </motion.p>
        <div className={styles.galleryGrid}>
          {images.map((image, index) => (
            // ৩. প্রতিটি ছবিতে পর্যায়ক্রমিক স্লাইড অ্যানিমেশন
            <motion.div
              key={index}
              variants={index % 2 === 0 ? slideFromLeft : slideFromRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
            >
              <div className={styles.imageWrapper} onClick={() => openLightbox(image.src)}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={400}
                  height={300}
                  className={styles.galleryImage}
                />
                <div className={styles.imageOverlay}>
                  <p>{image.alt}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal (অপরিবর্তিত) */}
      {selectedImage && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <button className={styles.closeButton}><FiX /></button>
          <div className={styles.lightboxContent}>
            <Image
              src={selectedImage}
              alt="Enlarged view"
              width={1200}
              height={800}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}
    </section>
  );
}