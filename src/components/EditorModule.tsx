import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { RefreshCw, FileText, Download, Share2, Printer, Pencil, Eye, MessageSquareDiff, X } from 'lucide-react';
import { FriendlyEditor } from './FriendlyEditor';
import ChatCorrector from './ChatCorrector';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { normalizeMathMarkdown } from '../utils/mathMarkdown';


interface EditorModuleProps {
  content: string;
  onUpdateContent: (id: string, newContent: string) => void;
  onRegenerate: () => void;
}

const EditorModule: React.FC<EditorModuleProps> = ({ content, onUpdateContent, onRegenerate }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bottomPanel, setBottomPanel] = useState<'export' | 'edit' | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  /**
   * 导出前临时把内容区撑宽到桌面级宽度（800px + 大内边距），
   * 截图完成后恢复原样，避免手机端导出文字太窄。
   * 注意：不能用 position:fixed 移出屏幕——父元素有 transform（animate-fade-in）
   * 会导致 fixed 定位基准变为 section 而非 viewport，html-to-image 截空白。
   */
  const captureImage = async (): Promise<string> => {
    await document.fonts.ready;
    const node = contentRef.current!;

    // --- 保存原始 inline style ---
    const savedCss = node.style.cssText;

    // --- 临时撑宽到桌面排版（原地，不移出屏幕）---
    node.style.width = '800px';
    node.style.minWidth = '800px';
    node.style.maxWidth = '800px';
    node.style.padding = '64px';

    // 等待浏览器重排
    await new Promise(r => setTimeout(r, 150));

    // skipFonts: 跳过跨域字体嵌入（fonts.loli.net CORS 导致空白）
    // 第一次预热，第二次正式截图
    await toPng(node, { pixelRatio: 2, skipFonts: true });
    const imgData = await toPng(node, { pixelRatio: 2, skipFonts: true });

    // --- 恢复原始样式 ---
    node.style.cssText = savedCss;

    return imgData;
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
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 上下边距 mm
      const usable = pageHeight - margin * 2;

      // 多页：图片高度超过一页时自动分页
      let heightLeft = pdfHeight;
      let yOffset = margin;

      pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, pdfHeight);
      heightLeft -= usable;

      while (heightLeft > 0) {
        pdf.addPage();
        yOffset -= usable;
        pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, pdfHeight);
        heightLeft -= usable;
      }

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
    <>
      {/* Mobile: backdrop overlay when panel is open — MUST be outside section (transform breaks fixed) */}
      {bottomPanel && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setBottomPanel(null)}
        />
      )}

      {/* Mobile Floating Bottom Bar — MUST be outside section (animate-fade-in has transform which breaks fixed positioning) */}
      <div className="fixed bottom-3 left-0 right-0 z-50 px-3 lg:hidden safe-area-bottom">
        {/* Expandable Panel */}
        {bottomPanel === 'export' && (
          <div className="bg-slate-800 border-t border-white/10 rounded-t-2xl px-5 pt-4 pb-2 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Download size={16} className="text-brand-accent" />
                成果导出
              </h3>
              <button onClick={() => setBottomPanel(null)} className="text-white/50 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 pb-2">
              <button
                onClick={() => { handleExportPDF(); setBottomPanel(null); }}
                disabled={isExporting}
                className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                {isExporting ? <RefreshCw className="animate-spin" size={16} /> : <Printer size={16} />}
                <span>存为 PDF 打印版</span>
              </button>
              <button
                onClick={() => { handleExportImage(); setBottomPanel(null); }}
                disabled={isExporting}
                className="w-full py-3 bg-white/10 text-white border border-white/20 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                <Share2 size={16} />
                <span>生成微信长图</span>
              </button>
            </div>
          </div>
        )}

        {bottomPanel === 'edit' && (
          <div className="bg-slate-800 border-t border-white/10 rounded-t-2xl px-5 pt-4 pb-2 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Pencil size={16} className="text-brand-accent" />
                内容编辑
              </h3>
              <button onClick={() => setBottomPanel(null)} className="text-white/50 p-1">
                <X size={18} />
              </button>
            </div>

            {/* 手动编辑切换 */}
            <button
              onClick={() => { setIsEditing(!isEditing); setBottomPanel(null); }}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all mb-4 ${
                isEditing
                  ? 'bg-brand-accent text-white'
                  : 'bg-white/10 text-white/80 border border-white/20'
              }`}
            >
              {isEditing ? <Eye size={16} /> : <Pencil size={16} />}
              <span>{isEditing ? '完成，返回预览' : '手动编辑内容'}</span>
            </button>

            <div className="border-t border-white/10 mb-3" />

            {/* AI 纠错 */}
            <p className="font-bold mb-3 flex items-center gap-2 text-xs text-white/60">
              <MessageSquareDiff size={14} className="text-brand-accent" />
              AI 纠错
            </p>
            <div className="pb-2">
              <ChatCorrector
                content={content}
                onContentChange={(newContent) => { onUpdateContent('section-1', newContent); setBottomPanel(null); }}
                compact
              />
            </div>
          </div>
        )}

        {/* Bottom Button Bar (always visible) */}
        <div className="mx-auto max-w-md bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
          <button
            onClick={() => setBottomPanel(bottomPanel === 'edit' ? null : 'edit')}
            className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${
              bottomPanel === 'edit' || isEditing
                ? 'bg-brand-accent text-white'
                : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            <Pencil size={16} />
            <span>编辑</span>
          </button>

          <button
            onClick={() => setBottomPanel(bottomPanel === 'export' ? null : 'export')}
            className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${
              bottomPanel === 'export'
                ? 'bg-brand-primary text-white'
                : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            <Download size={16} />
            <span>下载</span>
          </button>
        </div>
      </div>

      <section className="max-w-6xl mx-auto my-4 sm:my-10 animate-fade-in px-2 sm:px-4 pb-32 lg:pb-0">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side: Document Preview (Paper Style) */}
        <div className="flex-1 w-full">
          <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col min-h-[60vh] sm:min-h-[80vh] relative">
            <div className="bg-slate-50/80 backdrop-blur-md px-4 py-3 sm:px-8 sm:py-6 flex items-center border-b border-slate-100 sticky top-0 z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                  <FileText size={18} strokeWidth={2.5} />
                </div>
                <span className="font-black text-slate-800 tracking-tight text-sm sm:text-base">预览你的文档</span>
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
              className={`px-4 py-6 sm:p-8 lg:p-16 overflow-y-auto bg-white${isEditing ? ' hidden' : ''}`}
              ref={contentRef}
            >
              <div className="max-w-3xl mx-auto prose prose-slate prose-base sm:prose-lg lg:prose-xl">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: '#888' }]]}
                  children={normalizeMathMarkdown(content)}
                  components={{
                    h1: (props) => <h1 className="text-4xl font-extrabold text-brand-primary text-center mb-12" {...props} />,
                    h2: (props) => <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-6 border-b-2 border-brand-primary/20 pb-2" {...props} />,
                    p: (props) => <p className="mb-6 text-slate-700 leading-relaxed font-medium text-lg lg:text-xl" {...props} />,
                    strong: (props) => <strong className="text-brand-primary font-black bg-brand-primary/5 px-1.5 rounded" {...props} />,
                    blockquote: (props) => <blockquote className="border-l-4 border-brand-accent bg-brand-accent/5 p-4 rounded-r-xl italic" {...props} />,
                  }}
                >
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tools (Docked) — hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex w-full lg:w-80 flex-col gap-4 sm:gap-6 sticky lg:top-32">
          {/* Export Tools */}
          <div className="bg-slate-800 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-xl text-white">
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

          {/* 内容编辑：手动 + AI 纠错 合并卡片 */}
          <div className="bg-slate-800 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-xl text-white">
            <h3 className="font-black mb-5 flex items-center gap-3 text-lg">
              <Pencil size={24} className="text-brand-accent" />
              <span>内容编辑</span>
            </h3>

            {/* 手动编辑切换 */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mb-5 ${
                isEditing
                  ? 'bg-brand-accent text-white'
                  : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
              }`}
            >
              {isEditing ? <Eye size={18} /> : <Pencil size={18} />}
              <span>{isEditing ? '完成，返回预览' : '手动编辑内容'}</span>
            </button>

            <div className="border-t border-white/10 mb-5" />

            {/* AI 纠错（内嵌，不带卡片） */}
            <p className="font-bold mb-4 flex items-center gap-2 text-sm text-white/70">
              <MessageSquareDiff size={16} className="text-brand-accent" />
              AI 纠错
            </p>
            <ChatCorrector
              content={content}
              onContentChange={(newContent) => onUpdateContent('section-1', newContent)}
              compact
            />
          </div>

          <button
            onClick={onRegenerate}
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-brand-primary py-4 px-6 rounded-2xl border border-dashed border-slate-200 hover:border-brand-primary transition-all font-bold text-sm bg-white"
          >
            <RefreshCw size={14} />
            <span>不满意？重新识别</span>
          </button>
        </div>
      </div>
    </section>
    </>
  );
};

export default EditorModule;
