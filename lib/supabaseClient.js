// lib/supabaseClient.js (সঠিক এবং চূড়ান্ত কোড)

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// এটি ব্রাউজারের জন্য একটি বিশেষ ক্লায়েন্ট তৈরি করে যা কুকি ব্যবহার করে,
// যাতে সার্ভার এবং ক্লায়েন্ট সেশন শেয়ার করতে পারে।
export const supabase = createPagesBrowserClient();