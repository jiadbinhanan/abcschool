// components/homepage/HeroSection.tsx
import Link from 'next/link';
import styles from './HeroSection.module.css';
import { FiArrowRight } from 'react-icons/fi';
import { FaSchool, FaUserGraduate, FaCalendarAlt } from 'react-icons/fa';

export default function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.overlay}></div>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Shaping young minds for a brighter tomorrow
        </h1>
        <p className={styles.heroSubtitle}>
          Welcome to ABC Academy, where excellence in education is our tradition.
        </p>
        <div className={styles.ctaButtons}>
          <Link href="/admission" className={styles.ctaButtonPrimary}>
            Admission Open <FiArrowRight />
          </Link>
          <Link href="/contact" className={styles.ctaButtonSecondary}>
            Contact Us
          </Link>
        </div>
      </div>
      
{/* --- Decorated Cards (Updated with Hover Effect) --- */}
<div className={styles.cardGrid}>
  {/* Card 1: Our Campus */}
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
      <img src="/cards/campus.jpg" alt="Our Campus" />
    </div>
  </div>

  {/* Card 2: Bright Students */}
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
      <img src="/cards/students.jpg" alt="Bright Students" />
    </div>
  </div>

  {/* Card 3: Events & Culture */}
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
      <img src="/cards/events.jpg" alt="Events & Culture" />
    </div>
  </div>
</div>
      </section>
  );
}