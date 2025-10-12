// pages/manage-students.tsx (চূড়ান্ত এবং সঠিক কোড)

import type { GetServerSidePropsContext } from 'next';
// ১. নতুন লাইব্রেরি ইম্পোর্ট করা হয়েছে
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import OriginalManageStudentsPage from '../components/teacher/OriginalManageStudentsPage';

type PageProps = {
  allowed: boolean;
};

// --- সার্ভার-সাইড পারমিশন চেক (নতুন এবং সঠিক পদ্ধতিতে) ---
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // ২. সার্ভারের জন্য বিশেষ ক্লায়েন্ট তৈরি করা হয়েছে
  const supabase = createPagesServerClient(context);

  context.res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );

  // ৩. নতুন ক্লায়েন্ট ব্যবহার করে সেশন আনা হচ্ছে
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // নতুন ক্লায়েন্ট ব্যবহার করে পারমিশন চেক করা হচ্ছে
  const { data: permission } = await supabase
    .from('app_settings')
    .select('is_enabled')
    .eq('setting_name', 'allow_teachers_manage_students')
    .single();

  if (!permission || !permission.is_enabled) {
    return { props: { allowed: false } };
  }

  return { props: { allowed: true } };
}


// --- মূল পেজ কম্পোনেন্ট (অপরিবর্তিত) ---
export default function ManageStudentsWrapper({ allowed }: PageProps) {
  if (!allowed) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Access Denied</h1>
        <p>This feature is currently disabled by the admin.</p>
        <p>Please contact the administrator for access.</p>
      </div>
    );
  }

  return <OriginalManageStudentsPage />;
}