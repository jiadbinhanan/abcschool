// lib/supabaseClient.js
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// We are creating a browser client, which is the direct replacement
// for the createClientComponentClient from the old package.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);