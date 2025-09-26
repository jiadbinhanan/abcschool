import { useState } from 'react';
import Image from 'next/image';
import styles from './HeroSection.module.css';
import { FiArrowRight } from 'react-icons/fi';
import { FaSchool, FaUserGraduate, FaCalendarAlt, FaWhatsapp } from 'react-icons/fa';
import Modal from '../ui/Modal';

import { Slide, Zoom } from "react-awesome-reveal";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';

const sliderImages = [
  '/slider/image1.jpg',
  '/slider/image2.jpg',
  '/slider/image3.jpg',
  '/slider/image4.jpg'
];

export default function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'admission' | 'contact' | null>(null);

  const openModal = (type: 'admission' | 'contact') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.overlay}></div>
        <div className={styles.heroContent}>

          <h1 className={styles.heroTitle}>
            Shaping young minds <br /> for a brighter tomorrow
          </h1>

          <Slide direction="down" duration={1000} triggerOnce>
            <p className={styles.heroSubtitle}>
              Welcome to ABC Academy, where excellence in education is our tradition.
            </p>
          </Slide>
          
          <div className={styles.canvasContainer}>
            <div className={styles.sliderCanvas}>
              <Swiper
                modules={[Autoplay, EffectFade]}
                spaceBetween={0}
                slidesPerView={1}
                loop={true}
                autoplay={{ delay: 2000, disableOnInteraction: false }}
                effect="fade"
                fadeEffect={{ crossFade: true }}
              >
                {sliderImages.map((src, index) => (
                  <SwiperSlide key={index}>
                    <Image
                      src={src}
                      alt={`School Banner Image ${index + 1}`}
                      fill
                      sizes="80vw"
                      style={{ objectFit: 'cover' }}
                      priority={index === 0}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          <Zoom duration={500} delay={200}>
            <div className={styles.ctaButtons}>
              <button onClick={() => openModal('admission')} className={styles.ctaButtonPrimary}>
                Admission Open <FiArrowRight />
              </button>
              <button onClick={() => openModal('contact')} className={styles.ctaButtonSecondary}>
                Contact Us
              </button>
            </div>
          </Zoom>
        </div>
        
        <div className={styles.cardGrid}>
          <Slide direction="right" duration={700}>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <FaSchool className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>Our Campus</h3>
                <p className={styles.cardText}>State-of-the-art facilities and a nurturing environment.</p>
                <a href="https://drive.google.com/drive/folders/1BRWKxkyEMn2BeBcLTVSYbkeN26zztvZT" target="_blank" rel="noopener noreferrer" className={styles.viewMore}>
                  Click here to view more
                </a>
              </div>
              <div className={styles.imagePopup}>
                <Image src="/cards/campus.jpg" alt="Our Campus" layout="fill" objectFit="cover" />
              </div>
            </div>
          </Slide>

          <Slide direction="left" duration={700}>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <FaUserGraduate className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>Bright Students</h3>
                <p className={styles.cardText}>Fostering talent and encouraging curiosity in every child.</p>
                <a href="#" target="_blank" rel="noopener noreferrer" className={styles.viewMore}>
                  Click here to view more
                </a>
              </div>
              <div className={styles.imagePopup}>
                <Image src="/cards/students.jpg" alt="Bright Students" layout="fill" objectFit="cover" />
              </div>
            </div>
          </Slide>
          
          <Slide direction="right" duration={700}>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <FaCalendarAlt className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>Events & Culture</h3>
                <p className={styles.cardText}>A vibrant campus life with diverse cultural and sports events.</p>
                <a href="#" target="_blank" rel="noopener noreferrer" className={styles.viewMore}>
                  Click here to view more
                </a>
              </div>
              <div className={styles.imagePopup}>
                <Image src="/cards/events.jpg" alt="Events & Culture" layout="fill" objectFit="cover" />
              </div>
            </div>
          </Slide>
        </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalType === 'admission' && (
          <div>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Admission Process (Offline)</h2>
            <p>আমাদের প্রতিষ্ঠানে ভর্তির প্রক্রিয়াটি অফলাইনে সম্পন্ন করা হয়। প্রক্রিয়াটি নিম্নরূপ:</p>
            <ol style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '10px' }}>বিদ্যালয়ের অফিস থেকে আবেদনপত্র সংগ্রহ করুন।</li>
              <li style={{ marginBottom: '10px' }}>সঠিকভাবে পূরণ করে প্রয়োজনীয় নথি-পত্র (জন্মের প্রমাণপত্র, আগের শ্রেণীর মার্কশিট, আধার কার্ড, এবং ছবি) সহ জমা দিন।</li>
              <li style={{ marginBottom: '10px' }}>বিদ্যালয় কর্তৃক নির্ধারিত দিনে একটি ছোট সাক্ষাৎকার বা ভর্তি পরীক্ষা অনুষ্ঠিত হবে।</li>
              <li>নির্বাচিত হলে নির্দিষ্ট তারিখের মধ্যে ভর্তি ফি জমা দিয়ে ভর্তি সম্পন্ন করুন।</li>
            </ol>
            <p style={{ marginTop: '20px' }}>আরও তথ্যের জন্য বা কোনো সহায়তার জন্য আমাদের সাথে WhatsApp-এ যোগাযোগ করুন:</p>
            <a 
              href="https://wa.me/918597872806" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.whatsappButton}
            >
              <FaWhatsapp /> যোগাযোগ করুন
            </a>
          </div>
        )}

        {modalType === 'contact' && (
          <div>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Contact Information</h2>
            <div style={{ lineHeight: '1.8' }}>
              <p><strong>Address:</strong><br/>ABC Street, Murshidabad, 742304</p>
              <p><strong>Phone:</strong><br/>+91 XXXXX XXXXX</p>
              <p><strong>Email:</strong><br/>info@abcacademy.com</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}