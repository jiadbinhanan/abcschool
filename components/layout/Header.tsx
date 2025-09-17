// components/layout/Header.tsx
import { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import { FiHome, FiInfo, FiBookOpen, FiClipboard, FiImage, FiMail, FiLogIn, FiMenu, FiX } from 'react-icons/fi';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>🏫</div>
            <div>
              <h1 className={styles.schoolName}>A B C Academy</h1>
              <p className={styles.address}>ABC Street, Murshidabad, 742304</p>
            </div>
          </div>
          <button onClick={toggleMenu} className={styles.hamburgerButton}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>
      
      {/* --- Glass Effect Navigation Menu --- */}
      <nav className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuOpen : ''}`}>
         <div className={styles.navHeader}>
            <h2>Menu</h2>
            <button onClick={toggleMenu} className={styles.closeButton}><FiX /></button>
         </div>
         <ul className={styles.navLinks}>
            <li><Link href="/"><FiHome /> Home</Link></li>
            <li><Link href="/about"><FiInfo /> About Us</Link></li>
            <li><Link href="/academics"><FiBookOpen /> Academics</Link></li>
            <li><Link href="/admission"><FiClipboard /> Admission</Link></li>
            <li><Link href="/gallery"><FiImage /> Gallery</Link></li>
            <li><Link href="/contact"><FiMail /> Contact</Link></li>
         </ul>
         <div className={styles.divider}></div>
         <ul className={styles.navLinks}>
            <li><Link href="/login" className={styles.loginButton}><FiLogIn /> Teacher Login</Link></li>
            <li><Link href="/admin/login" className={styles.loginButton}><FiLogIn /> Admin Login</Link></li>
         </ul>
<p className={styles.navFooter}>&quot;Education for a Bright Future&quot;</p>  
      </nav>
    </>
  );
}