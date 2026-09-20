import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowRight, Sparkles, HelpCircle, FileText, ArrowLeft } from 'lucide-react';
import { addQuizHistory } from '../utils/storage';

const HanjaQuizView = ({ items, allPoolItems, onBackToStudy, onBack, title }) => {
  const [quizState, setQuizState] = useState('config'); // 'config' | 'active' | 'result'
  const [quizType, setQuizType] = useState('choice'); // 'choice' | 'text'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // Prepare questions on start
  const startQuiz = (customItems = items) => {
    if (!customItems || customItems.length === 0) return;

    const pool = (allPoolItems && allPoolItems.length > 0) ? allPoolItems : items;

    const shuffled = [...customItems].sort(() => Math.random() - 0.5);
    const generated = shuffled.map((item) => {
      // Generate 3 distractors from global pool
      const otherPool = pool.filter(
        (p) => p.meaningSound !== item.meaningSound
      );

      const shuffledOther = [...otherPool].sort(() => Math.random() - 0.5);
      const distractors = shuffledOther.slice(0, 3).map((p) => p.meaningSound);

      // Fill in case pool is extremely small (< 4 unique items)
      let fillIdx = 1;
      while (distractors.length < 3) {
        distractors.push(`보기 ${fillIdx++}`);
      }

      const options = [...distractors, item.meaningSound].sort(() => Math.random() - 0.5);

      return {
        item,
        options,
      };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setTextInput('');
    setIsAnswerSubmitted(false);
    setQuizState('active');
  };

  const handleChoiceSubmit = (option) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(option);
    setIsAnswerSubmitted(true);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (isAnswerSubmitted || !textInput.trim()) return;
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    const q = questions[currentIndex];
    let isCorrect = false;

    // Normalize whitespace & text comparison for short answer
    if (quizType === 'choice') {
      isCorrect = selectedAnswer === q.item.meaningSound;
    } else {
      const userClean = textInput.trim().replace(/\s+/g, '');
      const targetClean = q.item.meaningSound.trim().replace(/\s+/g, '');
      isCorrect = userClean === targetClean;
    }

    const answerRecord = {
      question: q.item,
      userAnswer: quizType === 'choice' ? selectedAnswer : textInput,
      correctAnswer: q.item.meaningSound,
      isCorrect,
    };

    const newAnswers = [...userAnswers, answerRecord];
    setUserAnswers(newAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setTextInput('');
      setIsAnswerSubmitted(false);
    } else {
      // Quiz Finished!
      finishQuiz(newAnswers);
    }
  };

  // Keyboard shortcuts for Desktop/Tablet
  React.useEffect(() => {
    if (quizState !== 'active') return;

    const handleKeyDown = (e) => {
      // If typing in text input, only allow Enter to submit
      if (e.target.tagName === 'INPUT') return;

      if (!isAnswerSubmitted && quizType === 'choice') {
        const q = questions[currentIndex];
        if (q && q.options) {
          if (e.key === '1' && q.options[0]) handleChoiceSubmit(q.options[0]);
          else if (e.key === '2' && q.options[1]) handleChoiceSubmit(q.options[1]);
          else if (e.key === '3' && q.options[2]) handleChoiceSubmit(q.options[2]);
          else if (e.key === '4' && q.options[3]) handleChoiceSubmit(q.options[3]);
        }
      } else if (isAnswerSubmitted) {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizState, isAnswerSubmitted, quizType, currentIndex, questions]);

  const finishQuiz = (finalAnswers) => {
    setQuizState('result');
    const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
    const totalCount = finalAnswers.length;
    const scorePct = Math.round((correctCount / totalCount) * 100);

    // Confetti effect on high score
    if (scorePct >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Record quiz history
    addQuizHistory({
      type: `한자 (${quizType === 'choice' ? '객관식' : '단답형'})`,
      score: scorePct,
      correctCount,
      totalCount,
      wrongItems: finalAnswers.filter((a) => !a.isCorrect).map((a) => a.question),
    });
  };

  const handleReviewWrong = () => {
    const wrongItems = userAnswers.filter((a) => !a.isCorrect).map((a) => a.question);
    startQuiz(wrongItems);
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center text-slate-400 bg-slate-800/40 rounded-3xl border border-slate-700/50">
        <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-2" />
        <p className="font-semibold text-slate-300">시험을 치를 한자 데이터가 없습니다.</p>
      </div>
    );
  }

  if (quizState === 'config') {
    return (
      <div className="w-full max-w-xl md:max-w-2xl mx-auto pb-28">
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
                <span className="text-xs font-bold text-slate-900">{title}</span>
                <span className="text-[11px] text-blue-600 block font-medium">시험 준비 ({items.length}문항)</span>
              </div>
            )}
          </div>
        )}

        <div className="w-full bg-white p-5 md:p-7 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">한자 시험 설정</h3>
              <p className="text-xs text-slate-500">{title ? `${title} 범위로 시험을 치릅니다.` : '선택한 범위로 실력을 테스트해보세요.'}</p>
            </div>
          </div>

          <div className="space-y-4 my-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">시험 유형 선택</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQuizType('choice')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    quizType === 'choice'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-sm ring-2 ring-blue-400/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-xs md:text-sm font-bold">객관식 (4지선다)</span>
                  <span className="text-[11px] text-slate-400">보기에서 선택 (1~4 키 지원)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizType('text')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    quizType === 'text'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-sm ring-2 ring-blue-400/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-xs md:text-sm font-bold">단답형 (직접입력)</span>
                  <span className="text-[11px] text-slate-400">뜻과 음 직접 입력</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <span className="font-medium">출제 문항 수</span>
              <span className="font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-md">
                총 {items.length} 문제
              </span>
            </div>
          </div>

          <button
            onClick={() => startQuiz()}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm active:scale-95 transition-all text-sm flex items-center justify-center space-x-2"
          >
            <span>시험 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ SCREEN ---
  if (quizState === 'active') {
    const q = questions[currentIndex];
    const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div className="w-full max-w-xl md:max-w-2xl mx-auto flex flex-col items-center pb-28">
        {onBack && (
          <div className="w-full flex items-center justify-between mb-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={onBack}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 px-3 py-1.5 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>시험 중단 및 목록으로</span>
            </button>
            {title && (
              <span className="text-xs font-bold text-slate-900">{title}</span>
            )}
          </div>
        )}

        {/* Progress header */}
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

        {/* Question Hanja Display */}
        <div className="w-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center my-1">
          <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md mb-2">
            {q.item.unit} · 올바른 뜻과 음은?
          </span>
          <span className="text-7xl md:text-8xl font-extrabold text-slate-900 my-2 select-none">{q.item.character}</span>
        </div>

        {/* Options / Input Section (2x2 Grid on Tablet/PC) */}
        {quizType === 'choice' ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            {q.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = opt === q.item.meaningSound;

              let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';
              if (isAnswerSubmitted) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle = 'bg-rose-50 border-rose-500 text-rose-800 font-bold';
                }
              } else if (isSelected) {
                btnStyle = 'bg-blue-50 border-blue-500 text-blue-900 font-bold';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceSubmit(opt)}
                  disabled={isAnswerSubmitted}
                  className={`p-3.5 md:p-4 rounded-xl border text-left flex items-center justify-between shadow-sm transition-all ${btnStyle}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center border border-slate-200 shadow-2xs">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold">{opt}</span>
                  </div>
                  {isAnswerSubmitted && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {isAnswerSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Short Answer Text Mode */
          <form onSubmit={handleTextSubmit} className="w-full space-y-2.5 mt-3">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isAnswerSubmitted}
                placeholder="예: 효도 효"
                className="w-full py-3.5 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base font-bold text-center shadow-sm"
              />
            </div>

            {!isAnswerSubmitted ? (
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="w-full py-3.5 bg-blue-600 disabled:opacity-40 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
              >
                정답 제출 (Enter)
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">정답:</span>
                <span className="text-sm font-bold text-blue-700">{q.item.meaningSound}</span>
              </div>
            )}
          </form>
        )}

        {/* Bottom Next Button when answer submitted */}
        {isAnswerSubmitted && (
          <button
            onClick={handleNextQuestion}
            className="w-full mt-3 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm active:scale-95 transition-all text-sm flex items-center justify-center space-x-2"
          >
            <span>{currentIndex + 1 === questions.length ? '결과 보기 (Enter)' : '다음 문제 (Enter)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Keyboard hint */}
        <div className="hidden md:flex items-center justify-center space-x-3 text-xs text-slate-400 mt-4">
          <span>💡 객관식 보기 번호 <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-[11px]">1~4</kbd> 키 입력 및 <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-[11px]">Enter</kbd> 로 빠르게 진행할 수 있습니다.</span>
        </div>
      </div>
    );
  }

  // --- RESULT SCREEN ---
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;
  const wrongAnswers = userAnswers.filter((a) => !a.isCorrect);
  const scorePct = Math.round((correctCount / Math.max(1, userAnswers.length)) * 100);

  return (
    <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto bg-white p-5 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center pb-28">
      <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl mb-2">
        <Trophy className="w-10 h-10 text-blue-600" />
      </div>

      <h3 className="text-lg font-black text-slate-900">한자 시험 완료</h3>
      <p className="text-xs text-slate-500 mt-0.5">수고하셨습니다. 성적을 확인해보세요.</p>

      {/* Score Badge */}
      <div className="my-4 p-4 w-full bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center">
        <span className="text-4xl font-black text-blue-600">
          {scorePct}점
        </span>
        <span className="text-xs text-slate-600 mt-1 font-medium">
          총 {userAnswers.length}문제 중 <strong className="text-blue-700">{correctCount}문제</strong> 정답
        </span>
      </div>

      {/* Wrong answers review section */}
      {wrongAnswers.length > 0 ? (
        <div className="w-full space-y-2 text-left mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 mb-1">
            <span>틀린 문제 ({wrongAnswers.length}개)</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
            {wrongAnswers.map((w, idx) => (
              <div
                key={idx}
                className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-slate-900">{w.question.character}</span>
                  <span className="text-rose-500 line-through">
                    {w.userAnswer || '(미입력)'}
                  </span>
                </div>
                <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {w.correctAnswer}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>모든 문제를 맞히셨습니다! 만점 축하합니다!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full space-y-2">
        {wrongAnswers.length > 0 && (
          <button
            onClick={handleReviewWrong}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 active:scale-95 transition-all text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>오답만 다시 풀기 ({wrongAnswers.length}문제)</span>
          </button>
        )}

        <button
          onClick={() => setQuizState('config')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all text-xs"
        >
          다시 시험 보기
        </button>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 active:scale-95 transition-all text-xs"
          >
            과/세트 목록으로 돌아가기
          </button>
        )}

        {onBackToStudy && (
          <button
            onClick={onBackToStudy}
            className="w-full py-2 bg-transparent hover:bg-slate-100 text-slate-500 font-medium rounded-xl active:scale-95 transition-all text-xs"
          >
            학습 모드로 전환
          </button>
        )}
      </div>
    </div>
  );
};

export default HanjaQuizView;
