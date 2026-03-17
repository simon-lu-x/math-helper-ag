import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, Loader, MessageSquareDiff } from 'lucide-react';
import { applyAIEdit } from '../utils/ai_edit';

interface Props {
  content: string;
  onContentChange: (newContent: string) => void;
  /** 内嵌在父卡片中时传 true，不渲染外层卡片 */
  compact?: boolean;
}

// 浏览器 SpeechRecognition 类型
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const ChatCorrector: React.FC<Props> = ({ content, onContentChange, compact = false }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recogRef = useRef<any>(null);

  const handleSend = async (command: string) => {
    const cmd = command.trim();
    if (!cmd || loading) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await applyAIEdit(content, cmd);
      onContentChange(updated);
      setInput('');
    } catch (e: any) {
      setError(e.message || 'AI 修改失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const toggleVoice = () => {
    if (!SpeechRecognition) {
      setError('当前浏览器不支持语音输入');
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'zh-CN';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      setListening(false);
      setInput(transcript);
      handleSend(transcript);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  const inner = (
    <>
      {!compact && (
        <h3 className="font-black mb-5 flex items-center gap-3 text-lg">
          <MessageSquareDiff size={24} className="text-brand-accent" />
          <span>AI 纠错</span>
        </h3>
      )}

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述修改…例：第3题改成 -7又8分之3"
          disabled={loading || listening}
          className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-accent transition-colors"
        />

        {/* 语音按钮 */}
        <button
          onClick={toggleVoice}
          disabled={loading}
          title={listening ? '停止录音' : '语音输入'}
          className={`p-3 rounded-2xl transition-colors flex-shrink-0 ${
            listening
              ? 'bg-red-500 animate-pulse'
              : 'bg-white/10 hover:bg-white/20 border border-white/20'
          }`}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* 发送按钮 */}
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || loading}
          className="p-3 rounded-2xl bg-brand-accent hover:bg-brand-primary transition-colors flex-shrink-0 disabled:opacity-40"
        >
          {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-red-400 text-xs leading-relaxed">{error}</p>
      )}

      {!error && (
        <p className="mt-3 text-white/30 text-xs">
          回车发送 · 点击 🎤 语音输入
        </p>
      )}
    </>
  );

  if (compact) return <>{inner}</>;

  return (
    <div className="bg-slate-800 rounded-[2rem] p-8 shadow-xl text-white">
      <h3 className="font-black mb-5 flex items-center gap-3 text-lg">
        <MessageSquareDiff size={24} className="text-brand-accent" />
        <span>AI 纠错</span>
      </h3>
      {inner}
    </div>
  );
};

export default ChatCorrector;
