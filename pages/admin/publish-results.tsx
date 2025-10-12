// pages/admin/publish-results.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import styles from '../../styles/ManageStudents.module.css'; // একই CSS ফাইল ব্যবহার করা হচ্ছে
import { FiLock, FiUnlock, FiChevronDown } from 'react-icons/fi';

type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Exam = { id: number; name: string; };
type AcademicYear = { academic_year: string };

export default function PublishResults() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // ১. Academic Year-এর জন্য নতুন state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // শুরুতে Academic Year এবং Exam তালিকা লোড করা
  useEffect(() => {
    const fetchData = async () => {
      const { data: examData } = await supabase.from('exams').select('*').order('name');
      setExams(examData || []);
      
      const { data: yearData } = await supabase.rpc('get_distinct_academic_years');
      if (yearData && yearData.length > 0) {
        setAcademicYears(yearData);
        setSelectedYear(yearData[0].academic_year);
      }
    };
    fetchData();
  }, []);
  
  // ২. Year অনুযায়ী Class তালিকা লোড করা
  useEffect(() => {
    if (selectedYear) {
      const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*').eq('academic_year', selectedYear).order('name');
        setClasses(data || []);
      };
      fetchClasses();
      setSelectedClass(''); // Year পরিবর্তন হলে রিসেট
      setSections([]);
      setSelectedSection('');
      setIsLocked(null);
    }
  }, [selectedYear]);

  // Class পরিবর্তনের সাথে Section লোড
  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('sections').select('*').eq('class_id', selectedClass).order('name');
        setSections(data || []);
      };
      fetchSections();
      setSelectedSection('');
      setIsLocked(null);
    }
  }, [selectedClass]);

  // ৩. Year অনুযায়ী Lock status চেক করা
  useEffect(() => {
    if (selectedClass && selectedSection && selectedExam && selectedYear) {
      const checkLockStatus = async () => {
        const { data } = await supabase
          .from('exam_locks')
          .select('is_locked')
          .eq('class_id', selectedClass)
          .eq('section_id', selectedSection)
          .eq('exam_id', selectedExam)
          .eq('academic_year', selectedYear) // academic_year যোগ করা হয়েছে
          .single();
        setIsLocked(data ? data.is_locked : false);
      };
      checkLockStatus();
    }
  }, [selectedClass, selectedSection, selectedExam, selectedYear]);

  // ৪. Lock/Unlock করার সময় Year ব্যবহার করা
  const handleToggleLock = async () => {
    if (!selectedClass || !selectedSection || !selectedExam || !selectedYear) {
        setMessage('Please select all criteria first.');
        return;
    }
    
    const lockData = {
      class_id: selectedClass,
      section_id: selectedSection,
      exam_id: selectedExam,
      academic_year: selectedYear, // academic_year যোগ করা হয়েছে
    };

    if (isLocked) {
      const { error } = await supabase.from('exam_locks').delete().match(lockData);
      if (error) setMessage(`Error: ${error.message}`);
      else { setIsLocked(false); setMessage('Results have been unlocked.'); }
    } else {
      const { error } = await supabase.from('exam_locks').insert(lockData);
      if (error) setMessage(`Error: ${error.message}`);
      else { setIsLocked(true); setMessage('Results have been locked and published.'); }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin/dashboard')} className={styles.backButton}>← Back</button>
        <h1>Publish & Lock Results</h1>
      </header>
      
      <main className={styles.content}>
        <div className={styles.card}>
          <h2>Select Examination to Manage</h2>
          <div className={styles.formGrid}>
            <div className={styles.selectWrapper}>
              {/* ৫. Academic Year ড্রপডাউন যোগ করা হয়েছে */}
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={styles.select}>
                <option value="">Select Year</option>
                {academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}
              </select><FiChevronDown />
            </div>
            <div className={styles.selectWrapper}>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={styles.select} disabled={!selectedYear}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select><FiChevronDown />
            </div>
            <div className={styles.selectWrapper}>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={styles.select} disabled={!selectedClass}>
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select><FiChevronDown />
            </div>
            <div className={styles.selectWrapper}>
              <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className={styles.select}>
                <option value="">Select Exam</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select><FiChevronDown />
            </div>
          </div>
        </div>

        {selectedClass && selectedSection && selectedExam && selectedYear && (
            <div className={styles.card}>
                <h2>Current Status for {selectedYear}</h2>
                {isLocked === null ? <p>Checking status...</p> : (
                    <div className={styles.statusBox}>
                        <p>Results are currently: <strong>{isLocked ? 'LOCKED' : 'UNLOCKED'}</strong></p>
                        <button onClick={handleToggleLock} className={styles.actionButton}>
                            {isLocked ? <><FiUnlock /> Unlock for Editing</> : <><FiLock /> Lock & Publish</>}
                        </button>
                    </div>
                )}
                {message && <p className={styles.message}>{message}</p>}
            </div>
        )}
      </main>
    </div>
  );
}