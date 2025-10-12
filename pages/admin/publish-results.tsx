// pages/admin/publish-results.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useRouter } from 'next/router';
import manageStyles from '../../styles/Manage.module.css';
import { FiLock, FiUnlock, FiChevronDown } from 'react-icons/fi';

type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Exam = { id: number; name: string; };

export default function PublishResults() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Fetch initial data (classes and exams)
  useEffect(() => {
    const fetchData = async () => {
      const { data: classData } = await supabase.from('classes').select('*').order('name');
      setClasses(classData || []);
      const { data: examData } = await supabase.from('exams').select('*').order('name');
      setExams(examData || []);
    };
    fetchData();
  }, []);

  // Fetch sections when a class is selected
  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('sections').select('*').eq('class_id', selectedClass).order('name');
        setSections(data || []);
      };
      fetchSections();
      setIsLocked(null); // Reset lock status
    }
  }, [selectedClass]);

  // Check lock status when all fields are selected
  useEffect(() => {
    if (selectedClass && selectedSection && selectedExam) {
      const checkLockStatus = async () => {
        const { data } = await supabase
          .from('exam_locks')
          .select('is_locked')
          .eq('class_id', selectedClass)
          .eq('section_id', selectedSection)
          .eq('exam_id', selectedExam)
          .single();
        setIsLocked(data ? data.is_locked : false);
      };
      checkLockStatus();
    }
  }, [selectedClass, selectedSection, selectedExam]);

  // Handle locking/unlocking results
  const handleToggleLock = async () => {
    if (!selectedClass || !selectedSection || !selectedExam) {
        setMessage('Please select class, section, and exam first.');
        return;
    }
    
    if (isLocked) {
      // UNLOCK: Delete the lock record
      const { error } = await supabase.from('exam_locks').delete()
        .eq('class_id', selectedClass)
        .eq('section_id', selectedSection)
        .eq('exam_id', selectedExam);
      if (error) setMessage(`Error: ${error.message}`);
      else {
        setIsLocked(false);
        setMessage('Results have been unlocked.');
      }
    } else {
      // LOCK: Insert a lock record
      const { error } = await supabase.from('exam_locks').insert({
        class_id: selectedClass,
        section_id: selectedSection,
        exam_id: selectedExam
      });
      if (error) setMessage(`Error: ${error.message}`);
      else {
        setIsLocked(true);
        setMessage('Results have been locked and published.');
      }
    }
  };

  return (
    <div className={manageStyles.pageContainer}>
      <header className={manageStyles.header}>
        <button onClick={() => router.push('/admin/dashboard')} className={manageStyles.backButton}>← Back</button>
        <h1>Publish & Lock Results</h1>
      </header>
      
      <main className={manageStyles.content}>
        <div className={manageStyles.card}>
          <h2>Select Examination to Manage</h2>
          <div className={manageStyles.formGrid}>
            <div className={manageStyles.selectWrapper}>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={manageStyles.select}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select><FiChevronDown />
            </div>
            <div className={manageStyles.selectWrapper}>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={manageStyles.select} disabled={!selectedClass}>
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select><FiChevronDown />
            </div>
            <div className={manageStyles.selectWrapper}>
              <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className={manageStyles.select}>
                <option value="">Select Exam</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select><FiChevronDown />
            </div>
          </div>
        </div>

        {selectedClass && selectedSection && selectedExam && (
            <div className={manageStyles.card}>
                <h2>Current Status</h2>
                {isLocked === null ? <p>Checking status...</p> : (
                    <div className={manageStyles.statusBox}>
                        <p>Results are currently: <strong>{isLocked ? 'LOCKED' : 'UNLOCKED'}</strong></p>
                        <button onClick={handleToggleLock} className={manageStyles.actionButton}>
                            {isLocked ? <><FiUnlock /> Unlock for Editing</> : <><FiLock /> Lock & Publish</>}
                        </button>
                    </div>
                )}
                {message && <p className={manageStyles.message}>{message}</p>}
            </div>
        )}
      </main>
    </div>
  );
}