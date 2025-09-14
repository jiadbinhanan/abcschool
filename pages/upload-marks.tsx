// pages/upload-marks.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';
import uploadStyles from '../styles/UploadMarks.module.css';
import type { User } from '@supabase/supabase-js';

// Define types for our data
type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Exam = { id: number; name: string; };
type Subject = { id: number; name: string; };
type Student = { id: number; name: string; roll_number: number; };

export default function UploadMarks() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [marks, setMarks] = useState<{ [key: number]: string }>({});
  const [fullMarks, setFullMarks] = useState('100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
            router.push('/');
        } else {
            setUser(session.user);
        }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: classData } = await supabase.from('classes').select('*');
      setClasses(classData || []);
      const { data: examData } = await supabase.from('exams').select('*');
      setExams(examData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const fetchSectionsAndSubjects = async () => {
        const { data: sectionsData } = await supabase.from('sections').select('*').eq('class_id', selectedClass);
        setSections(sectionsData || []);
        const { data: subjectsData } = await supabase.from('subjects').select('*').eq('class_id', selectedClass);
        setSubjects(subjectsData || []);
      };
      fetchSectionsAndSubjects();
      setSelectedSection('');
      setSelectedSubject('');
      setStudents([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSection) {
        const fetchStudents = async () => {
            const { data } = await supabase.from('students').select('*').eq('section_id', selectedSection).order('roll_number');
            setStudents(data || []);
        };
        fetchStudents();
    }
  }, [selectedSection]);

  const handleMarkChange = (studentId: number, value: string) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = async () => {
    if (!user) {
        setMessage('Error: User not found. Please log in again.');
        return;
    }
    setLoading(true);
    setMessage('');
    
    const recordsToUpsert = students.map(student => ({
      student_id: student.id,
      subject_id: selectedSubject,
      exam_id: selectedExam,
      marks_obtained: marks[student.id] || 0,
      full_marks: parseInt(fullMarks, 10) || 100,
      entered_by: user.id,
    }));

    const { error } = await supabase.from('results').upsert(recordsToUpsert, {
      onConflict: 'student_id,subject_id,exam_id'
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Marks saved successfully!');
    }
    setLoading(false);
  };

  if (!user) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={uploadStyles.pageContainer}>
      <header className={uploadStyles.header}>
        <button onClick={() => router.push('/dashboard')} className={uploadStyles.backButton}>← Back to Dashboard</button>
        <h1>Upload Marks</h1>
      </header>
      
      <main className={uploadStyles.content}>
        <div className={uploadStyles.selectorGrid}>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedClass}>
            <option value="">Select Section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="">Select Exam</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {selectedSection && selectedExam && selectedSubject && students.length > 0 && (
            <div className={uploadStyles.marksCard}>
                <div className={uploadStyles.cardHeader}>
                    <h2>Enter Marks for {subjects.find(s => s.id == Number(selectedSubject))?.name}</h2>
                    <div className={uploadStyles.fullMarksContainer}>
                        <label htmlFor="fullMarks">Full Marks:</label>
                        <input
                        id="fullMarks"
                        type="number"
                        className={uploadStyles.fullMarksInput}
                        value={fullMarks}
                        onChange={(e) => setFullMarks(e.target.value)}
                        />
                    </div>
                </div>
                <table className={uploadStyles.marksTable}>
                    <thead>
                        <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Marks Obtained (out of {fullMarks || 'N/A'})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.roll_number}</td>
                            <td>{student.name}</td>
                            <td>
                            <input 
                                type="number" 
                                className={uploadStyles.markInput}
                                value={marks[student.id] || ''}
                                onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={handleSaveMarks} disabled={loading} className={uploadStyles.saveButton}>
                    {loading ? 'Saving...' : 'Save Marks'}
                </button>
                {message && <p className={uploadStyles.message}>{message}</p>}
            </div>
        )}
      </main>
    </div>
  );
}
