import React from 'react';
import { GraduationCap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-primary text-white sticky top-0 z-50 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6 py-2.5 relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap size={24} className="text-white/80" />
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-extrabold tracking-tight">手写宝</h1>
            <p className="hidden sm:block text-white/50 text-sm font-medium">专为资深教师设计的课前准备工具</p>
          </div>
        </div>

        <p className="hidden md:block text-white/60 text-sm font-medium">
          将手稿，转化为 <span className="text-brand-accent font-bold">精美电子课件</span>
        </p>
      </div>
    </header>
  );
};

export default Header;

