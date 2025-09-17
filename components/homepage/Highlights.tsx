// components/homepage/Highlights.tsx
import { useState, useEffect } from 'react'; // Import useState and useEffect
import styles from './Highlights.module.css';
import { FiArrowRight } from 'react-icons/fi';

// Dummy data
const notices = [
  { id: 1, title: 'Upcoming Exam Dates', date: '2025-09-20' },
  { id: 2, title: 'Admission Open for 2026', date: '2025-09-15' },
  { id: 3, title: 'Holiday Notice: Autumn Break', date: '2025-09-12' },
  { id: 4, title: 'Results Published for Mid-Term', date: '2025-09-10' },
];

const events = [
  { id: 1, title: 'Annual Sports Day Highlights', image: '/events/sports.jpg' },
  { id: 2, title: 'Science Exhibition Winners', image: '/events/science.jpg' },
  { id: 3, title: 'Cultural Fest Moments', image: '/events/cultural.jpg' },
];

// A new sub-component to safely render dates on the client-side
const NoticeDate = ({ dateString }: { dateString: string }) => {
  const [formattedDate, setFormattedDate] = useState({ day: '', month: '' });

  useEffect(() => {
    // This code runs only on the client, after hydration is complete
    const date = new Date(dateString);
    setFormattedDate({
      day: date.getDate().toString(),
      month: date.toLocaleString('default', { month: 'short' }),
    });
  }, [dateString]);

  // Render a placeholder or nothing on the server and initial client render
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


export default function Highlights() {
  return (
    <section className={styles.highlightsSection}>
      <div className={styles.container}>
        {/* Notice Board */}
        <div className={styles.column}>
          <h2 className={styles.columnTitle}>Notice Board</h2>
          <div className={styles.noticeList}>
            {notices.map(notice => (
              <div key={notice.id} className={styles.noticeItem}>
                {/* Use the new safe component for rendering dates */}
                <NoticeDate dateString={notice.date} />
                <div className={styles.noticeContent}>
                  <p className={styles.noticeTitle}>{notice.title}</p>
                  <a href="#" className={styles.readMore}>Read More <FiArrowRight /></a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events & Achievements */}
        <div className={styles.column}>
          <h2 className={styles.columnTitle}>Events & Achievements</h2>
          <div className={styles.eventGrid}>
            {events.map(event => (
              <div key={event.id} className={styles.eventCard} style={{ backgroundImage: `url(${event.image})` }}>
                <div className={styles.eventOverlay}></div>
                <h3 className={styles.eventTitle}>{event.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}