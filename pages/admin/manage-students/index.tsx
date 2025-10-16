// pages/admin/manage-students/index.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import styles from '../../../styles/ManageStudents.module.css';
import permissionStyles from '../../../styles/Permissions.module.css';
import { FiUserPlus, FiBookOpen, FiAward } from 'react-icons/fi';
// ✅ ধাপ ১: getServerSideProps এবং পারমিশন চেকার ইম্পোর্ট করা
import type { GetServerSidePropsContext } from 'next';
import { checkPermissionAndGetRole } from '../../../lib/permissions';

// TeacherPermissionToggle কম্পোনেন্টটি অপরিবর্তিত থাকবে
function TeacherPermissionToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissionStatus = async () => {
      const { data } = await supabase.from('app_settings').select('is_enabled').eq('setting_name', 'allow_teachers_manage_students').single();
      if (data) setIsEnabled(data.is_enabled);
      setLoading(false);
    };
    fetchPermissionStatus();
  }, []);

  const handleToggle = async () => {
    const newStatus = !isEnabled;
    setIsEnabled(newStatus);
    await supabase.from('app_settings').update({ is_enabled: newStatus, updated_at: new Date().toISOString() }).eq('setting_name', 'allow_teachers_manage_students');
  };

  if (loading) return <p>Loading permission setting...</p>;

  return (
    <div className={permissionStyles.permissionContainer}>
      <h3 className={permissionStyles.permissionHeader}>Teacher Access Control</h3>
      <p className={permissionStyles.permissionSubheader}>
        Use this master switch to grant or revoke "Manage Students" access for ALL teachers.
      </p>
      <div className={permissionStyles.teacherRow}>
        <span className={permissionStyles.teacherName}>Allow All Teachers to Manage Students</span>
        <div className={permissionStyles.permissionAction}>
          <label className={permissionStyles.switch}>
            <input type="checkbox" checked={isEnabled} onChange={handleToggle} />
            <span className={permissionStyles.slider}></span>
          </label>
          <span className={isEnabled ? permissionStyles.statusEnabled : permissionStyles.statusDisabled}>
            {isEnabled ? 'ALLOWED' : 'DENIED'}
          </span>
        </div>
      </div>
    </div>
  );
}


// ✅ ধাপ ২: কম্পোনেন্টটি এখন props থেকে userRole গ্রহণ করবে
export default function ManageStudentsHub({ userRole }: { userRole: 'admin' | 'teacher' }) {
  const router = useRouter();
  // 🔄 ধাপ ৩: হার্ডকোডেড useState লাইনটি সরিয়ে ফেলা হয়েছে

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
<button 
  onClick={() => router.push(userRole === 'admin' ? '/admin/dashboard' : '/dashboard')} 
  className={styles.backButton}
>
  ← Back
</button>
        <h1>Student Management</h1>
      </header>
      <main className={styles.hubContent}>
        <div className={styles.actionGrid}>
          {/* এই লিঙ্কগুলো টিচার এবং অ্যাডমিন উভয়ের জন্যই কাজ করবে */}
          <Link href="/admin/manage-students/class-view" className={styles.actionCard}>
            <FiUserPlus size={40} />
            <h2>Add & View Students</h2>
            <p>Manage students by class and section. Add new students for the current academic year.</p>
          </Link>
          <Link href="/admin/manage-students/directory" className={styles.actionCard}>
            <FiBookOpen size={40} />
            <h2>Student Directory</h2>
            <p>View a master list of all students. Find mistake entries and manage permanent records.</p>
          </Link>
          <Link href="/admin/manage-students/promote-students" className={styles.actionCard}>
            <FiAward size={40} />
            <h2>Promote Students</h2>
            <p>Move students to the next academic year and class after a session ends.</p>
          </Link>
        </div>

        {/* এই সেকশনটি শুধুমাত্র অ্যাডমিন দেখতে পাবে */}
        {userRole === 'admin' && (
          <div className={styles.permissionSection}>
            <TeacherPermissionToggle />
          </div>
        )}
      </main>
    </div>
  );
}

// ✅ ধাপ ৪:getServerSideProps ফাংশন যোগ করা
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // আমাদের বানানো কেন্দ্রীয় ফাংশনটি কল করে পারমিশন চেক করা হচ্ছে
  const permissionResult = await checkPermissionAndGetRole(context);

  // যদি পারমিশন না থাকে (যেমন লগইন করা না থাকলে বা পারমিশন false হলে),
  // তাহলে permissionResult-এ একটি redirect অবজেক্ট থাকবে, যা এখানে return করা হবে।
  if ('redirect' in permissionResult) {
    return permissionResult;
  }

  // পারমিশন থাকলে userRole প্রপটি পেজে পাঠানো হবে
  return {
    props: {
      ...permissionResult.props,
    },
  };
}