// pages/admin/index.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import styles from '../../styles/Login.module.css';
import { FiShield, FiLock } from 'react-icons/fi';
import { useRouter } from 'next/router';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Step 1: Sign in the user
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      setMessage('Error: Invalid login credentials.');
      setLoading(false);
      return;
    }

    // Step 2: Check if the user has the 'admin' role
    if (user) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !roleData || roleData.role !== 'admin') {
        setMessage('Error: You do not have admin privileges.');
        await supabase.auth.signOut(); // Log out non-admin users
      } else {
        setMessage('Admin login successful! Redirecting...');
        router.push('/admin/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div
      className={styles.loginContainer}
      style={{
        backgroundImage: "url('/background2.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={styles.glassCard}>
        <h2 className={styles.title}>Admin Login</h2>
        <p className={styles.subtitle}>Management Panel Access</p>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <FiShield className={styles.icon} />
            <input
              type="email"
              placeholder="Admin Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          <div className={styles.inputGroup}>
            <FiLock className={styles.icon} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          <button type="submit" disabled={loading} className={styles.loginButton}>
            {loading ? 'Authenticating...' : 'Login as Admin'}
          </button>
        </form>
        {message && <p className={styles.message} style={{ color: message.startsWith('Error') ? '#ff9a9a' : '#a2ff9a' }}>{message}</p>}
      </div>
    </div>
  );
}