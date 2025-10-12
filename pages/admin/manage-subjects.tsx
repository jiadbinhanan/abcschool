// pages/admin/manage-subjects.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import manageStyles from '../../styles/Manage.module.css';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

// Define types for our data
type Class = { id: number; name: string; };
type Subject = { id: number; name: string; class_id: number; };

export default function ManageSubjects() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Fetch all classes from the database
  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) setMessage('Error fetching classes');
    else setClasses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Handle selecting a class to view its subjects
  const handleClassSelect = async (cls: Class) => {
    setSelectedClass(cls);
    setMessage('');
    const { data, error } = await supabase.from('subjects').select('*').eq('class_id', cls.id).order('name');
    if (error) setMessage('Error fetching subjects');
    else setSubjects(data || []);
  };

  // Handle adding a new subject to the selected class
  const handleAddSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedClass) {
        setMessage('Please select a class and enter a subject name.');
        return;
    };
    const { error } = await supabase.from('subjects').insert([{ name: newSubjectName, class_id: selectedClass.id }]);
    if (error) {
      setMessage(`Error adding subject: ${error.message}`);
    } else {
      setMessage('Subject added successfully!');
      setNewSubjectName('');
      handleClassSelect(selectedClass); // Refresh the subject list
    }
  };

  // Handle deleting a subject
  const handleDeleteSubject = async (subjectId: number) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
      if (error) {
        setMessage(`Error deleting subject: ${error.message}`);
      } else {
        setMessage('Subject deleted successfully!');
        handleClassSelect(selectedClass!); // Refresh the subject list
      }
    }
  };

  return (
    <div className={manageStyles.pageContainer}>
      <header className={manageStyles.header}>
        <button onClick={() => router.push('/admin/dashboard')} className={manageStyles.backButton}>← Back</button>
        <h1>Manage Subjects</h1>
      </header>

      <main className={manageStyles.contentGrid}>
        {/* Left Column: Classes List */}
        <div className={manageStyles.card}>
          <h2>Classes</h2>
          {loading ? <p>Loading...</p> : (
            <ul className={manageStyles.list}>
              {classes.map((cls) => (
                <li key={cls.id} className={`${manageStyles.listItem} ${selectedClass?.id === cls.id ? manageStyles.active : ''}`} onClick={() => handleClassSelect(cls)}>
                  <span>{cls.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Column: Subjects Management */}
        <div className={manageStyles.card}>
          {selectedClass ? (
            <>
              <h2>Subjects for {selectedClass.name}</h2>
              <form onSubmit={handleAddSubject} className={manageStyles.form}>
                <input type="text" placeholder="Add New Subject" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className={manageStyles.input} />
                <button type="submit" className={manageStyles.addButton}><FiPlus /></button>
              </form>
              {message && <p className={manageStyles.message}>{message}</p>}
              <ul className={manageStyles.list}>
                {subjects.map((sub) => (
                  <li key={sub.id} className={manageStyles.listItem}>
                    <span>{sub.name}</span>
                    <button onClick={() => handleDeleteSubject(sub.id)} className={manageStyles.deleteButton}><FiTrash2 /></button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className={manageStyles.placeholder}>
              <p>Select a class from the left to manage its subjects.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}