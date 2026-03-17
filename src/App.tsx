import { useState } from 'react';
import Header from './components/Header';
import CaptureModule from './components/CaptureModule';
import EditorModule from './components/EditorModule';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { performQwenOCR } from './utils/qwen_ocr';

function App() {
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const handleAddImages = (newImages: string[]) => {
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartProcess = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await performQwenOCR(images);
      setGeneratedContent(result);
    } catch (error: any) {
      if (error.message.includes("API_KEY_MISSING")) {
        alert(`检测到未配置 AI API Key。请在项目根目录创建 .env 文件并设置 VITE_QWEN_API_KEY`);
      } else {
        alert("识别过程中出现错误：" + error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const handleUpdateContent = (_id: string, newContent: string) => {
    setGeneratedContent(newContent);
  };

  const handleRegenerate = () => {
    handleStartProcess();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 pb-20 overflow-x-hidden">
        <div className="px-4 pt-6">
          <AnimatePresence mode="wait">
            {!generatedContent ? (
              <motion.div
                key="capture"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <CaptureModule 
                  images={images}
                  onAddImages={handleAddImages}
                  onRemoveImage={handleRemoveImage}
                  onStartProcess={handleStartProcess}
                  isProcessing={isProcessing}
                />

                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-[20px] z-[100] flex flex-col items-center justify-center text-white"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/40 to-brand-accent/20 pointer-events-none" />
                    
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 bg-white/10 p-12 rounded-[3rem] border border-white/20 shadow-2xl backdrop-blur-3xl flex flex-col items-center"
                    >
                      <div className="relative mb-12">
                        <div className="w-32 h-32 border-4 border-white/10 border-t-brand-accent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Sparkles size={48} className="text-brand-accent animate-pulse" />
                        </div>
                      </div>
                      
                      <h3 className="text-3xl font-black mb-4 tracking-tight">AI 深度创作中</h3>
                      <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm">正在为您整理数学手稿...</p>
                      
                      <div className="mt-12 w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: "0%" }}
                           animate={{ width: "100%" }}
                           transition={{ duration: 3 }}
                           className="h-full bg-gradient-to-r from-brand-accent to-brand-primary"
                         />
                      </div>
                    </motion.div>
                  </motion.div>
                )}

              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
              >
                <EditorModule 
                  content={generatedContent}
                  onUpdateContent={handleUpdateContent}
                  onRegenerate={handleRegenerate}
                />
                
                <div className="max-w-4xl mx-auto mt-8 flex justify-center">
                   <button 
                    onClick={() => { setGeneratedContent(null); setImages([]); }}
                    className="text-slate-400 hover:text-brand-primary font-medium flex items-center gap-2 py-4 px-8"
                   >
                     <span>← 返回采集新教案</span>
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 px-4 text-center">
        <p className="text-slate-400 text-sm font-medium">
          © 2026 手写宝 · 用 AI 点亮教育智慧
        </p>
      </footer>
    </div>
  );
}

export default App;
