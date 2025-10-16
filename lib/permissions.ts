// lib/permissions.ts (চূড়ান্ত কোড)

import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { GetServerSidePropsContext } from 'next';

type UserRole = 'admin' | 'teacher' | null;

export async function checkPermissionAndGetRole(context: GetServerSidePropsContext) {
  const supabase = createPagesServerClient(context);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  const role: UserRole = roleData?.role;

  if (role === 'admin') {
    return { props: { userRole: 'admin' } };
  }

  if (role === 'teacher') {
    const { data: permission } = await supabase
      .from('app_settings')
      .select('is_enabled')
      .eq('setting_name', 'allow_teachers_manage_students')
      .single();

    if (permission?.is_enabled) {
      return { props: { userRole: 'teacher' } };
    }
  }
  
  return { redirect: { destination: '/access-denied', permanent: false } };
}