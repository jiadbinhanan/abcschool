// components/ClassList.tsx
import styles from '../styles/Dashboard.module.css';

export default function ClassList({ classes, onClassSelect, selectedClassId }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Select a Class</h2>
      <div className={styles.classList}>
        {classes.map((cls) => (
          <button
            key={cls.id}
            className={`${styles.classItem} ${selectedClassId === cls.id ? styles.active : ''}`}
            onClick={() => onClassSelect(cls)}
          >
            {cls.name}
          </button>
        ))}
      </div>
    </div>
  );
}