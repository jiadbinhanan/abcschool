// components/homepage/WelcomeMessage.tsx
import Image from 'next/image';
import styles from './WelcomeMessage.module.css';

export default function WelcomeMessage() {
  return (
    <section className={styles.welcomeSection}>
      <div className={styles.container}>
        <div className={styles.headmasterCard}>
          <div className={styles.imageContainer}>
            {/* A placeholder image. Replace with the actual headmaster's photo in /public/headmaster.jpg */}
            <Image 
              src="/headmaster.jpg" 
              alt="Headmaster Jack" 
              width={200} 
              height={200} 
              className={styles.headmasterImage}
            />
          </div>
          <div className={styles.messageContent}>
            <p className={styles.quote}>
              “Welcome to ABC Academy, where we believe every child has the potential to achieve greatness. Our mission is to provide holistic education that nurtures both knowledge and character.”
            </p>
            <p className={styles.signature}>— Headmaster Jack</p>
          </div>
        </div>
        
        <div className={styles.historyCard}>
          <h2 className={styles.historyTitle}>A Legacy of Excellence</h2>
          <p className={styles.historyText}>
            Established in 1990, ABC Academy has been a center of excellence in academics, sports, and cultural activities for over three decades. We are committed to shaping the leaders of tomorrow.
          </p>
        </div>
      </div>
    </section>
  );
}