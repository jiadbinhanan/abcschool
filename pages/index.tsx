// pages/index.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import styles from '../styles/Login.module.css';
import { FiMail, FiLock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Import Link for navigation

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [typingFinished, setTypingFinished] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setTypingFinished(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage('Error: Invalid login credentials.');
      setLoading(false);
    } else {
      setMessage('Login successful! Redirecting...');
      router.push('/dashboard');
    }
  };

  return (
    <div
      className={styles.loginContainer}
      style={{
        backgroundImage: "url('/background1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={styles.mainLoginWrapper}>
        <div className={styles.glassCard}>
          <h2 className={styles.title} data-finished={typingFinished}>Teacher Login</h2>
          <p className={styles.subtitle}>Please sign in to continue</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <FiMail className={styles.icon} />
              <input
                type="email"
                placeholder="Your Email ID"
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
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.inputField}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.loginButton}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {message && <p className={styles.message} style={{ color: message.startsWith('Error') ? '#ff9a9a' : '#a2ff9a' }}>{message}</p>}
        </div>

        {/* This is the new Admin Login link card */}
        <div className={styles.adminLinkCard}>
          <p>
            Are you an Administrator? <Link href="/admin"><span>Login Here</span></Link>
          </p>
        </div>
      </div>
    </div>
  );
}