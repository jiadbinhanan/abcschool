// components/homepage/PhotoGallery.tsx
import { useState } from 'react';
import Image from 'next/image';
import styles from './PhotoGallery.module.css';
import { FiX } from 'react-icons/fi';

// Dummy data for the gallery images.
// Make sure these images exist in your /public/gallery/ folder.
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

  const openLightbox = (src: string) => {
    setSelectedImage(src);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  return (
    <section className={styles.gallerySection}>
      <div className={styles.container}>
        <h2 className={styles.title}>Our Gallery</h2>
        <p className={styles.subtitle}>A Glimpse into Life at ABC Academy</p>
        <div className={styles.galleryGrid}>
          {images.map((image, index) => (
            <div key={index} className={styles.imageWrapper} onClick={() => openLightbox(image.src)}>
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
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
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