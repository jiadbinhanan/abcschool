// pages/admin/manage-notices.tsx

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import styles from '../../styles/AdminDashboard.module.css';
import noticeStyles from '../../styles/ManageNotices.module.css'; // নতুন CSS ফাইল

// নোটিশের জন্য টাইপ (details সহ)
type Notice = {
  id: number;
  created_at: string;
  title: string;
  notice_date: string;
  details: string | null;
};

export default function ManageNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // কোন নোটিশ এডিট হচ্ছে তার ID

  // পেজ লোড হওয়ার সাথে সাথে সব নোটিশ fetch করা
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('notice_date', { ascending: false });

    if (data) {
      setNotices(data);
    } else {
      console.error('Error fetching notices:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setNoticeDate('');
    setDetails('');
    setEditingId(null);
  };

  // Form সাবমিট করার ফাংশন (Add এবং Update দুটোই হ্যান্ডেল করবে)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!title || !noticeDate) {
      setMessage('Please provide a title and date.');
      setIsLoading(false);
      return;
    }

    let error;
    if (editingId) {
      // --- Update Logic ---
      const { error: updateError } = await supabase
        .from('notices')
        .update({ title, notice_date: noticeDate, details })
        .eq('id', editingId);
      error = updateError;
    } else {
      // --- Insert Logic ---
      const { error: insertError } = await supabase
        .from('notices')
        .insert([{ title, notice_date: noticeDate, details }]);
      error = insertError;
    }

    if (error) {
      setMessage(`An error occurred: ${error.message}`);
    } else {
      setMessage(editingId ? 'Notice updated successfully!' : 'Notice added successfully!');
      resetForm();
      await fetchNotices(); // তালিকা রিফ্রেশ করুন
    }
    
    setIsLoading(false);
  };

  const handleEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setNoticeDate(notice.notice_date);
    setDetails(notice.details || '');
    window.scrollTo(0, 0); // পেজের উপরে স্ক্রল করুন
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) {
        setMessage(`Error deleting notice: ${error.message}`);
      } else {
        setMessage('Notice deleted successfully!');
        await fetchNotices(); // তালিকা রিফ্রেশ করুন
      }
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <header className={styles.header}>
        <h1>Manage Notices</h1>
        <p>Add, edit, or delete notices for the website from here.</p>
      </header>

      <main>
        <div className={styles.formContainer}> 
          <form onSubmit={handleSubmit}>
            <h2 className={noticeStyles.formTitle}>{editingId ? 'Edit Notice' : 'Add New Notice'}</h2>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input id="title" type="text" className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="noticeDate">Date</label>
              <input id="noticeDate" type="date" className={styles.formInput} value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="details">Details (Optional)</label>
              <textarea id="details" className={styles.formTextarea} value={details} onChange={(e) => setDetails(e.target.value)} rows={5} />
            </div>
            <div className={noticeStyles.buttonGroup}>
              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? 'Processing...' : (editingId ? 'Update Notice' : 'Add Notice')}
              </button>
              {editingId && (
                <button type="button" className={noticeStyles.cancelButton} onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
          {message && <p className={styles.formMessage}>{message}</p>}
        </div>

        <div className={noticeStyles.noticeListContainer}>
          <h2>Existing Notices</h2>
          <ul className={noticeStyles.noticeList}>
            {notices.map((notice) => (
              <li key={notice.id} className={noticeStyles.noticeListItem}>
                <div className={noticeStyles.noticeInfo}>
                  <strong>{notice.title}</strong>
                  <span>{new Date(notice.notice_date).toLocaleDateString()}</span>
                </div>
                <div className={noticeStyles.actionButtons}>
                  <button onClick={() => handleEdit(notice)} className={noticeStyles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(notice.id)} className={noticeStyles.deleteButton}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.backLinkContainer}>
           <Link href="/admin/dashboard" legacyBehavior>
                <a className={styles.logoutButton}>Back to Dashboard</a>
           </Link>
        </div>
      </main>
    </div>
  );
}