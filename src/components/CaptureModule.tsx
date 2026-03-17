import React, { useRef } from 'react';
import { Camera, X, Plus, Sparkles, UploadCloud, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CaptureModuleProps {
  images: string[];
  onAddImages: (newImages: string[]) => void;
  onRemoveImage: (index: number) => void;
  onStartProcess: () => void;
  isProcessing: boolean;
}

const CaptureModule: React.FC<CaptureModuleProps> = ({ 
  images, 
  onAddImages, 
  onRemoveImage, 
  onStartProcess,
  isProcessing 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      onAddImages(newImages);
    }
  };

  return (
    <section className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-5 shadow-2xl border border-white/50 max-w-5xl mx-auto my-4 relative overflow-hidden">
      {/* Decorative background flare */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-brand-primary text-white p-3 rounded-[1rem] shadow-lg shadow-brand-primary/20">
            <Camera size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">第一步：拍下你的手写内容</h2>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mt-0.5">
              <Info size={13} className="text-brand-accent" />
              支持多张同时上传，AI 自动串联内容
            </p>
          </div>
        </div>
      </div>

      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-[1.5rem] py-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/[0.02] transition-all group bg-slate-50/50"
        >
          <div className="bg-white p-5 rounded-full shadow-xl group-hover:scale-110 transition-transform duration-500 border border-slate-100">
            <UploadCloud size={44} className="text-brand-primary" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700">点击拍照或上传图片</p>
            <p className="text-slate-400 mt-1 text-sm font-medium italic">笔记、教案、公式、食谱…… 都可以</p>
          </div>
          <div className="px-6 py-2 bg-brand-primary text-white rounded-full font-bold shadow-lg shadow-brand-primary/20">
             选择图片
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          <AnimatePresence>
            {images.map((img, index) => (
              <motion.div 
                key={img}
                initial={{ scale: 0.8, opacity: 0, rotate: index % 2 === 0 ? -2 : 2 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ y: -5, rotate: index % 2 === 0 ? 1 : -1 }}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white shadow-xl group cursor-pointer"
              >
                <img src={img} alt={`手稿 ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-brand-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveImage(index); }}
                    className="bg-white text-red-500 p-3 rounded-full hover:bg-red-50 shadow-lg ring-4 ring-black/5"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="absolute top-4 left-4 bg-black/70 text-white text-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20">
                   P.{index + 1}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[3/4] rounded-2xl border-4 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all group"
          >
            <div className="bg-white p-4 rounded-full shadow-md group-hover:scale-110 transition-all duration-300">
              <Plus size={32} strokeWidth={3} />
            </div>
            <span className="font-black text-sm uppercase tracking-tighter">添加更多</span>
          </button>
        </div>
      )}

      <input 
        type="file" 
        multiple 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />

      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={onStartProcess}
          disabled={images.length === 0 || isProcessing}
          className={`w-full max-w-md py-4 rounded-[1.25rem] flex items-center justify-center gap-3 text-lg font-black shadow-2xl transition-all relative overflow-hidden group ${
            images.length > 0 && !isProcessing
              ? 'bg-brand-primary text-white hover:bg-brand-secondary active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {images.length > 0 && !isProcessing && (
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
          
          {isProcessing ? (
            <>
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span>AI 识别中...</span>
            </>
          ) : (
            <>
              <Sparkles className="animate-pulse text-brand-accent scale-125" size={24} />
              <span>开始 AI 识别</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-2 text-brand-primary/40 font-bold text-sm uppercase tracking-widest">
           <div className="h-[1px] w-8 bg-current" />
           <span>AI 智能识别引擎</span>
           <div className="h-[1px] w-8 bg-current" />
        </div>
      </div>
    </section>
  );
};

export default CaptureModule;

