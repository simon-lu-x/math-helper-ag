import React from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-primary text-white sticky top-0 z-50 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6 py-5 relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
            <GraduationCap size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">湖南教师数学课件助手</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-brand-accent/30">
                PRO EDITION
              </span>
              <p className="text-white/60 text-xs font-medium">专为资深教师设计的课前准备工具</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3 bg-black/20 hover:bg-black/30 transition-colors px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <Sparkles size={16} className="text-brand-accent animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Gemini 2.5 Flash 驱动</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

