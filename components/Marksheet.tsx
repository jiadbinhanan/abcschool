// components/Marksheet.tsx
import styles from '../styles/Marksheet.module.css';
import { FiDownload, FiX } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Type definitions remain the same ---
type Result = { subject_id: number; subject_name: string; full_marks: number; marks_obtained: number; };
type StudentResult = {
  student_name: string;
  roll_number: number;
  percentage: number;
  total_marks: number;
  total_full_marks: number;
  subjects: Result[];
  class_name: string;
  section_name: string;
  exam_name: string;
};
type MarksheetProps = {
  student: StudentResult;
  onClose: () => void;
};
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'O', remarks: 'Outstanding' };
    if (percentage >= 80) return { grade: 'A+', remarks: 'Excellent' };
    if (percentage >= 70) return { grade: 'A', remarks: 'Very Good' };
    if (percentage >= 60) return { grade: 'B+', remarks: 'Good' };
    if (percentage >= 50) return { grade: 'B', remarks: 'Satisfactory' };
    if (percentage >= 40) return { grade: 'C', remarks: 'Needs Improvement' };
    if (percentage < 40) return { grade: 'F', remarks: 'Fail' };
    return { grade: 'N/A', remarks: '' };
};

export default function Marksheet({ student, onClose }: MarksheetProps) {
  const { grade, remarks } = getGrade(student.percentage);

  const downloadMarksheetPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let currentY = 20;

    // 1. Full Page Border (Double Border)
    doc.setDrawColor('#C9A050');
    doc.setLineWidth(1.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // 2. Top Section: School Name & Address (Maroon Color)
    doc.setFontSize(26);
    doc.setFont('times', 'bold');
    doc.setTextColor('#800000');
    doc.text("A B C Academy", pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.setTextColor('#555');
    doc.text("Abc street, Murshidabad - 742304", pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

        // --- Separator Line ---
    doc.setDrawColor('#AAAAAA');
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10; // কার্ড এবং লাইনের মধ্যেকার দূরত্ব
    
    // --- Main Container Card Start ---
    const mainCardStartY = currentY;

    // নতুন লাইন: কার্ডের ভেতরে প্যাডিং যোগ করার জন্য
    currentY += 5; // <<-- এই মানটি পরিবর্তন করে লেখাকে নিচে নামান
    
    // --- Title inside Main Card ---
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.setTextColor('#333');
    doc.text(`${student.exam_name} Examination Progress Report Card`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text("Academic Year 2025", pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // --- First Sub-card: Student Info ---
    const studentInfoCardY = currentY;
    const studentInfoCardHeight = 22;
    doc.setDrawColor('#CCCCCC');
    doc.setLineWidth(0.2);
    doc.rect(margin + 5, studentInfoCardY, pageWidth - (2 * (margin + 5)), studentInfoCardHeight);
    
    doc.setFontSize(11);
    doc.setFont('times', 'italic');
    doc.setTextColor('#4A4A4A');
    doc.text(`Student Name: ${student.student_name}`, margin + 10, studentInfoCardY + 8);
    doc.text(`Roll No: ${student.roll_number}`, margin + 10, studentInfoCardY + 15);
    doc.text(`Class: ${student.class_name}`, pageWidth - margin - 60, studentInfoCardY + 8);
    doc.text(`Section: ${student.section_name}`, pageWidth - margin - 60, studentInfoCardY + 15);
    currentY += studentInfoCardHeight + 10;

    // --- Second Sub-card: Marks Table ---
    const tableStartY = currentY;
    const tableColumn = ["Subject", "Full Marks", "Marks Obtained", "Subject Grade", "Remarks"];
    const tableRows = student.subjects.map(sub => {
        const subjectPercentage = (sub.marks_obtained / sub.full_marks) * 100;
        const subjectGradeInfo = getGrade(subjectPercentage);
        return [sub.subject_name, sub.full_marks, sub.marks_obtained, subjectGradeInfo.grade, subjectGradeInfo.remarks];
    });
    tableRows.push(['Total', student.total_full_marks, student.total_marks, grade, remarks]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      theme: 'grid',
      headStyles: { fillColor: '#1A237E', textColor: '#FFFFFF', lineWidth: 0.2, lineColor: '#CCCCCC' },
      styles: { cellPadding: 3, fontSize: 10, font: 'times', lineWidth: 0.2, lineColor: '#CCCCCC' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 60 }
      },
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: function (data) {
        const tableWidth = pageWidth - data.settings.margin.left - data.settings.margin.right;
        let tableHeight = 0;
        data.table.head.forEach(row => tableHeight += row.height);
        data.table.body.forEach(row => tableHeight += row.height);

        doc.setDrawColor('#CCCCCC');
        doc.setLineWidth(0.2);
        doc.rect(data.settings.margin.left, data.settings.startY, tableWidth, tableHeight);
      },
      margin: { left: margin + 5, right: margin + 5 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // --- Third Sub-card: Summary ---
    const summaryCardY = currentY;
    const summaryCardHeight = 20;
    doc.setDrawColor('#CCCCCC');
    doc.setLineWidth(0.2);
    doc.rect(margin + 5, summaryCardY, pageWidth - (2 * (margin + 5)), summaryCardHeight);

    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.setTextColor('#4A4A4A');
    doc.text(`Total Marks: ${student.total_marks} / ${student.total_full_marks}`, margin + 10, summaryCardY + 8);
    doc.text(`Percentage: ${student.percentage}%`, margin + 10, summaryCardY + 16);
    doc.text(`Final Grade: ${grade}`, pageWidth - margin - 80, summaryCardY + 8);
    doc.text(`Remarks: ${remarks}`, pageWidth - margin - 80, summaryCardY + 16);
    currentY += summaryCardHeight + 10;

    // --- Draw Main Container's Double Border ---
    const mainCardHeight = currentY - mainCardStartY;
    doc.setDrawColor('#AAAAAA');
    doc.setLineWidth(0.4);
    doc.rect(margin, mainCardStartY - 5, pageWidth - (2 * margin), mainCardHeight + 5);
    doc.setLineWidth(0.2);
    doc.rect(margin + 1, mainCardStartY - 4, pageWidth - (2 * (margin+1)), mainCardHeight + 3);

    // --- Qualification Remark (Below Main Card) ---
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('times', 'italic');
    const qualificationText = grade === 'F' ? "Needs Improvement to Qualify" : "Student successfully qualified this exam";
    doc.text(qualificationText, pageWidth / 2, currentY, { align: 'center' });

    // --- Footer with Signatures ---
    const signatureY = pageHeight - 30;
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.setTextColor('#555555');
    doc.setDrawColor('#8D6E63');
    doc.setLineWidth(0.5);
    doc.line(margin, signatureY, margin + 50, signatureY);
    doc.text("Institution's Seal", margin + 5, signatureY + 5);
    doc.line(pageWidth / 2 - 25, signatureY, pageWidth / 2 + 25, signatureY);
    doc.text("Headmaster's Signature", pageWidth / 2, signatureY + 5, { align: 'center' });
    doc.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);
    doc.text("Guardian's Signature", pageWidth - margin - 25, signatureY + 5, { align: 'center' });
    
    doc.save(`${student.student_name}_report_card.pdf`);
  };

  return (
    // JSX part remains unchanged
    <div className={styles.modalOverlay}>
      <div className={styles.marksheetContainer}>
        <div className={styles.marksheetContent}>
            <div className={styles.marksheetHeader}>
                <div className={styles.schoolTitleBlock}>
                    <h2>A B C Academy</h2>
                    <p>Abc street, Murshidabad - 742304</p>
                </div>
                <button onClick={onClose} className={styles.closeButton}><FiX /></button>
            </div>
            <div className={styles.mainCard}>
                <div className={styles.reportCardTitleBlock}>
                    <h3>{student.exam_name} Examination Progress Report Card</h3>
                    <p>Academic Year 2025</p>
                </div>
                <div className={styles.studentInfoBlock}>
                    <div className={styles.infoRow}>
                        <div className={styles.infoItem}><strong>Student Name:</strong> <span>{student.student_name}</span></div>
                        <div className={styles.infoItem}><strong>Roll No:</strong> <span>{student.roll_number}</span></div>
                    </div>
                    <div className={styles.infoRow}>
                        <div className={styles.infoItem}><strong>Class:</strong> <span>{student.class_name}</span></div>
                        <div className={styles.infoItem}><strong>Section:</strong> <span>{student.section_name}</span></div>
                    </div>
                </div>
                <div className={styles.resultsTableBlock}>
                    <table className={styles.resultsTable}>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Full Marks</th>
                                <th>Marks Obtained</th>
                                <th>Grade</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {student.subjects.map((sub: Result) => {
                                const subjectPercentage = (sub.marks_obtained / sub.full_marks) * 100;
                                const { grade: subjectGrade, remarks: subjectRemarks } = getGrade(subjectPercentage);
                                return (
                                    <tr key={sub.subject_id}>
                                        <td>{sub.subject_name}</td>
                                        <td>{sub.full_marks}</td>
                                        <td>{sub.marks_obtained}</td>
                                        <td>{subjectGrade}</td>
                                        <td>{subjectRemarks}</td>
                                    </tr>
                                );
                            })}
                            <tr className={styles.totalRow}>
                                <td>Total</td>
                                <td>{student.total_full_marks}</td>
                                <td>{student.total_marks}</td>
                                <td>{grade}</td>
                                <td>{remarks}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className={styles.summaryBlock}>
                    <div className={styles.summaryItem}><span>Total Marks</span><strong>{student.total_marks} / {student.total_full_marks}</strong></div>
                    <div className={styles.summaryItem}><span>Percentage</span><strong>{student.percentage}%</strong></div>
                    <div className={styles.summaryItem}><span>Final Grade</span><strong>{grade}</strong></div>
                    <div className={styles.summaryItem}><span>Remarks</span><strong>{remarks}</strong></div>
                </div>
                <div className={styles.signaturesBlock}>
                    <div className={styles.signature}>Institution's Seal</div>
                    <div className={styles.signature}>Headmaster's Signature</div>
                    <div className={styles.signature}>Guardian's Signature</div>
                </div>
            </div>
        </div>
        <div className={styles.buttonContainer}>
            <button onClick={downloadMarksheetPDF} className={styles.downloadButton}><FiDownload/> Download as PDF</button>
        </div>
      </div>
    </div>
  );
}
