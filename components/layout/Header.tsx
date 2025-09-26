import { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import { FiHome, FiInfo, FiBookOpen, FiClipboard, FiImage, FiMail, FiLogIn, FiMenu, FiX } from 'react-icons/fi';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // মেনু খোলা বা বন্ধ করার ফাংশন
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // লিঙ্কে ক্লিক করলে মেনু বন্ধ করার জন্য নতুন ফাংশন
  const handleLinkClick = () => {
    setIsMenuOpen(false);
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
      
      <nav className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuOpen : ''}`}>
         <div className={styles.navHeader}>
            <h2>Menu</h2>
            <button onClick={toggleMenu} className={styles.closeButton}><FiX /></button>
         </div>
         <ul className={styles.navLinks}>
            {/* অ্যানিমেশনের জন্য style এবং স্ক্রলের জন্য href ও onClick যোগ করা হয়েছে */}
            <li style={{ '--delay': 1 } as React.CSSProperties}><Link href="#" onClick={handleLinkClick}><FiHome /> Home</Link></li>
            <li style={{ '--delay': 2 } as React.CSSProperties}><Link href="#about" onClick={handleLinkClick}><FiInfo /> About Us</Link></li>
            <li style={{ '--delay': 3 } as React.CSSProperties}><Link href="#academics" onClick={handleLinkClick}><FiBookOpen /> Academics</Link></li>
            <li style={{ '--delay': 4 } as React.CSSProperties}><Link href="#notices" onClick={handleLinkClick}><FiClipboard /> Notices</Link></li>
            <li style={{ '--delay': 5 } as React.CSSProperties}><Link href="#gallery" onClick={handleLinkClick}><FiImage /> Gallery</Link></li>
            <li style={{ '--delay': 6 } as React.CSSProperties}><Link href="#contact" onClick={handleLinkClick}><FiMail /> Contact</Link></li>
         </ul>
         <div className={styles.divider}></div>
         <ul className={styles.navLinks}>
            <li style={{ '--delay': 7 } as React.CSSProperties}><Link href="/login" className={styles.loginButton} onClick={handleLinkClick}><FiLogIn /> Teacher Login</Link></li>
            <li style={{ '--delay': 8 } as React.CSSProperties}><Link href="/admin/login" className={styles.loginButton} onClick={handleLinkClick}><FiLogIn /> Admin Login</Link></li>
         </ul>
        <p className={styles.navFooter}>&quot;Education for a Bright Future&quot;</p>  
      </nav>
    </>
  );
}