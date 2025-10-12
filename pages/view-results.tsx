// pages/view-results.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import manageStyles from '../styles/Manage.module.css';
import resultsStyles from '../styles/Results.module.css';
import { FiEye, FiFileText, FiGrid, FiChevronDown, FiZap } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import Marksheet from '../components/Marksheet';
// Unused 'User' type import is removed.

// Define Types
type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Exam = { id: number; name: string; };
type Result = { student_id: number; student_name: string; roll_number: number; marks_obtained: number; full_marks: number; subject_id: number; subject_name: string; };
type StudentResult = { 
  student_id: number; 
  student_name: string; 
  roll_number: number; 
  total_marks: number; 
  total_full_marks: number; 
  percentage: number; 
  subjects: Result[];
  class_name: string;
  section_name: string;
  exam_name: string;
};

export default function ViewResults() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if(session) {
            const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
            if(roleData?.role === 'admin') {
                setIsAdmin(true);
            }
        } else {
            router.push('/');
        }
        setLoading(false);
    };
    checkUserRole();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: classData } = await supabase.from('classes').select('*').order('name');
      setClasses(classData || []);
      const { data: examData } = await supabase.from('exams').select('*').order('name');
      setExams(examData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('sections').select('*').eq('class_id', selectedClass).order('name');
        setSections(data || []);
      };
      fetchSections();
      setResults([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedExam) {
      const fetchResults = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('detailed_results').select('*')
          .eq('section_id', selectedSection)
          .eq('exam_id', selectedExam);
        
        if (data) {
          const className = classes.find(c => c.id === Number(selectedClass))?.name || '';
          const sectionName = sections.find(s => s.id === Number(selectedSection))?.name || '';
          const examName = exams.find(e => e.id === Number(selectedExam))?.name || '';
          const groupedByStudent = data.reduce((acc, curr: Result) => {
            acc[curr.student_id] = acc[curr.student_id] || { 
              student_id: curr.student_id, student_name: curr.student_name, roll_number: curr.roll_number,
              total_marks: 0, total_full_marks: 0, subjects: [] 
            };
            acc[curr.student_id].subjects.push(curr);
            acc[curr.student_id].total_marks += curr.marks_obtained;
            acc[curr.student_id].total_full_marks += curr.full_marks;
            return acc;
          }, {});
          const finalResults = Object.values(groupedByStudent).map((student: any) => ({
            ...student,
            percentage: parseFloat(((student.total_marks / student.total_full_marks) * 100).toFixed(2)) || 0,
            class_name: className,
            section_name: sectionName,
            exam_name: examName,
          })).sort((a,b) => a.roll_number - b.roll_number);
          setResults(finalResults as StudentResult[]);
        }
        if (error) console.error("Error fetching results: ", error);
        setLoading(false);
      };
      fetchResults();
    }
  }, [selectedClass, selectedSection, selectedExam, classes, sections, exams]);

  const downloadStudentListPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Roll Number", "Student Name"];
    const tableRows = results.map(res => [res.roll_number, res.student_name]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Student List - ${results[0]?.class_name} - ${results[0]?.section_name}`, 14, 15);
    doc.save("student_list.pdf");
  };

  const downloadStudentListExcel = () => {
      const csvData = results.map(res => ({ "Roll Number": res.roll_number, "Student Name": res.student_name, }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if(link.href) URL.revokeObjectURL(link.href);
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "student_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await fetch('/api/download-marksheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          results: results,
          class_name: classes.find(c => c.id === Number(selectedClass))?.name,
          section_name: sections.find(s => s.id === Number(selectedSection))?.name,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marksheets_${classes.find(c => c.id === Number(selectedClass))?.name}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`Error creating ZIP file: ${error.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  if (loading) {
      return <div className={manageStyles.pageContainer}><p style={{textAlign: 'center'}}>Loading...</p></div>
  }

  return (
    <div className={manageStyles.pageContainer}>
        <header className={manageStyles.header}>
            <button onClick={() => router.back()} className={manageStyles.backButton}>← Back</button>
            <h1>View Results & Marksheets</h1>
        </header>
        <main className={manageStyles.content}>
            <div className={manageStyles.card}>
                <h2>Select Criteria</h2>
                <div className={manageStyles.formGrid}>
                    <div className={manageStyles.selectWrapper}>
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={manageStyles.select}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><FiChevronDown />
                    </div>
                    <div className={manageStyles.selectWrapper}>
                        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={manageStyles.select} disabled={!selectedClass}><option value="">Select Section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><FiChevronDown />
                    </div>
                    <div className={manageStyles.selectWrapper}>
                        <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className={manageStyles.select}><option value="">Select Exam</option>{exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><FiChevronDown />
                    </div>
                </div>
            </div>
            {!loading && selectedSection && results.length > 0 && (
                <div className={manageStyles.card}>
                    <div className={resultsStyles.cardHeader}>
                        <h2>Results Overview</h2>
                        <div className={resultsStyles.exportButtons}>
                            {isAdmin && (
                                <button onClick={handleDownloadZip} disabled={isZipping}>
                                    {isZipping ? 'Generating...' : <><FiZap/> Download All (ZIP)</>}
                                </button>
                            )}
                            <button onClick={downloadStudentListPDF}><FiFileText/> Export List (PDF)</button>
                            <button onClick={downloadStudentListExcel}><FiGrid/> Export List (Excel)</button>
                        </div>
                    </div>
                    <table className={resultsStyles.resultsTable}>
                        <thead><tr><th>Roll</th><th>Name</th><th>Total Marks</th><th>Percentage</th><th>Actions</th></tr></thead>
                        <tbody>
                            {results.map((res) => (
                                <tr key={res.student_id}>
                                    <td>{res.roll_number}</td>
                                    <td>{res.student_name}</td>
                                    <td>{res.total_marks}</td>
                                    <td>{res.percentage}%</td>
                                    <td className={resultsStyles.actionCell}>
                                        <button onClick={() => setSelectedStudent(res)} title="View Marksheet"><FiEye /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
        {selectedStudent && (
            <Marksheet student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
    </div>
  );
}
