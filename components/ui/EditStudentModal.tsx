// components/ui/EditStudentModal.tsx
import { useState, useEffect } from 'react';
import styles from '../../styles/ManageStudents.module.css'; // আমরা একই স্টাইল ব্যবহার করব

type Student = {
  id: number;
  name: string;
  student_unique_id: string;
  father_name: string | null;
  date_of_birth: string | null;
};
type StudentEnrollmentData = {
  id: number;
  roll_number: number;
  students: Student;
};

type Props = {
  isOpen: boolean;
  studentData: StudentEnrollmentData;
  onSave: (updatedData: { name: string, roll_number: number, father_name: string, date_of_birth: string }) => void;
  onCancel: () => void;
};

export default function EditStudentModal({ isOpen, studentData, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('');

  useEffect(() => {
    if (studentData) {
      setName(studentData.students.name);
      setRoll(studentData.roll_number.toString());
      setFatherName(studentData.students.father_name || '');
      // Supabase থেকে আসা yyyy-mm-dd ফরম্যাট ঠিক রাখা
      setDob(studentData.students.date_of_birth || '');
    }
  }, [studentData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      roll_number: parseInt(roll, 10),
      father_name: fatherName,
      date_of_birth: dob
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Edit Student: {studentData.students.name}</h2>
        <p>Student ID: {studentData.students.student_unique_id}</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Student Name" required className={styles.input}/>
            <input type="number" value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="Roll Number" required className={styles.input}/>
          </div>
          <div className={styles.formGrid}>
            <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Father's Name" className={styles.input}/>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={styles.input}/>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>Cancel</button>
            <button type="submit" className={styles.actionButton}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}