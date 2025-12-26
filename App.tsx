
import React, { useState, useEffect } from 'react';
import { STYLES } from './constants';
import { StyleTemplate, GeneratedImage } from './types';
import { generateHangeulImage } from './services/gemini';

// @google/genai guidelines: Using global aistudio for API key management.
// Augmenting global types to avoid "Subsequent property declarations" error.
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const CATEGORIES = [
  { id: 'all', name: '🏠 전체', icon: 'fa-border-all', desc: '모든 스타일' },
  { id: 'Mood & Concept', name: '🎭 컨셉', icon: 'fa-wand-magic-sparkles', desc: '분위기 중심' },
  { id: 'Texture & Material', name: '🧱 질감', icon: 'fa-mound', desc: '소재와 질감' },
  { id: 'Layout & Structure', name: '📐 형태', icon: 'fa-layer-group', desc: '구조와 배치' },
  { id: 'Color & Effect', name: '🎨 효과', icon: 'fa-palette', desc: '색채와 특수효과' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'mydata'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<StyleTemplate | null>(null);
  const [inputText, setInputText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [myImages, setMyImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hangeul_art_mydata');
    if (saved) setMyImages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('hangeul_art_mydata', JSON.stringify(myImages));
  }, [myImages]);

  const handleStyleClick = (style: StyleTemplate) => {
    setSelectedStyle(style);
    updatePrompt(style, inputText);
  };

  const updatePrompt = (style: StyleTemplate, text: string) => {
    const value = text.trim() || "[텍스트 입력]";
    const newPrompt = style.template.replace("[텍스트 입력]", value);
    setPrompt(newPrompt);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    if (selectedStyle) updatePrompt(selectedStyle, text);
  };

  const handleGenerate = async () => {
    if (!prompt || isGenerating) return;

    // 가이드라인: 키 선택 여부 확인 및 요청
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // 가이드라인: 키 선택창을 띄우고 레이스 컨디션을 방지하기 위해 즉시 진행 시도
        await window.aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    setError(null);

    try {
      const imageUrl = await generateHangeulImage(prompt);
      if (imageUrl) {
        const newImg: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt,
          styleName: selectedStyle?.name || "사용자",
          createdAt: Date.now()
        };
        setMyImages(prev => [newImg, ...prev]);
        setActiveTab('mydata');
      }
    } catch (e: any) {
      console.error(e);
      // 가이드라인: API 키 누락 또는 유효하지 않은 키 오류 처리
      if (e.message === "MISSING_API_KEY" || e.message?.includes("API Key must be set")) {
        setError("API 키를 선택해 주세요. (상단 열쇠 버튼)");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else if (e.message?.includes("Requested entity was not found")) {
        setError("유효하지 않은 API 키입니다. 다시 선택해 주세요.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else {
        setError("오류: " + (e.message || "생성 실패"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredStyles = selectedCategory === 'all' 
    ? STYLES 
    : STYLES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-xl">H</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Hangeul Art <span className="text-indigo-400">Studio</span></h1>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('templates')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'templates' ? 'bg-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>템플릿</button>
          <button onClick={() => setActiveTab('mydata')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'mydata' ? 'bg-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>내 보관함</button>
          <button onClick={() => window.aistudio?.openSelectKey()} className="ml-2 w-10 h-10 flex items-center justify-center text-indigo-400 hover:bg-white/5 rounded-xl transition-all" title="API 설정"><i className="fa-solid fa-key"></i></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)] overflow-hidden">
        {/* Sidebar / Main Content Area */}
        <section className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {activeTab === 'templates' ? (
            <>
              <nav className="w-full lg:w-72 border-r border-white/5 bg-slate-900/20 overflow-y-auto p-4 flex flex-col gap-2 shrink-0">
                <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">분류</div>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full px-5 py-4 rounded-2xl transition-all text-left group ${selectedCategory === cat.id ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid ${cat.icon} text-lg ${selectedCategory === cat.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}></i>
                      <span className="font-bold">{cat.name}</span>
                    </div>
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10">
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pb-20">
                  {filteredStyles.map(style => (
                    <button key={style.id} onClick={() => handleStyleClick(style)} className={`group relative p-6 rounded-[28px] transition-all border-2 text-left animate-fade-in ${selectedStyle?.id === style.id ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl' : 'glass border-transparent hover:border-white/10 hover:bg-white/5'}`}>
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{style.icon}</div>
                      <h3 className="font-bold text-lg mb-1">{style.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{style.description}</p>
                      {selectedStyle?.id === style.id && <div className="absolute top-4 right-4 text-indigo-500"><i className="fa-solid fa-circle-check"></i></div>}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-12">
              <h2 className="text-3xl font-black mb-10 flex items-center gap-4"><i className="fa-solid fa-sparkles text-indigo-500"></i> 생성된 작업물</h2>
              {myImages.length === 0 ? (
                <div className="h-80 glass border-dashed flex flex-col items-center justify-center text-slate-600 rounded-[40px]">
                  <i className="fa-solid fa-moon text-6xl mb-4 opacity-10"></i>
                  <p className="font-bold">보관된 이미지가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myImages.map(img => (
                    <div key={img.id} className="glass rounded-[32px] overflow-hidden group shadow-2xl transition-all hover:ring-2 hover:ring-indigo-500/50">
                      <div className="relative aspect-square">
                        <img src={img.url} className="w-full h-full object-cover" alt={img.prompt} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                           <button onClick={() => { const a = document.createElement('a'); a.href = img.url; a.download = `art-${img.id}.png`; a.click(); }} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all"><i className="fa-solid fa-download"></i></button>
                           <button onClick={() => setMyImages(prev => prev.filter(i => i.id !== img.id))} className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </div>
                      <div className="p-5 border-t border-white/5 bg-slate-900/30">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{img.styleName}</span>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-medium italic">"{img.prompt}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Control Panel (Right) */}
        <aside className="w-full md:w-[420px] glass border-l border-white/5 p-8 flex flex-col gap-8 shrink-0 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-40">
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {selectedStyle ? (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-[32px] border border-indigo-500/20 relative overflow-hidden group">
                   <div className="absolute -top-10 -right-10 text-9xl opacity-5 group-hover:scale-125 transition-transform duration-700">{selectedStyle.icon}</div>
                   <div className="flex items-center gap-5 relative z-10">
                     <div className="text-5xl">{selectedStyle.icon}</div>
                     <div>
                       <h3 className="text-xl font-bold">{selectedStyle.name}</h3>
                       <p className="text-[10px] font-black text-indigo-400 tracking-tighter uppercase">{selectedStyle.englishName}</p>
                     </div>
                   </div>
                   <div className="mt-6 space-y-3 relative z-10">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Template 프롬프트</div>
                      <div className="p-4 bg-black/40 rounded-2xl text-[12px] text-slate-400 italic font-medium leading-relaxed border border-white/5">
                        "{selectedStyle.template}"
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">예시 (Example)</div>
                      <div className="p-4 bg-indigo-500/5 rounded-2xl text-[12px] text-indigo-300/80 font-medium leading-relaxed border border-indigo-500/10">
                        "{selectedStyle.example}"
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hangeul Text</label>
                    <input type="text" value={inputText} onChange={handleInputChange} placeholder="변환할 한글을 입력하세요" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500/50 outline-none text-xl font-black placeholder:text-slate-700 transition-all shadow-inner" />
                  </div>

                  <div className="space-y-2 px-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Final AI Prompt</label>
                      <button onClick={() => { navigator.clipboard.writeText(prompt); alert('복사되었습니다!'); }} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"><i className="fa-solid fa-copy mr-1"></i> 복사</button>
                    </div>
                    <textarea value={prompt} readOnly className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-[13px] italic text-slate-500 resize-none shadow-inner leading-relaxed" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-900/20 rounded-[40px] border border-dashed border-white/10">
                 <i className="fa-solid fa-hand-pointer text-4xl mb-4 text-indigo-500/30 animate-bounce"></i>
                 <p className="text-slate-500 font-bold text-lg leading-snug">좌측 리스트에서<br/>스타일을 선택해 주세요</p>
              </div>
            )}
          </div>

          <div className="pt-4 space-y-4 border-t border-white/5">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-[11px] font-bold flex gap-3 animate-pulse italic"><i className="fa-solid fa-circle-exclamation mt-0.5"></i>{error}</div>}
            
            <button onClick={handleGenerate} disabled={isGenerating || !prompt} className={`w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] ${isGenerating || !prompt ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_15px_40px_rgba(79,70,229,0.3)]'}`}>
              {isGenerating ? <><i className="fa-solid fa-spinner animate-spin"></i><span>생성 중...</span></> : <><i className="fa-solid fa-wand-magic-sparkles text-2xl"></i><span>AI 아트 생성</span></>}
            </button>
            
            <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
               <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Powered by Gemini 3 Pro Image</p>
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-indigo-500 hover:underline">Billing & Policy</a>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
