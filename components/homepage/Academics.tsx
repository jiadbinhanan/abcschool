// components/homepage/Academics.tsx
import styles from './Academics.module.css';
import { FaBook, FaFlask, FaChalkboardTeacher, FaFutbol, FaPalette, FaCheckCircle } from 'react-icons/fa';

const facilities = [
  { icon: <FaBook />, text: 'Library with 5,000+ books' },
  { icon: <FaFlask />, text: 'Modern Science & Computer Labs' },
  { icon: <FaChalkboardTeacher />, text: 'Interactive Smart Classrooms' },
  { icon: <FaFutbol />, text: 'Sports Ground & Indoor Games' },
  { icon: <FaPalette />, text: 'Music, Art & Cultural Activities' },
];

const curriculum = [
  { level: 'Primary Section' },
  { level: 'Secondary Section' },
  { level: 'Higher Secondary Section' },
];

export default function Academics() {
  return (
    <section className={styles.academicsSection}>
      <div className={styles.container}>
        <h2 className={styles.mainTitle}>Academics & Facilities</h2>
        <div className={styles.grid}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Our Curriculum</h3>
            <div className={styles.itemList}>
              {curriculum.map((item, index) => (
                <div key={index} className={styles.item}>
                  <span className={styles.itemIcon}><FaCheckCircle /></span>
                  <p>{item.level}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Our Facilities</h3>
            <div className={styles.itemList}>
              {facilities.map((facility, index) => (
                <div key={index} className={styles.item}>
                  <span className={styles.itemIcon}>{facility.icon}</span>
                  <p>{facility.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}