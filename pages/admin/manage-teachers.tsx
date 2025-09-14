// pages/admin/manage-teachers.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import manageStyles from '../../styles/Manage.module.css';
import { FiUserPlus, FiTrash2 } from 'react-icons/fi';
import { useRouter } from 'next/router';

type Teacher = { id: string; email: string; name: string; };

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // --- Function to fetch all teachers from our new VIEW ---
  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('teachers_list').select('*');
    if (error) {
      setMessage(`Error fetching teachers: ${error.message}`);
    } else {
      setTeachers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // --- Function to add a new teacher using our new SQL function ---
  const handleAddTeacher = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      setMessage('Please fill all fields.');
      return;
    }
    // Calling the PostgreSQL function `create_new_teacher`
    const { error } = await supabase.rpc('create_new_teacher', {
      email: newTeacherEmail,
      password: newTeacherPassword,
      name: newTeacherName
    });

    if (error) {
      setMessage(`Error creating teacher: ${error.message}`);
    } else {
      setMessage('Teacher created successfully!');
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPassword('');
      fetchTeachers(); // Refresh the list
    }
  };

  // --- Function to delete a teacher using our new SQL function ---
  const handleDeleteTeacher = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      // Calling the PostgreSQL function `delete_teacher`
      const { error } = await supabase.rpc('delete_teacher', {
        teacher_id: teacherId
      });
      if (error) {
        setMessage(`Error deleting teacher: ${error.message}`);
      } else {
        setMessage('Teacher deleted successfully!');
        fetchTeachers(); // Refresh the list
      }
    }
  };

  return (
    <div className={manageStyles.pageContainer}>
      <header className={manageStyles.header}>
        <button onClick={() => router.push('/admin/dashboard')} className={manageStyles.backButton}>← Back</button>
        <h1>Manage Teachers</h1>
      </header>
      
      <main className={manageStyles.content}>
        <div className={manageStyles.card}>
          <h2>Add New Teacher</h2>
          {message && <p className={manageStyles.message}>{message}</p>}
          <form onSubmit={handleAddTeacher} className={manageStyles.formGrid}>
            <input type="text" placeholder="Teacher Name" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} className={manageStyles.input} />
            <input type="email" placeholder="Teacher Email" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} className={manageStyles.input} />
            <input type="password" placeholder="Initial Password" value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} className={manageStyles.input} />
            <button type="submit" className={manageStyles.addButton}><FiUserPlus /> Add Teacher</button>
          </form>
        </div>

        <div className={manageStyles.card}>
          <h2>Teacher List</h2>
          {loading ? <p>Loading...</p> : (
            <ul className={manageStyles.list}>
              {teachers.map((teacher) => (
                <li key={teacher.id} className={manageStyles.listItem}>
                  <span>
                    <strong>{teacher.name || 'No Name'}</strong> - {teacher.email}
                  </span>
                  <button onClick={() => handleDeleteTeacher(teacher.id)} className={manageStyles.deleteButton}><FiTrash2 /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}