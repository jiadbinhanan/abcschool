import 'regenerator-runtime/runtime';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useInactivityLogout } from '../lib/hooks/useInactivityLogout';
import { Toaster } from 'react-hot-toast';
import { useRoleTheme } from '../lib/hooks/useRoleTheme'; // ১. আপনার role theme হুকটি ইম্পোর্ট করা হলো

function MyApp({ Component, pageProps }: AppProps) {
  // ইনঅ্যাকটিভিটি হুক
  useInactivityLogout();
  
  // ২. role অনুযায়ী থিম সেট করার জন্য হুকটি এখানে কল করা হলো
  useRoleTheme();

  return (
    <>
      <Component {...pageProps} />
<Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}


export default MyApp;