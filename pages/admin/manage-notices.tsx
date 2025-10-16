// pages/admin/manage-notices.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>;
  }
}

// নোটিশের জন্য টাইপ
type Notice = {
  id: number;
  created_at: string;
  title: string;
  notice_date: string;
  details: string | null;
};

// SVG আইকন
const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function ManageNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  useEffect(() => {
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jspdfScript.async = true;

    const html2canvasScript = document.createElement('script');
    html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    html2canvasScript.async = true;

    let scriptsPending = 2;
    const onScriptLoad = () => {
        scriptsPending -= 1;
        if (scriptsPending === 0) setScriptsLoaded(true);
    };

    jspdfScript.onload = onScriptLoad;
    html2canvasScript.onload = onScriptLoad;
    
    document.body.appendChild(jspdfScript);
    document.body.appendChild(html2canvasScript);

    return () => {
        if (jspdfScript.parentNode) jspdfScript.parentNode.removeChild(jspdfScript);
        if (html2canvasScript.parentNode) html2canvasScript.parentNode.removeChild(html2canvasScript);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('notice_date', { ascending: false });

    if (data) setNotices(data);
    else console.error('Error fetching notices:', error);
  };

  const resetForm = () => {
    setTitle('');
    setNoticeDate('');
    setDetails('');
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!title || !noticeDate) {
      toast.error('Please provide a title and date.');
      setIsLoading(false);
      return;
    }

    if (editingId) {
      const noticeToUpdate = { title, notice_date: noticeDate, details };
      
      const { data: originalNotice } = await supabase.from('notices').select('*').eq('id', editingId).single();
      if (!originalNotice) {
        toast.error("Original notice not found. Cannot update.");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from('notices').update(noticeToUpdate).eq('id', editingId);

      if (error) {
        toast.error(`Update failed: ${error.message}`);
      } else {
        await fetchNotices(); 
        toast.custom(
          (t) => (
            <div style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>Notice updated successfully!</span>
              <button
                style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
                onClick={async () => {
                  const revertPayload = {
                    title: originalNotice.title,
                    notice_date: originalNotice.notice_date,
                    details: originalNotice.details,
                  };
                  await supabase.from('notices').update(revertPayload).eq('id', originalNotice.id);
                  
                  toast.dismiss(t.id);
                  await fetchNotices(); 
                  toast.success('Reverted to original state.');
                }}
              >
                Undo
              </button>
            </div>
          ), { duration: 6000 }
        );
        resetForm();
      }

    } else {
      const { error } = await supabase.from('notices').insert([{ title, notice_date: noticeDate, details }]);
      if (error) {
        toast.error(`An error occurred: ${error.message}`);
      } else {
        toast.success('Notice added successfully!');
        resetForm();
        await fetchNotices();
      }
    }
    
    setIsLoading(false);
  };

  const handleEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setNoticeDate(notice.notice_date);
    setDetails(notice.details || '');
    window.scrollTo(0, 0);
  };

  const openDeleteModal = (id: number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const noticeId = itemToDelete;
    const noticeToDelete = notices.find(n => n.id === noticeId);
    if (!noticeToDelete) return;

    setIsConfirmModalOpen(false);
    setNotices(prev => prev.filter(n => n.id !== noticeId));

    const timeout = setTimeout(async () => {
      await supabase.from('notices').delete().eq('id', noticeId);
      toast.success(`Notice "${noticeToDelete.title}" permanently deleted.`);
    }, 5000);

    toast.custom((t) => (
      <div style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* ✅ সংশোধন: এখানে ডাবল কোটেশন (" ") পরিবর্তন করে &quot; ব্যবহার করা হয়েছে */}
        <span>Notice &quot;{noticeToDelete.title}&quot; deleted.</span>
        <button
          style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px' }}
          onClick={() => {
            clearTimeout(timeout);
            setNotices(prev => [...prev, noticeToDelete].sort((a, b) => new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime()));
            toast.success(`Restored "${noticeToDelete.title}"`, { id: t.id, duration: 3000 });
          }}
        >
          Undo
        </button>
      </div>
    ), { duration: 5000, id: `delete-notice-${noticeId}` });
    
    setItemToDelete(null);
  };

  const handleDownloadPDF = (notice: Notice) => {
    if (!scriptsLoaded) {
        alert('PDF library is loading, please wait a moment.');
        return;
    }
    
    const printableArea = document.createElement('div');
    printableArea.style.width = '210mm';
    printableArea.style.height = '297mm';
    printableArea.style.position = 'absolute';
    printableArea.style.left = '-9999px';
    printableArea.style.top = '0';
    printableArea.style.boxSizing = 'border-box';
    printableArea.style.overflow = 'hidden';

    printableArea.innerHTML = `
        <style>@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&display=swap');</style>
        <img src="/notice-template.png" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;" />
        <p style="font-family: 'Hind Siliguri', sans-serif; position: absolute; top: 250px; left: 100px; font-size: 22px; font-weight: bold; color: #000; z-index: 2;">বিষয়: ${notice.title}</p>
        <p style="font-family: 'Hind Siliguri', sans-serif; position: absolute; top: 300px; left: 100px; font-size: 16px; line-height: 1.7; width: 600px; color: #000; text-align: justify; white-space: pre-wrap; z-index: 2;">${notice.details || 'কোনো বিস্তারিত তথ্য নেই।'}</p>
    `;
    document.body.appendChild(printableArea);
    const { jsPDF } = window.jspdf;
    window.html2canvas(printableArea, { scale: 3, useCORS: true }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        pdf.save(`${notice.title.replace(/\s+/g, '_')}.pdf`);
        document.body.removeChild(printableArea);
    });
  };

  return (
    <>
      <style>{`
        .pageContainer {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #e0f7fa 0%, #fff9c4 50%, #fce4ec 100%);
          background-attachment: fixed;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
        }
        .header {
          background-color: transparent;
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.07);
          margin-bottom: 20px;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 1.8rem;
          color: #263238;
          font-weight: 600;
        }
        .backButton {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid #ddd;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          text-decoration: none;
          color: #263238;
          white-space: nowrap;
        }
        .backButton:hover {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        main { max-width: 900px; margin: 0 auto; }
        .formContainer, .noticeListContainer {
          background-color: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          margin-bottom: 30px;
        }
        .formTitle, .noticeListContainer h2 {
          text-align: center; margin-top: 0; margin-bottom: 30px;
          color: #263238; font-weight: 600;
          border-bottom: 1px solid #e0e6ed; padding-bottom: 15px;
        }
        .formGroup { margin-bottom: 20px; }
        .formGroup label { display: block; margin-bottom: 8px; font-weight: 500; color: #37474f; }
        .formInput, .formTextarea {
          width: 100%; padding: 12px; font-size: 1rem;
          border: 1px solid #cdd7e1; border-radius: 8px;
          background-color: #fff; transition: all 0.2s ease;
        }
        .formInput:focus, .formTextarea:focus { outline: none; border-color: #5C6BC0; box-shadow: 0 0 0 3px rgba(92, 107, 192, 0.2); }
        .buttonGroup { display: flex; gap: 15px; align-items: center; justify-content: center; margin-top: 20px; }
        .submitButton {
          padding: 12px 30px; font-size: 1.1rem; font-weight: 600;
          color: white; background-color: #5C6BC0; border: none;
          border-radius: 25px; cursor: pointer; transition: all 0.3s ease;
        }
        .submitButton:hover { background-color: #3f51b5; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(92, 107, 192, 0.3); }
        .submitButton:disabled { background-color: #ccc; cursor: not-allowed; }
        .cancelButton {
          padding: 12px 30px; font-size: 1.1rem; font-weight: 600;
          color: #555; background-color: transparent;
          border: 1px solid #ccc; border-radius: 25px;
          cursor: pointer; transition: all 0.3s ease;
        }
        .cancelButton:hover { background-color: #f1f1f1; border-color: #aaa; }
        .noticeList { list-style: none; padding: 0; margin: 0; }
        .noticeListItem { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eef2f7; flex-wrap: wrap; gap: 10px; }
        .noticeListItem:last-child { border-bottom: none; }
        .noticeInfo { display: flex; flex-direction: column; gap: 5px; flex-grow: 1; }
        .noticeInfo strong { font-size: 1.1rem; color: #263238; }
        .noticeInfo span { font-size: 0.9rem; color: #78909c; }
        .actionButtons { display: flex; gap: 10px; flex-shrink: 0; }
        .editButton, .deleteButton, .downloadButton { padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
        .editButton { background-color: #42a5f5; color: white; }
        .editButton:hover { background-color: #1e88e5; transform: translateY(-1px); }
        .deleteButton { background-color: #ef5350; color: white; }
        .deleteButton:hover { background-color: #e53935; transform: translateY(-1px); }
        .downloadButton { background-color: #66bb6a; color: white; }
        .downloadButton:hover { background-color: #43a047; transform: translateY(-1px); }
      `}</style>
      <div className="pageContainer">
        <header className="header">
          <Link href="/admin/dashboard" legacyBehavior>
                <a className="backButton">← Back to Dashboard</a>
          </Link>
          <h1>Manage Notices</h1>
        </header>

        <main className="content">
          <div className="formContainer"> 
            <form onSubmit={handleSubmit}>
              <h2 className="formTitle">{editingId ? 'Edit Notice' : 'Add New Notice'}</h2>
              <div className="formGroup">
                <label htmlFor="title">Title</label>
                <input id="title" type="text" className="formInput" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="formGroup">
                <label htmlFor="noticeDate">Date</label>
                <input id="noticeDate" type="date" className="formInput" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} required />
              </div>
              <div className="formGroup">
                <label htmlFor="details">Details (Optional)</label>
                <textarea
                  id="details"
                  className="formTextarea"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={10}
                  placeholder="নোটিশের বিস্তারিত বিবরণ এখানে লিখুন..."
                />
              </div>
              <div className="buttonGroup">
                <button type="submit" className="submitButton" disabled={isLoading}>
                  {isLoading ? 'Processing...' : (editingId ? 'Update Notice' : 'Add Notice')}
                </button>
                {editingId && (
                  <button type="button" className="cancelButton" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="noticeListContainer">
            <h2>Existing Notices</h2>
            <ul className="noticeList">
              {notices.map((notice) => (
                <li key={notice.id} className="noticeListItem">
                  <div className="noticeInfo">
                    <strong>{notice.title}</strong>
                    <span>{new Date(notice.notice_date).toLocaleDateString()}</span>
                  </div>
                  <div className="actionButtons">
                    <button onClick={() => handleDownloadPDF(notice)} className="downloadButton" title="Download as PDF" disabled={!scriptsLoaded}>
                      <DownloadIcon />
                    </button>
                    <button onClick={() => handleEdit(notice)} className="editButton">Edit</button>
                    <button onClick={() => openDeleteModal(notice.id)} className="deleteButton">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this notice?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </>
  );
}