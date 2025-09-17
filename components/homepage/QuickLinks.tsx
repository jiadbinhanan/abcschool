// components/homepage/QuickLinks.tsx
import Link from 'next/link';
import styles from './QuickLinks.module.css';
import { FiFileText, FiCalendar, FiAward, FiUsers } from 'react-icons/fi';

const links = [
  { 
    href: '/admission', 
    icon: <FiFileText />, 
    title: 'Admission Form',
    subtitle: 'Apply for the new session'
  },
  { 
    href: '/routine', 
    icon: <FiCalendar />, 
    title: 'Syllabus & Routine',
    subtitle: 'View academic schedule'
  },
  { 
    href: '/results', 
    icon: <FiAward />, 
    title: 'Online Results',
    subtitle: 'Check your exam results'
  },
  { 
    href: '/teachers', 
    icon: <FiUsers />, 
    title: 'Teachers’ Directory',
    subtitle: 'Meet our respected faculty'
  },
];

export default function QuickLinks() {
  return (
    <section className={styles.quickLinksSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>Quick Links</h2>
        <div className={styles.linksGrid}>
          {links.map((link, index) => (
            <Link href={link.href} key={index} className={styles.linkCard}>
              <div className={styles.cardIcon}>{link.icon}</div>
              <div className={styles.cardText}>
                <h3 className={styles.cardTitle}>{link.title}</h3>
                <p className={styles.cardSubtitle}>{link.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}