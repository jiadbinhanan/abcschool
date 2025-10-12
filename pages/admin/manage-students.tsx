// pages/admin/manage-students.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../../styles/ManageStudents.module.css';
import permissionStyles from '../../styles/Permissions.module.css';
import { FiUserPlus, FiTrash2, FiChevronDown, FiFileText, FiGrid, FiSearch, FiEdit } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import EditStudentModal from '../../components/ui/EditStudentModal';

declare global {
  interface Window { Papa: any; }
}

// Type Definitions (অপরিবর্তিত)
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

// --- Permission Toggle Component (অপরিবর্তিত) ---
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


// --- Main ManageStudents Component for Admin ---
export default function AdminManageStudents() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
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

  // বাকি কোড অপরিবর্তিত...
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
  
    useEffect(() => {
    const fetchAcademicYears = async () => {
      const { data: yearData } = await supabase.rpc('get_distinct_academic_years');
      if (yearData && yearData.length > 0) {
        setAcademicYears(yearData);
        if(!selectedYear) setSelectedYear(yearData[0].academic_year);
      }
    };
    fetchAcademicYears();
  }, []);

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
      setSelectedSection(''); setStudents([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSection || !selectedYear) {
        setStudents([]);
        return;
      }
      let query = supabase.from('enrollments').select('id, roll_number, students(id, name, student_unique_id, father_name, date_of_birth)').eq('section_id', selectedSection).eq('academic_year', selectedYear);
      
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery) {
        const searchOn = trimmedQuery.toUpperCase().startsWith('ABC') ? 'student_unique_id' : 'name';
        query = query.ilike(`students.${searchOn}`, `%${trimmedQuery}%`);
      }
      
      const { data, error } = await query.order('roll_number', { ascending: true });

      if (error) { 
        toast.error('Failed to fetch students.'); 
      } else if (data) {
        const formattedData = data.map(enrollment => ({
          ...enrollment,
          students: Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students
        })).filter(enrollment => enrollment.students); 

        setStudents(formattedData as StudentEnrollmentData[]); 
      }
    };
    const debounceFetch = setTimeout(fetchStudents, 300);
    return () => clearTimeout(debounceFetch);
  }, [selectedSection, selectedYear, searchQuery]);

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
      
      const newStudentEntry: StudentEnrollmentData = {
        id: enrollmentData.id,
        roll_number: enrollmentData.roll_number,
        students: studentData
      };
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
      const { data: updatedStudent, error: studentError } = await supabase
        .from('students')
        .update({ name: updatedData.name, father_name: updatedData.father_name, date_of_birth: updatedData.date_of_birth })
        .eq('id', studentToEdit.students.id)
        .select()
        .single();
      if (studentError) throw studentError;
        
      const { data: updatedEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .update({ roll_number: updatedData.roll_number })
        .eq('id', studentToEdit.id)
        .select()
        .single();
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ABC Academy', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Student List - Class: ${className}, Section: ${sectionName} (${selectedYear})`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const tableHead = [['SL No.', 'Name', 'Roll No.', 'Student ID', 'Remarks']];
    const tableBody = students.map((s, index) => [
      index + 1,
      s.students.name,
      s.roll_number,
      s.students.student_unique_id,
      ''
    ]);

    // ### পরিবর্তন শুরু ###
    // এখানে টেবিলের বর্ডার বা ছক যোগ করার জন্য `theme`, `lineWidth` এবং `lineColor` যোগ করা হয়েছে।
    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 30,
      theme: 'grid', // এই অপশনটি টেবিলের বর্ডার তৈরি করে।
      styles: {
        lineWidth: 0.1, // বর্ডারের লাইন কতটা মোটা হবে
        lineColor: [44, 62, 80], // বর্ডারের রঙ (dark grey)
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [230, 230, 230],
        textColor: 20
      },
      columnStyles: {
        0: { cellWidth: 10 }, // SL No.
        1: { cellWidth: 60 }, 
        2: { cellWidth: 10 }, // Roll No.
        3: { cellWidth: 25 }, // Student ID কলামের প্রস্থ কমানো হয়েছে
        4: { cellWidth: 'auto' }
      }
    });
    // ### পরিবর্তন শেষ ###

    doc.save(`students_${selectedYear}_${className}_${sectionName}.pdf`);
  };
  

  const downloadStudentListExcel = () => {
    if (!scriptsLoaded) {
      toast.error('Excel library is loading, please try again.');
      return;
    }
    const className = classes.find(c => c.id === Number(selectedClass))?.name;
    const sectionName = sections.find(s => s.id === Number(selectedSection))?.name;
    const csvData = students.map(s => ({
        'Roll No.': s.roll_number,
        'Student Name': s.students.name,
        'Student ID': s.students.student_unique_id,
        "Father's Name": s.students.father_name || 'N/A',
        'Date of Birth': s.students.date_of_birth || 'N/A'
    }));
    const csv = window.Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${selectedYear}_${className}_${sectionName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
    const confirmationMessage = itemToDelete
    ? `Are you sure you want to delete "${itemToDelete.students.name}"?`
    : "Are you sure you want to delete this enrollment?";

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>← Back</button>
        <h1>Manage Students (Admin)</h1>
      </header>
      <main className={styles.content}>
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => handleAccordionToggle('permissions')}>
            <h3>Teacher Access Control</h3>
            <FiChevronDown className={`${styles.chevronIcon} ${openAccordion === 'permissions' ? styles.rotated : ''}`} />
          </div>
          {openAccordion === 'permissions' && (
            <div className={styles.accordionContent}><TeacherPermissionToggle /></div>
          )}
        </div>

        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => handleAccordionToggle('criteria')}>
            <h3>Manage & View Students</h3>
            <FiChevronDown className={`${styles.chevronIcon} ${openAccordion === 'criteria' ? styles.rotated : ''}`} />
          </div>
          {openAccordion === 'criteria' && (
            <div className={styles.accordionContent}>
              <div className={styles.subCard}>
                <h4>Select Criteria</h4>
                <div className={styles.formGrid}><div className={styles.selectWrapper}><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={styles.select}><option value="">-- Select Year --</option>{academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}</select><FiChevronDown /></div><div className={styles.selectWrapper}><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={styles.select}><option value="">-- Select Class --</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><FiChevronDown /></div><div className={styles.selectWrapper}><select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={styles.select} disabled={!selectedClass}><option value="">-- Select Section --</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><FiChevronDown /></div></div>
              </div>
              
              <div className={styles.subCard}>
                <h4><FiSearch /> Search Students</h4>
                <div className={styles.formGrid}><input type="text" placeholder="Search by Name, Roll, or Student ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.input}/></div>
              </div>

              {selectedSection && (
                <>
                  <div className={styles.subCard}>
                    <h4>Add New Student</h4>
                    <form onSubmit={handleAddStudent} className={styles.addStudentForm}><div className={styles.formGrid}><input type="text" className={styles.input} placeholder="Full Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required /><input type="number" className={styles.input} placeholder="Roll Number" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} required /></div><div className={`${styles.moreDetailsContainer} ${showMoreDetails ? styles.show : ''}`}><div className={styles.formGrid}><input type="text" className={styles.input} placeholder="Father's Name" value={newStudentFatherName} onChange={(e) => setNewStudentFatherName(e.target.value)} /><input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} placeholder="Select Date of Birth" className={styles.input} value={newStudentDob} onChange={(e) => setNewStudentDob(e.target.value)} /></div></div><div className={styles.formActions}><button type="button" className={styles.toggleDetailsButton} onClick={() => setShowMoreDetails(!showMoreDetails)}>{showMoreDetails ? 'Hide Details' : 'Add More Details'} <FiChevronDown className={showMoreDetails ? styles.rotated : ''}/></button><button type="submit" className={styles.actionButton}><FiUserPlus /> Add Student</button></div></form>
                  </div>
                  
                  <div className={styles.subCard}>
                    <div className={styles.cardHeader}>
                      <h4>Student List ({students.length} {students.length === 1 ? 'student' : 'students'})</h4>
                      <div className={styles.exportButtons}>
                        <button onClick={downloadStudentListPDF}><FiFileText/> PDF</button>
                        <button onClick={downloadStudentListExcel} disabled={!scriptsLoaded}><FiGrid/> Excel</button>
                      </div>
                    </div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead><tr><th>Roll</th><th>Name</th><th>Student ID</th><th>Father's Name</th><th>Actions</th></tr></thead>
                        <tbody>
                          {students.map(enrollment => (
                            <tr key={enrollment.id}>
                              <td>{enrollment.roll_number}</td>
                              <td>{enrollment.students.name}</td>
                              <td>{enrollment.students.student_unique_id}</td>
                              <td>{enrollment.students.father_name || 'N/A'}</td>
                              <td className={styles.actionCell}><button onClick={() => handleOpenEditModal(enrollment)} className={styles.editButton} title="Edit Student"><FiEdit /></button><button onClick={() => openDeleteModal(enrollment)} className={styles.deleteButton} title="Delete Enrollment"><FiTrash2 /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal isOpen={isConfirmModalOpen} title="Confirm Deletion" message={confirmationMessage} onConfirm={handleConfirmDelete} onCancel={() => setIsConfirmModalOpen(false)} />
      
      {isEditModalOpen && studentToEdit && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          studentData={studentToEdit}
          onSave={handleUpdateStudent}
          onCancel={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}