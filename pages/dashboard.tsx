// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
import { FiGrid, FiUpload, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import ClassList from '../components/ClassList';
import StudentList from '../components/StudentList';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

// Define types for our data
type Class = { id: number; name: string; };
type Section = { id: number; name: string; class_id: number; };
type Student = { id: number; name: string; roll_number: number; };

// New SectionList Component with correct types
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/');
      else setUser(session.user);
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
            <li><Link href="/upload-marks"><FiUpload /> <span>Upload Marks</span></Link></li>
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
