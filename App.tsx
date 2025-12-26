
import React, { useState, useEffect } from 'react';
import { STYLES } from './constants';
import { StyleTemplate, GeneratedImage } from './types';
import { generateHangeulImage } from './services/gemini';

// Fix: Inline the AIStudio interface within declare global to resolve naming conflicts and modifier mismatches.
// window.aistudio is assumed to be pre-configured by the environment.
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
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

    setError(null);

    // 가이드라인: 키 선택 여부 확인 및 자동 팝업
    if (window.aistudio) {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // 가이드라인: 키 선택 성공을 가정하고 즉시 진행 (return하지 않음)
          await window.aistudio.openSelectKey();
        }
      } catch (e) {
        console.error("API Key check error", e);
      }
    }

    setIsGenerating(true);

    try {
      const imageUrl = await generateHangeulImage(prompt);
      if (imageUrl) {
        const newImg: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt,
          styleName: selectedStyle?.name || "커스텀",
          createdAt: Date.now()
        };
        setMyImages(prev => [newImg, ...prev]);
        setActiveTab('mydata');
      }
    } catch (e: any) {
      console.error("Generation Error:", e);
      // 가이드라인: 키 관련 에러 시 재선택 유도
      if (e.message === "MISSING_API_KEY" || e.message?.includes("API Key must be set")) {
        setError("API 키가 선택되지 않았습니다. 상단 열쇠 버튼을 눌러주세요.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else if (e.message?.includes("Requested entity was not found")) {
        setError("유효하지 않은 프로젝트의 API 키입니다. 유료 프로젝트 키를 선택해주세요.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else {
        setError("생성 중 오류 발생: " + (e.message || "알 수 없는 오류"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredStyles = selectedCategory === 'all' 
    ? STYLES 
    : STYLES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-xl">H</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Hangeul Art <span className="text-indigo-400">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('templates')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'templates' ? 'bg-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>스타일 탐색</button>
          <button onClick={() => setActiveTab('mydata')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'mydata' ? 'bg-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>갤러리</button>
          <button onClick={() => window.aistudio?.openSelectKey()} className="ml-2 w-10 h-10 flex items-center justify-center text-indigo-400 hover:bg-white/10 rounded-xl transition-all" title="API 설정"><i className="fa-solid fa-key"></i></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)] overflow-hidden">
        {/* Left: Style Explorer */}
        <section className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {activeTab === 'templates' ? (
            <>
              <nav className="w-full lg:w-64 border-r border-white/5 bg-slate-900/20 overflow-y-auto p-4 flex flex-col gap-2 shrink-0">
                <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">카테고리</div>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full px-4 py-3.5 rounded-2xl transition-all text-left group ${selectedCategory === cat.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid ${cat.icon} w-5 text-center ${selectedCategory === cat.id ? 'text-indigo-400' : 'text-slate-600'}`}></i>
                      <span className="font-bold text-sm">{cat.name}</span>
                    </div>
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pb-24">
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
              <h2 className="text-3xl font-black mb-10 flex items-center gap-4"><i className="fa-solid fa-images text-indigo-500"></i> 내 보관함</h2>
              {myImages.length === 0 ? (
                <div className="h-80 glass border-dashed flex flex-col items-center justify-center text-slate-600 rounded-[40px] opacity-50">
                  <i className="fa-solid fa-ghost text-6xl mb-4"></i>
                  <p className="font-bold text-xl">아직 생성된 이미지가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                  {myImages.map(img => (
                    <div key={img.id} className="glass rounded-[32px] overflow-hidden group shadow-2xl transition-all hover:ring-2 hover:ring-indigo-500/50 animate-fade-in">
                      <div className="relative aspect-square">
                        <img src={img.url} className="w-full h-full object-cover" alt={img.prompt} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                           <button onClick={() => { const a = document.createElement('a'); a.href = img.url; a.download = `art-${img.id}.png`; a.click(); }} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all"><i className="fa-solid fa-download"></i></button>
                           <button onClick={() => setMyImages(prev => prev.filter(i => i.id !== img.id))} className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </div>
                      <div className="p-4 border-t border-white/5 bg-slate-900/30">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{img.styleName}</span>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-medium italic">"{img.prompt}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: Generation Panel */}
        <aside className="w-full md:w-[440px] glass border-l border-white/5 p-8 flex flex-col gap-6 shrink-0 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] z-40">
          <div className="flex-1 overflow-y-auto pr-2 space-y-8">
            <h2 className="text-xl font-black italic tracking-widest text-slate-500">CONTROL CENTER</h2>
            
            {selectedStyle ? (
              <div className="space-y-8 animate-fade-in">
                {/* Style Detail Info */}
                <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-[32px] border border-indigo-500/20 relative overflow-hidden">
                   <div className="absolute -top-12 -right-12 text-[180px] opacity-10 rotate-12">{selectedStyle.icon}</div>
                   <div className="flex items-center gap-4 relative z-10">
                     <div className="text-5xl drop-shadow-2xl">{selectedStyle.icon}</div>
                     <div>
                       <h3 className="text-2xl font-bold">{selectedStyle.name}</h3>
                       <p className="text-xs font-black text-indigo-400 tracking-wider uppercase opacity-80">{selectedStyle.englishName}</p>
                     </div>
                   </div>
                   
                   <div className="mt-8 space-y-5 relative z-10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <i className="fa-solid fa-code text-indigo-500"></i> Template 프롬프트
                        </div>
                        <div className="p-4 bg-black/50 rounded-2xl text-[12px] text-slate-300 italic font-medium leading-relaxed border border-white/5 shadow-inner">
                          "{selectedStyle.template}"
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <i className="fa-solid fa-wand-sparkles text-indigo-500"></i> 예시 (Example)
                        </div>
                        <div className="p-4 bg-indigo-500/10 rounded-2xl text-[12px] text-indigo-300 font-medium leading-relaxed border border-indigo-500/20 shadow-inner">
                          "{selectedStyle.example}"
                        </div>
                      </div>
                   </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">한글 텍스트 입력</label>
                    <input type="text" value={inputText} onChange={handleInputChange} placeholder="여기에 한글을 입력 (예: 기적, 사랑)" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500/50 outline-none text-xl font-black placeholder:text-slate-800 transition-all shadow-inner" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">최종 생성 프롬프트</label>
                      <button onClick={() => { navigator.clipboard.writeText(prompt); alert('프롬프트가 복사되었습니다!'); }} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"><i className="fa-solid fa-copy mr-1"></i> 복사</button>
                    </div>
                    <textarea value={prompt} readOnly className="w-full h-36 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-[13px] italic text-slate-500 resize-none shadow-inner leading-relaxed overflow-y-auto" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 rounded-[40px] border border-dashed border-white/10 opacity-60">
                 <i className="fa-solid fa-hand-pointer text-5xl mb-6 text-indigo-500/40 animate-bounce"></i>
                 <p className="text-slate-400 font-bold text-lg leading-snug">스타일 템플릿을 선택하면<br/><span className="text-indigo-400/80">프롬프트와 예시</span>가 나타납니다.</p>
              </div>
            )}
          </div>

          <div className="pt-6 space-y-5 border-t border-white/5">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-[11px] font-bold flex gap-3 animate-pulse italic"><i className="fa-solid fa-triangle-exclamation mt-0.5"></i>{error}</div>}
            
            <button onClick={handleGenerate} disabled={isGenerating || !prompt} className={`w-full py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-[0.97] ${isGenerating || !prompt ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_20px_50px_rgba(79,70,229,0.4)]'}`}>
              {isGenerating ? <><i className="fa-solid fa-circle-notch animate-spin"></i><span>생성 중...</span></> : <><i className="fa-solid fa-wand-magic-sparkles text-2xl"></i><span>이미지 생성하기</span></>}
            </button>
            
            <div className="flex flex-col items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity duration-500">
               <p className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase">Gemini 3 Pro Image Architecture</p>
               <div className="flex gap-4">
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-indigo-400 hover:underline">Billing Info</a>
                 <span className="text-[9px] text-slate-700">|</span>
                 <span className="text-[9px] text-slate-500">v3.1 Production</span>
               </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
