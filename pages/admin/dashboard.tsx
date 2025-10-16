// pages/admin/dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../../styles/AdminDashboard.module.css';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';

// Framer Motion for animations
import { motion, AnimatePresence, type Variants } from 'framer-motion';

// Icons
import { 
  FiUsers, FiClipboard, FiLogOut, FiEye, FiCalendar, FiMenu, FiX, 
  FiBookOpen, FiAward, FiBell, FiGrid, FiBriefcase
} from 'react-icons/fi';

// Variants for page load animations
const overviewContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const cardVariants = {
  fromTop: { hidden: { y: -30, opacity: 0 }, visible: { y: 0, opacity: 1 } },
  fromRight: { hidden: { x: 30, opacity: 0 }, visible: { x: 0, opacity: 1 } },
  fromLeft: { hidden: { x: -30, opacity: 0 }, visible: { x: 0, opacity: 1 } },
  fromBottom: { hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1 } },
};

// Component for individual stat cards
const StatCard = ({ icon, label, value, color, variants }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  color: string; 
  variants: Variants 
}) => (
  <motion.div 
    className={styles.statCard} 
    style={{ '--card-color': color } as React.CSSProperties}
    variants={variants}
  >
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statInfo}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [studentCount, setStudentCount] = useState<number | string>('...');
  const [classCount, setClassCount] = useState<number | string>('...');
  const [teacherCount, setTeacherCount] = useState<number | string>('...');
  const [sectionCount, setSectionCount] = useState<number | string>('...');

  const router = useRouter();

  useEffect(() => {
    const fetchCounts = async () => {
      // এখানে আপনার বর্তমান শিক্ষাবর্ষ নির্ধারণ করার লজিক বসান
      // আপাতত, আমরা সর্বশেষ বছরটিকে বর্তমান বছর হিসেবে ধরে নিচ্ছি
      const { data: latestYearData } = await supabase.rpc('get_distinct_academic_years').limit(1);
      const currentAcademicYear = latestYearData && latestYearData.length > 0 ? latestYearData[0].academic_year : new Date().getFullYear().toString();

      // ### পরিবর্তন ১: সঠিক ছাত্র সংখ্যা গণনা ###
      const { count: students } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('academic_year', currentAcademicYear);
      setStudentCount(students ?? 0);

      // ### পরিবর্তন ২: সঠিক ক্লাস সংখ্যা গণনা ###
      const { count: classes } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('academic_year', currentAcademicYear);
      setClassCount(classes ?? 0);

      // শিক্ষক এবং সেকশনের সংখ্যা অপরিবর্তিত রাখা হয়েছে (এগুলো সাধারণত মোট সংখ্যাই দেখানো হয়)
      const { count: teachers } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
      setTeacherCount(teachers ?? 0);
      const { count: sections } = await supabase.from('sections').select('*', { count: 'exact', head: true });
      setSectionCount(sections ?? 0);
    };

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/admin'); return; }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
      if (roleData?.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/admin');
      } else {
        setUser(session.user);
        fetchCounts();
      }
    };
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const smokeRevealVariants: Variants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { delay: 0.3, staggerChildren: 0.05 } },
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', damping: 12, stiffness: 100 } },
  };

  const welcomeText = "Welcome, Admin!";

  const sidebarVariants: Variants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30, delay: 0.2 } },
  };

  const navContainerVariants: Variants = {
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  };

  const navItemVariants: Variants = {
    open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
    closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } },
  };

  if (!user) return <div className={`${styles.loading} ${styles.theme}`}>Verifying Admin Access...</div>;

  const sidebarLinks = [
      { href: "/admin/manage-teachers", icon: <FiUsers />, label: "Manage Teachers" },
      { href: "/admin/manage-classes", icon: <FiClipboard />, label: "Manage Classes" },
      { href: "/admin/manage-subjects", icon: <FiBookOpen />, label: "Manage Subjects" },
      { href: "/admin/manage-academic-years", icon: <FiCalendar />, label: "Manage Years" },
  ];

  // ### পরিবর্তন ৩: Manage Students লিংক আপডেট করা ###
  const mainGridLinks = [
      { 
        href: "/admin/manage-students", 
        icon: <FiUsers />, 
        label: "Manage Students", 
        description: "Access class view, student directory, and manage permissions" 
      },
      { href: "/admin/manage-notices", icon: <FiBell />, label: "Manage Notices", description: "Create or update school notices" },
      { href: "/admin/publish-results", icon: <FiAward />, label: "Publish Results", description: "Declare and manage exam results" },
      { href: "/view-results", icon: <FiEye />, label: "View Results", description: "Check published results" },
  ];

  return (
    <div className={`${styles.pageWrapper} ${styles.theme}`}>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            className={styles.mobileBackdrop}
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        className={styles.sidebar}
        variants={sidebarVariants}
        initial="closed"
        animate={isSidebarOpen ? "open" : "closed"}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        <div className={styles.sidebarTopControls}>
            <button className={styles.sidebarCloseButton} onClick={() => setSidebarOpen(false)}>
                <FiX />
            </button>
        </div>
        <motion.div className={styles.sidebarHeaderCard}>
            <Image src="/logo.jpg" alt="School Logo" width={40} height={40} className={styles.logo} />
            <span className={styles.schoolName}>A B C Academy</span>
        </motion.div>

        <motion.nav className={styles.sidebarNav} variants={navContainerVariants}>
            {sidebarLinks.map(link => (
              <motion.div key={link.href} variants={navItemVariants}>
                <Link href={link.href} className={styles.sidebarLinkCard} title={link.label}>
                    {link.icon}
                    <span>{link.label}</span>
                </Link>
              </motion.div>
            ))}
        </motion.nav>

        <button onClick={handleLogout} className={styles.logoutButton}>
            <FiLogOut /> <span>Logout</span>
        </button>
      </motion.aside>

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
            <header className={styles.header}>
                <button className={styles.hamburger} onClick={() => setSidebarOpen(true)}>
                    <FiMenu />
                </button>
                <motion.div 
                  className={styles.schoolHeaderCard}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Image src="/logo.jpg" alt="School Logo" width={35} height={35} className={styles.logo} />
                    <span>A B C Academy Admin</span>
                </motion.div>
            </header>

            <motion.h1
              className={styles.welcomeText}
              variants={smokeRevealVariants}
              initial="hidden"
              animate="visible"
            >
              {welcomeText.split("").map((char, index) => (
                <motion.span key={char + "-" + index} variants={letterVariants}>
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.h1>

            <section>
              <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
              <motion.div 
                className={styles.overviewGrid}
                variants={overviewContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <StatCard icon={<FiUsers />} label="Active Students" value={studentCount} color="#28a745" variants={cardVariants.fromTop} />
                <StatCard icon={<FiClipboard />} label="Active Classes" value={classCount} color="#007bff" variants={cardVariants.fromRight} />
                <StatCard icon={<FiBriefcase />} label="Total Teachers" value={teacherCount} color="#ffc107" variants={cardVariants.fromLeft} />
                <StatCard icon={<FiGrid />} label="Total Sections" value={sectionCount} color="#17a2b8" variants={cardVariants.fromBottom} />
              </motion.div>
            </section>

            <section className={styles.quickActionsSection}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <motion.div 
                  className={styles.navGrid}
                  variants={overviewContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                    {mainGridLinks.map((link) => (
                        <motion.div
                            key={link.href}
                            variants={cardVariants.fromBottom}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <Link href={link.href} className={styles.navCard} title={link.label}>
                                <div className={styles.cardIcon}>{link.icon}</div>
                                <h3 className={styles.cardTitle}>{link.label}</h3>
                                <p className={styles.cardDescription}>{link.description}</p>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div>
      </main>
    </div>
  );
}