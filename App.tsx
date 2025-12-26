
import React, { useState, useEffect } from 'react';
import { STYLES } from './constants';
import { StyleTemplate, GeneratedImage } from './types';
import { generateHangeulImage, testApiConnection } from './services/gemini';

// Defining AIStudio interface to match global expectations
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

// External declaration for aistudio window functions
declare global {
  interface Window {
    // Added readonly and used AIStudio type to resolve conflicting declarations with ambient environment types
    readonly aistudio: AIStudio;
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
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'fail'>('idle');

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('hangeul_art_mydata');
    if (saved) {
      setMyImages(JSON.parse(saved));
    }
    
    checkApiKey();
  }, []);

  useEffect(() => {
    localStorage.setItem('hangeul_art_mydata', JSON.stringify(myImages));
  }, [myImages]);

  const checkApiKey = async () => {
    try {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } catch (e) {
      console.error("Error checking API key status", e);
    }
  };

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setConnectionStatus('idle');
    } catch (e) {
      console.error("Error opening key selector", e);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const success = await testApiConnection();
      setConnectionStatus(success ? 'success' : 'fail');
    } catch (e) {
      setConnectionStatus('fail');
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
    if (!hasApiKey) {
      await handleSelectKey();
    }

    if (!prompt || isGenerating) return;

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
      if (e.message === "RESET_KEY") {
        setHasApiKey(false);
        setError("API 키에 문제가 발생했습니다. 설정에서 키를 다시 확인해 주세요.");
        setIsSettingsOpen(true);
      } else {
        setError("오류가 발생했습니다: " + e.message);
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl font-bold">한</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Hangeul Art <span className="text-indigo-400">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-layer-group mr-2"></i> 스타일 템플릿
          </button>
          <button 
            onClick={() => setActiveTab('mydata')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'mydata' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-heart mr-2"></i> My Data
            {myImages.length > 0 && <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{myImages.length}</span>}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!hasApiKey ? 'bg-amber-500 text-black animate-pulse' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)] overflow-hidden">
        
        {/* Left Side: Category Sidebar & Style Grid */}
        <section className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {activeTab === 'templates' ? (
            <>
              {/* Category Menu */}
              <nav className="w-full lg:w-96 border-r border-white/5 bg-slate-900/40 overflow-y-auto p-5 flex flex-col gap-4 shrink-0">
                <div className="px-3 py-2 text-[12px] font-black text-slate-500 uppercase tracking-widest mb-1 border-b border-white/5">카테고리 탐색</div>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`group w-full flex flex-col gap-2 p-5 rounded-[24px] transition-all text-left ${selectedCategory === cat.id ? 'bg-indigo-600/20 text-indigo-400 ring-2 ring-indigo-500/50 shadow-2xl' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${selectedCategory === cat.id ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                        <i className={`fa-solid ${cat.icon} text-base`}></i>
                      </div>
                      <div className="text-xl font-black leading-tight tracking-tight">{cat.name}</div>
                    </div>
                    {cat.desc && <div className="text-[13px] opacity-80 leading-snug break-keep font-medium pl-1">{cat.desc}</div>}
                  </button>
                ))}
              </nav>

              {/* Style Grid */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                {/* Main Content Header */}
                <div className="mb-10 p-8 glass rounded-[40px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-5 mb-4">
                      <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
                        <i className={`fa-solid ${currentCat?.icon} text-3xl`}></i>
                      </div>
                      <h2 className="text-4xl font-black tracking-tighter">{currentCat?.name}</h2>
                    </div>
                    <p className="text-lg text-slate-300 italic break-keep leading-relaxed border-l-4 border-indigo-500/50 pl-6 py-1">
                      {currentCat?.desc}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-24">
                  {filteredStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleClick(style)}
                      className={`group relative text-left p-7 rounded-[32px] transition-all border-2 ${selectedStyle?.id === style.id ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.15)] scale-[1.02]' : 'glass border-transparent hover:border-white/20 hover:scale-[1.01]'}`}
                    >
                      <div className="text-5xl mb-5 transform group-hover:scale-110 transition-transform duration-300">{style.icon}</div>
                      <h3 className="font-bold text-xl text-slate-100 mb-2 group-hover:text-white leading-tight">{style.name}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 font-medium">{style.description}</p>
                      
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
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <h2 className="text-4xl font-black flex items-center gap-4 mb-10">
                <i className="fa-solid fa-images text-indigo-400"></i> 생성된 내 작업물
              </h2>
              {myImages.length === 0 ? (
                <div className="h-[500px] flex flex-col items-center justify-center text-slate-500 glass rounded-[48px] border-dashed border-2 border-white/10">
                  <i className="fa-solid fa-wand-sparkles text-8xl mb-8 opacity-5"></i>
                  <p className="text-xl font-bold">아직 생성된 이미지가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 pb-10">
                  {myImages.map(img => (
                    <div key={img.id} className="glass rounded-[40px] overflow-hidden group border border-white/5 hover:border-indigo-500/50 transition-all shadow-2xl">
                      <div className="aspect-square relative">
                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                          <button 
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = img.url;
                              a.download = `hangeul-art-${img.id}.png`;
                              a.click();
                            }}
                            className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-2xl active:scale-90"
                          >
                            <i className="fa-solid fa-download text-xl"></i>
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('이 작품을 정말로 삭제하시겠습니까?')) {
                                setMyImages(prev => prev.filter(i => i.id !== img.id));
                              }
                            }}
                            className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl active:scale-90"
                          >
                            <i className="fa-solid fa-trash text-xl"></i>
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{img.styleName}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{new Date(img.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-base text-slate-300 line-clamp-2 italic leading-relaxed font-medium">"{img.prompt}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Side: Generation Panel */}
        <aside className="w-full md:w-[440px] glass border-l border-white/10 p-7 flex flex-col gap-7 shadow-2xl relative shrink-0">
          <div className="space-y-6 overflow-y-auto pr-2">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <i className="fa-solid fa-sparkles text-indigo-400"></i> 생성 패널
            </h2>
            
            {/* Style Details */}
            {selectedStyle ? (
              <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-inner relative overflow-hidden">
                <div className="absolute -top-10 -right-10 text-8xl opacity-10 blur-sm pointer-events-none select-none">{selectedStyle.icon}</div>
                <div className="flex items-center gap-5 mb-5 relative z-10">
                  <span className="text-5xl">{selectedStyle.icon}</span>
                  <div>
                    <h3 className="font-black text-xl leading-tight">{selectedStyle.name}</h3>
                    <p className="text-[12px] text-slate-500 uppercase font-black tracking-widest mt-1">{selectedStyle.englishName}</p>
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                   <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.15em]">스타일 예시 가이드</div>
                   <p className="text-sm text-slate-300 leading-relaxed bg-black/50 p-5 rounded-2xl italic border border-white/5 shadow-lg">
                     {selectedStyle.example}
                   </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-8 bg-black/20 rounded-[40px] border border-dashed border-white/10">
                <i className="fa-solid fa-hand-pointer text-4xl text-slate-700 mb-5 block animate-bounce"></i>
                <p className="text-lg text-slate-500 font-black">왼쪽 스타일을 먼저 골라주세요.</p>
              </div>
            )}

            {/* Input Box */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase px-1 tracking-[0.2em]">삽입할 텍스트</label>
              <div className="relative">
                <input 
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="예: 우리집, 행복, 사랑..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-[24px] px-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg shadow-2xl placeholder:text-slate-700"
                  disabled={!selectedStyle}
                />
              </div>
            </div>

            {/* Final Prompt View */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">생성 프롬프트</label>
                <button 
                  onClick={copyToClipboard}
                  disabled={!prompt}
                  className="text-[11px] bg-white/5 hover:bg-indigo-600/40 text-indigo-300 px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-indigo-500/30 disabled:opacity-30 font-black"
                >
                  <i className="fa-solid fa-copy"></i> 복사
                </button>
              </div>
              <textarea 
                value={prompt}
                readOnly
                className="w-full h-40 bg-black/50 border border-white/10 rounded-[24px] px-6 py-5 text-sm italic text-slate-400 resize-none leading-relaxed shadow-inner"
                placeholder="스타일을 선택하면 AI 프롬프트가 자동 생성됩니다."
              />
            </div>

            {/* ACTION BUTTON & ERROR */}
            <div className="space-y-5 pt-4">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className={`w-full py-6 rounded-[28px] font-black text-xl flex items-center justify-center gap-5 transition-all ${isGenerating || !prompt ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:scale-[1.02] text-white shadow-[0_20px_60px_rgba(79,70,229,0.3)] active:scale-[0.98]'}`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>캔버스 렌더링 중...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-palette text-2xl"></i>
                    <span>한글 아트 생성하기</span>
                  </>
                )}
              </button>
              
              <div className="text-center text-white font-medium text-base">Developer: Lebi</div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-5 rounded-3xl text-sm flex items-start gap-4 shadow-2xl animate-pulse">
                  <i className="fa-solid fa-triangle-exclamation mt-1 text-lg"></i>
                  <span className="font-bold">{error}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass rounded-[40px] p-8 border border-white/20 shadow-2xl relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <i className="fa-solid fa-gear text-2xl"></i>
              </div>
              <h2 className="text-3xl font-black tracking-tight">설정</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-100">Google Gemini API 키</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  외부 사용자도 안전하게 사용할 수 있도록 이 앱은 로컬 브라우저 세션에 API 키를 유지합니다. Vercel 배포 환경에서도 본인의 API 키를 직접 관리할 수 있습니다.
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline ml-1">결제 관리 안내</a>
                </p>
                <button 
                  onClick={handleSelectKey}
                  className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-4 border ${hasApiKey ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'bg-amber-500 text-black border-transparent shadow-xl'}`}
                >
                  <i className="fa-solid fa-key"></i>
                  {hasApiKey ? 'API 키 변경하기' : 'API 키 선택하기'}
                </button>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-200">연결 테스트</h3>
                  <div className={`flex items-center gap-2 text-sm font-black ${connectionStatus === 'success' ? 'text-green-400' : connectionStatus === 'fail' ? 'text-red-400' : 'text-slate-500'}`}>
                    {connectionStatus === 'success' && <><i className="fa-solid fa-circle-check"></i> 연결 성공</>}
                    {connectionStatus === 'fail' && <><i className="fa-solid fa-circle-exclamation"></i> 연결 실패</>}
                    {connectionStatus === 'idle' && '준비됨'}
                  </div>
                </div>
                <button 
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !hasApiKey}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                >
                  {isTestingConnection ? (
                    <i className="fa-solid fa-spinner animate-spin"></i>
                  ) : (
                    <i className="fa-solid fa-vial"></i>
                  )}
                  API 기능 테스트
                </button>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-5 rounded-[24px] bg-indigo-600 text-white font-black text-xl shadow-2xl hover:bg-indigo-500 transition-all mt-4"
              >
                저장 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Warning for No Key */}
      {!hasApiKey && activeTab === 'templates' && !isSettingsOpen && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 glass p-10 rounded-[48px] border border-amber-500/50 flex flex-col md:flex-row items-center gap-10 shadow-[0_30px_100px_rgba(245,158,11,0.25)] z-30 animate-bounce-slow max-w-[95vw] md:max-w-4xl ring-4 ring-amber-500/10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-4xl shrink-0 shadow-2xl border border-amber-500/30">
              <i className="fa-solid fa-key-skeleton"></i>
            </div>
            <div>
              <p className="text-2xl font-black mb-2 tracking-tight">API 키 설정이 필요합니다.</p>
              <p className="text-base text-slate-400 font-medium">배포 환경에서도 본인의 키를 사용하여 안전하게 이미지를 생성할 수 있습니다.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black px-10 py-5 rounded-[24px] font-black text-xl transition-all shadow-2xl shadow-amber-500/40 whitespace-nowrap active:scale-95 hover:scale-105"
          >
            설정 열기
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -20px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 5s infinite ease-in-out;
        }
        .break-keep {
          word-break: keep-all;
        }
      `}</style>
    </div>
  );
};

export default App;
