// pages/admin/manage-teachers.tsx
import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import manageStyles from '../../styles/ManageStudents.module.css';
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

  // --- NEW: useEffect to verify admin session on page load ---
  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin'); // Redirect if not logged in
        return;
      }

      // Verify the user is an admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (roleData?.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/admin'); // Redirect if not an admin
        return;
      }

      // If all checks pass, fetch the teacher list
      await fetchTeachers();
      setLoading(false);
    };

    checkAdminAndFetchData();
  }, [router]);


  const fetchTeachers = async () => {
    // setLoading(true) is removed from here as it's handled in the main useEffect
    const { data, error } = await supabase.from('teachers_list').select('*');
    if (error) {
      setMessage(`Error fetching teachers: ${error.message}`);
    } else {
      setTeachers(data || []);
    }
    // setLoading(false) is also removed from here
  };

  const handleAddTeacher = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('Adding teacher...');
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // This check is now a fallback, the useEffect should prevent this.
            throw new Error("Authentication session expired. Please log in again.");
        }

        const response = await fetch('/api/create-teacher', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                user_email: newTeacherEmail,
                user_password: newTeacherPassword,
                user_name: newTeacherName
            }),
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setMessage('Teacher added successfully!');
        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherPassword('');
        await fetchTeachers();

    } catch (error: any) {
        setMessage(`Error adding teacher: ${error.message}`);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
        setMessage('Deleting teacher...');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error("Authentication session expired. Please log in again.");
            }
    
            const response = await fetch('/api/delete-teacher', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ user_id_to_delete: teacherId }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            setMessage('Teacher deleted successfully!');
            await fetchTeachers();

        } catch(error: any) {
            setMessage(`Error deleting teacher: ${error.message}`);
        }
    }
  };

  // Show a loading screen while session is being verified
  if (loading) {
    return <div className={manageStyles.pageContainer}><p style={{textAlign: 'center'}}>Verifying access and loading data...</p></div>
  }

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
            <input type="text" placeholder="Teacher Name" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} className={manageStyles.input} required />
            <input type="email" placeholder="Teacher Email" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} className={manageStyles.input} required />
            <input type="password" placeholder="Initial Password" value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} className={manageStyles.input} required />
            <button type="submit" className={manageStyles.addButton}><FiUserPlus /> Add Teacher</button>
          </form>
        </div>

        <div className={manageStyles.card}>
          <h2>Teacher List</h2>
          {/* No need for a loading indicator here anymore */}
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
        </div>
      </main>
    </div>
  );
}