// lib/supabaseClient.js
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Auth Helper থেকে ক্লায়েন্ট তৈরি করা হচ্ছে
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey,
});