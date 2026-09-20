import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  ArrowLeft,
  Layers,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { downloadTemplate } from '../utils/excelParser';
import {
  getActiveSheetId,
  saveActiveSheetId,
  extractSheetId,
  DEFAULT_SHEET_ID,
} from '../utils/googleSheetsService';

const AdminPage = ({
  studySets,
  activeSetId,
  setActiveSetId,
  hanjaItems,
  wordItems,
  onRefreshData,
  isSyncing,
  onClose,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState('sheet'); // 'sheet' | 'hanja' | 'word'
  const [sheetInput, setSheetInput] = useState(getActiveSheetId());
  const [sheetSaveMsg, setSheetSaveMsg] = useState(null);
  const [selectedSetId, setSelectedSetId] = useState(activeSetId || studySets[0]?.id || '');

  const currentSheetId = getActiveSheetId();
  const currentSheetUrl = `https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`;

  // Handle Sheet ID / URL change
  const handleSaveSheetId = async (e) => {
    e.preventDefault();
    const extracted = extractSheetId(sheetInput);
    if (!extracted) {
      setSheetSaveMsg({ type: 'error', text: '올바른 구글 시트 링크 또는 ID를 입력해주세요.' });
      return;
    }

    saveActiveSheetId(extracted);
    setSheetInput(extracted);
    setSheetSaveMsg({ type: 'success', text: '구글 시트 ID가 저장되었습니다. 데이터를 동기화합니다...' });

    if (onRefreshData) {
      await onRefreshData();
    }

    setTimeout(() => {
      setSheetSaveMsg(null);
    }, 4000);
  };

  const handleResetDefaultSheet = async () => {
    saveActiveSheetId(DEFAULT_SHEET_ID);
    setSheetInput(DEFAULT_SHEET_ID);
    setSheetSaveMsg({ type: 'success', text: '기본 구글 시트로 초기화되었습니다.' });
    if (onRefreshData) {
      await onRefreshData();
    }
  };

  // Filter items for selected set
  const filteredHanja = hanjaItems.filter((h) => h.setId === selectedSetId);
  const filteredWords = wordItems.filter((w) => w.setId === selectedSetId);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 pb-20 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 mb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">구글 시트 실시간 데이터 관리</h2>
            <p className="text-[10px] text-slate-500">
              구글 시트에서 직접 입력/수정 후 즉시 동기화할 수 있습니다.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>학습 화면으로 돌아가기</span>
        </button>
      </div>

      {/* Sub Tabs: [구글 시트 설정 & 동기화] | [한자 데이터 확인] | [단어 데이터 확인] */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-slate-200 mb-4 text-xs font-bold shadow-sm">
        <button
          onClick={() => setActiveAdminTab('sheet')}
          className={`py-2 rounded-lg transition-all ${
            activeAdminTab === 'sheet'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          시트 연동 및 가이드
        </button>
        <button
          onClick={() => setActiveAdminTab('hanja')}
          className={`py-2 rounded-lg transition-all ${
            activeAdminTab === 'hanja'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          한자 목록 ({hanjaItems.length}개)
        </button>
        <button
          onClick={() => setActiveAdminTab('word')}
          className={`py-2 rounded-lg transition-all ${
            activeAdminTab === 'word'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          한문 목록 ({wordItems.length}개)
        </button>
      </div>

      {/* TAB 1: Google Sheet Connection & Guide */}
      {activeAdminTab === 'sheet' && (
        <div className="space-y-4">
          {/* Quick Action Box */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>현재 연동된 구글 스프레드시트</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  시트에서 데이터를 입력하고 아래 동기화 버튼을 누르면 즉시 모든 기기에 반영됩니다.
                </p>
              </div>

              <a
                href={currentSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <span>구글 시트 바로 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-2">
              <button
                onClick={onRefreshData}
                disabled={isSyncing}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? '구글 시트와 동기화하는 중...' : '지금 최신 데이터 동기화 (새로고침)'}</span>
              </button>
            </div>
          </div>

          {/* Change Spreadsheet URL / ID */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <span>구글 스프레드시트 링크 또는 ID 변경</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              새로운 스프레드시트를 만들었을 경우, 구글 시트 공유 설정을 <strong>"링크가 있는 모든 사용자에게 보기 권한"</strong>으로 설정한 후 해당 링크나 ID를 입력하세요.
            </p>

            <form onSubmit={handleSaveSheetId} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/... 또는 Sheet ID"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
                >
                  저장 & 동기화
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetDefaultSheet}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  기본 시트로 초기화
                </button>
              </div>
            </form>

            {sheetSaveMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  sheetSaveMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {sheetSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{sheetSaveMsg.text}</span>
              </div>
            )}
          </div>

          {/* Spreadsheet Column Format Instructions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>구글 스프레드시트 탭(시트) 구성 안내</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-blue-700 block">1. [세트] 탭</span>
                <p className="text-[11px] text-slate-600 font-mono">setId | 제목 | 설명</p>
                <p className="text-[10px] text-slate-400">예: set-1 | 1학기 기말 | 1~5과 범위</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-emerald-700 block">2. [한자] 탭</span>
                <p className="text-[11px] text-slate-600 font-mono">setId | 과 | 한자 | 뜻과 음</p>
                <p className="text-[10px] text-slate-400">예: set-1 | 1과 | 孝 | 효도 효</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-amber-700 block">3. [한문] 탭</span>
                <p className="text-[11px] text-slate-600 font-mono">setId | 과 | 단어 | 음 | 뜻</p>
                <p className="text-[10px] text-slate-400">예: set-1 | 1과 | 孝道 | 효도 | 부모 섬김</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-500">오프라인용 엑셀 양식이 필요하신가요?</span>
              <div className="space-x-2">
                <button
                  onClick={() => downloadTemplate('hanja')}
                  className="inline-flex items-center space-x-1 text-[11px] text-blue-600 hover:underline font-bold"
                >
                  <Download className="w-3 h-3" />
                  <span>한자 양식</span>
                </button>
                <button
                  onClick={() => downloadTemplate('word')}
                  className="inline-flex items-center space-x-1 text-[11px] text-emerald-600 hover:underline font-bold"
                >
                  <Download className="w-3 h-3" />
                  <span>한문 양식</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Hanja List Preview */}
      {activeAdminTab === 'hanja' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <span className="text-xs text-slate-600 font-semibold flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>학습 세트 필터:</span>
            </span>
            <select
              value={selectedSetId}
              onChange={(e) => {
                setSelectedSetId(e.target.value);
                if (setActiveSetId) setActiveSetId(e.target.value);
              }}
              className="bg-slate-50 text-xs font-bold text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
            >
              {studySets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                선택된 세트의 한자 ({filteredHanja.length}개)
              </span>
              <a
                href={currentSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center space-x-1"
              >
                <span>구글 시트에서 수정하기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
              {filteredHanja.length > 0 ? (
                filteredHanja.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">
                        {h.unit}
                      </span>
                      <span className="text-xl font-extrabold text-slate-900">{h.character}</span>
                      <span className="font-bold text-slate-700">{h.meaningSound}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  이 세트에 등록된 한자가 없습니다. 구글 시트의 [한자] 탭을 확인하세요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Word List Preview */}
      {activeAdminTab === 'word' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <span className="text-xs text-slate-600 font-semibold flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>학습 세트 필터:</span>
            </span>
            <select
              value={selectedSetId}
              onChange={(e) => {
                setSelectedSetId(e.target.value);
                if (setActiveSetId) setActiveSetId(e.target.value);
              }}
              className="bg-slate-50 text-xs font-bold text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
            >
              {studySets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                선택된 세트의 한문 단어 ({filteredWords.length}개)
              </span>
              <a
                href={currentSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center space-x-1"
              >
                <span>구글 시트에서 수정하기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
              {filteredWords.length > 0 ? (
                filteredWords.map((w, idx) => (
                  <div
                    key={w.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">
                          {w.unit}
                        </span>
                        <span className="text-base font-extrabold text-slate-900">{w.word}</span>
                        <span className="font-bold text-blue-700">[{w.sound || w.word}]</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{w.meaning}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  이 세트에 등록된 한문 단어가 없습니다. 구글 시트의 [한문] 탭을 확인하세요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
