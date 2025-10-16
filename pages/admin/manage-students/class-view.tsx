// pages/admin/manage-students/class-view.tsx

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import styles from '../../../styles/ManageStudents.module.css';
import { FiUserPlus, FiTrash2, FiChevronDown, FiFileText, FiGrid, FiSearch, FiEdit } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import EditStudentModal from '../../../components/ui/EditStudentModal';

// ✅ সমাধান ৩: createPagesServerClient ইম্পোর্ট করা হয়েছে
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { GetServerSidePropsContext } from 'next';
import { checkPermissionAndGetRole } from '../../../lib/permissions';

declare global {
  interface Window { Papa: any; }
}

// --- Type Definitions (অপরিবর্তিত) ---
type Class = { id: number; name:string; };
type Section = { id: number; name: string; };
type AcademicYear = { academic_year: string };
type Student = {
  id: number;
  name: string;
  student_unique_id: string;
  father_name: string | null;
  date_of_birth: string | null;
};
type StudentEnrollmentData = {
  id: number; // Enrollment ID
  roll_number: number;
  students: Student;
};

// ✅ সমাধান ১: PageProps থেকে 'userRole' সরানো হয়েছে কারণ এটি ব্যবহার করা হচ্ছিল না
type PageProps = {
  initialAcademicYears: AcademicYear[];
};

