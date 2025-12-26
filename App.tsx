
import React, { useState, useEffect } from 'react';
import { STYLES } from './constants';
import { StyleTemplate, GeneratedImage } from './types';
import { generateHangeulImage } from './services/gemini';

// 플랫폼 API 키 관리 함수 선언 - AIStudio 타입을 사용하여 선언 충돌을 해결합니다.
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const CATEGORIES = [
  { 
    id: 'all', 
    name: '🏠 전체 스타일 보기', 
    icon: 'fa-border-all',
    desc: '모든 한글 아트 스타일을 한눈에 확인하세요.'
  },
  { 
    id: 'Mood & Concept', 
    name: '🎭 분위기와 컨셉', 
    icon: 'fa-wand-magic-sparkles', 
    desc: '전체적인 이미지의 분위기나 특정 테마를 결정하는 스타일입니다.' 
  },
  { 
    id: 'Texture & Material', 
    name: '🧱 질감과 재료', 
    icon: 'fa-mound', 
    desc: '텍스트를 구성하는 소재의 질감과 촉각적인 느낌을 강조하는 스타일입니다.' 
  },
  { 
    id: 'Layout & Structure', 
    name: '📐 형태와 구조', 
    icon: 'fa-layer-group', 
    desc: '텍스트의 배치, 각도, 정렬 방식을 통해 시각적인 재미를 주는 스타일입니다.' 
  },
  { 
    id: 'Color & Effect', 
    name: '🎨 색채와 효과', 
    icon: 'fa-palette', 
    desc: '색상의 조화나 특수 효과를 통해 시선을 사로잡는 스타일입니다.' 
  },
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
    const savedImages = localStorage.getItem('hangeul_art_mydata');
    if (savedImages) setMyImages(JSON.parse(savedImages));
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
    if (selectedStyle) {
      updatePrompt(selectedStyle, text);
    }
  };

  const copyToClipboard = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    alert('프롬프트가 복사되었습니다!');
  };

  const handleGenerate = async () => {
    if (!prompt || isGenerating) return;

    // API 키 선택 여부 확인 (플랫폼 표준 가이드라인)
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // 키 선택 창을 띄운 후에는 즉시 진행 (레이스 컨디션 방지)
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
          prompt: prompt,
          styleName: selectedStyle?.name || "사용자 지정",
          createdAt: Date.now()
        };
        setMyImages(prev => [newImg, ...prev]);
        setActiveTab('mydata');
      } else {
        setError("이미지를 생성하지 못했습니다. 다시 시도해 주세요.");
      }
    } catch (e: any) {
      console.error(e);
      // API Key selection error handling as per guidelines
      if (e.message?.includes("Requested entity was not found")) {
        setError("API 키 설정이 필요합니다. 상단의 키 버튼을 클릭해 주세요.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else {
        setError("오류가 발생했습니다: " + (e.message || "알 수 없는 오류"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const currentCat = CATEGORIES.find(c => c.id === selectedCategory);
  const filteredStyles = selectedCategory === 'all' 
    ? STYLES 
    : STYLES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden">
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold">한</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Hangeul Art <span className="text-indigo-400">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('templates')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>스타일 템플릿</button>
          <button onClick={() => setActiveTab('mydata')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'mydata' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>My Data</button>
          <button onClick={() => window.aistudio?.openSelectKey()} title="API 키 선택" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-slate-400 hover:text-white transition-all"><i className="fa-solid fa-key"></i></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)] overflow-hidden">
        <section className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {activeTab === 'templates' ? (
            <>
              <nav className="w-full lg:w-96 border-r border-white/5 bg-slate-900/40 overflow-y-auto p-6 flex flex-col gap-4 shrink-0">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full p-5 rounded-3xl transition-all text-left ${selectedCategory === cat.id ? 'bg-indigo-600/20 ring-1 ring-indigo-500/50 shadow-xl' : 'hover:bg-white/5'}`}>
                    <div className="flex items-center gap-4 mb-2">
                      <i className={`fa-solid ${cat.icon} text-lg ${selectedCategory === cat.id ? 'text-indigo-400' : 'text-slate-500'}`}></i>
                      <span className="font-bold">{cat.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
                  {filteredStyles.map(style => (
                    <button key={style.id} onClick={() => handleStyleClick(style)} className={`group relative p-8 rounded-[32px] transition-all border-2 ${selectedStyle?.id === style.id ? 'bg-indigo-600/20 border-indigo-500 scale-[1.02]' : 'glass border-transparent hover:border-white/20'}`}>
                      <div className="text-5xl mb-6">{style.icon}</div>
                      <h3 className="font-bold text-xl mb-2">{style.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-12">
              <h2 className="text-3xl font-bold mb-12">생성된 내 작업물</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {myImages.map(img => (
                  <div key={img.id} className="glass rounded-[32px] overflow-hidden group shadow-2xl">
                    <img src={img.url} className="w-full aspect-square object-cover" alt={img.prompt} />
                    <div className="p-5">
                      <span className="text-xs font-bold text-indigo-400 uppercase">{img.styleName}</span>
                      <p className="text-sm text-slate-400 line-clamp-1 mt-1 italic">"{img.prompt}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="w-full md:w-[400px] glass border-l border-white/10 p-8 flex flex-col gap-8 shrink-0">
          <h2 className="text-2xl font-black italic">GENERATE PANEL</h2>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">한글 텍스트 입력</label>
              <input type="text" value={inputText} onChange={handleInputChange} placeholder="예: 기적, 사랑, 2025" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500/50 outline-none text-lg font-bold" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">AI 프롬프트 (자동 생성)</label>
              <textarea value={prompt} readOnly className="w-full h-40 bg-black/30 border border-white/10 rounded-2xl px-5 py-5 text-sm italic text-slate-400 resize-none shadow-inner" placeholder="스타일을 선택하면 프롬프트가 완성됩니다." />
            </div>

            <div className="pt-4 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold flex gap-2"><i className="fa-solid fa-circle-exclamation mt-0.5"></i>{error}</div>}
              <button onClick={handleGenerate} disabled={isGenerating || !prompt} className={`w-full py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 transition-all ${isGenerating || !prompt ? 'bg-slate-800 text-slate-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] shadow-2xl shadow-indigo-600/30'}`}>
                {isGenerating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                <span>{isGenerating ? '생성 중...' : '이미지 만들기'}</span>
              </button>
              <div className="text-center">
                <p className="text-[10px] text-slate-600">Gemini 3 Pro Image (Nano Banana Pro) 모델을 사용합니다.</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-indigo-500/50 hover:underline">Billing 안내</a>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
