// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '../lib/supabaseClient';
import type { GetServerSidePropsContext } from 'next';

import styles from '../styles/Dashboard.module.css';
import { FiGrid, FiUpload, FiUser, FiUsers, FiLogOut, FiMenu, FiX, FiEye, FiDownload } from 'react-icons/fi';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Type Definitions (সঠিক করা হয়েছে) ---
type Class = { id: number; name: string; };
type Section = { id: number; name: string; class_id: number; };
type StudentInfo = {
  name: string;
  student_unique_id: string;
  father_name: string | null;
};
type StudentData = {
  roll_number: number;
  students: StudentInfo;
};

type PageProps = {
  initialCanManageStudents: boolean;
  initialAcademicYears: { academic_year: string }[];
};

export default function Dashboard({ initialCanManageStudents, initialAcademicYears }: PageProps) {
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [canManageStudents] = useState(initialCanManageStudents);
  const [academicYears] = useState(initialAcademicYears);
  const [selectedYear, setSelectedYear] = useState<string | null>(
    initialAcademicYears.length > 0 ? initialAcademicYears[0].academic_year : null
  );
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);

  useEffect(() => {
    if (selectedYear) {
      const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*').eq('academic_year', selectedYear).order('name');
        setClasses(data || []);
      };
      fetchClasses();
      setSelectedClass(null); setSections([]); setSelectedSection(null); setStudents([]);
    }
  }, [selectedYear]);

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
    
    // ## চূড়ান্ত সমাধান এখানে: ডেটা ফেচিং এবং ফরম্যাটিং ##
    const { data, error } = await supabase
      .from('enrollments')
      .select('roll_number, students!inner(name, student_unique_id, father_name)')
      .eq('academic_year', selectedYear)
      .eq('section_id', sec.id)
      .order('roll_number');

    if (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } else {
      // ডেটা রূপান্তর (Data Transformation)
      const formattedData = data.map(enrollment => ({
        ...enrollment,
        students: Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students
      })).filter(e => e.students);

      setStudents(formattedData as StudentData[]);
    }
  };

  const handleExportPDF = () => {
    if (!selectedClass || !selectedSection || !selectedYear || students.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Student List - ${selectedClass.name}, Section: ${selectedSection.name} (${selectedYear})`, 14, 15);
    autoTable(doc, {
      head: [['Roll', 'Name', 'Student ID', "Father's Name"]],
      body: students.map(s => [s.roll_number, s.students.name, s.students.student_unique_id, s.students.father_name || 'N/A']),
      startY: 20,
    });
    doc.save(`students_${selectedYear}_${selectedClass.name}_${selectedSection.name}.pdf`);
  };

  const handleExportExcel = () => {
    if (!selectedClass || !selectedSection || !selectedYear || students.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(students.map(s => ({ 
        "Roll Number": s.roll_number, 
        "Name": s.students.name,
        "Student ID": s.students.student_unique_id,
        "Father's Name": s.students.father_name || 'N/A'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `students_${selectedYear}_${selectedClass.name}_${selectedSection.name}.xlsx`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className={styles.dashboardLayout}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}><h2>School Panel</h2><button className={styles.closeButton} onClick={() => setSidebarOpen(false)}><FiX /></button></div>
        <nav className={styles.sidebarNav}>
          <ul>
            <li><Link href="/dashboard" className={styles.active}><FiGrid /> <span>Dashboard</span></Link></li>
            <li><Link href={canManageStudents ? "/admin/manage-students" : "#"} className={!canManageStudents ? styles.disabledLink : ''} onClick={(e) => { if (!canManageStudents) { e.preventDefault(); alert("This feature is disabled by admin."); } }} ><FiUsers /> <span>Manage Students</span></Link></li>
            <li><Link href="/upload-marks"><FiUpload /> <span>Upload Marks</span></Link></li>
            <li><Link href="/view-results"><FiEye /> <span>View Results</span></Link></li>
            <li><Link href="#"><FiUser /> <span>Profile</span></Link></li>
          </ul>
        </nav>
        <button onClick={handleLogout} className={styles.logoutButton}><FiLogOut /> <span>Logout</span></button>
      </aside>

      <main className={`${styles.mainContent} ${isSidebarOpen ? styles.blurred : ''}`}>
        {/* ## চূড়ান্ত সমাধান এখানে: UI এলিমেন্টগুলো আবার যোগ করা হয়েছে ## */}
        <div className={styles.dashboardHeaderArea}>
          <div className={styles.topBar}>
            <button className={styles.hamburgerMenu} onClick={() => setSidebarOpen(true)}><FiMenu /></button>
            <div className={styles.academyCard}><img src="/logo.jpg" alt="A B C Academy Logo" /><h2>A B C Academy</h2></div>
          </div>
          <div className={styles.welcomeMessageContainer}><div className={styles.smokeEffect}></div><div className={styles.welcomeText}>Welcome, Teacher</div></div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
        </div>

        <div className={`${styles.selectorCard} ${styles.glassCard}`}>
          <div className={styles.formGroup}>
            <label htmlFor="academicYear">Select Academic Year</label>
            <select id="academicYear" className={styles.selectDropdown} value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="" disabled>-- Select a Year --</option>
              {academicYears.map(year => (<option key={year.academic_year} value={year.academic_year}>{year.academic_year}</option>))}
            </select>
          </div>
        </div>

        {selectedYear && classes.length > 0 && (
          <div className={`${styles.selectorCard} ${styles.glassCard}`}>
             <div className={styles.formGroup}>
                <label>Select a Class</label>
                <div className={styles.classList}>
                    {classes.map((cls) => (<button key={cls.id} className={`${styles.classItem} ${selectedClass?.id === cls.id ? styles.active : ''}`} onClick={() => handleClassSelect(cls)}>{cls.name}</button>))}
                </div>
            </div>
          </div>
        )}

        {selectedClass && sections.length > 0 && (
            <div className={`${styles.selectorCard} ${styles.glassCard}`}>
                <div className={styles.formGroup}>
                    <label>Select a Section</label>
                    <div className={styles.classList}>
                        {sections.map((sec) => (<button key={sec.id} className={`${styles.classItem} ${selectedSection?.id === sec.id ? styles.active : ''}`} onClick={() => handleSectionSelect(sec)}>{sec.name}</button>))}
                    </div>
                </div>
            </div>
        )}

        {selectedSection && students.length > 0 && (
          <div className={`${styles.card} ${styles.glassCard}`}>
            <div className={styles.listHeader}>
              <h2 className={styles.cardTitle}>Students of {selectedClass?.name} - {selectedSection?.name} ({selectedYear})</h2>
              <div className={styles.exportButtons}><button onClick={handleExportPDF} className={styles.exportButton}><FiDownload /> PDF</button><button onClick={handleExportExcel} className={styles.exportButton}><FiDownload /> Excel</button></div>
            </div>
            <table className={styles.studentTable}>
              <thead><tr><th>Roll Number</th><th>Name</th><th>Student ID</th><th>Father's Name</th></tr></thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.students.student_unique_id}>
                    <td>{student.roll_number}</td>
                    <td>{student.students.name}</td>
                    <td>{student.students.student_unique_id}</td>
                    <td>{student.students.father_name || 'N/A'}</td>
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createPagesServerClient(context);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { redirect: { destination: '/', permanent: false } };
  }
  const { data: permission } = await supabase.from('app_settings').select('is_enabled').eq('setting_name', 'allow_teachers_manage_students').single();
  const { data: years } = await supabase.rpc('get_distinct_academic_years');
  return {
    props: {
      initialCanManageStudents: permission?.is_enabled || false,
      initialAcademicYears: years || [],
    },
  };
}