// pages/admin/manage-students/promote-students.tsx

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../../../styles/ManageStudents.module.css';
import { toast } from 'react-hot-toast';
import { FiAward, FiSearch, FiUsers, FiUserCheck } from 'react-icons/fi';

// ✅ ধাপ ১: getServerSideProps এবং প্রয়োজনীয় মডিউল ইম্পোর্ট করা
import type { GetServerSidePropsContext } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { checkPermissionAndGetRole } from '../../../lib/permissions';

// --- Type Definitions (অপরিবর্তিত) ---
type AcademicYear = { academic_year: string };
type Class = { id: number; name: string; academic_year: string };
type Section = { id: number; name: string; };
type StudentInTable = {
  student_id: number;
  name: string;
  student_unique_id: string;
  father_name: string | null;
  current_roll: number;
  current_class: string;
  current_section: string;
  current_year: string;
  newRoll: string;
  isAlreadyPromoted: boolean;
};

// ✅ ধাপ ২: PageProps টাইপ ডিফাইন করা
type PageProps = {
  initialAcademicYears: AcademicYear[];
  initialAllClasses: Class[];
  userRole: 'admin' | 'teacher';
};

export default function PromoteStudents({ initialAcademicYears, initialAllClasses, }: PageProps) {
  const router = useRouter();

  // ✅ ধাপ ৩: State গুলো এখন props থেকে ইনিশিয়ালাইজ করা হচ্ছে
  const [academicYears] = useState<AcademicYear[]>(initialAcademicYears);
  const [allClasses] = useState<Class[]>(initialAllClasses);

  // বাকি state গুলো অপরিবর্তিত
  const [searchMode, setSearchMode] = useState<'class' | 'id'>('class');
  const [sourceSections, setSourceSections] = useState<Section[]>([]);
  const [destinationSections, setDestinationSections] = useState<Section[]>([]);
  const [studentsInTable, setStudentsInTable] = useState<StudentInTable[]>([]);
  const [sourceYear, setSourceYear] = useState<string>('');
  const [sourceClass, setSourceClass] = useState<string>('');
  const [sourceSection, setSourceSection] = useState<string>('');
  const [studentIdSearch, setStudentIdSearch] = useState('');
  const [destinationYear, setDestinationYear] = useState<string>('');
  const [destinationClass, setDestinationClass] = useState<string>('');
  const [destinationSection, setDestinationSection] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [promotedStudentIds, setPromotedStudentIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // ❌ ধাপ ৪: প্রাথমিক ডেটা fetch করার জন্য যে useEffect ছিল, সেটি সরিয়ে ফেলা হয়েছে

  // ক্লায়েন্ট-সাইড লজিক অপরিবর্তিত থাকবে
  useEffect(() => {
    // Note: This logic seems to have a small bug. It should set sections for both source and destination.
    // Corrected logic:
    if (sourceClass) {
        supabase.from('sections').select('id, name').eq('class_id', sourceClass).then(({data}) => setSourceSections(data || []));
    }
    if (destinationClass) {
        supabase.from('sections').select('id, name').eq('class_id', destinationClass).then(({data}) => setDestinationSections(data || []));
    }
  }, [sourceClass, destinationClass]);


  const fetchAndFormatStudents = useCallback(async (queryBuilder: any) => {
    setIsLoading(true);
    const { data, error } = await queryBuilder;

    if (error) { toast.error('Failed to fetch student data.'); } 
    else {
        const formattedData = data.map((item: any) => {
            const student = Array.isArray(item.students) ? item.students[0] : item.students;
            const cls = Array.isArray(item.classes) ? item.classes[0] : item.classes;
            const sec = Array.isArray(item.sections) ? item.sections[0] : item.sections;
            return {
                student_id: student.id, name: student.name, student_unique_id: student.student_unique_id,
                father_name: student.father_name, current_roll: item.roll_number, current_class: cls.name,
                current_section: sec.name, current_year: item.academic_year, newRoll: '',
                isAlreadyPromoted: promotedStudentIds.has(student.id)
            };
        }).filter((s: any) => s.student_id);
      formattedData.sort((a: StudentInTable, b: StudentInTable) => a.current_roll - b.current_roll);
      setStudentsInTable(formattedData);
      setSelectedStudents(new Set());
    }
    setIsLoading(false);
}, [promotedStudentIds]);

  useEffect(() => {
    if (searchMode === 'class' && sourceYear && sourceClass && sourceSection) {
      const query = supabase.from('enrollments').select('roll_number, academic_year, students!inner(*), classes!inner(name), sections!inner(name)').eq('academic_year', sourceYear).eq('class_id', sourceClass).eq('section_id', sourceSection);
      fetchAndFormatStudents(query);
    } else if (searchMode !== 'id') { // Prevent clearing when switching to ID search
      setStudentsInTable([]);
    }
}, [sourceYear, sourceClass, sourceSection, searchMode, fetchAndFormatStudents]);

  const handleStudentIdSearch = async () => {
      if (!studentIdSearch.trim()) return;
      const query = supabase.from('enrollments').select('roll_number, academic_year, students!inner(*), classes!inner(name), sections!inner(name)').eq('students.student_unique_id', studentIdSearch.trim().toUpperCase()).order('academic_year', { ascending: false });
      fetchAndFormatStudents(query);
  };

  useEffect(() => {
      if (!destinationYear) { setPromotedStudentIds(new Set()); return; }
      supabase.from('enrollments').select('student_id').eq('academic_year', destinationYear).then(({ data }) => {
          if (data) setPromotedStudentIds(new Set(data.map(e => e.student_id)));
      });
  }, [destinationYear]);

  useEffect(() => {
      setStudentsInTable(prev => prev.map(s => ({...s, isAlreadyPromoted: promotedStudentIds.has(s.student_id)})));
  }, [promotedStudentIds]);

  const handleRollChange = (studentId: number, newRoll: string) => { setStudentsInTable(prev => prev.map(s => (s.student_id === studentId ? { ...s, newRoll } : s))); };
  const handleSelectStudent = (studentId: number) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) newSelection.delete(studentId); else newSelection.add(studentId);
    setSelectedStudents(newSelection);
  };

  const handlePromote = async () => {
    if (selectedStudents.size === 0) { toast.error('Please select students.'); return; }
    if (!destinationYear || !destinationClass || !destinationSection) { toast.error('Please select a destination.'); return; }
    const toastId = toast.loading('Processing promotion...');
    const studentsToEnroll = studentsInTable.filter(s => selectedStudents.has(s.student_id));
    if (parseInt(destinationYear) < parseInt(sourceYear || studentsToEnroll[0]?.current_year || '0')) {
        toast.error('Cannot demote students to a past year.', { id: toastId });
        return;
    }
    const rollNumbers = studentsToEnroll.map(s => s.newRoll).filter(roll => roll);
    if (new Set(rollNumbers).size !== rollNumbers.length) { toast.error('Duplicate new roll numbers found.', { id: toastId }); return; }
    const newEnrollments = studentsToEnroll.map(s => ({ student_id: s.student_id, class_id: destinationClass, section_id: destinationSection, academic_year: destinationYear, roll_number: s.newRoll ? parseInt(s.newRoll, 10) : null, status: 'Promoted' }));
    const { error } = await supabase.from('enrollments').insert(newEnrollments);
    if (error) { toast.error(`Promotion failed: ${error.message}`, { id: toastId }); } 
    else {
      toast.success(`${newEnrollments.length} students promoted!`, { id: toastId });
      setStudentsInTable([]); setSelectedStudents(new Set());
      setSourceYear(''); setSourceClass(''); setSourceSection('');
      setStudentIdSearch('');
    }
  };

  const sourceClassesFiltered = allClasses.filter(c => c.academic_year === sourceYear);
  const destinationClassesFiltered = allClasses.filter(c => c.academic_year === destinationYear);
  const futureYears = academicYears.filter(y => parseInt(y.academic_year) >= parseInt(sourceYear || '0'));

  // --- JSX Rendering (অপরিবর্তিত) ---
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>← Back</button>
        <h1><FiAward /> Promote Students</h1>
      </header>
      <main className={styles.content}>
        <div className={styles.card}>
            <div className={styles.searchModeToggle}>
                <button onClick={() => setSearchMode('class')} className={searchMode === 'class' ? styles.active : ''}><FiUsers/> Search by Class</button>
                <button onClick={() => setSearchMode('id')} className={searchMode === 'id' ? styles.active : ''}><FiUserCheck/> Search by Student ID</button>
            </div>

            {searchMode === 'class' ? (
                <div className={styles.subCard}>
                    <h4>Select Source Class</h4>
                    <div className={styles.formGrid}>
                        <div className={styles.selectWrapper}><select value={sourceYear} onChange={(e) => { setSourceYear(e.target.value); setSourceClass(''); setSourceSection(''); }} className={styles.select}><option value="">-- Year --</option>{academicYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}</select></div>
                        <div className={styles.selectWrapper}><select value={sourceClass} onChange={(e) => { setSourceClass(e.target.value); setSourceSection(''); }} className={styles.select} disabled={!sourceYear}><option value="">-- Class --</option>{sourceClassesFiltered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div className={styles.selectWrapper}><select value={sourceSection} onChange={(e) => setSourceSection(e.target.value)} className={styles.select} disabled={!sourceClass}><option value="">-- Section --</option>{sourceSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                </div>
            ) : (
                 <div className={styles.subCard}>
                    <h4>Find Student by ID</h4>
                    <div className={styles.directoryControls}>
                        <div className={styles.searchWrapper}><input type="text" placeholder="Enter Student ID (e.g., ABC250001)" value={studentIdSearch} onChange={(e) => setStudentIdSearch(e.target.value)} className={styles.input} /></div>
                        <button onClick={handleStudentIdSearch} className={styles.actionButton}><FiSearch /> Find Student</button>
                    </div>
                </div>
            )}
        </div>

        {isLoading ? <div className={styles.card}><p>Loading...</p></div> : studentsInTable.length > 0 && (
            <div className={styles.card}>
                <h4>Select Students to Promote</h4>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
<thead><tr><th>Select & Roll</th><th>Name & ID</th><th>Current Enrollment</th><th>Father&apos;s Name</th><th>New Roll</th></tr></thead>
                        <tbody>
                            {studentsInTable.map(student => (
                                <tr key={student.student_id}>
                                    <td className={styles.selectAndRollCell}>
                                        {student.isAlreadyPromoted ? <span className={styles.promotedTag}>Promoted</span> : (
                                            <input type="checkbox" className={styles.bigCheckbox} checked={selectedStudents.has(student.student_id)} onChange={() => handleSelectStudent(student.student_id)} />
                                        )}
                                        <span className={styles.currentRoll}>{student.current_roll}</span>
                                    </td>
                                    <td>
                                      <div>{student.name}</div>
                                      <div className={styles.studentIdSubtle}>{student.student_unique_id}</div>
                                    </td>
                                    <td>{`${student.current_class} - ${student.current_section} (${student.current_year})`}</td>
                                    <td>{student.father_name || 'N/A'}</td>
                                    <td>
                                        {selectedStudents.has(student.student_id) && !student.isAlreadyPromoted && (
                                            <input type="number" placeholder="Roll" className={styles.rollInput} value={student.newRoll} onChange={(e) => handleRollChange(student.student_id, e.target.value)} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.subCard} style={{marginTop: '30px'}}>
                    <h4>Promote To</h4>
                    <div className={styles.formGrid}>
                        <div className={styles.selectWrapper}><select value={destinationYear} onChange={(e) => { setDestinationYear(e.target.value); setDestinationClass(''); setDestinationSection(''); }} className={styles.select} disabled={!sourceYear && searchMode !== 'id'}><option value="">-- To Year --</option>{futureYears.map(y => <option key={y.academic_year} value={y.academic_year}>{y.academic_year}</option>)}</select></div>
                        <div className={styles.selectWrapper}><select value={destinationClass} onChange={(e) => { setDestinationClass(e.target.value); setDestinationSection(''); }} className={styles.select} disabled={!destinationYear}><option value="">-- To Class --</option>{destinationClassesFiltered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div className={styles.selectWrapper}><select value={destinationSection} onChange={(e) => setDestinationSection(e.target.value)} className={styles.select} disabled={!destinationClass}><option value="">-- To Section --</option>{destinationSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                    <button onClick={handlePromote} className={styles.actionButton} disabled={selectedStudents.size === 0} style={{width: '100%', marginTop: '20px'}}><FiAward /> Promote {selectedStudents.size} Selected Students</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

// ✅ ধাপ ৫: getServerSideProps ফাংশন যোগ করা
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const permissionResult = await checkPermissionAndGetRole(context);
  if ('redirect' in permissionResult) {
    return permissionResult;
  }

  const supabase = createPagesServerClient(context);

  // সার্ভারে দুটি ডেটা একসাথে আনা হচ্ছে (parallel fetching)
  const [yearsResponse, classesResponse] = await Promise.all([
    supabase.rpc('get_distinct_academic_years'),
    supabase.from('classes').select('id, name, academic_year')
  ]);

  // error handling সহ ডেটা প্রস্তুত করা
  const initialAcademicYears = yearsResponse.data || [];
  const initialAllClasses = classesResponse.data || [];
  if (yearsResponse.error) console.error("SSR Error fetching years:", yearsResponse.error.message);
  if (classesResponse.error) console.error("SSR Error fetching classes:", classesResponse.error.message);

  return {
    props: {
      ...permissionResult.props, // এটা userRole প্রপটিকে পাস করবে
      initialAcademicYears,
      initialAllClasses,
    },
  };
}