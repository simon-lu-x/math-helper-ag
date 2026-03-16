import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { RefreshCw, FileText, Download, Share2, Printer, Pencil, Eye } from 'lucide-react';
import { FriendlyEditor } from './FriendlyEditor';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';


interface EditorModuleProps {
  content: string;
  onUpdateContent: (id: string, newContent: string) => void;
  onRegenerate: () => void;
}

const EditorModule: React.FC<EditorModuleProps> = ({ content, onUpdateContent, onRegenerate }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const captureImage = async (): Promise<string> => {
    await document.fonts.ready;
    const node = contentRef.current!;
    // Run twice: first pass embeds fonts, second pass renders correctly
    await toPng(node, { pixelRatio: 2 });
    return toPng(node, { pixelRatio: 2 });
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    try {
      const imgData = await captureImage();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('数学课件.pdf');
    } catch (err) {
      console.error('Export failed', err);
    }
    setIsExporting(false);
  };

  const handleExportImage = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    try {
      const imgData = await captureImage();
      const link = document.createElement('a');
      link.download = '数学课件长图.png';
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
    setIsExporting(false);
  };

  return (
    <section className="max-w-6xl mx-auto my-10 animate-fade-in px-4">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side: Document Preview (Paper Style) */}
        <div className="flex-1 w-full">
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col min-h-[80vh] relative">
            <div className="bg-slate-50/80 backdrop-blur-md px-8 py-6 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                  <FileText size={20} strokeWidth={2.5} />
                </div>
                <span className="font-black text-slate-800 tracking-tight">预览您的电子课件</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    isEditing
                      ? 'bg-brand-primary text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-brand-primary hover:text-white border border-slate-200 shadow-sm'
                  }`}
                >
                  {isEditing ? <Eye size={18} /> : <Pencil size={18} />}
                  <span>{isEditing ? '预览' : '编辑'}</span>
                </button>
              </div>
            </div>
            
            {/* Friendly editor — shown in edit mode */}
            <div className={isEditing ? 'block' : 'hidden'}>
              <FriendlyEditor
                content={content}
                onChange={(newContent) => onUpdateContent("section-1", newContent)}
              />
            </div>

            {/* Preview — always mounted so contentRef is available for export */}
            <div
              className={`p-12 lg:p-20 overflow-y-auto bg-white${isEditing ? ' hidden' : ''}`}
              ref={contentRef}
            >
              <div className="max-w-3xl mx-auto prose prose-slate prose-lg lg:prose-xl">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-4xl font-extrabold text-brand-primary text-center mb-12" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-6 border-b-2 border-brand-primary/20 pb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-6 text-slate-700 leading-relaxed font-medium text-lg lg:text-xl" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-brand-primary font-black bg-brand-primary/5 px-1.5 rounded" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-brand-accent bg-brand-accent/5 p-4 rounded-r-xl italic" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tools (Docked) */}
        <div className="w-full lg:w-80 flex flex-col gap-6 sticky lg:top-32">
          {/* Export Tools */}
          <div className="bg-slate-800 rounded-[2rem] p-8 shadow-xl text-white">
            <h3 className="font-black mb-6 flex items-center gap-3 text-lg">
              <Download size={24} className="text-brand-accent" />
              <span>成果导出</span>
            </h3>
            <div className="space-y-4">
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full py-4 bg-brand-primary text-white rounded-[1.25rem] font-black flex items-center justify-center gap-3 hover:bg-brand-secondary transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="animate-spin" size={20} /> : <Printer size={20} />}
                <span>存为 PDF 打印版</span>
              </button>
              
              <button 
                onClick={handleExportImage}
                disabled={isExporting}
                className="w-full py-4 bg-white/10 text-white border border-white/20 rounded-[1.25rem] font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Share2 size={18} />
                <span>生成微信长图</span>
              </button>
            </div>
          </div>

          <button 
            onClick={onRegenerate}
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-brand-primary py-4 px-6 rounded-2xl border border-dashed border-slate-200 hover:border-brand-primary transition-all font-bold text-sm bg-white"
          >
            <RefreshCw size={14} />
            <span>不满意？重新识别全文</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default EditorModule;

