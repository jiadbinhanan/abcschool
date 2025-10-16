// pages/admin/manage-classes.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../../styles/ManageStudents.module.css';
import { FiPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

type Class = { id: number; name: string; };
type Section = { id: number; name: string; class_id: number; };
type AcademicYear = { academic_year: string };

export default function ManageClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'class' | 'section' } | null>(null);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      const { data: yearData } = await supabase.rpc('get_distinct_academic_years');
      if (yearData && yearData.length > 0) {
        setAcademicYears(yearData);
        setSelectedYear(yearData[0].academic_year);
      }
    };
    fetchAcademicYears();
  }, []);

  const fetchClasses = async (year: string) => {
    if (!year) return;
    const { data, error } = await supabase.from('classes').select('*').eq('academic_year', year).order('name');
    if (error) toast.error('Error fetching classes');
    else setClasses(data || []);
  };

  useEffect(() => {
    fetchClasses(selectedYear);
    setSelectedClass(null);
    setSections([]);
  }, [selectedYear]);

  const handleClassSelect = async (cls: Class) => {
    setSelectedClass(cls);
    const { data, error } = await supabase.from('sections').select('*').eq('class_id', cls.id).order('name');
    if (error) toast.error('Error fetching sections');
    else setSections(data || []);
  };

  const handleAddClass = async (e: FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !selectedYear) return;
    const { error } = await supabase.from('classes').insert([{ name: newClassName, academic_year: selectedYear }]);
    if (error) toast.error(`Error: ${error.message}`);
    else {
      toast.success('Class added successfully!');
      setNewClassName('');
      fetchClasses(selectedYear);
    }
  };

  const handleAddSection = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !selectedClass || !selectedYear) return;
    const { error } = await supabase.from('sections').insert([{ name: newSectionName, class_id: selectedClass.id, academic_year: selectedYear }]);
    if (error) toast.error(`Error: ${error.message}`);
    else {
      toast.success('Section added successfully!');
      setNewSectionName('');
      handleClassSelect(selectedClass);
    }
  };

  const openDeleteModal = (id: number, type: 'class' | 'section') => {
    setItemToDelete({ id, type });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;
    
    if (type === 'class') {
      const classToDelete = classes.find(c => c.id === id);
      if (!classToDelete) return;

      setClasses(prev => prev.filter(c => c.id !== id));
      if (selectedClass?.id === id) {
        setSelectedClass(null);
        setSections([]);
      }

      const timeout = setTimeout(async () => {
        await supabase.from('classes').delete().eq('id', id);
        toast.success(`Class "${classToDelete.name}" permanently deleted.`);
      }, 5000);

      toast.custom((t) => (
        <div style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* ✅ সংশোধন: এখানে ডাবল কোটেশন (" ") পরিবর্তন করে &quot; ব্যবহার করা হয়েছে */}
          <span>Class &quot;{classToDelete.name}&quot; deleted.</span>
          <button style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
            onClick={() => {
              clearTimeout(timeout);
              setClasses(prev => [...prev, classToDelete].sort((a, b) => a.name.localeCompare(b.name)));
              toast.success(`Restored "${classToDelete.name}"`, { id: t.id, duration: 3000 });
            }}>
            Undo
          </button>
        </div>
      ), { duration: 5000, id: `delete-class-${id}` });
    }
    
    if (type === 'section') {
      const sectionToDelete = sections.find(s => s.id === id);
      if (!sectionToDelete) return;
      
      setSections(prev => prev.filter(s => s.id !== id));
      
      const timeout = setTimeout(async () => {
        await supabase.from('sections').delete().eq('id', id);
        toast.success(`Section "${sectionToDelete.name}" permanently deleted.`);
      }, 5000);

      toast.custom((t) => (
        <div style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* ✅ সংশোধন: এখানেও ডাবল কোটেশন (" ") পরিবর্তন করে &quot; ব্যবহার করা হয়েছে */}
          <span>Section &quot;{sectionToDelete.name}&quot; deleted.</span>
          <button style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
            onClick={() => {
              clearTimeout(timeout);
              setSections(prev => [...prev, sectionToDelete].sort((a, b) => a.name.localeCompare(b.name)));
              toast.success(`Restored "${sectionToDelete.name}"`, { id: t.id, duration: 3000 });
            }}>
            Undo
          </button>
        </div>
      ), { duration: 5000, id: `delete-section-${id}` });
    }

    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin/dashboard')} className={styles.backButton}>← Back</button>
          <h1>Manage Classes & Sections</h1>
        </header>

        <main className={styles.content}>
          <div className={styles.card} style={{ marginBottom: '20px' }}>
            <h2>Select Academic Year</h2>
            <div className={styles.selectWrapper}>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={styles.select}>
                <option value="" disabled>-- Select a Year --</option>
                {academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}
              </select>
              <FiChevronDown />
            </div>
          </div>

          {selectedYear && (
            <div className={styles.contentGrid}>
              <div className={styles.card}>
                <h2>Classes for {selectedYear}</h2>
                <form onSubmit={handleAddClass} className={styles.form}>
                  <input type="text" placeholder="Add New Class" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className={styles.input} />
                  <button type="submit" className={styles.addButton}><FiPlus /></button>
                </form>
                <ul className={styles.list}>
                  {classes.map((cls) => (
                    <li key={cls.id} className={`${styles.listItem} ${selectedClass?.id === cls.id ? styles.active : ''}`} onClick={() => handleClassSelect(cls)}>
                      <span>{cls.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); openDeleteModal(cls.id, 'class'); }} className={styles.deleteButton}><FiTrash2 /></button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.card}>
                {selectedClass ? (
                  <>
                    <h2>Sections for {selectedClass.name}</h2>
                    <form onSubmit={handleAddSection} className={styles.form}>
                      <input type="text" placeholder="Add New Section" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} className={styles.input} />
                      <button type="submit" className={styles.addButton}><FiPlus /></button>
                    </form>
                    <ul className={styles.list}>
                      {sections.map((sec) => (
                        <li key={sec.id} className={styles.listItem}>
                          <span>{sec.name}</span>
                          <button onClick={() => openDeleteModal(sec.id, 'section')} className={styles.deleteButton}><FiTrash2 /></button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className={styles.placeholder}>
                    <p>Select a class from the left to manage its sections.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action might be irreversible.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </>
  );
}