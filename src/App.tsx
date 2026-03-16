import { useState } from 'react';
import Header from './components/Header';
import CaptureModule from './components/CaptureModule';
import EditorModule from './components/EditorModule';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Info, Heart } from 'lucide-react';
import { performFaithfulOCR } from './utils/gemini_ocr';

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
      const result = await performFaithfulOCR(images);
      setGeneratedContent(result);
    } catch (error: any) {
      if (error.message.includes("API_KEY_MISSING")) {
        alert("检测到未配置 Gemini API Key。请在项目根目录创建 .env 文件并设置 VITE_GEMINI_API_KEY，否则系统将只能演示，无法识别新图片。");
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
        {/* Hero Section */}
        <section className="bg-brand-primary text-white pt-20 pb-40 px-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px] animate-pulse [animation-delay:-2s]" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-8 border border-white/20 backdrop-blur-md">
                <Sparkles size={16} className="text-brand-accent" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Next-Gen Math AI</span>
              </div>
              <h2 className="text-5xl sm:text-7xl font-black mb-8 tracking-tighter leading-[1.1]">
                将手稿，转化为<br />
                <span className="text-brand-accent italic bg-clip-text">精美电子课件</span>
              </h2>
              <p className="text-xl sm:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                深度适配岳阳方言校对，让老师的每一份智慧<br className="hidden sm:block" />
                都能以最标准的形式走进课堂。
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Section with Negative Margin */}
        <div className="-mt-16 px-4">
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
                      
                      <h3 className="text-3xl font-black mb-4 tracking-tight">Gemini 2.5 深度创作中</h3>
                      <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-xs">正在为您整理数学手稿...</p>
                      
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

                
                {/* Feature highlights */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  {[
                    { icon: Sparkles, title: "智能公式识别", desc: "采用 Gemini 2.5 长上下文能力，多页手稿一次性精准转化 LaTeX。" },
                    { icon: Info, title: "文字自动润色", desc: "保留您的教学思路，将口语化表达自动整理为规范的数学语言。" },
                    { icon: Heart, title: "语音校对修正", desc: "听得懂您的岳阳家乡话，复杂修改动动嘴就能完成。" }
                  ].map((f, i) => (
                    <div key={i} className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-shadow">
                      <f.icon className="text-brand-accent mb-4" size={32} />
                      <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
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
          © 2026 湖南教师数学助手 · 用 AI 点亮教育智慧
        </p>
      </footer>
    </div>
  );
}

export default App;
