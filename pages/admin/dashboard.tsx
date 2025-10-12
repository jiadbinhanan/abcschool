// pages/admin/dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import styles from '../../styles/AdminDashboard.module.css';
// ১. নতুন আইকন ইম্পোর্ট করুন
import { FiUsers, FiClipboard, FiPlusSquare, FiLogOut, FiCheckSquare, FiEye } from 'react-icons/fi';
import { BsMegaphoneFill } from 'react-icons/bs'; // Notice এর জন্য নতুন আইকন
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
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
          {/* Manage Students */}
          <Link href="/manage-students" className={styles.navCard}>
            <div className={styles.cardIcon}><FiUsers /></div>
            <h2 className={styles.cardTitle}>Manage Students</h2>
          </Link>
          {/* Manage Teachers */}
          <Link href="/admin/manage-teachers" className={styles.navCard}>
            <div className={styles.cardIcon}><FiUsers /></div>
            <h2 className={styles.cardTitle}>Manage Teachers</h2>
          </Link>
           {/* === ২. নতুন 'Manage Notices' কার্ডটি এখানে যোগ করুন === */}
          <Link href="/admin/manage-notices" className={styles.navCard}>
            <div className={styles.cardIcon}><BsMegaphoneFill /></div>
            <h2 className={styles.cardTitle}>Manage Notices</h2>
          </Link>
          {/* Manage Classes */}
          <Link href="/admin/manage-classes" className={styles.navCard}>
            <div className={styles.cardIcon}><FiClipboard /></div>
            <h2 className={styles.cardTitle}>Manage Classes</h2>
          </Link>
          {/* Manage Subjects */}
          <Link href="/admin/manage-subjects" className={styles.navCard}>
            <div className={styles.cardIcon}><FiPlusSquare /></div>
            <h2 className={styles.cardTitle}>Manage Subjects</h2>
          </Link>
          {/* Publish Results */}
          <Link href="/admin/publish-results" className={styles.navCard}>
            <div className={styles.cardIcon}><FiCheckSquare /></div>
            <h2 className={styles.cardTitle}>Publish Results</h2>
          </Link>
          {/* View Results */}
          <Link href="/view-results" className={styles.navCard}>
            <div className={styles.cardIcon}><FiEye /></div>
            <h2 className={styles.cardTitle}>View Results</h2>
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