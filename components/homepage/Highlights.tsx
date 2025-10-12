// components/homepage/Highlights.tsx

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';

// ✅ TypeScript-কে জানানোর জন্য যে window অবজেক্টে jspdf এবং html2canvas থাকবে
declare global {
  interface Window {
    jspdf: any;
    html2canvas: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>;
  }
}

// Notice টাইপ
export type Notice = {
  id: number;
  title: string;
  notice_date: string;
  details: string | null;
};

// Props-এর জন্য টাইপ
type HighlightsProps = {
  notices: Notice[];
};

// Events-এর ডেটা
const events = [
  { id: 1, title: 'Annual Sports Day Highlights', image: '/events/sports.jpg' },
  { id: 2, title: 'Science Exhibition Winners', image: '/events/science.jpg' },
  { id: 3, title: 'Cultural Fest Moments', image: '/events/cultural.jpg' },
];

// ডাউনলোড আইকনের জন্য SVG
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

// NoticeDate কম্পোনেন্ট
const NoticeDate = ({ dateString }: { dateString: string }) => {
  const [formattedDate, setFormattedDate] = useState({ day: '', month: '' });

  useEffect(() => {
    const date = new Date(dateString);
    setFormattedDate({
      day: date.getDate().toString(),
      month: date.toLocaleString('default', { month: 'short' }),
    });
  }, [dateString]);

  if (!formattedDate.day) {
    return <div className="noticeDate"></div>;
  }

  return (
    <div className="noticeDate" style={{backgroundColor: '#4a90e2', color: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', lineHeight: 1.2}}>
      <span style={{fontSize: '1.5rem', display: 'block'}}>{formattedDate.day}</span>
      {formattedDate.month}
    </div>
  );
};

export default function Highlights({ notices }: HighlightsProps) {
  const [expandedNoticeId, setExpandedNoticeId] = useState<number | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

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

  const handleToggle = (id: number) => {
    setExpandedNoticeId(prevId => (prevId === id ? null : id));
  };

  const handleDownloadPDF = (notice: Notice) => {
    if (!scriptsLoaded) {
        alert('PDF লাইব্রেরি এখনও লোড হচ্ছে, অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।');
        return;
    }
    
    const printableArea = document.createElement('div');
    // স্টাইল আগের মতোই থাকবে
    printableArea.style.width = '210mm';
    printableArea.style.height = '297mm';
    printableArea.style.position = 'absolute';
    printableArea.style.left = '-9999px';
    printableArea.style.top = '0';
    printableArea.style.boxSizing = 'border-box';
    printableArea.style.overflow = 'hidden'; // Ensure nothing spills out

    // ✅ পরিবর্তন: background-image এর পরিবর্তে <img> ট্যাগ এবং তার উপরে p ট্যাগ
    printableArea.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&display=swap');
        </style>

        {/* টেমপ্লেটকে একটি আসল <img> ট্যাগ হিসেবে ব্যবহার করা হচ্ছে */}
        <img 
            src="/notice-template.png" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;" 
        />

        {/* লেখাগুলোকে z-index দিয়ে ছবির উপরে রাখা হচ্ছে */}
        <p style="font-family: 'Hind Siliguri', sans-serif; position: absolute; top: 250px; left: 100px; font-size: 22px; font-weight: bold; color: #000; z-index: 2;">
            বিষয়: ${notice.title}
        </p>
        <p style="font-family: 'Hind Siliguri', sans-serif; position: absolute; top: 300px; left: 100px; font-size: 16px; line-height: 1.7; width: 600px; color: #000; text-align: justify; white-space: pre-wrap; z-index: 2;">
            ${notice.details || 'কোনো বিস্তারিত তথ্য নেই।'}
        </p>
    `;

    document.body.appendChild(printableArea);
    
    const { jsPDF } = window.jspdf;

    window.html2canvas(printableArea, {
        scale: 2, 
        useCORS: true,
    }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${notice.title.replace(/\s+/g, '_')}.pdf`);
        
        document.body.removeChild(printableArea);
    });
};

  const slideFromRight: Variants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const slideFromLeft: Variants = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <>
      <style>{`
        .highlightsSection { padding: 4rem 1rem; background-color: #f0f2f5; font-family: 'Segoe UI', sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2.5rem; }
        .columnTitle { font-size: 2rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center; color: #111827; }
        .noticeBoardFrame { background-color: #6f4e37; border: 15px solid #6f4e37; border-radius: 10px; padding: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0,0,0,0.5); }
        .noticeBoardCork { background-color: #d2b48c; background-image: url('https://www.transparenttextures.com/patterns/pinstripe.png'); padding: 20px; height: 500px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .noticePaper { background-color: #fffff0; padding: 15px; border-radius: 5px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15); position: relative; transition: transform 0.2s ease; }
        .noticePaper:nth-child(odd) { transform: rotate(-1.5deg); }
        .noticePaper:nth-child(even) { transform: rotate(1deg); }
        .noticePaper:hover { transform: rotate(0) scale(1.02); z-index: 10; }
        .pin { width: 15px; height: 15px; background-color: #ff4757; border-radius: 50%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4); position: absolute; top: -7px; left: 50%; transform: translateX(-50%); border: 1px solid rgba(0,0,0,0.2); }
        .noticeHeader { display: flex; align-items: center; cursor: pointer; }
        .noticeContent { flex-grow: 1; margin-left: 15px; }
        .noticeTitle { margin: 0; font-weight: 500; color: #333; }
        .noticeDetails { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out, padding-top 0.4s ease-out, margin-top 0.4s ease-out; margin-top: 0; padding-top: 0; }
        .noticeDetails.expanded { max-height: 1000px; margin-top: 15px; padding-top: 15px; border-top: 2px dashed rgba(0,0,0,0.1); }
        .noNotices { color: #fff; background-color: rgba(0,0,0,0.3); padding: 20px; border-radius: 5px; text-align: center; }
        .noticeBoardCork::-webkit-scrollbar { width: 10px; }
        .noticeBoardCork::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .noticeBoardCork::-webkit-scrollbar-thumb { background: #6f4e37; border-radius: 10px; border: 2px solid #d2b48c; }
        .noticeBoardCork::-webkit-scrollbar-thumb:hover { background: #5a3f2d; }
        .downloadButton { margin-top: 15px; padding: 8px 15px; font-size: 0.9rem; font-weight: bold; background-color: #6f4e37; color: white; border: none; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background-color 0.3s; }
        .downloadButton:hover { background-color: #5a3f2d; }
        .downloadButton:disabled { background-color: #9ca3af; cursor: not-allowed; }
        .eventGrid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        .eventCard { position: relative; height: 150px; border-radius: 12px; overflow: hidden; display: flex; align-items: flex-end; padding: 1.5rem; background-size: cover; background-position: center; color: #fff; cursor: pointer; transition: transform 0.3s; }
        .eventCard:hover { transform: scale(1.03); }
        .eventOverlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); }
        .eventTitle { position: relative; z-index: 2; margin: 0; font-size: 1.3rem; }
      `}</style>
      <section className="highlightsSection">
        <div className="container">
          <motion.div className="column" variants={slideFromRight} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }}>
            <h2 className="columnTitle">Notice Board</h2>
            <div className="noticeBoardFrame">
              <div className="noticeBoardCork">
                {notices && notices.length > 0 ? (
                  notices.map(notice => {
                    const isExpanded = expandedNoticeId === notice.id;
                    return (
                      <div key={notice.id} className="noticePaper">
                        <div className="pin"></div>
                        <div className="noticeHeader" onClick={() => handleToggle(notice.id)}>
                          <NoticeDate dateString={notice.notice_date} />
                          <div className="noticeContent">
                            <p className="noticeTitle">{notice.title}</p>
                          </div>
                        </div>
                        <div className={`noticeDetails ${isExpanded ? 'expanded' : ''}`}>
                          <p><b>বিষয়: {notice.title}</b></p>
                          <p style={{whiteSpace: 'pre-wrap'}}>{notice.details || 'No details available.'}</p>
                          <button className="downloadButton" onClick={() => handleDownloadPDF(notice)} disabled={!scriptsLoaded}>
                            <DownloadIcon /> Download PDF
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="noNotices">No New Notices</p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div className="column" variants={slideFromLeft} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }}>
            <h2 className="columnTitle">Events & Achievements</h2>
            <div className="eventGrid">
              {events.map(event => (
                <motion.div key={event.id}>
                  <div className="eventCard" style={{ backgroundImage: `url(${event.image})` }}>
                    <div className="eventOverlay"></div>
                    <h3 className="eventTitle">{event.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}