import React, { useState, useEffect } from 'react';
import {
  getActiveSetId,
  setActiveSetId as saveActiveSetId,
  saveStudySets,
  saveHanjaItems,
  saveWordItems,
} from './utils/storage';
import { fetchStudyDataFromGoogleSheets } from './utils/googleSheetsService';

import BottomNav from './components/BottomNav';
import HanjaTab from './components/HanjaTab';
import WordTab from './components/WordTab';
import SettingsTab from './components/SettingsTab';
import AdminPage from './components/AdminPage';
import { GraduationCap, Loader2 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('hanja');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Core Data States
  const [studySets, setStudySetsState] = useState([]);
  const [activeSetId, setActiveSetIdState] = useState('');
  const [hanjaItems, setHanjaItemsState] = useState([]);
  const [wordItems, setWordItemsState] = useState([]);

  // Load from Google Sheets on Mount (with localStorage fallback)
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchStudyDataFromGoogleSheets();
      setStudySetsState(data.studySets);
      setHanjaItemsState(data.hanjaItems);
      setWordItemsState(data.wordItems);
      setLastSyncTime(new Date());

      const savedActiveId = getActiveSetId();
      const validActiveId = data.studySets.some((s) => s.id === savedActiveId)
        ? savedActiveId
        : data.studySets[0]?.id || '';

      setActiveSetIdState(validActiveId);
      return data;
    } catch (err) {
      console.error('Failed to load study data from Google Sheets:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Setters with automatic LocalStorage Sync
  const setStudySets = (newSets) => {
    setStudySetsState(newSets);
    saveStudySets(newSets);
  };

  const setActiveSetId = (newId) => {
    setActiveSetIdState(newId);
    saveActiveSetId(newId);
  };

  const setHanjaItems = (newHanjas) => {
    setHanjaItemsState(newHanjas);
    saveHanjaItems(newHanjas);
  };

  const setWordItems = (newWords) => {
    setWordItemsState(newWords);
    saveWordItems(newWords);
  };

  // Render Admin View if active
  if (isAdminMode) {
    return (
      <AdminPage
        studySets={studySets}
        setStudySets={setStudySets}
        setActiveSetId={setActiveSetId}
        hanjaItems={hanjaItems}
        setHanjaItems={setHanjaItems}
        wordItems={wordItems}
        setWordItems={setWordItems}
        onRefreshData={() => loadData(true)}
        isSyncing={isSyncing}
        onClose={() => setIsAdminMode(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs font-bold text-slate-700">한문 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      {/* Outer Shell: Responsive on Mobile / Tablet / PC */}
      <div className="w-full min-h-screen flex flex-col bg-slate-50">
        
        {/* DESKTOP & TABLET TOP NAVIGATION BAR (hidden on mobile) */}
        <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-6xl xl:max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            {/* Left Brand */}
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-black tracking-tight text-slate-900">
                    한문 내신 학습
                  </h1>
                  <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                    PC · 태블릿 모드
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">플래시카드 & 실전 시험 시스템</p>
              </div>
            </div>

            {/* Center Navigation Tabs */}
            <nav className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTab('hanja')}
                className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'hanja'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>한자 학습</span>
              </button>
              <button
                onClick={() => setActiveTab('word')}
                className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'word'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>한문 학습</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>설정</span>
              </button>
            </nav>

            {/* Right: Quick Set Selector & Admin */}
            <div className="flex items-center space-x-3">
              {studySets.length > 0 && (
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500">세트:</span>
                  <select
                    value={activeSetId}
                    onChange={(e) => setActiveSetId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[160px] truncate"
                  >
                    {studySets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MOBILE APP BAR HEADER (hidden on tablet & desktop) */}
        <header className="md:hidden sticky top-0 z-30 px-4 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900">
                한문 내신 학습
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto p-4 md:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'hanja' && (
            <HanjaTab
              studySets={studySets}
              activeSetId={activeSetId}
              setActiveSetId={setActiveSetId}
              hanjaItems={hanjaItems}
            />
          )}

          {activeTab === 'word' && (
            <WordTab
              studySets={studySets}
              activeSetId={activeSetId}
              setActiveSetId={setActiveSetId}
              wordItems={wordItems}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              studySets={studySets}
              activeSetId={activeSetId}
              setActiveSetId={setActiveSetId}
              onRefreshData={() => loadData(true)}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
              onOpenAdmin={() => setIsAdminMode(true)}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation Bar (Visible only on mobile screens) */}
        <div className="md:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

export default App;
