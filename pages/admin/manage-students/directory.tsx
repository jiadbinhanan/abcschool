// pages/admin/manage-students/directory.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // ক্লায়েন্ট-সাইড আপডেটের জন্য এটি থাকবে
import { useRouter } from 'next/router';
import styles from '../../../styles/ManageStudents.module.css';
import { toast } from 'react-hot-toast';
import { FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import EditStudentModal from '../../../components/ui/EditStudentModal';

// ✅ ধাপ ১: getServerSideProps এবং পারমিশন চেকার ইম্পোর্ট করা
import type { GetServerSidePropsContext } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { checkPermissionAndGetRole } from '../../../lib/permissions';

// --- Type Definitions (অপরিবর্তিত) ---
type Student = {
  id: number;
  name: string;
  student_unique_id: string;
  father_name: string | null;
  date_of_birth: string | null;
};
type StudentWithEnrollments = Student & {
  enrollments: { id: number }[];
  isEnrolled: boolean;
};
type StudentEnrollmentData = {
  id: number;
  roll_number: number;
  students: Student;
};

// ✅ ধাপ ২: PageProps টাইপ ডিফাইন করা
type PageProps = {
  initialStudents: StudentWithEnrollments[];
  userRole: 'admin' | 'teacher';
};


export default function StudentDirectory({ initialStudents, }: PageProps) {
  const router = useRouter();

  // ✅ ধাপ ৩: State গুলো এখন props থেকে ইনিশিয়ালাইজ করা হচ্ছে
  const [allStudents, setAllStudents] = useState<StudentWithEnrollments[]>(initialStudents);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithEnrollments[]>(initialStudents);

  // বাকি state গুলো অপরিবর্তিত
  const [searchQuery, setSearchQuery] = useState('');
  const [showMistakeEntries, setShowMistakeEntries] = useState(false);
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentWithEnrollments | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentEnrollmentData | null>(null);

  // ❌ ধাপ ৪: প্রাথমিক ডেটা fetch করার জন্য যে useEffect ছিল, সেটি সরিয়ে ফেলা হয়েছে

  // ফিল্টারিং এর জন্য useEffect টি অপরিবর্তিত থাকবে
  useEffect(() => {
    let results = allStudents;
    if (showMistakeEntries) {
      results = allStudents.filter(s => !s.isEnrolled);
    }
    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.trim().toLowerCase();
      results = results.filter(s => s.name.toLowerCase().includes(lowercasedQuery) || s.student_unique_id.toLowerCase().includes(lowercasedQuery));
    }
    setFilteredStudents(results);
  }, [searchQuery, showMistakeEntries, allStudents]);

  // হ্যান্ডলার ফাংশনগুলো অপরিবর্তিত
  const openPermanentDeleteModal = (student: StudentWithEnrollments) => {
    setStudentToDelete(student);
    setIsPermanentDeleteModalOpen(true);
  };

  const handlePermanentDelete = async () => {
    if (!studentToDelete) return;
    const studentIdToDelete = studentToDelete.id;
    const studentName = studentToDelete.name;
    const toastId = toast.loading(`Permanently deleting ${studentName}...`);

    const { error } = await supabase.from('students').delete().eq('id', studentIdToDelete);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { id: toastId });
    } else {
      setAllStudents(prev => prev.filter(s => s.id !== studentIdToDelete));
      toast.success(`"${studentName}" deleted permanently.`, { id: toastId });
    }
    setIsPermanentDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const handleOpenEditModal = (student: StudentWithEnrollments) => {
    const studentDataForModal: StudentEnrollmentData = {
        id: -1, 
        roll_number: 0, 
        students: {
            id: student.id,
            name: student.name,
            student_unique_id: student.student_unique_id,
            father_name: student.father_name,
            date_of_birth: student.date_of_birth
        }
    };
    setStudentToEdit(studentDataForModal);
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (updatedData: { name: string, father_name: string, date_of_birth: string, roll_number: number }) => {
    if (!studentToEdit) return;
    const toastId = toast.loading('Updating student...');

    try {
      const { data: updatedStudent, error } = await supabase
        .from('students')
        .update({ name: updatedData.name, father_name: updatedData.father_name, date_of_birth: updatedData.date_of_birth })
        .eq('id', studentToEdit.students.id)
        .select()
        .single();
      if (error) throw error;

      setAllStudents(prev => prev.map(s => s.id === updatedStudent.id ? { ...s, ...updatedStudent } : s));

      toast.success('Student updated successfully!', { id: toastId });
      setIsEditModalOpen(false);
      setStudentToEdit(null);
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`, { id: toastId });
    }
  };

  const permanentDeleteMessage = `Are you sure you want to permanently delete "${studentToDelete?.name}"? This will delete the student and ALL their academic records. This action cannot be undone.`;

  // --- JSX Rendering (অপরিবর্তিত) ---
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin/manage-students')} className={styles.backButton}>← Back to Hub</button>
        <h1>Student Directory</h1>
      </header>
      <main className={styles.content}>
        <div className={styles.subCard}>
          <h4>Find Students</h4>
          <div className={styles.directoryControls}>
            <div className={styles.searchWrapper}>
              <FiSearch />
              <input type="text" placeholder="Search by Name or Student ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.input} />
            </div>
            <button onClick={() => setShowMistakeEntries(!showMistakeEntries)} className={`${styles.actionButton} ${showMistakeEntries ? styles.activeToggle : ''}`}>{showMistakeEntries ? "Show All Students" : "Find Mistake Entries"}</button>
          </div>
          {showMistakeEntries && <p className={styles.infoText}>Showing students who have NO enrollment records. These can be safely deleted.</p>}
        </div>

        <div className={styles.subCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Student ID</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.student_unique_id}</td>
                    <td><span className={student.isEnrolled ? styles.statusEnrolled : styles.statusNotEnrolled}>{student.isEnrolled ? 'Enrolled' : 'Not Enrolled'}</span></td>
                    <td className={styles.actionCell}>
                      <button onClick={() => handleOpenEditModal(student)} className={styles.editButton} title="Edit Student"><FiEdit /></button>
                      <button onClick={() => openPermanentDeleteModal(student)} className={styles.permanentDeleteButton} title="Delete Permanently"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ConfirmationModal 
        isOpen={isPermanentDeleteModalOpen} 
        title="⚠️ PERMANENT DELETION ⚠️" 
        message={permanentDeleteMessage} 
        onConfirm={handlePermanentDelete} 
        onCancel={() => setIsPermanentDeleteModalOpen(false)} 
      />

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

// ✅ ধাপ ৫: getServerSideProps ফাংশন যোগ করা
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // পারমিশন চেক করা হচ্ছে
  const permissionResult = await checkPermissionAndGetRole(context);
  if ('redirect' in permissionResult) {
    return permissionResult;
  }

  // সার্ভার-সাইড Supabase ক্লায়েন্ট তৈরি করা হচ্ছে
  const supabase = createPagesServerClient(context);

  // ছাত্রছাত্রীদের ডেটা আনা হচ্ছে
  const { data, error } = await supabase.from('students').select(`id, name, student_unique_id, father_name, date_of_birth, enrollments (id)`);

  let initialStudents: StudentWithEnrollments[] = [];
  if (!error && data) {
    // ডেটা প্রসেস করা হচ্ছে
    initialStudents = data.map(student => ({
      ...student,
      isEnrolled: student.enrollments.length > 0,
    }));
  } else if (error) {
    console.error("Error fetching students in SSR:", error.message);
  }

  // প্রপস হিসেবে ডেটা পাঠানো হচ্ছে
  return {
    props: {
      ...permissionResult.props, // এটা userRole প্রপটিকে পাস করবে
      initialStudents,
    },
  };
}