import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Layers, BookOpen, Trophy } from 'lucide-react';
import FlashcardView from './FlashcardView';
import HanjaQuizView from './HanjaQuizView';

const HanjaTab = ({ studySets, activeSetId, setActiveSetId, hanjaItems }) => {
  // Navigation viewMode: 'menu' | 'study' | 'quiz'
  const [viewMode, setViewMode] = useState('menu');
  const [activeSession, setActiveSession] = useState({ title: '', items: [] });

  // Multi-selection state for top grid
  const [selectedUnits, setSelectedUnits] = useState([]);

  // Accordion state: which unit is currently expanded (or null)
  const [expandedUnit, setExpandedUnit] = useState(null);

  // 1. Filter Hanja items for active set
  const currentSetHanjaItems = useMemo(() => {
    return hanjaItems.filter((item) => item.setId === activeSetId);
  }, [hanjaItems, activeSetId]);

  // 2. Unique units list sorted naturally (e.g. ['4과', '5과', '6과', ...])
  const availableUnits = useMemo(() => {
    const units = Array.from(new Set(currentSetHanjaItems.map((item) => item.unit)));
    return units.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [currentSetHanjaItems]);

  // Group items by unit and create 10-item chunked sets
  const unitDataMap = useMemo(() => {
    const map = {};
    availableUnits.forEach((unit) => {
      const items = currentSetHanjaItems.filter((item) => item.unit === unit);
      
      // Chunk items into ~10 items per set
      const chunkSize = 10;
      const sets = [];
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const setIndex = sets.length + 1;
        const startNum = i + 1;
        const endNum = i + chunk.length;
        sets.push({
          setId: `${unit}-set-${setIndex}`,
          setIndex,
          name: `세트 ${setIndex}`,
          rangeText: `${startNum} ~ ${endNum}번`,
          items: chunk,
        });
      }

      map[unit] = {
        unit,
        items,
        totalCount: items.length,
        setsCount: sets.length,
        sets,
      };
    });
    return map;
  }, [availableUnits, currentSetHanjaItems]);

  // Handle Multi-select in top card
  const toggleUnitSelection = (unit) => {
    setSelectedUnits((prev) => {
      if (prev.includes(unit)) {
        return prev.filter((u) => u !== unit);
      } else {
        return [...prev, unit];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUnits.length === availableUnits.length) {
      setSelectedUnits([]);
    } else {
      setSelectedUnits([...availableUnits]);
    }
  };

  // Toggle Accordion
  const toggleAccordion = (unit) => {
    setExpandedUnit((prev) => (prev === unit ? null : unit));
  };

  // Start Study or Quiz
  const startStudy = (items, title) => {
    if (!items || items.length === 0) return;
    setActiveSession({ title, items });
    setViewMode('study');
  };

  const startQuiz = (items, title) => {
    if (!items || items.length === 0) return;
    setActiveSession({ title, items });
    setViewMode('quiz');
  };

  const handleBackToMenu = () => {
    setViewMode('menu');
  };

  // Multi-selected items computation
  const multiSelectedItems = useMemo(() => {
    if (selectedUnits.length === 0) return [];
    return currentSetHanjaItems.filter((item) => selectedUnits.includes(item.unit));
  }, [currentSetHanjaItems, selectedUnits]);

  // Multi-select actions
  const handleMultiStudy = () => {
    if (multiSelectedItems.length === 0) return;
    const title = selectedUnits.length === availableUnits.length 
      ? '전체 단원' 
      : selectedUnits.join(', ');
    startStudy(multiSelectedItems, `${title} 학습`);
  };

  const handleMultiQuiz = () => {
    if (multiSelectedItems.length === 0) return;
    const title = selectedUnits.length === availableUnits.length 
      ? '전체 단원' 
      : selectedUnits.join(', ');
    startQuiz(multiSelectedItems, `${title} 시험`);
  };

  // If in Study View
  if (viewMode === 'study') {
    return (
      <FlashcardView
        items={activeSession.items}
        title={activeSession.title}
        onBack={handleBackToMenu}
      />
    );
  }

  // If in Quiz View
  if (viewMode === 'quiz') {
    return (
      <HanjaQuizView
        items={activeSession.items}
        allPoolItems={currentSetHanjaItems}
        title={activeSession.title}
        onBack={handleBackToMenu}
        onBackToStudy={() => setViewMode('study')}
      />
    );
  }

  // Default: Menu View (Image Layout)
  const isAllSelected = availableUnits.length > 0 && selectedUnits.length === availableUnits.length;

  return (
    <div className="w-full space-y-4 pb-24">
      {/* Set Selector Dropdown */}
      {studySets.length > 1 && (
        <div className="flex items-center justify-between px-2 py-1 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            <select
              value={activeSetId}
              onChange={(e) => {
                setActiveSetId(e.target.value);
                setSelectedUnits([]);
                setExpandedUnit(null);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {studySets.map((set) => (
                <option key={set.id} value={set.id} className="bg-white text-slate-900">
                  {set.title}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            총 {currentSetHanjaItems.length}자
          </span>
        </div>
      )}

      {/* TOP CARD: 복수 선택 학습 및 시험 (Multi Selection Card) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            복수 선택 학습 및 시험
          </h2>
          <button
            onClick={handleSelectAll}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
          >
            {isAllSelected ? '선택 해제' : '모두 선택'}
          </button>
        </div>

        {/* Unit Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 mb-5">
          {availableUnits.map((unit) => {
            const isSelected = selectedUnits.includes(unit);
            return (
              <button
                key={unit}
                onClick={() => toggleUnitSelection(unit)}
                className={`py-3 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {unit}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleMultiStudy}
            disabled={selectedUnits.length === 0}
            className="py-3.5 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>선택 항목 학습</span>
          </button>

          <button
            onClick={handleMultiQuiz}
            disabled={selectedUnits.length === 0}
            className="py-3.5 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Trophy className="w-4 h-4 text-white" />
            <span>선택 항목 시험</span>
          </button>
        </div>
      </div>

      {/* SECTION TITLE: 과별 및 세트 세부 메뉴 */}
      <div className="px-1 pt-1">
        <h3 className="text-xs md:text-sm font-bold text-slate-500">
          과별 및 세트 세부 메뉴
        </h3>
      </div>

      {/* ACCORDION / CARD GRID: 과별 세부 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {availableUnits.map((unit) => {
          const data = unitDataMap[unit];
          if (!data) return null;

          const isExpanded = expandedUnit === unit;

          return (
            <div
              key={unit}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleAccordion(unit)}
                className="p-4 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h4 className="text-base font-black text-slate-900">{data.unit}</h4>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    총 {data.totalCount}자 · {data.setsCount}개 세트
                  </span>
                </div>
                <div className="p-1 text-slate-400">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Accordion Expanded Body */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  {/* Unit Full Study & Quiz Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      onClick={() => startStudy(data.items, `${data.unit} 전체`)}
                      className="py-3 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-all active:scale-95 flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>학습</span>
                    </button>
                    <button
                      onClick={() => startQuiz(data.items, `${data.unit} 전체`)}
                      className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5 text-white" />
                      <span>시험</span>
                    </button>
                  </div>

                  {/* Sub-sets Section */}
                  {data.sets && data.sets.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-500 px-0.5">
                        세트별 (약 10자) 분할
                      </div>

                      <div className="space-y-2">
                        {data.sets.map((set) => (
                          <div
                            key={set.setId}
                            className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center justify-between shadow-sm"
                          >
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">{set.name}</h5>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {set.rangeText}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => startStudy(set.items, `${data.unit} ${set.name}`)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-all"
                              >
                                학습
                              </button>
                              <button
                                onClick={() => startQuiz(set.items, `${data.unit} ${set.name}`)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                              >
                                시험
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HanjaTab;
