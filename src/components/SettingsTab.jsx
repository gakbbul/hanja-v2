import React, { useMemo, useState } from 'react';
import {
  Award,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { getQuizHistory } from '../utils/storage';
import { getActiveSheetId } from '../utils/googleSheetsService';

const SettingsTab = ({
  studySets,
  activeSetId,
  setActiveSetId,
  onRefreshData,
  isSyncing,
  lastSyncTime,
  onOpenAdmin,
}) => {
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);
  const history = useMemo(() => getQuizHistory(), []);
  const activeSheetId = getActiveSheetId();
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`;

  const handleManualSync = async () => {
    if (onRefreshData) {
      await onRefreshData();
      setSyncSuccessMsg(true);
      setTimeout(() => setSyncSuccessMsg(false), 3000);
    }
  };

  return (
    <div className="w-full pb-28 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">구글 스프레드시트 실시간 연동</h3>
            <p className="text-xs text-slate-500">
              구글 시트에서 수정 후 '새로고침'을 누르면 즉시 앱에 반영됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Grid: 2-Columns on Tablet & PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left Column: Google Sheets & Set Selection */}
        <div className="space-y-4">
          {/* Google Sheets Sync Card */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="text-xs font-bold text-slate-900">구글 시트 연동 중</h4>
              </div>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all"
              >
                <span>시트 열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              연동된 시트: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-700 font-mono break-all">{activeSheetId}</code>
            </p>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '구글 시트에서 불러오는 중...' : '지금 데이터 동기화 (새로고침)'}</span>
            </button>

            {syncSuccessMsg && (
              <div className="flex items-center justify-center space-x-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>최신 구글 시트 데이터가 반영되었습니다!</span>
              </div>
            )}

            {lastSyncTime && (
              <p className="text-[10px] text-slate-400 text-center">
                마지막 동기화: {lastSyncTime.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Active Study Set Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>현재 학습 세트 선택</span>
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

          {/* Advanced Admin Access Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">시트 URL 설정 & 대시보드</h4>
                <p className="text-[10px] text-slate-400">다른 구글 시트 주소 연결 및 데이터 검토</p>
              </div>
            </div>

            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all"
            >
              설정 열기
            </button>
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
        <p className="font-bold text-slate-600">한문 내신 학습 (구글 스프레드시트 실시간 연동)</p>
        <p className="mt-0.5">중학교 한문 내신 대비 스마트 학습기</p>
      </div>
    </div>
  );
};

export default SettingsTab;
