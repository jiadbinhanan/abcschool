// components/ui/ConfirmationModal.tsx
import styles from '../../components/ui/ConfirmationModal.module.css';
import { FiAlertTriangle } from 'react-icons/fi';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <FiAlertTriangle className={styles.icon} />
          <h2 className={styles.title}>{title}</h2>
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}