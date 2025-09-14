// pages/admin/manage-classes.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import manageStyles from '../../styles/Manage.module.css';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

type Class = { id: number; name: string; };
type Section = { id: number; name: string; class_id: number; };

export default function ManageClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

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

  const handleClassSelect = async (cls: Class) => {
    setSelectedClass(cls);
    const { data, error } = await supabase.from('sections').select('*').eq('class_id', cls.id).order('name');
    if (error) setMessage('Error fetching sections');
    else setSections(data || []);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const { error } = await supabase.from('classes').insert([{ name: newClassName }]);
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setNewClassName('');
      fetchClasses();
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !selectedClass) return;
    const { error } = await supabase.from('sections').insert([{ name: newSectionName, class_id: selectedClass.id }]);
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setNewSectionName('');
      handleClassSelect(selectedClass);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      const { error } = await supabase.from('sections').delete().eq('id', sectionId);
      if (error) setMessage(`Error: ${error.message}`);
      else {
        handleClassSelect(selectedClass!);
      }
    }
  };
  
  const handleDeleteClass = async (classId: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) setMessage(`Error: ${error.message}`);
        else {
            setMessage('Class deleted successfully!');
            fetchClasses();
            setSelectedClass(null);
            setSections([]);
        }
    }
  };

  return (
    <div className={manageStyles.pageContainer}>
      <header className={manageStyles.header}>
        <button onClick={() => router.push('/admin/dashboard')} className={manageStyles.backButton}>← Back</button>
        <h1>Manage Classes & Sections</h1>
      </header>

      <main className={manageStyles.contentGrid}>
        <div className={manageStyles.card}>
          <h2>Classes</h2>
          <form onSubmit={handleAddClass} className={manageStyles.form}>
            <input type="text" placeholder="Add New Class" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className={manageStyles.input} />
            <button type="submit" className={manageStyles.addButton}><FiPlus /></button>
          </form>
          {loading ? <p>Loading...</p> : (
            <ul className={manageStyles.list}>
              {classes.map((cls) => (
                <li key={cls.id} className={`${manageStyles.listItem} ${selectedClass?.id === cls.id ? manageStyles.active : ''}`} onClick={() => handleClassSelect(cls)}>
                  <span>{cls.name}</span>
                   <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className={manageStyles.deleteButton}><FiTrash2 /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={manageStyles.card}>
          {selectedClass ? (
            <>
              <h2>Sections for {selectedClass.name}</h2>
              <form onSubmit={handleAddSection} className={manageStyles.form}>
                <input type="text" placeholder="Add New Section" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} className={manageStyles.input} />
                <button type="submit" className={manageStyles.addButton}><FiPlus /></button>
              </form>
              <ul className={manageStyles.list}>
                {sections.map((sec) => (
                  <li key={sec.id} className={manageStyles.listItem}>
                    <span>{sec.name}</span>
                    <button onClick={() => handleDeleteSection(sec.id)} className={manageStyles.deleteButton}><FiTrash2 /></button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className={manageStyles.placeholder}>
              <p>Select a class from the left to manage its sections.</p>
            </div>
          )}
        </div>
      </main>
      {message && <div className={manageStyles.message}>{message}</div>}
    </div>
  );
}