// pages/admin/manage-students.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import manageStyles from '../../styles/Manage.module.css';
import { FiUserPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';

type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Student = { id: number; name: string; roll_number: number; };

export default function ManageStudents() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('name');
      setClasses(data || []);
      setLoading(false);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('sections').select('*').eq('class_id', selectedClass).order('name');
        setSections(data || []);
        setStudents([]);
        setSelectedSection('');
      };
      fetchSections();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSection) {
      const fetchStudents = async () => {
        setLoading(true);
        const { data } = await supabase.from('students').select('*').eq('section_id', selectedSection).order('roll_number');
        setStudents(data || []);
        setLoading(false);
      };
      fetchStudents();
    }
  }, [selectedSection]);
  
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedSection || !newStudentName.trim() || !newStudentRoll.trim()) {
      setMessage('Please fill all fields.');
      return;
    }
    const { error } = await supabase.from('students').insert([{ 
      name: newStudentName, 
      roll_number: parseInt(newStudentRoll, 10),
      class_id: parseInt(selectedClass, 10),
      section_id: parseInt(selectedSection, 10),
    }]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Student added successfully!');
      setNewStudentName('');
      setNewStudentRoll('');
      const { data } = await supabase.from('students').select('*').eq('section_id', selectedSection).order('roll_number');
      setStudents(data || []);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Student deleted successfully!');
        setStudents(students.filter(s => s.id !== studentId));
      }
    }
  };

  return (
    <div className={manageStyles.pageContainer}>
      <header className={manageStyles.header}>
        <button onClick={() => router.push('/admin/dashboard')} className={manageStyles.backButton}>← Back</button>
        <h1>Manage Students</h1>
      </header>
      
      <main className={manageStyles.content}>
        <div className={manageStyles.card}>
          <h2>Add New Student</h2>
          {message && <p className={manageStyles.message}>{message}</p>}
          <form onSubmit={handleAddStudent} className={manageStyles.formGrid}>
            <input type="text" placeholder="Student Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className={manageStyles.input} />
            <input type="number" placeholder="Roll Number" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} className={manageStyles.input} />
            <div className={manageStyles.selectWrapper}>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={manageStyles.select}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <FiChevronDown />
            </div>
            <div className={manageStyles.selectWrapper}>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={manageStyles.select} disabled={!selectedClass}>
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <FiChevronDown />
            </div>
            <button type="submit" className={manageStyles.addButton}><FiUserPlus /> Add Student</button>
          </form>
        </div>

        <div className={manageStyles.card}>
          <h2>Student List</h2>
          {(loading && selectedSection) ? <p>Loading students...</p> : (
            <ul className={manageStyles.list}>
              {students.length > 0 ? students.map((student) => (
                <li key={student.id} className={manageStyles.listItem}>
                  <span><strong>{student.roll_number}</strong> - {student.name}</span>
                  <button onClick={() => handleDeleteStudent(student.id)} className={manageStyles.deleteButton}><FiTrash2 /></button>
                </li>
              )) : <p>Select a class and section to see the student list.</p>}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}