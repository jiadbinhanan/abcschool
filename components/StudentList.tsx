// components/StudentList.tsx
import styles from '../styles/Dashboard.module.css';

// Define types for the props
type Class = { id: number; name: string; };
type Section = { id: number; name: string; };
type Student = { id: number; name: string; roll_number: number; };

type StudentListProps = {
  students: Student[];
  selectedClass: Class | null;
  selectedSection: Section | null;
};

export default function StudentList({ students, selectedClass, selectedSection }: StudentListProps) {
  if (!selectedSection) {
    return null;
  }

  return (
    <div className={styles.card} style={{ marginTop: '30px' }}>
      <h2 className={styles.cardTitle}>Students of {selectedClass?.name} - {selectedSection.name}</h2>
      {students.length > 0 ? (
        <table className={styles.studentTable}>
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.roll_number}</td>
                <td>{student.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No students found in this section.</p>
      )}
    </div>
  );
}