// ✅ সমাধান ১: কম্পোনেন্টের props থেকে 'userRole' সরানো হয়েছে
export default function ClassViewManageStudents({ initialAcademicYears }: PageProps) {
  const router = useRouter();
  
  // --- State Management ---
  // ✅ সমাধান ২: setAcademicYears সরানো হয়েছে কারণ এটি ব্যবহার করা হচ্ছিল না
  const [academicYears] = useState<AcademicYear[]>(initialAcademicYears);
  const [selectedYear, setSelectedYear] = useState<string>(
    initialAcademicYears.length > 0 ? initialAcademicYears[0].academic_year : ''
  );

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<StudentEnrollmentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentFatherName, setNewStudentFatherName] = useState('');
  const [newStudentDob, setNewStudentDob] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StudentEnrollmentData | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('criteria');
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentEnrollmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const papaScript = document.createElement('script');
    papaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
    papaScript.async = true;
    papaScript.onload = () => setScriptsLoaded(true);
    document.body.appendChild(papaScript);
    return () => { document.body.removeChild(papaScript); };
  }, []);

  const handleAccordionToggle = (accordionName: string) => {
    setOpenAccordion(prev => (prev === accordionName ? null : accordionName));
  };
  
  // ক্লায়েন্ট-সাইড ডেটা fetch করার বাকি লজিক অপরিবর্তিত
  useEffect(() => {
    if (selectedYear) {
      const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('id, name').eq('academic_year', selectedYear).order('name');
        setClasses(data || []);
      };
      fetchClasses();
      setSelectedClass(''); setSections([]); setSelectedSection(''); setStudents([]);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('sections').select('id, name').eq('class_id', selectedClass).order('name');
        setSections(data || []);
      };
      fetchSections();
      setSelectedSection('');
      setStudents([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedYear || !selectedClass || !selectedSection) {
        setStudents([]);
        return;
      }
      setIsLoading(true);
      try {
        let query = supabase.from('enrollments').select('id, roll_number, students(*)').eq('academic_year', selectedYear).eq('class_id', selectedClass).eq('section_id', selectedSection);
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
            query = query.ilike('students.name', `%${trimmedQuery}%`);
        }
        const { data, error } = await query.order('roll_number', { ascending: true });
        if (error) throw error;
        if (data) {
          const formattedData = data.map(enrollment => ({ ...enrollment, students: Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students })).filter(enrollment => enrollment.students);
          setStudents(formattedData as StudentEnrollmentData[]);
        }
      } catch (error: any) {
        toast.error(`Failed to fetch students: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceFetch = setTimeout(fetchStudents, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedYear, selectedClass, selectedSection, searchQuery]);

  // হ্যান্ডলার ফাংশনগুলো অপরিবর্তিত
  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedSection || !selectedYear) {
      toast.error('Please select a class, section and academic year first.'); return;
    }
    const toastId = toast.loading('Adding new student...');
    try {
      const { data: studentData, error: studentError } = await supabase.from('students').insert({ name: newStudentName, father_name: newStudentFatherName || null, date_of_birth: newStudentDob || null, admission_date: new Date().toISOString() }).select().single();
      if (studentError) throw studentError;
      const { data: enrollmentData, error: enrollmentError } = await supabase.from('enrollments').insert({ student_id: studentData.id, class_id: selectedClass, section_id: selectedSection, academic_year: selectedYear, roll_number: parseInt(newStudentRoll, 10), status: 'New Admission' }).select().single();
      if (enrollmentError) throw enrollmentError;

      const newStudentEntry: StudentEnrollmentData = { id: enrollmentData.id, roll_number: enrollmentData.roll_number, students: studentData };
      setStudents(prev => [...prev, newStudentEntry].sort((a,b) => a.roll_number - b.roll_number));

      toast.success(`Student "${newStudentName}" added successfully!`, { id: toastId });
      setNewStudentName(''); setNewStudentRoll(''); setNewStudentFatherName(''); setNewStudentDob(''); setShowMoreDetails(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  const openDeleteModal = (enrollmentData: StudentEnrollmentData) => {
    setItemToDelete(enrollmentData); setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const enrollmentToDelete = itemToDelete;
    setIsConfirmModalOpen(false);
    setStudents(prev => prev.filter(s => s.id !== enrollmentToDelete.id));
    const timeout = setTimeout(async () => {
      await supabase.from('enrollments').delete().eq('id', enrollmentToDelete.id);
      toast.success(`"${enrollmentToDelete.students.name}" was permanently deleted.`);
    }, 5000);

    toast.custom((t) => (
      <div className={styles.undoToast}>
        <span>"{enrollmentToDelete.students.name}" deleted.</span>
        <button
          className={styles.undoButton}
          onClick={() => {
            clearTimeout(timeout);
            setStudents(prev => [...prev, enrollmentToDelete].sort((a, b) => a.roll_number - b.roll_number));
            toast.dismiss(t.id);
            toast.success(`Restored "${enrollmentToDelete.students.name}"`);
          }}
        >
          Undo
        </button>
      </div>
    ), {
      duration: 5000,
      id: `delete-student-${enrollmentToDelete.id}`
    });
    setItemToDelete(null);
  };

  const handleOpenEditModal = (studentData: StudentEnrollmentData) => {
    setStudentToEdit(studentData);
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (updatedData: { name: string, roll_number: number, father_name: string, date_of_birth: string }) => {
    if (!studentToEdit) return;
    const toastId = toast.loading('Updating student...');
    try {
      const { data: updatedStudent, error: studentError } = await supabase.from('students').update({ name: updatedData.name, father_name: updatedData.father_name, date_of_birth: updatedData.date_of_birth }).eq('id', studentToEdit.students.id).select().single();
      if (studentError) throw studentError;
      const { data: updatedEnrollment, error: enrollmentError } = await supabase.from('enrollments').update({ roll_number: updatedData.roll_number }).eq('id', studentToEdit.id).select().single();
      if (enrollmentError) throw enrollmentError;

      setStudents(prev => prev.map(s => 
        s.id === studentToEdit.id 
        ? { ...s, roll_number: updatedEnrollment.roll_number, students: updatedStudent } 
        : s
      ).sort((a,b) => a.roll_number - b.roll_number));

      toast.success('Student updated successfully!', { id: toastId });
      setIsEditModalOpen(false);
      setStudentToEdit(null);
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`, { id: toastId });
    }
  };

  const downloadStudentListPDF = () => {
    const doc = new jsPDF();
    const className = classes.find(c => c.id === Number(selectedClass))?.name;
    const sectionName = sections.find(s => s.id === Number(selectedSection))?.name;

    doc.setFontSize(20);doc.setFont('helvetica', 'bold');
    doc.text('ABC Academy', 105, 13, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Student List: ${className},  ${sectionName} (${selectedYear})`, 105, 18, { align: 'center' });

    const tableColumn = ["Sl. No.", "Name", "Roll", "Student ID", "Remarks"];
    const tableRows = students.map((s, index) => [index + 1, s.students.name, s.roll_number, s.students.student_unique_id, '']);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: (10), textColor: [0, 0, 0], cellPadding: 2, valign: 'middle', fontStyle: 'normal', lineWidth: 0.3, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10, lineColor: [0, 0, 0] },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 60 }, 2: { cellWidth: 10 }, 3: { cellWidth: 25 }, 4: { cellWidth: 'auto' } },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          doc.text('ABC Academy', 105, 13, { align: 'center' });
          doc.text(`Student List - ${className}, ${sectionName} (${selectedYear})`, 105, 18, { align: 'center' });
        }
      }
    });
    doc.save(`students_${selectedYear}_${className}_${sectionName || 'all'}.pdf`);
  };

  const downloadStudentListExcel = () => {
    if (!scriptsLoaded) {
      toast.error('Excel library is loading, please try again.');
      return;
    }
    const className = classes.find(c => c.id === Number(selectedClass))?.name;
    const sectionName = sections.find(s => s.id === Number(selectedSection))?.name;
    const csvData = students.map(s => ({ 'Roll No.': s.roll_number, 'Student Name': s.students.name, 'Student ID': s.students.student_unique_id, "Father's Name": s.students.father_name || 'N/A', 'Date of Birth': s.students.date_of_birth || 'N/A' }));
    const csv = window.Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${selectedYear}_${className}_${sectionName || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmationMessage = itemToDelete ? `Are you sure you want to delete "${itemToDelete.students.name}"?` : "Are you sure you want to delete this enrollment?";

  // JSX অপরিবর্তিত
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin/manage-students')} className={styles.backButton}>← Back to Hub</button>
        <h1>Add & View Students by Class</h1>
      </header>
      <main className={styles.content}>
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => handleAccordionToggle('criteria')}>
            <h3>Manage & View Students</h3>
            <FiChevronDown className={`${styles.chevronIcon} ${openAccordion === 'criteria' ? styles.rotated : ''}`} />
          </div>
          {openAccordion === 'criteria' && (
            <div className={styles.accordionContent}>
              <div className={styles.subCard}>
                <h4>Select Criteria</h4>
                <div className={styles.formGrid}>
                  <div className={styles.selectWrapper}><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={styles.select}><option value="">-- Select Year --</option>{academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}</select><FiChevronDown /></div>
                  <div className={styles.selectWrapper}><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={styles.select}><option value="">-- Select Class --</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><FiChevronDown /></div>
                  <div className={styles.selectWrapper}><select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={styles.select} disabled={!selectedClass}><option value="">-- Select Section --</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><FiChevronDown /></div>
                </div>
              </div>
              <div className={styles.subCard}>
                <h4><FiSearch /> Search Students</h4>
                <div className={styles.formGrid}><input type="text" placeholder="Search by Name, Roll, or Student ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.input} disabled={!selectedSection}/></div>
              </div>

              {selectedSection && (
                <div className={styles.subCard}>
                    <h4>Add New Student</h4>
                    <form onSubmit={handleAddStudent} className={styles.addStudentForm}>
                      <div className={styles.formGrid}><input type="text" className={styles.input} placeholder="Full Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required /><input type="number" className={styles.input} placeholder="Roll Number" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} required /></div>
                      <div className={`${styles.moreDetailsContainer} ${showMoreDetails ? styles.show : ''}`}><div className={styles.formGrid}><input type="text" className={styles.input} placeholder="Father's Name" value={newStudentFatherName} onChange={(e) => setNewStudentFatherName(e.target.value)} /><input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} placeholder="Select Date of Birth" className={styles.input} value={newStudentDob} onChange={(e) => setNewStudentDob(e.target.value)} /></div></div>
                      <div className={styles.formActions}><button type="button" className={styles.toggleDetailsButton} onClick={() => setShowMoreDetails(!showMoreDetails)}>{showMoreDetails ? 'Hide Details' : 'Add More Details'} <FiChevronDown className={showMoreDetails ? styles.rotated : ''}/></button><button type="submit" className={styles.actionButton}><FiUserPlus /> Add Student</button></div>
                    </form>
                </div>
              )}

              {selectedSection && (
                <div className={styles.subCard}>
                  {isLoading ? (
                    <p className={styles.noStudentsMessage}>Loading students...</p>
                  ) : students.length > 0 ? (
                    <>
                      <div className={styles.cardHeader}>
                        <h4>Student List <span className={styles.studentCount}>({students.length} Total)</span></h4>
                        <div className={styles.exportButtons}>
                            <button onClick={downloadStudentListPDF} className={styles.actionButton}><FiFileText/> PDF</button>
                            <button onClick={downloadStudentListExcel} disabled={!scriptsLoaded} className={styles.actionButton}><FiGrid/> Excel</button>
                        </div>
                      </div>
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Roll</th><th>Name</th><th>Student ID</th><th>Father's Name</th><th>Date of Birth</th><th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map(enrollment => (
                              <tr key={enrollment.id}>
                                <td>{enrollment.roll_number}</td><td>{enrollment.students.name}</td><td>{enrollment.students.student_unique_id}</td><td>{enrollment.students.father_name || 'N/A'}</td><td>{enrollment.students.date_of_birth || 'N/A'}</td>
                                <td className={styles.actionCell}>
                                  <button onClick={() => handleOpenEditModal(enrollment)} className={styles.editButton} title="Edit Student"><FiEdit /></button>
                                  <button onClick={() => openDeleteModal(enrollment)} className={styles.deleteButton} title="Delete Enrollment"><FiTrash2 /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className={styles.noStudentsMessage}>No students found for the selected criteria. You can add one using the form above.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <ConfirmationModal isOpen={isConfirmModalOpen} title="Confirm Deletion" message={confirmationMessage} onConfirm={handleConfirmDelete} onCancel={() => setIsConfirmModalOpen(false)} />
      {isEditModalOpen && studentToEdit && (
        <EditStudentModal isOpen={isEditModalOpen} studentData={studentToEdit} onSave={handleUpdateStudent} onCancel={() => setIsEditModalOpen(false)} />
      )}
    </div>
  );
}

// getServerSideProps ফাংশন অপরিবর্তিত
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const permissionResult = await checkPermissionAndGetRole(context);

  if ('redirect' in permissionResult) {
    return permissionResult;
  }
  
  const supabase = createPagesServerClient(context);
  const { data: years } = await supabase.rpc('get_distinct_academic_years');

  return {
    props: {
      ...permissionResult.props,
      initialAcademicYears: years || [],
    },
  };
}