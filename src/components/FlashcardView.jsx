import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Shuffle,
  Grid,
  CreditCard,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Undo2,
  Trophy,
} from 'lucide-react';

const FlashcardView = ({ items, onBack, title }) => {
  // Learning Queue of remaining items
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]); // [{ action: 'know'|'dontknow', card }]
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Initialize or Reset Queue
  const initQueue = (itemList, shuffle = isShuffleOn) => {
    if (!itemList || itemList.length === 0) {
      setQueue([]);
      setTotalCount(0);
      return;
    }
    let list = [...itemList];
    if (shuffle) {
      list.sort(() => Math.random() - 0.5);
    }
    setQueue(list);
    setHistory([]);
    setTotalCount(itemList.length);
    setIsFlipped(false);
  };

  useEffect(() => {
    initQueue(items, isShuffleOn);
  }, [items, isShuffleOn]);

  // When Queue becomes empty and there was content -> Completed!
  const isCompleted = totalCount > 0 && queue.length === 0;

  useEffect(() => {
    if (isCompleted) {
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch (e) {
        console.error(e);
      }
    }
  }, [isCompleted]);

  // --- ACTION: 알아요 (Mastered & Passed) ---
  const handleKnow = () => {
    if (queue.length === 0) return;
    setIsFlipped(false);

    const currentCard = queue[0];
    setHistory((prev) => [...prev, { action: 'know', card: currentCard }]);
    setQueue((prev) => prev.slice(1));
  };

  // --- ACTION: 몰라요 (Push to back of queue for repeated review) ---
  const handleDontKnow = () => {
    if (queue.length === 0) return;
    setIsFlipped(false);

    const currentCard = queue[0];
    setHistory((prev) => [...prev, { action: 'dontknow', card: currentCard }]);
    
    // Move current card to the end of the queue
    if (queue.length === 1) {
      // only 1 card left, keep it in queue
      setQueue([...queue]);
    } else {
      setQueue((prev) => [...prev.slice(1), prev[0]]);
    }
  };

  // --- ACTION: 이전 (Undo previous action) ---
  const handleUndo = () => {
    if (history.length === 0) return;
    setIsFlipped(false);

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));

    if (lastAction.action === 'know') {
      // Restore card back to the front of queue
      setQueue((prev) => [lastAction.card, ...prev]);
    } else if (lastAction.action === 'dontknow') {
      // Remove from back and put back to front
      setQueue((prev) => {
        const withoutLast = prev.slice(0, prev.length - 1);
        return [lastAction.card, ...withoutLast];
      });
    }
  };

  // Keyboard Navigation for Tablet / PC
  useEffect(() => {
    if (viewMode !== 'card' || isCompleted) return;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleDontKnow();
      } else if (e.key === 'ArrowRight' || e.key === '2' || e.key === 'Enter') {
        e.preventDefault();
        handleKnow();
      } else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isCompleted, queue, history, isFlipped]);

  // Toggle Shuffle
  const toggleShuffle = () => {
    const nextState = !isShuffleOn;
    setIsShuffleOn(nextState);
    if (queue.length > 1) {
      if (nextState) {
        setQueue((prev) => [...prev].sort(() => Math.random() - 0.5));
      }
    }
  };

  // Reset entire learning session
  const handleResetSession = () => {
    initQueue(items, isShuffleOn);
  };

  const currentItem = queue[0];
  const masteredCount = totalCount - queue.length;
  const progressPct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  // If no items at all
  if (!items || items.length === 0) {
    return (
      <div className="w-full max-w-xl md:max-w-2xl mx-auto pb-28">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 mb-4 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록으로 돌아가기</span>
          </button>
        )}
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm mt-2">
          <Sparkles className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-base font-bold text-slate-800">등록된 한자가 없습니다.</p>
          <p className="text-xs text-slate-500 mt-1">상단에서 다른 과(단원)를 선택해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col items-center pb-28">
      {/* Navigation Header */}
      {onBack && (
        <div className="w-full flex items-center justify-between mb-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>목록으로</span>
          </button>
          {title && (
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 block">{title}</span>
              <span className="text-[11px] text-blue-600 font-medium">플래시카드 반복학습</span>
            </div>
          )}
        </div>
      )}

      {/* Top Controller Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'card'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>플래시카드</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>전체 목록 ({items.length})</span>
          </button>
        </div>

        {viewMode === 'card' && !isCompleted && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={toggleShuffle}
              title={isShuffleOn ? '무작위 모드 켜짐' : '무작위 모드 꺼짐'}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold active:scale-95 transition-all ${
                isShuffleOn
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>{isShuffleOn ? '무작위 ON' : '순서대로'}</span>
            </button>

            <button
              onClick={handleResetSession}
              title="처음부터 다시 학습"
              className="p-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 rounded-lg border border-slate-200 shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {viewMode === 'card' ? (
        isCompleted ? (
          /* ALL CARDS COMPLETED CELEBRATION VIEW */
          <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center my-2">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-3">
              <Trophy className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">학습 완료!</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              선택한 <strong>총 {totalCount}개의 한자</strong>를 모두 마스터했습니다.<br />
              완벽히 외울 때까지 수고하셨습니다!
            </p>

            <div className="w-full my-5 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-around">
              <div>
                <span className="text-2xl font-black text-blue-600 block">{totalCount}개</span>
                <span className="text-[11px] text-slate-500 font-medium">완료한 한자</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="text-2xl font-black text-emerald-600 block">100%</span>
                <span className="text-[11px] text-slate-500 font-medium">마스터 달성률</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={handleResetSession}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-sm transition-all text-xs flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>처음부터 다시 학습하기</span>
              </button>

              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all text-xs"
                >
                  과/세트 목록으로 돌아가기
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE FLASHCARD QUEUE VIEW */
          <div className="w-full flex flex-col items-center">
            {/* Card Counter & Progress */}
            <div className="w-full mb-2">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1 font-medium px-0.5">
                <span className="flex items-center space-x-1.5">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">
                    {currentItem?.unit}
                  </span>
                  <span>남은 카드: <strong className="text-blue-600 font-bold">{queue.length}</strong> / {totalCount}</span>
                </span>
                <span className="text-emerald-700 font-bold">마스터 {masteredCount}개 완료 ({progressPct}%)</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* 3D Flip Card */}
            <div
              className="w-full h-72 sm:h-80 md:h-96 perspective-1000 cursor-pointer my-2 select-none"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`w-full h-full rounded-2xl relative transform-style-3d shadow-sm ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Card Front (Hanja Character) */}
                <div className="absolute inset-0 w-full h-full rounded-2xl backface-hidden bg-white border border-slate-200 flex flex-col items-center justify-center p-6 md:p-8 text-center shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-blue-600 font-bold mb-2 bg-blue-50 px-3 py-1 rounded-md">
                    한자 (클릭 / Space 로 뒤집기)
                  </span>
                  <span className="text-7xl md:text-8xl font-extrabold text-slate-900 my-auto select-none">
                    {currentItem?.character}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-auto bg-slate-50 px-3.5 py-1 rounded-full border border-slate-100">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>클릭하거나 스페이스바를 누르면 뜻과 음이 나와요</span>
                  </div>
                </div>

                {/* Card Back (Meaning & Sound) */}
                <div className="absolute inset-0 w-full h-full rounded-2xl backface-hidden rotate-y-180 bg-blue-600 border border-blue-700 flex flex-col items-center justify-center p-6 md:p-8 text-center text-white shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider text-blue-200 font-bold mb-2 bg-blue-700/60 px-3 py-1 rounded-md">
                    뜻과 음
                  </span>
                  <span className="text-4xl md:text-5xl font-extrabold text-white my-auto leading-tight">
                    {currentItem?.meaningSound}
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-blue-200 mb-2">
                    ({currentItem?.character})
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs text-blue-200 mt-auto bg-blue-700/40 px-3.5 py-1 rounded-full">
                    <span>다시 클릭하면 한자가 보입니다</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Toggle Flip Button */}
            <div className="w-full flex justify-center mt-1 mb-2">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm"
              >
                {isFlipped ? '한자 보기' : '뜻·음 보기 (Space)'}
              </button>
            </div>

            {/* MAIN ACTION CONTROLS: [몰라요] & [알아요] */}
            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              {/* 몰라요 Button (Pushes back to queue) */}
              <button
                onClick={handleDontKnow}
                className="py-4 md:py-4.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-800 hover:text-rose-700 font-black text-sm border border-slate-200 hover:border-rose-200 shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
                <div className="text-left">
                  <span className="block leading-none">몰라요 <span className="hidden md:inline text-[11px] font-mono text-slate-400">(←/1)</span></span>
                  <span className="text-[10px] font-normal text-slate-500 block mt-0.5">다시 학습 큐에 추가</span>
                </div>
              </button>

              {/* 알아요 Button (Mastered / Passed) */}
              <button
                onClick={handleKnow}
                className="py-4 md:py-4.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <div className="text-left">
                  <span className="block leading-none">알아요 <span className="hidden md:inline text-[11px] font-mono text-blue-200">(→/2)</span></span>
                  <span className="text-[10px] font-normal text-blue-100 block mt-0.5">통과 (완료 처리)</span>
                </div>
              </button>
            </div>

            {/* BOTTOM HELPER: [이전 카드 되돌리기] Button */}
            {history.length > 0 && (
              <div className="w-full flex justify-center mt-3">
                <button
                  onClick={handleUndo}
                  className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-all"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>이전 카드 되돌리기 (Z)</span>
                </button>
              </div>
            )}

            {/* Tablet & Desktop Keyboard Shortcut Indicator */}
            <div className="hidden md:flex items-center justify-center space-x-3 text-xs text-slate-500 mt-4 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-semibold text-slate-700">⌨️ 키보드 단축키:</span>
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono text-[11px] shadow-2xs">Space</kbd> 뒤집기</span>
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono text-[11px] shadow-2xs">← / 1</kbd> 몰라요</span>
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono text-[11px] shadow-2xs">→ / 2</kbd> 알아요</span>
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono text-[11px] shadow-2xs">Z</kbd> 되돌리기</span>
            </div>
          </div>
        )
      ) : (
        /* List Mode View (Multi-Column Grid on Tablet/Desktop) */
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-0.5">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white p-4 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-3xl font-extrabold text-slate-900">{item.character}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mr-2 font-bold">
                  {item.unit}
                </span>
                <span className="text-sm font-bold text-slate-800">{item.meaningSound}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardView;
