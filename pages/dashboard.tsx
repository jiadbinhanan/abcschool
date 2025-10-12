// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
// কোড ২ থেকে FiUsers আইকনটি যোগ করা হয়েছে
import { FiGrid, FiUpload, FiUser, FiUsers, FiLogOut, FiMenu, FiX, FiEye } from 'react-icons/fi';
import ClassList from '../components/ClassList';
import StudentList from '../components/StudentList';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

// Define types for our data (কোড ১ থেকে নেওয়া)
type Class = { id: number; name: string; };
type Section = { id: number; name: string; class_id: number; };
type Student = { id: number; name: string; roll_number: number; };

// New SectionList Component with correct types (কোড ১ থেকে নেওয়া)
function SectionList({ sections, onSectionSelect, selectedSectionId }: { sections: Section[], onSectionSelect: (section: Section) => void, selectedSectionId: number | null }) {
  if (sections.length === 0) return null;
  return (
    <div className={styles.card} style={{ marginTop: '20px' }}>
      <h2 className={styles.cardTitle}>Select a Section</h2>
      <div className={styles.classList}>
        {sections.map((sec) => (
          <button
            key={sec.id}
            className={`${styles.classItem} ${selectedSectionId === sec.id ? styles.active : ''}`}
            onClick={() => onSectionSelect(sec)}
          >
            {sec.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [canManageStudents, setCanManageStudents] = useState(false); // কোড ২ থেকে নতুন state
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*');
      setClasses(data || []);
    };
    fetchClasses();
  }, []);

  const handleClassSelect = async (cls: Class) => {
    setSelectedClass(cls);
    setSelectedSection(null);
    setStudents([]);
    const { data } = await supabase.from('sections').select('*').eq('class_id', cls.id);
    setSections(data || []);
  };

  const handleSectionSelect = async (sec: Section) => {
    setSelectedSection(sec);
    const { data } = await supabase.from('students').select('*').eq('section_id', sec.id).order('roll_number');
    setStudents(data || []);
  };

  // কোড ১ এবং কোড ২ এর user session এবং permission চেকিং লজিক একসাথে করা হয়েছে
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.push('/');
      } else {
        setUser(session.user);
        
        // Fetch the global permission setting
        const { data: permissionData } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'teachers_can_manage_students')
          .single();
        if (permissionData) {
          setCanManageStudents(permissionData.setting_value);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.dashboardLayout}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>School Panel</h2>
          <button className={styles.closeButton} onClick={() => setSidebarOpen(false)}><FiX /></button>
        </div>
        <nav className={styles.sidebarNav}>
          <ul>
            <li><Link href="/dashboard" className={styles.active}><FiGrid /> <span>Dashboard</span></Link></li>
            
            {/* কোড ২ থেকে নতুন শর্তসাপেক্ষ "Manage Students" লিঙ্ক যোগ করা হয়েছে */}
            <li>
                <Link 
                    href={canManageStudents ? "/manage-students" : "#"} // Changed link to be relative
                    className={!canManageStudents ? styles.disabledLink : ''}
                    onClick={!canManageStudents ? (e) => { e.preventDefault(); alert("This feature is currently disabled by the admin."); } : undefined}
                >
                    <FiUsers /> <span>Manage Students</span>
                </Link>
            </li>
            
            <li><Link href="/upload-marks"><FiUpload /> <span>Upload Marks</span></Link></li>
            <li><Link href="/view-results"><FiEye /> <span>View Results</span></Link></li>
            <li><Link href="#"><FiUser /> <span>Profile</span></Link></li>
          </ul>
        </nav>
        <button onClick={handleLogout} className={styles.logoutButton}><FiLogOut /> <span>Logout</span></button>
      </aside>

      <main className={`${styles.mainContent} ${isSidebarOpen ? styles.blurred : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <button className={styles.hamburgerMenu} onClick={() => setSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <FiX /> : <FiMenu />}
            </button>
            <h1>Dashboard</h1>
          </div>
        </header>

        <ClassList classes={classes} onClassSelect={handleClassSelect} selectedClassId={selectedClass?.id} />
        <SectionList sections={sections} onSectionSelect={handleSectionSelect} selectedSectionId={selectedSection?.id} />
        <StudentList students={students} selectedClass={selectedClass} selectedSection={selectedSection} />
      </main>
    </div>
  );
}
