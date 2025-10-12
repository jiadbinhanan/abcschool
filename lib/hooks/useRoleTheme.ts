import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useRoleTheme() {
  useEffect(() => {
    const setRoleTheme = async () => {
      // প্রথমে ব্যবহারকারীর সেশন আছে কিনা তা চেক করুন
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // সেশন থাকলে, ডাটাবেস থেকে ব্যবহারকারীর role আনুন
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        // পুরনো থিম ক্লাস (যদি থাকে) মুছে দিন
        document.body.classList.remove('theme-admin', 'theme-teacher');

        // role অনুযায়ী নতুন থিম ক্লাস যোগ করুন
        if (roleData?.role === 'admin') {
          document.body.classList.add('theme-admin');
        } else {
          // অ্যাডমিন না হলে ডিফল্ট হিসেবে টিচার থিম দেওয়া হলো
          document.body.classList.add('theme-teacher');
        }
      } else {
        // লগ-আউট অবস্থায় থাকলে, সব থিম ক্লাস মুছে ফেলুন
        document.body.classList.remove('theme-admin', 'theme-teacher');
      }
    };

    // পেজ লোড হওয়ার সাথে সাথে এবং ব্যবহারকারী পরিবর্তন হলে থিম সেট করুন
    setRoleTheme();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setRoleTheme();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
}