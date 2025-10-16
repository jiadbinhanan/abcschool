// pages/admin/manage-academic-years.tsx

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import styles from '../../styles/ManageStudents.module.css';
import { FiPlus, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

type AcademicYear = {
  id: number;
  year_name: string;
  is_active: boolean;
};

export default function ManageAcademicYears() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [newYearName, setNewYearName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const fetchYears = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('academic_years').select('*').order('year_name', { ascending: false });
    if (error) {
      toast.error('Error fetching academic years');
    } else {
      setYears(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleAddYear = async (e: FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim() || isNaN(Number(newYearName))) {
      toast.error('Please enter a valid year (e.g., 2026)');
      return;
    }
    const { error } = await supabase.from('academic_years').insert({ year_name: newYearName });
    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success('Academic year added successfully!');
      setNewYearName('');
      fetchYears();
    }
  };
  
  const openDeleteModal = (id: number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const yearId = itemToDelete;
    const yearToDelete = years.find(y => y.id === yearId);
    if (!yearToDelete) return;

    setIsConfirmModalOpen(false);
    setYears(prev => prev.filter(y => y.id !== yearId));

    const timeout = setTimeout(async () => {
      await supabase.from('academic_years').delete().eq('id', yearId);
      toast.success(`Academic Year "${yearToDelete.year_name}" permanently deleted.`);
    }, 5000);

    toast.custom((t) => (
      <div style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* এখানে ডাবল কোটেশন (" ") পরিবর্তন করে &quot; ব্যবহার করা হয়েছে */}
        <span>Year &quot;{yearToDelete.year_name}&quot; deleted.</span>
        <button style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
          onClick={() => {
            clearTimeout(timeout);
            setYears(prev => [...prev, yearToDelete].sort((a, b) => b.year_name.localeCompare(a.year_name)));
            toast.success(`Restored "${yearToDelete.year_name}"`, { id: t.id, duration: 3000 });
          }}>
          Undo
        </button>
      </div>
    ), { duration: 5000, id: `delete-year-${yearId}` });
    
    setItemToDelete(null);
  };

  const handleSetActive = async (yearId: number) => {
    const toastId = toast.loading('Setting active year...');
    const { error } = await supabase.rpc('set_active_year', { year_id: yearId });
    
    toast.dismiss(toastId);

    if (error) {
      toast.error(`Error setting active year: ${error.message}`);
    } else {
      toast.success('Active year has been updated.');
      fetchYears();
    }
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin/dashboard')} className={styles.backButton}>← Back</button>
          <h1>Manage Academic Years</h1>
        </header>

        <main className={styles.contentGrid}>
          <div className={styles.card}>
            <h2>Add New Year</h2>
            <form onSubmit={handleAddYear} className={styles.form}>
              <input 
                type="number" 
                placeholder="e.g., 2026" 
                value={newYearName} 
                onChange={(e) => setNewYearName(e.target.value)} 
                className={styles.input} 
              />
              <button type="submit" className={styles.addButton}><FiPlus /></button>
            </form>
          </div>

          <div className={styles.card}>
            <h2>Existing Academic Years</h2>
            {loading ? <p>Loading...</p> : (
              <ul className={styles.list}>
                {years.map((year) => (
                  <li key={year.id} className={`${styles.listItem} ${year.is_active ? styles.active : ''}`}>
                    <span style={{ fontWeight: year.is_active ? 'bold' : 'normal', color: year.is_active ? '#DAA520' : 'inherit' }}>
                      {year.year_name} {year.is_active && ' (Active)'}
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {!year.is_active && (
                         <button onClick={() => handleSetActive(year.id)} className={styles.actionButton} style={{backgroundColor: '#28a745'}}>
                           <FiCheckCircle /> Set Active
                         </button>
                      )}
                      <button onClick={() => openDeleteModal(year.id)} className={styles.deleteButton}><FiTrash2 /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      <ConfirmationModal
          isOpen={isConfirmModalOpen}
          title="Confirm Deletion"
          message="Are you sure you want to delete this academic year?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmModalOpen(false)}
      />
    </>
  );
}