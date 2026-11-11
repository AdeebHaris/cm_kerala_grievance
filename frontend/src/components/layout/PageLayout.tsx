import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-[#0f3d25] text-[#e5c060] text-xs text-center py-1.5 px-4 border-b border-[#c9a227]/30">
        Recruitment Prototype for WhiteMatrix Software Solutions — Not affiliated with or endorsed by the Government of Kerala or the Chief Minister's Office.
      </div>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
