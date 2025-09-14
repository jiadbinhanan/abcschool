// pages/admin/dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import styles from '../../styles/AdminDashboard.module.css';
import { FiUsers, FiClipboard, FiPlusSquare, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin');
        return;
      }
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      if (roleData?.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/admin');
      } else {
        setUser(session.user);
      }
    };
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) {
    return <div className={styles.loading}>Verifying Admin Access...</div>;
  }

  return (
    <div className={styles.dashboardLayout}>
      <div>
        <header className={styles.header}>
          <h1>Welcome, Admin!</h1>
          <p>Select an option below to manage the school data.</p>
        </header>

        <main className={styles.navGrid}>
          {/* Card 1: Manage Students */}
          <Link href="/admin/manage-students" className={styles.navCard}>
            <div className={styles.cardIcon}><FiUsers /></div>
            <h2 className={styles.cardTitle}>Manage Students</h2>
          </Link>

          {/* Card 2: Manage Teachers */}
          <Link href="#" className={styles.navCard}>
            <div className={styles.cardIcon}><FiUsers /></div>
            <h2 className={styles.cardTitle}>Manage Teachers</h2>
          </Link>

          {/* Card 3: Manage Classes & Sections */}
          <Link href="/admin/manage-classes" className={styles.navCard}>
            <div className={styles.cardIcon}><FiClipboard /></div>
            <h2 className={styles.cardTitle}>Manage Classes</h2>
          </Link>

          {/* Card 4: Manage Subjects */}
          <Link href="#" className={styles.navCard}>
            <div className={styles.cardIcon}><FiPlusSquare /></div>
            <h2 className={styles.cardTitle}>Manage Subjects</h2>
          </Link>
        </main>
        
        <div className={styles.logoutButtonContainer}>
            <button onClick={handleLogout} className={styles.logoutButton}>
                <FiLogOut style={{ marginRight: '8px' }} /> Logout
            </button>
        </div>
      </div>
    </div>
  );
}