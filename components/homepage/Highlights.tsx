// components/homepage/Highlights.tsx

import { useState, useEffect } from 'react';
import styles from './Highlights.module.css';
import { motion, Variants } from 'framer-motion';

// Notice টাইপ
export type Notice = {
  id: number;
  title: string;
  notice_date: string;
  details: string | null;
};

// Props-এর জন্য টাইপ
type HighlightsProps = {
  notices: Notice[];
};

// Events-এর ডেটা
const events = [
  { id: 1, title: 'Annual Sports Day Highlights', image: '/events/sports.jpg' },
  { id: 2, title: 'Science Exhibition Winners', image: '/events/science.jpg' },
  { id: 3, title: 'Cultural Fest Moments', image: '/events/cultural.jpg' },
];

// NoticeDate কম্পোনেন্ট অপরিবর্তিত
const NoticeDate = ({ dateString }: { dateString: string }) => {
  const [formattedDate, setFormattedDate] = useState({ day: '', month: '' });

  useEffect(() => {
    const date = new Date(dateString);
    setFormattedDate({
      day: date.getDate().toString(),
      month: date.toLocaleString('default', { month: 'short' }),
    });
  }, [dateString]);

  if (!formattedDate.day) {
    return <div className={styles.noticeDate}></div>;
  }

  return (
    <div className={styles.noticeDate}>
      <span>{formattedDate.day}</span>
      {formattedDate.month}
    </div>
  );
};

export default function Highlights({ notices }: HighlightsProps) {
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);

  const handleToggle = (id: number) => {
    setExpandedNoticeId(prevId => (prevId === id ? null : id));
  };

  // অ্যানিমেশনের জন্য ভ্যারিয়েন্ট
  const slideFromRight: Variants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const slideFromLeft: Variants = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section className={styles.highlightsSection}>
      <div className={styles.container}>
        {/* নোটিশ বোর্ড সেকশন */}
        <motion.div
          className={styles.column}
          variants={slideFromRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <h2 className={styles.columnTitle}>Notice Board</h2>
          <div className={styles.noticeBoardFrame}>
            <div className={styles.noticeBoardCork}>
              {/* --- ভেতরের কন্টেন্ট এখানে যোগ করা হয়েছে --- */}
              {notices && notices.length > 0 ? (
                notices.map(notice => {
                  const isExpanded = expandedNoticeId === notice.id;
                  return (
                    <div key={notice.id} className={styles.noticePaper}>
                      <div className={styles.pin}></div>
                      <div className={styles.noticeHeader} onClick={() => handleToggle(notice.id)}>
                        <NoticeDate dateString={notice.notice_date} />
                        <div className={styles.noticeContent}>
                          <p className={styles.noticeTitle}>{notice.title}</p>
                        </div>
                      </div>
                      <div className={`${styles.noticeDetails} ${isExpanded ? styles.expanded : ''}`}>
                        <p>{notice.details || 'No details available.'}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={styles.noNotices}>No New Notices</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ইভেন্টস সেকশন */}
        <div className={styles.column}>
          <motion.h2
            className={styles.columnTitle}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 1 }}
          >
            Events & Achievements
          </motion.h2>
          <div className={styles.eventGrid}>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                variants={index % 2 === 0 ? slideFromLeft : slideFromRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.5 }}
              >
                <div className={styles.eventCard} style={{ backgroundImage: `url(${event.image})` }}>
                  <div className={styles.eventOverlay}></div>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}