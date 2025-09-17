// components/layout/Footer.tsx
import Link from 'next/link';
import styles from './Footer.module.css';
import { FaFacebook, FaYoutube, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Contact Us</h3>
            <p>Address: ABC Street, Murshidabad, 742304</p>
            <p>Phone: <a href="tel:+91XXXXXXXXXX">+91 XXXXX XXXXX</a></p>
            <p>Email: <a href="mailto:info@abcacademy.com">info@abcacademy.com</a></p>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Quick Links</h3>
            <ul className={styles.quickLinks}>
              <li><Link href="/admission">Admission</Link></li>
              <li><Link href="/syllabus">Syllabus & Routine</Link></li>
              <li><Link href="/results">Results</Link></li>
              <li><Link href="/teachers">Teachers' List</Link></li>
            </ul>
          </div>
          
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Connect With Us</h3>
            <div className={styles.socialLinks}>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>

        </div>

        <div className={styles.devCredit}>
          <p>Developed & Designed by: 👨‍💻 Jiad Bin Hanan</p>
          <div className={styles.devContact}>
            <a href="mailto:jiadbinhanan@gmail.com"><FiMail /> Email</a>
            <a href="https://wa.me/918597872806" target="_blank" rel="noopener noreferrer"><FaWhatsapp /> WhatsApp</a>
            <a href="https://www.facebook.com/share/17867kHaon/" target="_blank" rel="noopener noreferrer"><FaFacebook /> Facebook</a>
          </div>
        </div>

        <div className={styles.copyright}>
          © {new Date().getFullYear()} ABC Academy. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}