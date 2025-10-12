// pages/view-results.tsx
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import manageStyles from '../styles/ManageStudents.module.css';
import { FiEye, FiFileText, FiGrid, FiChevronDown, FiZap, FiSearch } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Marksheet from '../components/Marksheet';

declare global {
  interface Window {
    Papa: any;
  }
}

// Define Types
type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Exam = { id: number; name: string; };
type AcademicYear = { academic_year: string };
type Result = { student_id: number; student_name: string; roll_number: number; marks_obtained: number; full_marks: number; subject_id: number; subject_name: string; };
type StudentResult = { 
  student_id: number; student_name: string; roll_number: number; 
  total_marks: number; total_full_marks: number; percentage: number; 
  subjects: Result[]; class_name: string; section_name: string;
  exam_name: string; academic_year: string;
};

export default function ViewResults() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const papaScript = document.createElement('script');
    papaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
    papaScript.async = true;
    papaScript.onload = () => setScriptsLoaded(true);
    document.body.appendChild(papaScript);
    return () => {
      document.body.removeChild(papaScript);
    };
  }, []);

  // ✅ এই useEffect শুধুমাত্র Academic Year, Exam এবং User Role আনার জন্য
  useEffect(() => {
    const checkUserRoleAndFetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if(session) {
          const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
          if(roleData?.role === 'admin') setIsAdmin(true);
      } else {
          router.push('/');
          return; // সেশন না থাকলে আর কিছু করার দরকার নেই
      }
      
      const { data: examData } = await supabase.from('exams').select('*').order('name');
      setExams(examData || []);
      
      const { data: yearData } = await supabase.rpc('get_distinct_academic_years');
      if (yearData && yearData.length > 0) {
        setAcademicYears(yearData);
        setSelectedYear(yearData[0].academic_year);
      }
      setLoading(false);
    };
    checkUserRoleAndFetchData();
  }, [router]);

  // ✅ আর এই useEffect টি selectedYear পরিবর্তন হলেই ক্লাস তালিকা নতুন করে আনবে
  useEffect(() => {
    if (selectedYear) {
      const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*').eq('academic_year', selectedYear).order('name');
        setClasses(data || []);
      };
      fetchClasses();
      // Year পরিবর্তন হলে পরবর্তী সিলেকশন এবং রেজাল্ট রিসেট হবে
      setResults([]); 
      setSelectedClass(''); 
      setSelectedSection('');
      setSearchTerm(''); // সার্চও রিসেট করা হলো
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('sections').select('*').eq('class_id', selectedClass).order('name');
        setSections(data || []);
      };
      fetchSections();
      setResults([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedExam && selectedYear) {
      const fetchResults = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('detailed_results').select('*')
          .eq('section_id', selectedSection)
          .eq('exam_id', selectedExam)
          .eq('academic_year', selectedYear);
        
        if (data) {
          const className = classes.find(c => c.id === Number(selectedClass))?.name || '';
          const sectionName = sections.find(s => s.id === Number(selectedSection))?.name || '';
          const examName = exams.find(e => e.id === Number(selectedExam))?.name || '';
          const groupedByStudent = data.reduce((acc, curr: Result) => {
            acc[curr.student_id] = acc[curr.student_id] || { student_id: curr.student_id, student_name: curr.student_name, roll_number: curr.roll_number, total_marks: 0, total_full_marks: 0, subjects: [] };
            acc[curr.student_id].subjects.push(curr);
            acc[curr.student_id].total_marks += curr.marks_obtained;
            acc[curr.student_id].total_full_marks += curr.full_marks;
            return acc;
          }, {});
          const finalResults = Object.values(groupedByStudent).map((student: any) => ({
            ...student,
            percentage: parseFloat(((student.total_marks / student.total_full_marks) * 100).toFixed(2)) || 0,
            class_name: className, section_name: sectionName, exam_name: examName, academic_year: selectedYear,
          })).sort((a,b) => a.roll_number - b.roll_number);
          setResults(finalResults as StudentResult[]);
        }
        if (error) console.error("Error fetching results: ", error);
        setLoading(false);
      };
      fetchResults();
    }
  }, [selectedClass, selectedSection, selectedExam, selectedYear, classes, sections, exams]);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return results;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return results.filter(res =>
      res.student_name.toLowerCase().includes(lowercasedSearchTerm) ||
      res.roll_number.toString().includes(lowercasedSearchTerm)
    );
  }, [results, searchTerm]);

  const downloadStudentListPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Roll Number", "Student Name", "Total Marks", "Percentage"];
    const tableRows = filteredResults.map(res => [res.roll_number, res.student_name, res.total_marks, `${res.percentage}%`]);
    autoTable(doc, {
      head: [tableColumn], body: tableRows,
      didDrawPage: (data) => {
        doc.text(`Results Overview - ${filteredResults[0]?.class_name}, ${filteredResults[0]?.section_name} (${selectedYear})`, data.settings.margin.left, 15);
      }
    });
    doc.save(`results_${selectedYear}.pdf`);
  };

  const downloadStudentListExcel = () => {
    if (!scriptsLoaded) {
      alert('Excel library is loading, please try again.');
      return;
    }
    const csvData = filteredResults.map(res => ({ "Roll Number": res.roll_number, "Student Name": res.student_name, "Total Marks": res.total_marks, "Percentage": res.percentage }));
    const csv = window.Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `results_${selectedYear}.csv`);
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          results: filteredResults,
          class_name: classes.find(c => c.id === Number(selectedClass))?.name,
          section_name: sections.find(s => s.id === Number(selectedSection))?.name,
          academic_year: selectedYear,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marksheets_${selectedYear}_${classes.find(c => c.id === Number(selectedClass))?.name}.zip`;
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


  if (loading && !selectedYear) { // প্রাথমিক লোডিং অবস্থা
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
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={manageStyles.select}><option value="">Select Year</option>{academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}</select><FiChevronDown />
                    </div>
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
            {selectedSection && results.length > 0 && (
                <div className={manageStyles.card}>
                    <div className={manageStyles.cardHeader}>
                        <h2>Results Overview for {selectedYear}</h2>
                        <div className={manageStyles.exportButtons}>
                            {isAdmin && (<button onClick={handleDownloadZip} disabled={isZipping}>{isZipping ? 'Generating...' : <><FiZap/> Download All (ZIP)</>}</button>)}
                            <button onClick={downloadStudentListPDF}><FiFileText/> Export List (PDF)</button>
                            <button onClick={downloadStudentListExcel} disabled={!scriptsLoaded}><FiGrid/> Export List (Excel)</button>
                        </div>
                    </div>
                    <div className={manageStyles.searchContainer}>
                      <FiSearch />
                      <input
                        type="text"
                        placeholder="Search by Name or Roll..."
                        className={manageStyles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className={manageStyles.tableWrapper}>
                        <table className={manageStyles.resultsTable}>
                            <thead><tr><th>Roll</th><th>Name</th><th>Total Marks</th><th>Percentage</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filteredResults.map((res) => (
                                    <tr key={res.student_id}>
                                        <td>{res.roll_number}</td>
                                        <td>{res.student_name}</td>
                                        <td>{res.total_marks}</td>
                                        <td>{res.percentage}%</td>
                                        <td className={manageStyles.actionCell}>
                                            <button onClick={() => setSelectedStudent(res)} title="View Marksheet"><FiEye /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {selectedSection && !loading && results.length === 0 && (
              <div className={manageStyles.card}><p>No results found for the selected criteria.</p></div>
            )}
        </main>
        {selectedStudent && (
            <Marksheet student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
    </div>
  );
}