// components/homepage/QuickLinks.tsx

import { useState } from 'react';
import styles from './QuickLinks.module.css';
import { FaWpforms, FaBook, FaPoll, FaChalkboardTeacher } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';

// ১. সম্পূর্ণ ডেটা অ্যারেটি এখানে ফিরিয়ে আনা হয়েছে
const quickLinksData = [
  {
    id: 1,
    icon: <FaWpforms />,
    title: "Admission Form",
    content: (
      <div>
        <p>আমাদের প্রতিষ্ঠানে ভর্তি প্রক্রিয়া অফলাইনে সম্পন্ন হয়। ভর্তির জন্য আবেদনপত্র সংগ্রহ করতে, অনুগ্রহ করে সরাসরি বিদ্যালয়ের অফিসে যোগাযোগ করুন।</p>
        <p><strong>অফিস সময়:</strong> সকাল ১০টা - দুপুর ২টা (রবিবার বাদে)</p>
        <p>আবেদনপত্র পূরণের পর প্রয়োজনীয় নথি-পত্রসহ অফিসে জমা দিতে হবে।</p>
      </div>
    )
  },
  {
    id: 2,
    icon: <FaBook />,
    title: "Syllabus & Routine",
    content: (
      <p>নতুন শিক্ষাবর্ষের জন্য সিলেবাস এবং ক্লাস রুটিন তৈরির কাজ চলছে। খুব শীঘ্রই এখানে ডাউনলোড লিঙ্ক যুক্ত করা হবে। অনুগ্রহ করে পরবর্তী আপডেটের জন্য অপেক্ষা করুন।</p>
    )
  },
  {
    id: 3,
    icon: <FaPoll />,
    title: "Online Results",
    content: (
      <p>বর্তমানে অনলাইন রেজাল্ট দেখার পরিষেবাটি চালু নেই। আমরা এই ফিচারটি নিয়ে কাজ করছি। অদূর ভবিষ্যতে, ছাত্র-ছাত্রী এবং অভিভাবকদের জন্য ওয়েবসাইটের মূল মেনুতে রেজাল্ট দেখার একটি বিশেষ অপশন যোগ করা হবে।</p>
    )
  },
  {
    id: 4,
    icon: <FaChalkboardTeacher />,
    title: "Teachers Directory",
    content: (
      <ul className={styles.teacherList}>
        <li><strong>অরিন্দম সেন:</strong> M.A. in English, B.Ed</li>
        <li><strong>সুজাতা চৌধুরী:</strong> M.Sc. in Physics, B.Ed</li>
        <li><strong>রাজীব কর্মকার:</strong> M.Sc. in Mathematics</li>
        <li><strong>প্রিয়াঙ্কা দাস:</strong> M.A. in Bengali, B.Ed</li>
        <li><strong>সৌমিত্র ব্যানার্জী:</strong> M.Sc. in Chemistry</li>
        <li><strong>অনন্যা ঘোষ:</strong> M.A. in History, B.Ed</li>
        <li><strong>বিক্রম সাহা:</strong> M.Sc. in Biology</li>
        <li><strong>নন্দিনী পাল:</strong> B.A. in Fine Arts</li>
      </ul>
    )
  }
];

export default function QuickLinks() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleToggle = (id: number) => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };

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
    <section className={styles.quickLinksSection}>
      <div className={styles.container}>
        <motion.h2
          className={styles.sectionTitle}
          variants={titleReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
        >
          Quick Links
        </motion.h2>
        <div className={styles.quickLinksGrid}>
          {quickLinksData.map((item, index) => {
            const isExpanded = expandedId === item.id;
            return (
              <motion.div
                key={item.id}
                variants={index % 2 === 0 ? slideFromLeft : slideFromRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
              >
                <div className={styles.linkCard}>
                  <div className={styles.cardHeader} onClick={() => handleToggle(item.id)}>
                    <div className={styles.cardIcon}>{item.icon}</div>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <FiChevronDown className={`${styles.chevronIcon} ${isExpanded ? styles.rotated : ''}`} />
                  </div>
                  <div className={`${styles.cardContent} ${isExpanded ? styles.expanded : ''}`}>
                    <div className={styles.contentInner}>
                      {item.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}