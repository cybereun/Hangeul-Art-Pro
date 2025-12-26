import React, { useState, useEffect } from 'react';
import { STYLES } from './constants';
import { StyleTemplate, GeneratedImage } from './types';
import { generateHangeulImage, testApiConnection } from './services/gemini';

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
  
  // Custom API Key States
  const [customApiKey, setCustomApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle');

  // Load saved data and key
  useEffect(() => {
    const savedImages = localStorage.getItem('hangeul_art_mydata');
    if (savedImages) setMyImages(JSON.parse(savedImages));

    const savedKey = localStorage.getItem('hangeul_art_api_key_enc');
    if (savedKey) {
      try {
        const decodedKey = atob(savedKey);
        setCustomApiKey(decodedKey);
      } catch (e) {
        console.error("Failed to decrypt key from storage");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hangeul_art_mydata', JSON.stringify(myImages));
  }, [myImages]);

  const handleSaveSettings = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('hangeul_art_api_key_enc', btoa(customApiKey.trim()));
    } else {
      localStorage.removeItem('hangeul_art_api_key_enc');
    }
    setIsSettingsOpen(false);
    setTestResult('idle');
  };

  const handleTestKey = async () => {
    if (!customApiKey.trim()) {
      alert("테스트할 API 키를 먼저 입력해주세요.");
      return;
    }
    setIsTestingConnection(true);
    setTestResult('idle');
    try {
      const success = await testApiConnection(customApiKey.trim());
      setTestResult(success ? 'success' : 'fail');
    } catch (e) {
      setTestResult('fail');
    } finally {
      setIsTestingConnection(false);
    }
  };

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
    if (!customApiKey.trim()) {
      setError("설정에서 API 키를 먼저 입력해주세요.");
      setIsSettingsOpen(true);
      return;
    }

    if (!prompt || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const imageUrl = await generateHangeulImage(prompt, customApiKey.trim());
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
      setError("오류가 발생했습니다: " + (e.message || "알 수 없는 오류"));
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
      {/* Header */}
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold">한</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Hangeul Art <span className="text-indigo-400">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            스타일 템플릿
          </button>
          <button 
            onClick={() => setActiveTab('mydata')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'mydata' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            My Data
            {myImages.length > 0 && <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{myImages.length}</span>}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            title="설정"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Side */}
        <section className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {activeTab === 'templates' ? (
            <>
              <nav className="w-full lg:w-96 border-r border-white/5 bg-slate-900/40 overflow-y-auto p-6 flex flex-col gap-4 shrink-0">
                <div className="px-3 py-2 text-[12px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5">카테고리 탐색</div>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`group w-full flex flex-col gap-2 p-5 rounded-[24px] transition-all text-left ${selectedCategory === cat.id ? 'bg-indigo-600/20 text-indigo-400 ring-2 ring-indigo-500/50 shadow-2xl' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${selectedCategory === cat.id ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                        <i className={`fa-solid ${cat.icon} text-xl`}></i>
                      </div>
                      <div className="text-xl font-black leading-tight tracking-tight">{cat.name}</div>
                    </div>
                    <div className="text-[13px] opacity-70 leading-snug break-keep font-medium pl-1 line-clamp-2">
                      {cat.desc}
                    </div>
                  </button>
                ))}
              </nav>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="mb-12 p-10 glass rounded-[40px] border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none"></div>
                  <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-4 flex items-center gap-4">
                      <i className={`fa-solid ${currentCat?.icon} text-indigo-400`}></i>
                      {currentCat?.name}
                    </h2>
                    <p className="text-lg text-slate-400 font-medium break-keep leading-relaxed max-w-3xl">
                      {currentCat?.desc}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-24">
                  {filteredStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleClick(style)}
                      className={`group relative text-left p-8 rounded-[32px] transition-all border-2 ${selectedStyle?.id === style.id ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.1)] scale-[1.02]' : 'glass border-transparent hover:border-white/20 hover:scale-[1.01]'}`}
                    >
                      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{style.icon}</div>
                      <h3 className="font-bold text-xl text-slate-100 mb-2 group-hover:text-white leading-tight">{style.name}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">{style.description}</p>
                      {selectedStyle?.id === style.id && (
                        <div className="absolute top-6 right-6 text-indigo-400">
                          <i className="fa-solid fa-circle-check text-2xl drop-shadow-lg"></i>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-12">
               <h2 className="text-4xl font-black mb-12 flex items-center gap-4">
                <i className="fa-solid fa-images text-indigo-400"></i> 생성된 내 작업물
              </h2>
              {myImages.length === 0 ? (
                <div className="h-[500px] flex flex-col items-center justify-center text-slate-600 glass rounded-[48px] border-dashed border-2 border-white/10">
                  <i className="fa-solid fa-wand-sparkles text-8xl mb-8 opacity-10"></i>
                  <p className="text-xl font-bold">아직 생성된 이미지가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                  {myImages.map(img => (
                    <div key={img.id} className="glass rounded-[40px] overflow-hidden group border border-white/5 hover:border-indigo-500/50 transition-all shadow-2xl">
                      <div className="aspect-square relative">
                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                          <button onClick={() => { const a = document.createElement('a'); a.href = img.url; a.download = `art-${img.id}.png`; a.click(); }} className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-xl"><i className="fa-solid fa-download"></i></button>
                          <button onClick={() => setMyImages(prev => prev.filter(i => i.id !== img.id))} className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-xl"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </div>
                      <div className="p-6">
                        <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">{img.styleName}</span>
                        <p className="text-base text-slate-300 line-clamp-2 mt-2 italic">"{img.prompt}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Side */}
        <aside className="w-full md:w-[440px] glass border-l border-white/10 p-8 flex flex-col gap-8 shrink-0 shadow-2xl">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <i className="fa-solid fa-sparkles text-indigo-400"></i> 생성 패널
          </h2>
          <div className="flex-1 space-y-8 overflow-y-auto pr-2">
            {selectedStyle ? (
              <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-inner relative overflow-hidden">
                <div className="absolute -top-10 -right-10 text-8xl opacity-10 blur-sm pointer-events-none">{selectedStyle.icon}</div>
                <div className="flex items-center gap-5 mb-5 relative z-10">
                  <span className="text-5xl">{selectedStyle.icon}</span>
                  <div>
                    <h3 className="font-black text-xl">{selectedStyle.name}</h3>
                    <p className="text-[12px] text-slate-500 uppercase font-black">{selectedStyle.englishName}</p>
                  </div>
                </div>
                <div className="bg-black/40 p-5 rounded-2xl italic border border-white/5 relative z-10">
                   <p className="text-sm text-slate-300 font-medium">"{selectedStyle.example}"</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-14 bg-black/20 rounded-[40px] border border-dashed border-white/10">
                <p className="text-lg text-slate-500 font-bold">스타일을 먼저 선택하세요</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">삽입할 텍스트</label>
              <input type="text" value={inputText} onChange={handleInputChange} placeholder="예: 우리집, 행복, 사랑..." className="w-full bg-slate-900 border border-white/10 rounded-[24px] px-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-lg shadow-xl" disabled={!selectedStyle} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">생성 프롬프트</label>
                <button onClick={copyToClipboard} disabled={!prompt} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-copy"></i> 복사</button>
              </div>
              <textarea value={prompt} readOnly className="w-full h-40 bg-black/30 border border-white/10 rounded-[28px] px-6 py-6 text-sm italic text-slate-400 resize-none shadow-inner" placeholder="스타일을 선택하면 AI 프롬프트가 자동 생성됩니다." />
            </div>

            <div className="space-y-5 pt-4">
              <button onClick={handleGenerate} disabled={isGenerating || !prompt} className={`w-full py-6 rounded-[28px] font-black text-xl flex items-center justify-center gap-4 transition-all ${isGenerating || !prompt ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] text-white shadow-[0_20px_60px_rgba(79,70,229,0.3)] active:scale-[0.98]'}`}>
                {isGenerating ? <><i className="fa-solid fa-spinner animate-spin"></i><span>생성 중...</span></> : <><i className="fa-solid fa-wand-magic-sparkles text-2xl"></i><span>한글 아트 생성하기</span></>}
              </button>
              <div className="text-center text-white font-medium text-base py-1">Developer: Lebi</div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-3xl text-sm flex items-start gap-4 animate-pulse"><i className="fa-solid fa-circle-exclamation mt-1"></i><span className="font-bold">{error}</span></div>}
            </div>
          </div>
        </aside>
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#18181b] rounded-[40px] p-10 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#7c3aed] flex items-center justify-center text-white text-2xl shadow-lg shadow-[#7c3aed]/20"><i className="fa-solid fa-gear"></i></div>
                <h2 className="text-3xl font-black text-white">설정</h2>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-3xl"></i></button>
            </div>
            <div className="space-y-8">
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-white">Google Gemini API 키</h3>
                <textarea value={customApiKey} onChange={(e) => { setCustomApiKey(e.target.value); setTestResult('idle'); }} placeholder="여기에 API 키를 입력하세요" className="w-full bg-[#27272a] border border-[#3f3f46] rounded-[24px] px-8 py-8 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] min-h-[160px] text-lg resize-none shadow-inner" />
                <div className="flex items-start gap-3 text-[#71717a] px-2">
                  <i className="fa-solid fa-lock mt-1 text-sm"></i>
                  <p className="text-[13px] break-keep">API 키는 브라우저 내부에 암호화되어 로컬 저장소에 저장되며, 외부 서버로 절대 전송되지 않습니다.</p>
                </div>
              </div>
              <button onClick={handleTestKey} disabled={isTestingConnection} className={`w-full py-5 rounded-[24px] bg-transparent border border-[#3f3f46] text-white font-bold flex items-center justify-center gap-4 transition-all hover:bg-white/5 ${testResult === 'success' ? 'border-green-500 text-green-400 bg-green-500/5' : testResult === 'fail' ? 'border-red-500 text-red-400 bg-red-500/5' : ''}`}>
                {isTestingConnection ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-flask-vial text-xl"></i>}
                <span className="text-lg">{testResult === 'success' ? '연결 성공!' : testResult === 'fail' ? '연결 실패' : 'API 기능 테스트'}</span>
              </button>
              <button onClick={handleSaveSettings} className="w-full py-6 rounded-[32px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-2xl shadow-2xl active:scale-95">저장 및 닫기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .glass { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .break-keep { word-break: keep-all; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default App;