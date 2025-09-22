// lib/hooks/useInactivityLogout.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';

export function useInactivityLogout() {
  const router = useRouter();

  useEffect(() => {
    let timer;

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('User inactive, logging out...');
          await supabase.auth.signOut();
          router.push('/login'); // Redirect to teacher login page
        }
      }, 30 * 60 * 1000); // 30 minutes in milliseconds
    };

    // Add event listeners to reset the timer on user activity
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Initial timer setup
    resetTimer();

    // Cleanup function to remove listeners when component unmounts
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [router]);
}