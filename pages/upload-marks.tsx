// pages/upload-marks.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css'; // Assuming this is for layout
import uploadStyles from '../styles/UploadMarks.module.css';
import type { User } from '@supabase/supabase-js';
import { FiLock } from 'react-icons/fi';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// টাইপ 정의
type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Exam = { id: number; name: string; };
type Subject = { id: number; name: string; };
type Student = { id: number; name: string; roll_number: number; };
type AcademicYear = { academic_year: string };

export default function UploadMarks() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [marks, setMarks] = useState<{ [key: number]: string }>({});
  const [fullMarks, setFullMarks] = useState('100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);

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

  // এই useEffect শুধুমাত্র Academic Year এবং Exam তালিকা আনার জন্য
  useEffect(() => {
    const fetchData = async () => {
      const { data: examData } = await supabase.from('exams').select('*');
      setExams(examData || []);
      
      const { data: yearData } = await supabase.rpc('get_distinct_academic_years');
      if (yearData && yearData.length > 0) {
        setAcademicYears(yearData);
        setSelectedYear(yearData[0].academic_year);
      }
    };
    fetchData();
  }, []);

  // এই useEffect টি selectedYear পরিবর্তন হলেই ক্লাস তালিকা নতুন করে আনবে
  useEffect(() => {
    if (selectedYear) {
      const fetchClasses = async () => {
        const { data: classData } = await supabase.from('classes').select('*').eq('academic_year', selectedYear).order('name');
        setClasses(classData || []);
      };
      fetchClasses();
      // Year পরিবর্তন হলে পরবর্তী সব সিলেকশন রিসেট হবে
      setSelectedClass('');
      setSelectedSection('');
      setSelectedSubject('');
      setStudents([]);
    }
  }, [selectedYear]);


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
    if (selectedSection && selectedYear) {
        const fetchStudents = async () => {
            const { data } = await supabase.from('students').select('*').eq('section_id', selectedSection).eq('academic_year', selectedYear).order('roll_number');
            setStudents(data || []);
        };
        fetchStudents();
    }
  }, [selectedSection, selectedYear]);

  useEffect(() => {
    const fetchLockAndMarks = async () => {
      if (selectedClass && selectedSection && selectedExam && selectedSubject && selectedYear) {
        const { data: lockData } = await supabase.from('exam_locks').select('is_locked').eq('class_id', selectedClass).eq('section_id', selectedSection).eq('exam_id', selectedExam).single();
        const locked = lockData ? lockData.is_locked : false;
        setIsLocked(locked);

        const { data: marksData } = await supabase.from('results')
            .select('student_id, marks_obtained, full_marks')
            .eq('exam_id', selectedExam)
            .eq('subject_id', selectedSubject)
            .eq('academic_year', selectedYear);
        
        if (marksData && marksData.length > 0) {
            const marksMap = marksData.reduce((acc, mark) => {
                if (mark.student_id) {
                    acc[mark.student_id] = mark.marks_obtained?.toString() || '';
                }
                return acc;
            }, {} as { [key: number]: string });
            setMarks(marksMap);
            setFullMarks(marksData[0].full_marks?.toString() || '100');
        } else {
            setMarks({});
        }
      }
    };
    fetchLockAndMarks();
  }, [selectedClass, selectedSection, selectedExam, selectedSubject, selectedYear]);


  const handleMarkChange = (studentId: number, value: string) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = async () => {
    if (!user || !selectedYear) return;
    setLoading(true);
    setMessage('');
    
    const recordsToUpsert = students.map(student => ({
      student_id: student.id,
      subject_id: selectedSubject,
      exam_id: selectedExam,
      marks_obtained: Number(marks[student.id]) || 0,
      full_marks: parseInt(fullMarks, 10) || 100,
      entered_by: user.id,
      academic_year: selectedYear,
    }));

    const { error } = await supabase.from('results').upsert(recordsToUpsert, {
      onConflict: 'student_id,subject_id,exam_id,academic_year'
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Marks saved successfully!');
    }
    setLoading(false);
  };
  
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    const className = classes.find(c => c.id == Number(selectedClass))?.name || 'N/A';
    const sectionName = sections.find(s => s.id == Number(selectedSection))?.name || 'N/A';
    const examName = exams.find(e => e.id == Number(selectedExam))?.name || 'N/A';
    const subjectName = subjects.find(s => s.id == Number(selectedSubject))?.name || 'N/A';

    doc.setFontSize(18);
    doc.text("A B C Academy", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text("Students Marks List", doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${examName} - ${selectedYear}`, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.line(20, 45, doc.internal.pageSize.getWidth() - 20, 45);
    doc.setFontSize(10);
    doc.text(`Class: ${className}`, 20, 55);
    doc.text(`Section: ${sectionName}`, 70, 55);
    doc.text(`Subject: ${subjectName}`, 120, 55);

    const tableColumn = ["SL No.", "Roll No.", "Student Name", "Total Marks", "Obtained Marks"];
    const tableRows = students.map((student, index) => [
        index + 1,
        student.roll_number,
        student.name,
        fullMarks,
        marks[student.id] || '0'
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
    });

    doc.save(`marks_${className}_${subjectName}.pdf`);
  };

  const handleDownloadExcel = () => {
    const dataForExcel = students.map((student, index) => ({
      'SL No.': index + 1,
      'Roll No.': student.roll_number,
      'Student Name': student.name,
      'Total Marks': parseInt(fullMarks, 10),
      'Obtained Marks': parseInt(marks[student.id] || '0', 10)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MarksList");
    
    const className = classes.find(c => c.id == Number(selectedClass))?.name || 'Class';
    const subjectName = subjects.find(s => s.id == Number(selectedSubject))?.name || 'Subject';
    XLSX.writeFile(workbook, `marks_${className}_${subjectName}_${selectedYear}.xlsx`);
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
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">Select Academic Year</option>
            {academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}
          </select>
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
            {isLocked && (
              <div className={uploadStyles.lockedMessage}>
                <FiLock />
                <p>Results for this examination are locked. Edits are not allowed.</p>
              </div>
            )}
            <div className={uploadStyles.cardHeader}>
                <h2>Enter Marks for {subjects.find(s => s.id == Number(selectedSubject))?.name}</h2>
                <div className={uploadStyles.fullMarksContainer}>
                    <label htmlFor="fullMarks">Full Marks:</label>
                    <input id="fullMarks" type="number" className={uploadStyles.fullMarksInput} value={fullMarks} onChange={(e) => setFullMarks(e.target.value)} disabled={isLocked} />
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
                        <input type="number" className={`${uploadStyles.markInput} ${isLocked ? uploadStyles.readOnlyInput : ''}`} value={marks[student.id] || ''} onChange={(e) => handleMarkChange(student.id, e.target.value)} disabled={isLocked} />
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
            <div className={uploadStyles.cardActions}>
              {!isLocked && (
                <button onClick={handleSaveMarks} disabled={loading} className={uploadStyles.saveButton}>
                  {loading ? 'Saving...' : 'Save Marks'}
                </button>
              )}
              <button onClick={handleDownloadPDF} className={uploadStyles.downloadButton}>Download PDF</button>
              <button onClick={handleDownloadExcel} className={uploadStyles.downloadButton}>Download Excel</button>
            </div>
            {message && <p className={uploadStyles.message}>{message}</p>}
          </div>
        )}
      </main>
    </div>
  );
}