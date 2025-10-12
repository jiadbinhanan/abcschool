// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
import { FiGrid, FiUpload, FiUser, FiUsers, FiLogOut, FiMenu, FiX, FiEye, FiDownload } from 'react-icons/fi';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Type Definitions ---
type Class = { id: number; name: string; };
type Section = { id: number; name: string; class_id: number; };
type Student = { id: number; name: string; roll_number: number; };

// --- Main Dashboard Component ---
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [canManageStudents, setCanManageStudents] = useState(false);
  
  const [academicYears, setAcademicYears] = useState<{ academic_year: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  
  const router = useRouter();

  // Initial data loading and authentication check
  useEffect(() => {
    const checkPermission = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('is_enabled')
        .eq('setting_name', 'allow_teachers_manage_students')
        .single();
      setCanManageStudents(data?.is_enabled || false);
    };

    const fetchAcademicYears = async () => {
      const { data } = await supabase.rpc('get_distinct_academic_years');
      if (data && data.length > 0) {
        setAcademicYears(data);
        if (!selectedYear) {
          setSelectedYear(data[0].academic_year);
        }
      }
    };
    
    const handleAuthChange = (session: any) => {
        if (session?.user) {
            setUser(session.user);
            checkPermission();
            fetchAcademicYears();
        } else {
            setUser(null);
            router.push('/');
        }
    };
    
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthChange(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  // Load classes based on selected year
  useEffect(() => {
    if (selectedYear) {
      const fetchClasses = async () => {
        const { data } = await supabase
          .from('classes')
          .select('*')
          .eq('academic_year', selectedYear)
          .order('name');
        setClasses(data || []);
      };
      fetchClasses();
      setSelectedClass(null);
      setSections([]);
      setSelectedSection(null);
      setStudents([]);
    }
  }, [selectedYear]);

  // --- Event Handlers ---
  const handleClassSelect = async (cls: Class) => {
    setSelectedClass(cls);
    const { data } = await supabase.from('sections').select('*').eq('class_id', cls.id);
    setSections(data || []);
    setSelectedSection(null);
    setStudents([]);
  };

  const handleSectionSelect = async (sec: Section) => {
    setSelectedSection(sec);
    if (!selectedYear) return;
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('section_id', sec.id)
      .eq('academic_year', selectedYear)
      .order('roll_number');
    setStudents(data || []);
  };
  
  const handleExportPDF = () => {
    if (!selectedClass || !selectedSection || !selectedYear || students.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Student List - ${selectedClass.name}, Section: ${selectedSection.name} (${selectedYear})`, 14, 15);
    autoTable(doc, {
      head: [['Roll Number', 'Name']],
      body: students.map(s => [s.roll_number, s.name]),
      startY: 20,
    });
    doc.save(`students_${selectedYear}_${selectedClass.name}_${selectedSection.name}.pdf`);
  };

  const handleExportExcel = () => {
    if (!selectedClass || !selectedSection || !selectedYear || students.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(students.map(s => ({ "Roll Number": s.roll_number, "Name": s.name })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `students_${selectedYear}_${selectedClass.name}_${selectedSection.name}.xlsx`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return <div className={styles.loading}>Loading...</div>;

  // --- JSX Rendering ---
  return (
    <div className={styles.dashboardLayout}>
      {/* --- Sidebar --- */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>School Panel</h2>
          <button className={styles.closeButton} onClick={() => setSidebarOpen(false)}><FiX /></button>
        </div>
        <nav className={styles.sidebarNav}>
          <ul>
            <li><Link href="/dashboard" className={styles.active}><FiGrid /> <span>Dashboard</span></Link></li>
            <li>
              <Link 
                href={canManageStudents ? "/manage-students" : "#"} 
                className={!canManageStudents ? styles.disabledLink : ''} 
                onClick={(e) => { if (!canManageStudents) { e.preventDefault(); alert("This feature is disabled by admin."); } }}
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

      {/* --- Main Content --- */}
      <main className={`${styles.mainContent} ${isSidebarOpen ? styles.blurred : ''}`}>
        <div className={styles.dashboardHeaderArea}>
          <div className={styles.topBar}>
            <button className={styles.hamburgerMenu} onClick={() => setSidebarOpen(true)}>
              <FiMenu />
            </button>
            <div className={styles.academyCard}>
              {/* Logo path updated */}
              <img src="/logo.jpg" alt="A B C Academy Logo" />
              <h2>A B C Academy</h2>
            </div>
          </div>
          
          {/* Welcome Message without a card */}
          <div className={styles.welcomeMessageContainer}>
            <div className={styles.smokeEffect}></div>
            <div className={styles.welcomeText}>
              {/* Welcome message text changed */}
              Welcome, Teacher
            </div>
          </div>
          
          {/* New "Dashboard" title added */}
          <h1 className={styles.pageTitle}>Dashboard</h1>
        </div>

        {/* --- Academic Year Selector Card --- */}
        <div className={`${styles.selectorCard} ${styles.glassCard}`}>
          <div className={styles.formGroup}>
            <label htmlFor="academicYear">Select Academic Year</label>
            <select 
              id="academicYear" 
              className={styles.selectDropdown} 
              value={selectedYear || ''} 
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="" disabled>-- Select a Year --</option>
              {academicYears.map(year => (
                <option key={year.academic_year} value={year.academic_year}>
                  {year.academic_year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Class Selector Card --- */}
        {selectedYear && classes.length > 0 && (
          <div className={`${styles.selectorCard} ${styles.glassCard}`}>
             <div className={styles.formGroup}>
                <label>Select a Class</label>
                <div className={styles.classList}>
                    {classes.map((cls) => (
                    <button 
                        key={cls.id} 
                        className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.active : ''}`} 
                        onClick={() => handleClassSelect(cls)}
                    >
                        {cls.name}
                    </button>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* --- Section Selector Card --- */}
        {selectedClass && sections.length > 0 && (
            <div className={`${styles.selectorCard} ${styles.glassCard}`}>
                <div className={styles.formGroup}>
                    <label>Select a Section</label>
                    <div className={styles.classList}>
                        {sections.map((sec) => (
                        <button 
                            key={sec.id} 
                            className={`${styles.classItem} ${selectedSection?.id === sec.id ? styles.active : ''}`} 
                            onClick={() => handleSectionSelect(sec)}
                        >
                            {sec.name}
                        </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {/* --- Student List Card --- */}
        {selectedSection && students.length > 0 && (
          <div className={`${styles.card} ${styles.glassCard}`}>
            <div className={styles.listHeader}>
              <h2 className={styles.cardTitle}>Students of {selectedClass?.name} - {selectedSection?.name} ({selectedYear})</h2>
              <div className={styles.exportButtons}>
                <button onClick={handleExportPDF} className={styles.exportButton}><FiDownload /> PDF</button>
                <button onClick={handleExportExcel} className={styles.exportButton}><FiDownload /> Excel</button>
              </div>
            </div>
            <table className={styles.studentTable}>
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>{student.roll_number}</td>
                    <td>{student.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}