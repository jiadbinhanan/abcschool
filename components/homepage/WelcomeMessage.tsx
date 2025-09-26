import Image from 'next/image';
import styles from './WelcomeMessage.module.css';
import { motion, Variants } from 'framer-motion';
import { Fade } from 'react-awesome-reveal';

export default function WelcomeMessage() {
  
  // ১. বাম দিক থেকে দ্রুত স্লাইড-ইন ভ্যারিয়েন্ট
  const fastSlideInFromLeft: Variants = {
    offscreen: { opacity: 0, x: -100 },
    onscreen: {
      opacity: 1,
      x: 0,
      transition: {
        type: "tween",
        duration: 0.2 // গতি আরও বাড়ানো হয়েছে
      }
    }
  };

  // ২. ডান দিক থেকে দ্রুত স্লাইড-ইন ভ্যারিয়েন্ট
  const fastSlideInFromRight: Variants = {
    offscreen: { opacity: 0, x: 100 }, // ডান দিক (x: 100) থেকে শুরু হবে
    onscreen: {
      opacity: 1,
      x: 0,
      transition: {
        type: "tween",
        duration: 0.2// গতি একই রাখা হয়েছে
      }
    }
  };

  // হেডমাস্টারের ছবির জন্য Pop-up ভ্যারিয়েন্ট (অপরিবর্তিত)
  const imageZoomVariant: Variants = {
    offscreen: { scale: 0.5, opacity: 0 },
    onscreen: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, delay: 0.2 } // Delay সামান্য কমানো হয়েছে
    }
  };

  // প্যারাগ্রাফের জন্য সাধারণ Fade-up ভ্যারিয়েন্ট (অপরিবর্তিত)
  const paragraphFadeUp: Variants = {
    offscreen: { opacity: 0, y: 20 },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.3, duration: 0.5 }
    }
  };

  return (
    <section className={styles.welcomeSection}>
      <div className={styles.container}>
        
        {/* হেডমাস্টার কার্ড - বাম দিক থেকে আসবে */}
        <motion.div 
          className={styles.headmasterCard}
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: false, amount: 0.4 }} 
          variants={fastSlideInFromLeft} // বাম দিকের ভ্যারিয়েন্ট
        >
          <motion.div 
            className={styles.imageContainer}
            variants={imageZoomVariant}
          >
            <Image 
              src="/headmaster.jpg" 
              alt="Headmaster Jack" 
              width={200} 
              height={200} 
              className={styles.headmasterImage}
            />
          </motion.div>
          <div className={styles.messageContent}>
            <p className={styles.quote}>
              “Welcome to ABC Academy, where we believe every child has the potential to achieve greatness. Our mission is to provide holistic education that nurtures both knowledge and character.”
            </p>
            <p className={styles.signature}>— Headmaster Jack</p>
          </div>
        </motion.div>
        
        {/* Legacy কার্ড - ডান দিক থেকে আসবে */}
        <motion.div 
          className={styles.historyCard}
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: false, amount: 0.4 }}
          variants={fastSlideInFromRight} // ডান দিকের ভ্যারিয়েন্ট
        >
          <h2 className={styles.historyTitle}>
            <Fade delay={300} cascade damping={0.05} triggerOnce={false}>
              A Legacy of Excellence
            </Fade>
          </h2>
          <motion.p 
            className={styles.historyText}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: false, amount: 0.8 }}
            variants={paragraphFadeUp}
          >
            Established in 1990, ABC Academy has been a center of excellence in academics, sports, and cultural activities for over three decades. We are committed to shaping the leaders of tomorrow.
          </motion.p>
        </motion.div>

      </div>
    </section>
  );
}

