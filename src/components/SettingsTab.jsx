import React, { useState, useMemo } from 'react';
import { Settings, ShieldCheck, Award, Layers, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { getQuizHistory } from '../utils/storage';
import { loginAdminWithFirebase } from '../utils/firebaseService';

const SettingsTab = ({ studySets, activeSetId, setActiveSetId, onOpenAdmin }) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const history = useMemo(() => getQuizHistory(), []);

  // Admin Firebase Verification Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      await loginAdminWithFirebase(emailInput.trim(), passwordInput.trim());
      setShowPinModal(false);
      setEmailInput('');
      setPasswordInput('');
      onOpenAdmin();
    } catch (err) {
      console.error(err);
      setAuthError('관리자 이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="w-full pb-28 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">학습 설정 및 관리</h3>
            <p className="text-xs text-slate-500">학습 세트 변경, 관리자 입장, 시험 기록을 확인합니다.</p>
          </div>
        </div>
      </div>

      {/* Main Settings Grid: 2-Columns on Tablet & PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left Column: Set Selection & Admin Access */}
        <div className="space-y-4">
          {/* Active Study Set Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>현재 선택된 학습 세트</span>
            </div>

            <select
              value={activeSetId}
              onChange={(e) => setActiveSetId(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {studySets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title} {set.description ? `(${set.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Access Section */}
          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">관리자 페이지</h4>
                  <p className="text-[11px] text-slate-500">학습 세트 등록, 엑셀 데이터 관리</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setAuthError('');
                  setShowPinModal(true);
                }}
                className="flex items-center space-x-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>입장</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Quiz History */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Award className="w-4 h-4 text-blue-600" />
              <span>최근 시험 응시 기록</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{history.length}건 저장됨</span>
          </div>

          {history.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
              {history.slice(0, 15).map((record) => (
                <div
                  key={record.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{record.type}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-sm ${record.score >= 80 ? 'text-blue-600' : 'text-slate-700'}`}>
                      {record.score}점
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {record.correctCount} / {record.totalCount}문제
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              아직 시험 응시 기록이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* App Info Footer */}
      <div className="text-center text-[11px] text-slate-400 pt-4">
        <p className="font-bold text-slate-600">한문 내신 학습 (PC · 태블릿 · 모바일 지원)</p>
        <p className="mt-0.5">중학교 한문 내신 대비 스마트 학습기</p>
      </div>

      {/* Admin Verification Modal (Firebase Auth Only) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mx-auto flex items-center justify-center mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">관리자 계정 로그인</h3>
              <p className="text-xs text-slate-500 mt-1">Firebase 관리자 계정으로 인증합니다.</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="admin@yourdomain.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">비밀번호</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="비밀번호"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {authError && (
                <p className="text-xs text-rose-600 text-center font-bold">
                  {authError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center justify-center space-x-1"
                >
                  {isAuthenticating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>로그인</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
