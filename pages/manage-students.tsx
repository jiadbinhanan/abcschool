// pages/manage-students.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import manageStyles from '../styles/Manage.module.css';
import { FiUserPlus, FiTrash2, FiChevronDown, FiFileText, FiGrid } from 'react-icons/fi';
// Library imports for exporting
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

// Type Definitions
type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Student = { id: number; name: string; roll_number: number; };

export default function ManageStudents() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');

  // Fetch all classes on page load
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      const { data } = await supabase.from('classes').select('*').order('name');
      setClasses(data || []);
      setLoading(false);
    };
    fetchClasses();
  }, []);

  // Fetch sections when a class is selected
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

  // Fetch students when a section is selected
  useEffect(() => {
    if (selectedSection) {
      const fetchStudents = async () => {
        setLoading(true);
        const { data } = await supabase.from('students').select('id, name, roll_number').eq('section_id', selectedSection).order('roll_number', { ascending: true });
        setStudents(data || []);
        setLoading(false);
      };
      fetchStudents();
    }
  }, [selectedSection]);

  // Handler for adding a new student
  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSection) {
      setMessage('Please select a section first.');
      return;
    }
    const { error } = await supabase.from('students').insert({
      name: newStudentName,
      roll_number: parseInt(newStudentRoll, 10),
      section_id: selectedSection,
    });
    if (error) {
      setMessage(`Error adding student: ${error.message}`);
    } else {
      setMessage('Student added successfully!');
      setNewStudentName('');
      setNewStudentRoll('');
      const { data } = await supabase.from('students').select('*').eq('section_id', selectedSection).order('roll_number');
      setStudents(data || []);
    }
  };

  // Handler for deleting a student
  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) {
        setMessage(`Error deleting student: ${error.message}`);
      } else {
        setMessage('Student deleted successfully.');
        setStudents(students.filter(s => s.id !== studentId));
      }
    }
  };

  // Function to download student list as PDF
  const downloadStudentListPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('A B C Academy', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Students List', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.setDrawColor('#cccccc');
    doc.setLineWidth(0.2);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 10;
    const className = classes.find(c => c.id === Number(selectedClass))?.name;
    const sectionName = sections.find(s => s.id === Number(selectedSection))?.name;
    doc.setFontSize(12);
    doc.text(`Class: ${className}`, 14, currentY);
    doc.text(`Section: ${sectionName}`, pageWidth / 2, currentY);
    currentY += 10;
    const tableColumn = ["SL No.", "Student Name", "Roll No.", "Remarks"];
    const tableRows = students.map((student, index) => [index + 1, student.name, student.roll_number, '']);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: currentY });
    doc.save(`student_list_${className}_${sectionName}.pdf`);
  };

  // Function to download student list as Excel (CSV)
  const downloadStudentListExcel = () => {
    const className = classes.find(c => c.id === Number(selectedClass))?.name;
    const sectionName = sections.find(s => s.id === Number(selectedSection))?.name;
    const csvData = students.map((student, index) => ({
      'SL No.': index + 1,
      'Student Name': student.name,
      'Roll No.': student.roll_number,
      'Remarks': ''
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student_list_${className}_${sectionName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && classes.length === 0) {
    return <div className={manageStyles.pageContainer}><p style={{ textAlign: 'center' }}>Loading class data...</p></div>;
  }

  return (
    <div className={manageStyles.pageContainer}>
      <header className={manageStyles.header}>
        <button onClick={() => router.back()} className={manageStyles.backButton}>
  ← Back
</button>
        <h1>Manage Students</h1>
      </header>
      <main className={manageStyles.content}>
        {message && <div className={manageStyles.messageBox} onClick={() => setMessage('')}>{message}</div>}

        <div className={manageStyles.card}>
          <h2>Select Criteria</h2>
          <div className={manageStyles.formGrid}>
            <div className={manageStyles.selectWrapper}>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={manageStyles.select}>
                <option value="">-- Select a Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <FiChevronDown />
            </div>
            <div className={manageStyles.selectWrapper}>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={manageStyles.select} disabled={!selectedClass || sections.length === 0}>
                <option value="">-- Select a Section --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <FiChevronDown />
            </div>
          </div>
        </div>

        {selectedSection && (
          <>
            <div className={manageStyles.card}>
              <h2>Add New Student to Section</h2>
              <form onSubmit={handleAddStudent} className={manageStyles.formGrid}>
                <input type="text" placeholder="Full Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required />
                <input type="number" placeholder="Roll Number" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} required />
                <button type="submit" className={manageStyles.actionButton}>
                  <FiUserPlus /> Add Student
                </button>
              </form>
            </div>

            <div className={manageStyles.card}>
              <div className={manageStyles.cardHeader}>
                <h2>Student List</h2>
                <div className={manageStyles.exportButtons}>
                  <button onClick={downloadStudentListPDF}><FiFileText/> Export (PDF)</button>
                  <button onClick={downloadStudentListExcel}><FiGrid/> Export (Excel)</button>
                </div>
              </div>
              
              {loading ? <p>Loading students...</p> : (
                <table className={manageStyles.table}>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.roll_number}</td>
                        <td>{student.name}</td>
                        <td>
                          <button onClick={() => handleDeleteStudent(student.id)} className={manageStyles.deleteButton}>
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}