import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../../styles/TeacherManageStudents.module.css';
import { FiUserPlus, FiTrash2, FiChevronDown, FiFileText, FiGrid, FiSearch } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// TypeScript-কে জানানোর জন্য যে window অবজেক্টে Papa থাকবে
declare global {
  interface Window {
    Papa: any;
  }
}

// Type Definitions
type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Student = { id: number; name: string; roll_number: number; };
type AcademicYear = { academic_year: string };

export default function TeacherManageStudents() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');

  // ✅ Modal এবং Undo লজিকের জন্য State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // paparse লাইব্রেরি CDN থেকে লোড করা হচ্ছে
  useEffect(() => {
    const papaScript = document.createElement('script');
    papaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
    papaScript.async = true;
    papaScript.onload = () => setScriptsLoaded(true);
    document.body.appendChild(papaScript);
    return () => { document.body.removeChild(papaScript); };
  }, []);

  // এই useEffect শুধুমাত্র Academic Year আনার জন্য
  useEffect(() => {
    const fetchAcademicYears = async () => {
      const { data: yearData } = await supabase.rpc('get_distinct_academic_years');
      if (yearData && yearData.length > 0) {
        setAcademicYears(yearData);
        setSelectedYear(yearData[0].academic_year);
      }
    };
    fetchAcademicYears();
  }, []);

  // এই useEffect টি selectedYear পরিবর্তন হলেই ক্লাস তালিকা নতুন করে আনবে
  useEffect(() => {
    if (selectedYear) {
      const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*').eq('academic_year', selectedYear).order('name');
        setClasses(data || []);
      };
      fetchClasses();
      setSelectedClass('');
      setSelectedSection('');
      setSections([]);
      setStudents([]);
    }
  }, [selectedYear]);

  useEffect(() => {
    setSections([]);
    setSelectedSection('');
    setStudents([]);
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('sections').select('id, name').eq('class_id', selectedClass).order('name');
        setSections(data || []);
      };
      fetchSections();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSection && selectedYear) {
      const fetchStudents = async () => {
        let query = supabase.from('students')
          .select('id, name, roll_number')
          .eq('section_id', selectedSection)
          .eq('academic_year', selectedYear);

        if (searchQuery.trim() !== '') {
          if (!isNaN(Number(searchQuery))) {
            query = query.eq('roll_number', searchQuery);
          } else {
            query = query.ilike('name', `%${searchQuery}%`);
          }
        }
        const { data } = await query.order('roll_number', { ascending: true });
        setStudents(data || []);
      };
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedSection, selectedYear, searchQuery]);

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !selectedYear) {
      toast.error('Please select a section and academic year first.');
      return;
    }
    const { error } = await supabase.from('students').insert({
      name: newStudentName,
      roll_number: parseInt(newStudentRoll, 10),
      section_id: selectedSection,
      academic_year: selectedYear,
    });
    if (error) {
      toast.error(`Error adding student: ${error.message}`);
    } else {
      toast.success('Student added successfully!');
      setNewStudentName('');
      setNewStudentRoll('');
      const { data } = await supabase.from('students').select('id, name, roll_number').eq('section_id', selectedSection).eq('academic_year', selectedYear).order('roll_number');
      setStudents(data || []);
    }
  };

  const openDeleteModal = (id: number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const studentId = itemToDelete;
    const studentToDelete = students.find(s => s.id === studentId);
    if (!studentToDelete) return;

    setIsConfirmModalOpen(false);
    setStudents(prev => prev.filter(s => s.id !== studentId));

    const timeout = setTimeout(async () => {
      await supabase.from('students').delete().eq('id', studentId);
      toast.success(`"${studentToDelete.name}" was permanently deleted.`);
    }, 5000);

    toast.custom((t) => (
      <div style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span>Student "{studentToDelete.name}" deleted.</span>
        <button style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
          onClick={() => {
            clearTimeout(timeout);
            setStudents(prev => [...prev, studentToDelete].sort((a, b) => a.roll_number - b.roll_number));
            toast.success(`Restored "${studentToDelete.name}"`, { id: t.id, duration: 3000 });
          }}>
          Undo
        </button>
      </div>
    ), { duration: 5000, id: `delete-student-${studentId}` });
    
    setItemToDelete(null);
  };

  const downloadStudentListPDF = () => {
    const doc = new jsPDF();
    const className = classes.find(c => c.id === Number(selectedClass))?.name;
    const sectionName = sections.find(s => s.id === Number(selectedSection))?.name;
    autoTable(doc, {
      head: [["Roll No.", "Student Name"]],
      body: students.map(s => [s.roll_number, s.name]),
      didDrawPage: (data) => {
        doc.text(`Student List - ${className}, ${sectionName} (${selectedYear})`, data.settings.margin.left, 15);
      }
    });
    doc.save(`students_${selectedYear}_${className}_${sectionName}.pdf`);
  };

  const downloadStudentListExcel = () => {
    if (!scriptsLoaded) {
        toast.error('Excel library is loading, please try again in a moment.');
        return;
    }
    const className = classes.find(c => c.id === Number(selectedClass))?.name;
    const sectionName = sections.find(s => s.id === Number(selectedSection))?.name;
    const csvData = students.map(student => ({
      'Roll No.': student.roll_number,
      'Student Name': student.name,
    }));
    const csv = window.Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${selectedYear}_${className}_${sectionName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>← Back</button>
          <h1>Manage Students (Teacher)</h1>
        </header>
        <main className={styles.content}>
          <div className={styles.card}>
            <div className={styles.subCard}>
              <h2>Select Criteria</h2>
              <div className={styles.formGrid}>
                <div className={styles.selectWrapper}>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={styles.select}>
                    <option value="">-- Select Academic Year --</option>
                    {academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}
                  </select>
                  <FiChevronDown />
                </div>
                <div className={styles.selectWrapper}>
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={styles.select}>
                    <option value="">-- Select a Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <FiChevronDown />
                </div>
                <div className={styles.selectWrapper}>
                  <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={styles.select} disabled={!selectedClass}>
                    <option value="">-- Select a Section --</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <FiChevronDown />
                </div>
              </div>
            </div>

            <div className={styles.subCard}>
              <h2><FiSearch /> Search Students</h2>
              <div className={styles.formGrid}>
                <input 
                  type="text" 
                  placeholder="Search by Name or Roll..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
            
            {selectedSection && (
              <>
                <div className={styles.subCard}>
                  <h2>Add New Student to Section</h2>
                  <form onSubmit={handleAddStudent} className={styles.formGrid}>
                    <input type="text" className={styles.input} placeholder="Full Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required />
                    <input type="number" className={styles.input} placeholder="Roll Number" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} required />
                    <button type="submit" className={styles.actionButton}><FiUserPlus /> Add Student</button>
                  </form>
                </div>

                <div className={styles.subCard}>
                  <div className={styles.cardHeader}>
                    <h2>Student List</h2>
                    <div className={styles.exportButtons}>
                      <button onClick={downloadStudentListPDF}><FiFileText/> PDF</button>
                      <button onClick={downloadStudentListExcel} disabled={!scriptsLoaded}><FiGrid/> Excel</button>
                    </div>
                  </div>
                  <table className={styles.table}>
                    <thead><tr><th>Roll</th><th>Name</th><th>Actions</th></tr></thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.id}>
                          <td>{student.roll_number}</td>
                          <td>{student.name}</td>
                          <td>
                            <button onClick={() => openDeleteModal(student.id)} className={styles.deleteButton}><FiTrash2 /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <ConfirmationModal
          isOpen={isConfirmModalOpen}
          title="Confirm Deletion"
          message="Are you sure you want to delete this student?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmModalOpen(false)}
      />
    </>
  );
}