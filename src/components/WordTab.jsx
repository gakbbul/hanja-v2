import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Layers,
  ArrowLeft,
  Bot,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { addQuizHistory } from '../utils/storage';
import { gradeWordsWithAI } from '../utils/aiGrading';

const WordTab = ({ studySets, activeSetId, setActiveSetId, wordItems }) => {
  // Navigation viewMode: 'menu' | 'quiz'
  const [viewMode, setViewMode] = useState('menu');
  const [quizSessionTitle, setQuizSessionTitle] = useState('');

  // Top multi-select in menu
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [expandedUnit, setExpandedUnit] = useState(null);

  // --- QUIZ INTERNAL STATES ---
  // quizStage: 'active' | 'grading_choice' | 'manual_grading' | 'ai_grading' | 'result'
  const [quizStage, setQuizStage] = useState('active');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Input states during active quiz
  const [currentSoundInput, setCurrentSoundInput] = useState('');
  const [currentMeaningInput, setCurrentMeaningInput] = useState('');

  // Collected answers: [{ item, userSound, isSoundCorrect, userMeaning, isMeaningCorrect, aiFeedback }]
  const [userAnswers, setUserAnswers] = useState([]);
  
  // Step-by-step manual grading index
  const [manualIndex, setManualIndex] = useState(0);
  const [_isAiLoading, setIsAiLoading] = useState(false);

  // 1. Filter Word items for active set
  const currentSetWordItems = useMemo(() => {
    return wordItems.filter((item) => item.setId === activeSetId);
  }, [wordItems, activeSetId]);

  // 2. Unique units list sorted naturally (e.g. ['1과', '2과', '3과', ...])
  const availableUnits = useMemo(() => {
    const units = Array.from(new Set(currentSetWordItems.map((item) => item.unit)));
    return units.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [currentSetWordItems]);

  // 3. Group items by unit and create 10-item chunked sets
  const unitDataMap = useMemo(() => {
    const map = {};
    availableUnits.forEach((unit) => {
      const items = currentSetWordItems.filter((item) => item.unit === unit);
      
      const chunkSize = 10;
      const sets = [];
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const setIndex = sets.length + 1;
        const startNum = i + 1;
        const endNum = i + chunk.length;
        sets.push({
          setId: `${unit}-word-set-${setIndex}`,
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
  }, [availableUnits, currentSetWordItems]);

  // Handle Multi-select
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

  const toggleAccordion = (unit) => {
    setExpandedUnit((prev) => (prev === unit ? null : unit));
  };

  // --- START QUIZ ---
  const startQuiz = (items, title) => {
    if (!items || items.length === 0) return;

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setCurrentSoundInput('');
    setCurrentMeaningInput('');
    setUserAnswers([]);
    setManualIndex(0);
    setQuizStage('active');
    setQuizSessionTitle(title || '한문 시험');
    setViewMode('quiz');
  };

  const handleBackToMenu = () => {
    setViewMode('menu');
    setQuizStage('active');
  };

  // Multi-selected items computation
  const multiSelectedItems = useMemo(() => {
    if (selectedUnits.length === 0) return [];
    return currentSetWordItems.filter((item) => selectedUnits.includes(item.unit));
  }, [currentSetWordItems, selectedUnits]);

  const handleMultiQuiz = () => {
    if (multiSelectedItems.length === 0) return;
    const title = selectedUnits.length === availableUnits.length
      ? '전체 단원'
      : selectedUnits.join(', ');
    startQuiz(multiSelectedItems, `${title} 한문 시험`);
  };

  // --- ACTIVE QUIZ: PROCEED TO NEXT QUESTION ---
  const handleNextQuestion = (e) => {
    e.preventDefault();
    const currentItem = questions[currentIndex];

    // 1. Auto Grade Sound (Clean compare)
    const targetSoundClean = (currentItem.sound || currentItem.word).trim().replace(/\s+/g, '').toLowerCase();
    const userSoundClean = currentSoundInput.trim().replace(/\s+/g, '').toLowerCase();
    const isSoundCorrect = userSoundClean === targetSoundClean;

    const recordedAnswer = {
      item: currentItem,
      userSound: currentSoundInput.trim(),
      isSoundCorrect,
      targetSound: currentItem.sound || currentItem.word,
      userMeaning: currentMeaningInput.trim(),
      targetMeaning: currentItem.meaning,
      isMeaningCorrect: false, // will be evaluated in grading phase
      aiFeedback: '',
    };

    const nextAnswers = [...userAnswers, recordedAnswer];
    setUserAnswers(nextAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSoundInput('');
      setCurrentMeaningInput('');
    } else {
      // Quiz questions finished -> Move to Grading Choice screen!
      setQuizStage('grading_choice');
    }
  };

  // --- GRADING ACTIONS ---
  // Option 1: AI Grading (Gemini)
  const handleAIGrading = async () => {
    setIsAiLoading(true);
    setQuizStage('ai_grading');

    try {
      const itemsToGrade = userAnswers.map((ans, idx) => ({
        id: ans.item.id || idx,
        word: ans.item.word,
        sound: ans.targetSound,
        targetMeaning: ans.targetMeaning,
        userMeaning: ans.userMeaning,
      }));

      const aiResults = await gradeWordsWithAI(itemsToGrade);

      // Merge AI evaluations into user answers
      const finalized = userAnswers.map((ans, idx) => {
        const aiEval = aiResults[idx] || {};
        return {
          ...ans,
          isMeaningCorrect: Boolean(aiEval.isCorrect),
          aiFeedback: aiEval.feedback || (aiEval.isCorrect ? 'AI 채점: 정답 인정' : 'AI 채점: 오답'),
        };
      });

      finishGrading(finalized, 'AI 채점 (Gemini)');
    } catch (err) {
      console.error(err);
      // Fallback to manual grading on critical error
      setManualIndex(0);
      setQuizStage('manual_grading');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Option 2: Step-by-step Manual Grading
  const handleStartManualGrading = () => {
    setManualIndex(0);
    setQuizStage('manual_grading');
  };

  // Single item graded in manual mode (O or X)
  const handleGradeCurrentItem = (isCorrect) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[manualIndex] = {
      ...updatedAnswers[manualIndex],
      isMeaningCorrect: isCorrect,
      aiFeedback: isCorrect ? '직접 채점: 정답' : '직접 채점: 오답',
    };
    setUserAnswers(updatedAnswers);

    if (manualIndex + 1 < userAnswers.length) {
      // Move to next word for manual grading
      setManualIndex((prev) => prev + 1);
    } else {
      // All manual grading completed -> Finish and show results!
      finishGrading(updatedAnswers, '수동 직접 채점');
    }
  };

  // Go back to previous word in manual grading
  const handlePrevManualItem = () => {
    if (manualIndex > 0) {
      setManualIndex((prev) => prev - 1);
    }
  };

  // --- FINISH GRADING & SHOW RESULT ---
  const finishGrading = (finalizedAnswers, gradingType) => {
    setUserAnswers(finalizedAnswers);
    setQuizStage('result');

    // Score calculation: Sound (50%) + Meaning (50%) per item
    let totalPoints = 0;
    const maxPoints = finalizedAnswers.length * 100;

    finalizedAnswers.forEach((a) => {
      if (a.isSoundCorrect) totalPoints += 50;
      if (a.isMeaningCorrect) totalPoints += 50;
    });

    const scorePct = Math.round((totalPoints / maxPoints) * 100);

    if (scorePct >= 70) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        console.error(e);
      }
    }

    const wrongItems = finalizedAnswers
      .filter((a) => !a.isSoundCorrect || !a.isMeaningCorrect)
      .map((a) => a.item);

    addQuizHistory({
      type: `단어 주관식 (${gradingType})`,
      score: scorePct,
      correctCount: finalizedAnswers.filter((a) => a.isSoundCorrect && a.isMeaningCorrect).length,
      totalCount: finalizedAnswers.length,
      wrongItems,
    });
  };

  // --- RENDER 1: MENU VIEW (DEFAULT) ---
  if (viewMode === 'menu') {
    const isAllSelected = availableUnits.length > 0 && selectedUnits.length === availableUnits.length;

    return (
      <div className="w-full space-y-4 pb-28">
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
              총 {currentSetWordItems.length}문항
            </span>
          </div>
        )}

        {/* TOP CARD: 복수 선택 한문 시험 (Multi-Selection Quiz Card) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                복수 선택 한문 시험
              </h2>
            </div>
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

          {/* Action Button: ONLY QUIZ BUTTON */}
          <button
            onClick={handleMultiQuiz}
            disabled={selectedUnits.length === 0}
            className="w-full py-3.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-xs md:text-sm"
          >
            <Trophy className="w-4 h-4 text-white" />
            <span>선택 항목 한문 시험 보기</span>
          </button>
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
                      총 {data.totalCount}문항 · {data.setsCount}개 세트
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
                  <div className="px-4 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    {/* Unit Full Quiz Action Button */}
                    <div>
                      <button
                        onClick={() => startQuiz(data.items, `${data.unit} 전체`)}
                        className="w-full py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <Trophy className="w-4 h-4 text-white" />
                        <span>{data.unit} 전체 한문 시험 보기 ({data.totalCount}문항)</span>
                      </button>
                    </div>

                    {/* Word and Meaning List Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
                        <span>{data.unit} 한문 및 뜻 목록 ({data.items.length}개)</span>
                      </div>

                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                        {data.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-base font-extrabold text-slate-900">{item.word}</span>
                                <span className="text-xs font-bold text-blue-700">[{item.sound || item.word}]</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                {idx + 1}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                              {item.meaning}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sub-sets Section (if multiple sets) */}
                    {data.sets && data.sets.length > 1 && (
                      <div className="space-y-2 pt-1 border-t border-slate-200/60">
                        <div className="text-[11px] font-bold text-slate-500 px-0.5">
                          세트별 (약 10단어) 분할 시험
                        </div>

                        <div className="space-y-2">
                          {data.sets.map((set) => (
                            <div
                              key={set.setId}
                              className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between shadow-sm"
                            >
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">{set.name}</h5>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {set.rangeText} ({set.items.length}단어)
                                </span>
                              </div>

                              <button
                                onClick={() => startQuiz(set.items, `${data.unit} ${set.name}`)}
                                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-all"
                              >
                                세트 시험
                              </button>
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
  }

  // --- RENDER 2: ACTIVE QUIZ VIEW (SUBJECTIVE SOUND & MEANING INPUT) ---
  if (quizStage === 'active') {
    const q = questions[currentIndex];
    const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div className="w-full max-w-xl md:max-w-2xl mx-auto flex flex-col items-center pb-28">
        {/* Navigation Bar */}
        <div className="w-full flex items-center justify-between mb-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={handleBackToMenu}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>시험 중단 및 목록으로</span>
          </button>
          <span className="text-xs font-bold text-slate-900">{quizSessionTitle}</span>
        </div>

        {/* Progress Header */}
        <div className="w-full mb-3">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 font-medium">
            <span>
              문제 <strong className="text-blue-600 text-sm font-bold">{currentIndex + 1}</strong> / {questions.length}
            </span>
            <span className="text-slate-400">{progressPct}% 완료</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Word Display Card */}
        <div className="w-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center my-1">
          <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md mb-2">
            {q.unit} · 한문 주관식 시험
          </span>
          <span className="text-6xl md:text-7xl font-extrabold text-slate-900 my-3 tracking-wider">
            {q.word}
          </span>
          <span className="text-xs text-slate-500">
            아래에 한문의 <strong>음</strong>과 <strong>뜻</strong>을 각각 입력하세요.
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleNextQuestion} className="w-full space-y-3 mt-3">
          {/* Sound Input Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>1. 음 (한글 발음)</span>
              <span className="text-[10px] text-slate-400 font-normal">자동 채점</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={currentSoundInput}
              onChange={(e) => setCurrentSoundInput(e.target.value)}
              placeholder="예: 효도, 사이비, 온고지신"
              className="w-full py-3.5 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base font-bold text-center shadow-sm"
            />
          </div>

          {/* Meaning Input Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>2. 뜻 (의미)</span>
              <span className="text-[10px] text-slate-400 font-normal">시험 후 채점</span>
            </label>
            <textarea
              required
              rows={2}
              value={currentMeaningInput}
              onChange={(e) => setCurrentMeaningInput(e.target.value)}
              placeholder="예: 부모를 정성껏 잘 섬김"
              className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!currentSoundInput.trim() || !currentMeaningInput.trim()}
            className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all text-sm flex items-center justify-center space-x-2"
          >
            <span>{currentIndex + 1 === questions.length ? '한문 시험 완료 및 채점하기' : '다음 문항'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // --- RENDER 3: GRADING CHOICE SCREEN (POST-QUIZ) ---
  if (quizStage === 'grading_choice') {
    return (
      <div className="w-full max-w-xl md:max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center pb-28">
        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl mb-3">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>

        <h3 className="text-lg font-black text-slate-900">한문 시험 작성 완료</h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          총 {userAnswers.length}문항의 답안 작성이 끝났습니다.<br />
          <strong>음(발음)</strong>은 자동 채점되었으며,<br />
          <strong>뜻</strong> 채점 방식을 아래에서 선택해주세요.
        </p>

        {/* Choice Options */}
        <div className="w-full space-y-3 my-5">
          {/* AI Grading Button */}
          <button
            onClick={handleAIGrading}
            className="w-full p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm flex items-center justify-between text-left active:scale-95 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-black block text-white">🤖 AI 자동 채점 (Gemini)</span>
                <span className="text-[11px] text-blue-100 block">
                  작성하신 뜻의 의미를 AI가 분석하여 자동 판별합니다.
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          {/* Manual Grading Button */}
          <button
            onClick={handleStartManualGrading}
            className="w-full p-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 flex items-center justify-between text-left active:scale-95 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black block text-slate-900">✍️ 수동 직접 채점 (1문제씩 확인)</span>
                <span className="text-[11px] text-slate-500 block">
                  정답 뜻을 확인하며 맞은 문제(O/X)를 1문제씩 직접 체크합니다.
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER 4: AI LOADING SCREEN ---
  if (quizStage === 'ai_grading') {
    return (
      <div className="w-full max-w-xl md:max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center my-6 pb-28">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <h3 className="text-base font-black text-slate-900">AI 채점 진행 중...</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Gemini AI가 입력하신 뜻의 핵심 의미를<br />
          정답과 비교하여 꼼꼼하게 채점하고 있습니다.
        </p>
      </div>
    );
  }

  // --- RENDER 5: STEP-BY-STEP MANUAL GRADING SCREEN (1단어씩 순차 진행) ---
  if (quizStage === 'manual_grading') {
    const currentAns = userAnswers[manualIndex];
    if (!currentAns) return null;

    const progressPct = Math.round(((manualIndex + 1) / userAnswers.length) * 100);

    return (
      <div className="w-full max-w-xl md:max-w-2xl mx-auto flex flex-col items-center pb-28">
        {/* Top Header */}
        <div className="w-full bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-900">
              수동 채점 진행 ({manualIndex + 1} / {userAnswers.length})
            </h3>
          </div>
          {manualIndex > 0 && (
            <button
              onClick={handlePrevManualItem}
              className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>이전 문제</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-3">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current Single Question Manual Review Card */}
        <div className="w-full bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Word & Sound result */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-3xl font-black text-slate-900 block">{currentAns.item.word}</span>
              <span className="text-xs font-bold text-slate-500 mt-0.5 block">정답 음: [{currentAns.targetSound}]</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-slate-500 block">내가 쓴 음: <strong>{currentAns.userSound || '(미입력)'}</strong></span>
              {currentAns.isSoundCorrect ? (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>음 자동정답</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded mt-1 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>음 오답</span>
                </span>
              )}
            </div>
          </div>

          {/* Meanings comparison */}
          <div className="space-y-2 text-xs">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-950">
              <strong className="text-blue-700 block mb-0.5 font-bold">정답 뜻:</strong>
              <span className="text-sm font-semibold">{currentAns.targetMeaning}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800">
              <strong className="text-slate-500 block mb-0.5 font-bold">내가 작성한 뜻:</strong>
              <span className="text-sm font-semibold">{currentAns.userMeaning || '(미입력)'}</span>
            </div>
          </div>

          <div className="text-center pt-1">
            <span className="text-xs font-bold text-slate-700">
              내가 쓴 뜻이 정답과 맞나요? 아래 버튼을 누르면 다음 단어로 넘어갑니다.
            </span>
          </div>

          {/* Big O / X Decision Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleGradeCurrentItem(false)}
              className="py-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-sm flex items-center justify-center space-x-1.5 active:scale-95 transition-all shadow-sm"
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>오답 처리 (X)</span>
            </button>

            <button
              type="button"
              onClick={() => handleGradeCurrentItem(true)}
              className="py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center space-x-1.5 active:scale-95 transition-all shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>정답 인정 (O)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 6: FINAL RESULT SCREEN ---
  const soundCorrectCount = userAnswers.filter((a) => a.isSoundCorrect).length;
  const meaningCorrectCount = userAnswers.filter((a) => a.isMeaningCorrect).length;
  const wrongAnswers = userAnswers.filter((a) => !a.isSoundCorrect || !a.isMeaningCorrect);

  const totalPoints = (soundCorrectCount * 50) + (meaningCorrectCount * 50);
  const maxPoints = userAnswers.length * 100;
  const scorePct = Math.round((totalPoints / Math.max(1, maxPoints)) * 100);

  return (
    <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto bg-white p-5 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center pb-28">
      <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl mb-2">
        <Trophy className="w-10 h-10 text-blue-600" />
      </div>

      <h3 className="text-lg font-black text-slate-900">한문 시험 성적표</h3>
      <p className="text-xs text-slate-500 mt-0.5">{quizSessionTitle} 채점이 완료되었습니다.</p>

      {/* Score Badge */}
      <div className="my-4 p-4 w-full bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center">
        <span className="text-4xl font-black text-blue-600">
          {scorePct}점
        </span>
        <div className="flex items-center space-x-4 text-xs text-slate-600 mt-2 font-medium">
          <span>음 정답: <strong className="text-blue-700">{soundCorrectCount}/{userAnswers.length}</strong></span>
          <span>뜻 정답: <strong className="text-blue-700">{meaningCorrectCount}/{userAnswers.length}</strong></span>
        </div>
      </div>

      {/* Wrong answers review section */}
      {wrongAnswers.length > 0 ? (
        <div className="w-full space-y-2 text-left mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 mb-1">
            <span>틀린 한문 ({wrongAnswers.length}개)</span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
            {wrongAnswers.map((w, idx) => (
              <div
                key={idx}
                className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-extrabold text-slate-900">{w.item.word}</span>
                    <span className="font-bold text-blue-700">[{w.targetSound}]</span>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                    {w.item.unit}
                  </span>
                </div>

                {/* Sound mistake */}
                {!w.isSoundCorrect && (
                  <div className="text-[11px] text-rose-600 font-medium">
                    음 오답: 작성({w.userSound || '미입력'}) ➔ 정답({w.targetSound})
                  </div>
                )}

                {/* Meaning detail */}
                <div className="bg-white p-2 rounded-lg text-[11px] space-y-0.5 border border-slate-200">
                  <div className="text-blue-800 font-medium">정답 뜻: {w.targetMeaning}</div>
                  <div className="text-slate-500">작성 뜻: {w.userMeaning || '(미입력)'}</div>
                </div>

                {w.aiFeedback && (
                  <div className="text-[10px] text-slate-500 italic">
                    {w.aiFeedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>모든 한문의 음과 뜻을 완벽히 맞히셨습니다!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full space-y-2">
        {wrongAnswers.length > 0 && (
          <button
            onClick={() => startQuiz(wrongAnswers.map((w) => w.item), '오답 한문 재시험')}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>오답 한문만 다시 시험 보기 ({wrongAnswers.length}개)</span>
          </button>
        )}

        <button
          onClick={handleBackToMenu}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all text-xs"
        >
          한문 목록으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default WordTab;
