// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useInactivityLogout } from '../lib/hooks/useInactivityLogout'; // ১. হুকটি import করুন

function MyApp({ Component, pageProps }: AppProps) {
  // ২. হুকটিকে এখানে কল করুন
  // এটি আপনার সম্পূর্ণ অ্যাপে ইনঅ্যাকটিভিটি টাইমারটি চালু করে দেবে
  useInactivityLogout();

  return <Component {...pageProps} />
}

export default MyApp;