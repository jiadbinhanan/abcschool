// pages/admin/manage-subjects.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../../styles/ManageStudents.module.css';
import { FiPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// Type Definitions
type Class = { id: number; name: string; };
type Subject = { id: number; name: string; class_id: number; };
type AcademicYear = { academic_year: string };

export default function ManageSubjects() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // ✅ Modal এবং Undo লজিকের জন্য State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

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

  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedYear) return;
      setLoading(true);
      const { data, error } = await supabase.from('classes').select('*').eq('academic_year', selectedYear).order('name');
      if (error) toast.error('Error fetching classes');
      else setClasses(data || []);
      setLoading(false);
    };
    fetchClasses();
    setSelectedClass(null);
    setSubjects([]);
  }, [selectedYear]);

  const handleClassSelect = async (cls: Class) => {
    setSelectedClass(cls);
    if (!selectedYear) return;
    const { data, error } = await supabase.from('subjects').select('*').eq('class_id', cls.id).eq('academic_year', selectedYear).order('name');
    if (error) toast.error('Error fetching subjects');
    else setSubjects(data || []);
  };

  const handleAddSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedClass || !selectedYear) {
        toast.error('Please select a year, a class, and enter a subject name.');
        return;
    };
    const { error } = await supabase.from('subjects').insert([{ name: newSubjectName, class_id: selectedClass.id, academic_year: selectedYear }]);
    if (error) {
      toast.error(`Error adding subject: ${error.message}`);
    } else {
      toast.success('Subject added successfully!');
      setNewSubjectName('');
      handleClassSelect(selectedClass);
    }
  };

  // ✅ ধাপ ১: Modal খোলার জন্য ফাংশন
  const openDeleteModal = (id: number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  // ✅ ধাপ ২: Modal থেকে Confirm করার পর Undo লজিকসহ ডিলিট ফাংশন
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const subjectId = itemToDelete;
    const subjectToDelete = subjects.find(s => s.id === subjectId);
    if (!subjectToDelete) return;

    setIsConfirmModalOpen(false);
    setSubjects(prev => prev.filter(s => s.id !== subjectId));

    const timeout = setTimeout(async () => {
      await supabase.from('subjects').delete().eq('id', subjectId);
      toast.success(`Subject "${subjectToDelete.name}" permanently deleted.`);
    }, 5000);

    toast.custom((t) => (
      <div style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span>Subject "{subjectToDelete.name}" deleted.</span>
        <button style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
          onClick={() => {
            clearTimeout(timeout);
            setSubjects(prev => [...prev, subjectToDelete].sort((a, b) => a.name.localeCompare(b.name)));
            toast.success(`Restored "${subjectToDelete.name}"`, { id: t.id, duration: 3000 });
          }}>
          Undo
        </button>
      </div>
    ), { duration: 5000, id: `delete-subject-${subjectId}` });
    
    setItemToDelete(null);
  };


  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin/dashboard')} className={styles.backButton}>← Back</button>
          <h1>Manage Subjects</h1>
        </header>

        <main className={styles.content}>
          <div className={styles.card} style={{ marginBottom: '20px' }}>
            <h2>Select Academic Year</h2>
            <div className={styles.selectWrapper}>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={styles.select}>
                {academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}
              </select>
              <FiChevronDown />
            </div>
          </div>

          {selectedYear && (
            <div className={styles.contentGrid}>
              <div className={styles.card}>
                <h2>Classes ({selectedYear})</h2>
                {loading ? <p>Loading...</p> : (
                  <ul className={styles.list}>
                    {classes.map((cls) => (
                      <li key={cls.id} className={`${styles.listItem} ${selectedClass?.id === cls.id ? styles.active : ''}`} onClick={() => handleClassSelect(cls)}>
                        <span>{cls.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.card}>
                {selectedClass ? (
                  <>
                    <h2>Subjects for {selectedClass.name} ({selectedYear})</h2>
                    <form onSubmit={handleAddSubject} className={styles.form}>
                      <input type="text" placeholder="Add New Subject" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className={styles.input} />
                      <button type="submit" className={styles.addButton}><FiPlus /></button>
                    </form>
                    <ul className={styles.list}>
                      {subjects.map((sub) => (
                        <li key={sub.id} className={styles.listItem}>
                          <span>{sub.name}</span>
                          {/* ✅ ধাপ ৩: onClick এ এখন openDeleteModal কল করা হচ্ছে */}
                          <button onClick={() => openDeleteModal(sub.id)} className={styles.deleteButton}><FiTrash2 /></button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className={styles.placeholder}>
                    <p>Select a class from the left to manage its subjects for the selected year.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* ✅ ধাপ ৪: Modal কম্পোনেন্টটি এখানে যোগ করা হয়েছে */}
      <ConfirmationModal
          isOpen={isConfirmModalOpen}
          title="Confirm Deletion"
          message="Are you sure you want to delete this subject?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmModalOpen(false)}
      />
    </>
  );
}