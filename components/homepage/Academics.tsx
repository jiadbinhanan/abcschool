// components/homepage/Academics.tsx
import styles from './Academics.module.css';
import { FaBook, FaFlask, FaChalkboardTeacher, FaFutbol, FaPalette, FaCheckCircle } from 'react-icons/fa';
import { motion, Variants } from 'framer-motion'; // ১. Framer Motion ইম্পোর্ট করুন

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
  
  // ২. অ্যানিমেশনের জন্য ভ্যারিয়েন্ট তৈরি করা হয়েছে
  const titleReveal: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
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
    <section className={styles.academicsSection}>
      <div className={styles.container}>
        <motion.h2
          className={styles.mainTitle}
          variants={titleReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
        >
          Academics & Facilities
        </motion.h2>
        <div className={styles.grid}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Our Curriculum</h3>
            <div className={styles.itemList}>
              {curriculum.map((item, index) => (
                // ৩. প্রতিটি আইটেমে পর্যায়ক্রমিক স্লাইড অ্যানিমেশন
                <motion.div
                  key={index}
                  variants={index % 2 === 0 ? slideFromLeft : slideFromRight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.5 }}
                >
                  <div className={styles.item}>
                    <span className={styles.itemIcon}><FaCheckCircle /></span>
                    <p>{item.level}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Our Facilities</h3>
            <div className={styles.itemList}>
              {facilities.map((facility, index) => (
                // ৪. প্রতিটি আইটেমে পর্যায়ক্রমিক স্লাইড অ্যানিমেশন
                <motion.div
                  key={index}
                  variants={index % 2 === 0 ? slideFromLeft : slideFromRight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.5 }}
                >
                  <div className={styles.item}>
                    <span className={styles.itemIcon}>{facility.icon}</span>
                    <p>{facility.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}