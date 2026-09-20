import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Edit2, Upload, Download, ArrowLeft, Layers, Save, X, FileSpreadsheet } from 'lucide-react';
import { parseHanjaFile, parseWordFile, downloadTemplate } from '../utils/excelParser';
import {
  saveStudySetToFirestore,
  deleteStudySetFromFirestore,
  saveHanjaItemsToFirestore,
  updateHanjaItemInFirestore,
  deleteHanjaItemFromFirestore,
  saveWordItemsToFirestore,
  updateWordItemInFirestore,
  deleteWordItemFromFirestore,
} from '../utils/firebaseService';

const AdminPage = ({
  studySets,
  setStudySets,
  setActiveSetId,
  hanjaItems,
  setHanjaItems,
  wordItems,
  setWordItems,
  onClose,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState('sets'); // 'sets' | 'hanja' | 'word'
  const [selectedSetId, setSelectedSetId] = useState(studySets[0]?.id || '');

  // New Study Set Form
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetDesc, setNewSetDesc] = useState('');

  // Upload Feedback Status
  const [uploadMsg, setUploadMsg] = useState(null);

  // Inline Editing Row State
  const [editingId, setEditingId] = useState(null);
  const [editRowData, setEditRowData] = useState({});

  // New Item Inline Add State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemUnit, setNewItemUnit] = useState('1과');
  const [newItemCharWord, setNewItemCharWord] = useState('');
  const [newItemSound, setNewItemSound] = useState('');
  const [newItemMeaning, setNewItemMeaning] = useState('');

  // Set Creation Handler
  const handleCreateSet = async (e) => {
    e.preventDefault();
    if (!newSetTitle.trim()) return;

    const newSet = {
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: newSetTitle.trim(),
      description: newSetDesc.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...studySets, newSet];
    setStudySets(updated);
    setSelectedSetId(newSet.id);
    if (setActiveSetId) setActiveSetId(newSet.id);
    setNewSetTitle('');
    setNewSetDesc('');

    // Save to Firestore
    await saveStudySetToFirestore(newSet);
  };

  // Set Deletion Handler
  const handleDeleteSet = async (setId) => {
    if (studySets.length <= 1) {
      alert('최소 1개의 학습 세트는 유지되어야 합니다.');
      return;
    }
    if (confirm('이 학습 세트와 포함된 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
      const updatedSets = studySets.filter((s) => s.id !== setId);
      const updatedHanja = hanjaItems.filter((h) => h.setId !== setId);
      const updatedWords = wordItems.filter((w) => w.setId !== setId);

      setStudySets(updatedSets);
      setHanjaItems(updatedHanja);
      setWordItems(updatedWords);
      const nextActiveId = updatedSets[0].id;
      setSelectedSetId(nextActiveId);
      if (setActiveSetId) setActiveSetId(nextActiveId);

      // Delete from Firestore
      await deleteStudySetFromFirestore(setId, hanjaItems, wordItems);
    }
  };

  // Hanja Excel Upload
  const handleHanjaFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadMsg({ type: 'info', text: '파일 파싱 중...' });
      const parsed = await parseHanjaFile(file);

      const newItems = parsed.map((item, idx) => ({
        id: `h-up-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        setId: selectedSetId,
        unit: item.unit,
        character: item.character,
        meaningSound: item.meaningSound,
      }));

      setHanjaItems([...hanjaItems, ...newItems]);
      setUploadMsg({
        type: 'success',
        text: `성공! 총 ${newItems.length}개의 한자가 업로드되어 Firebase에 저장되었습니다.`,
      });

      // Save batch to Firestore
      await saveHanjaItemsToFirestore(newItems);
    } catch (err) {
      setUploadMsg({
        type: 'error',
        text: `업로드 실패: ${err.message || '파일 양식을 확인하세요.'}`,
      });
    }
    e.target.value = '';
  };

  // Word Excel Upload
  const handleWordFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadMsg({ type: 'info', text: '파일 파싱 중...' });
      const parsed = await parseWordFile(file);

      const newItems = parsed.map((item, idx) => ({
        id: `w-up-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        setId: selectedSetId,
        unit: item.unit,
        word: item.word,
        sound: item.sound || item.word,
        meaning: item.meaning || '',
      }));

      setWordItems([...wordItems, ...newItems]);
      setUploadMsg({
        type: 'success',
        text: `성공! 총 ${newItems.length}개의 한자 단어가 업로드되어 Firebase에 저장되었습니다.`,
      });

      // Save batch to Firestore
      await saveWordItemsToFirestore(newItems);
    } catch (err) {
      setUploadMsg({
        type: 'error',
        text: `업로드 실패: ${err.message || '파일 양식을 확인하세요.'}`,
      });
    }
    e.target.value = '';
  };

  // Inline Edit Start
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditRowData({ ...item });
  };

  // Inline Edit Save
  const saveEditing = async (isHanja) => {
    if (isHanja) {
      const updated = hanjaItems.map((h) => (h.id === editingId ? editRowData : h));
      setHanjaItems(updated);
      await updateHanjaItemInFirestore(editRowData);
    } else {
      const updated = wordItems.map((w) => (w.id === editingId ? editRowData : w));
      setWordItems(updated);
      await updateWordItemInFirestore(editRowData);
    }
    setEditingId(null);
  };

  // Single Item Deletion
  const deleteItem = async (id, isHanja) => {
    if (isHanja) {
      setHanjaItems(hanjaItems.filter((h) => h.id !== id));
      await deleteHanjaItemFromFirestore(id);
    } else {
      setWordItems(wordItems.filter((w) => w.id !== id));
      await deleteWordItemFromFirestore(id);
    }
  };

  // Add Item Submit
  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItemCharWord.trim()) return;

    if (activeAdminTab === 'hanja') {
      if (!newItemMeaning.trim()) return;
      const newItem = {
        id: `h-add-${Date.now()}`,
        setId: selectedSetId,
        unit: newItemUnit.trim(),
        character: newItemCharWord.trim(),
        meaningSound: newItemMeaning.trim(),
      };
      setHanjaItems([...hanjaItems, newItem]);
      await saveHanjaItemsToFirestore([newItem]);
    } else {
      if (!newItemSound.trim() || !newItemMeaning.trim()) return;
      const newItem = {
        id: `w-add-${Date.now()}`,
        setId: selectedSetId,
        unit: newItemUnit.trim(),
        word: newItemCharWord.trim(),
        sound: newItemSound.trim(),
        meaning: newItemMeaning.trim(),
      };
      setWordItems([...wordItems, newItem]);
      await saveWordItemsToFirestore([newItem]);
    }

    setNewItemCharWord('');
    setNewItemSound('');
    setNewItemMeaning('');
    setShowAddModal(false);
  };

  // Filter items for selected set
  const filteredHanja = hanjaItems.filter((h) => h.setId === selectedSetId);
  const filteredWords = wordItems.filter((w) => w.setId === selectedSetId);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 pb-20 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 mb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">관리자 대시보드</h2>
            <p className="text-[10px] text-slate-500">학습 세트 및 엑셀 데이터 관리</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>나가기</span>
        </button>
      </div>

      {/* Target Study Set Picker */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 mb-4 flex items-center justify-between shadow-sm">
        <span className="text-xs text-slate-600 font-semibold flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>관리 대상 세트:</span>
        </span>
        <select
          value={selectedSetId}
          onChange={(e) => setSelectedSetId(e.target.value)}
          className="bg-slate-50 text-xs font-bold text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
        >
          {studySets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Sub Tabs: [세트 관리] | [한자 관리] | [단어 관리] */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-slate-200 mb-4 text-xs font-bold shadow-sm">
        <button
          onClick={() => setActiveAdminTab('sets')}
          className={`py-2 rounded-lg transition-all ${
            activeAdminTab === 'sets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          세트 관리
        </button>
        <button
          onClick={() => setActiveAdminTab('hanja')}
          className={`py-2 rounded-lg transition-all ${
            activeAdminTab === 'hanja' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          한자 ({filteredHanja.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('word')}
          className={`py-2 rounded-lg transition-all ${
            activeAdminTab === 'word' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          한문 ({filteredWords.length})
        </button>
      </div>

      {/* TAB 1: Study Set Management */}
      {activeAdminTab === 'sets' && (
        <div className="space-y-4">
          {/* Create New Set Form */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-blue-600 flex items-center space-x-1.5">
              <Plus className="w-4 h-4" />
              <span>새 학습 세트 추가</span>
            </h4>
            <form onSubmit={handleCreateSet} className="space-y-2">
              <input
                type="text"
                required
                placeholder="세트 제목 (예: 수유중 2-2 기말)"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
              <input
                type="text"
                placeholder="설명 (선택사항)"
                value={newSetDesc}
                onChange={(e) => setNewSetDesc(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                세트 생성
              </button>
            </form>
          </div>

          {/* List of Existing Sets */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500">등록된 학습 세트 목록</h4>
            {studySets.map((s) => {
              const hCount = hanjaItems.filter((h) => h.setId === s.id).length;
              const wCount = wordItems.filter((w) => w.setId === s.id).length;
              return (
                <div
                  key={s.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-sm"
                >
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{s.title}</span>
                    <span className="text-[10px] text-slate-400">{s.description || '설명 없음'}</span>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-100">
                        한자 {hCount}개
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100">
                        한문 {wCount}개
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSet(s.id)}
                    title="세트 삭제"
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2 & 3: Hanja / Word Management */}
      {(activeAdminTab === 'hanja' || activeAdminTab === 'word') && (
        <div className="space-y-4">
          {/* Excel/CSV Upload Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-600 flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>엑셀/CSV 데이터 대량 업로드</span>
              </h4>
              <button
                onClick={() => downloadTemplate(activeAdminTab)}
                className="flex items-center space-x-1 text-[11px] text-blue-600 hover:underline font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>양식 다운로드</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              규격: [{activeAdminTab === 'hanja' ? '과 | 한자 | 뜻과 음' : '과 | 단어 | 음 | 뜻'}]
            </p>

            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50">
              <Upload className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs font-bold text-slate-700">클릭하여 파일 선택 (.xlsx, .csv)</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={activeAdminTab === 'hanja' ? handleHanjaFileUpload : handleWordFileUpload}
                className="hidden"
              />
            </label>

            {uploadMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold ${
                  uploadMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : uploadMsg.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {uploadMsg.text}
              </div>
            )}
          </div>

          {/* Web Data Table Header & Add Item Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {activeAdminTab === 'hanja' ? '한자 목록' : '단어 목록'} ({activeAdminTab === 'hanja' ? filteredHanja.length : filteredWords.length}개)
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>항목 직접 추가</span>
            </button>
          </div>

          {/* Web Data Table / List View */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
            {activeAdminTab === 'hanja' ? (
              filteredHanja.length > 0 ? (
                filteredHanja.map((h) => {
                  const isEditing = editingId === h.id;
                  return (
                    <div
                      key={h.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                    >
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-3 gap-1 mr-2">
                          <input
                            type="text"
                            value={editRowData.unit}
                            onChange={(e) => setEditRowData({ ...editRowData, unit: e.target.value })}
                            className="bg-slate-50 p-1.5 rounded border border-slate-300 text-slate-900 font-bold"
                          />
                          <input
                            type="text"
                            value={editRowData.character}
                            onChange={(e) => setEditRowData({ ...editRowData, character: e.target.value })}
                            className="bg-slate-50 p-1.5 rounded border border-slate-300 text-slate-900 font-bold text-center"
                          />
                          <input
                            type="text"
                            value={editRowData.meaningSound}
                            onChange={(e) => setEditRowData({ ...editRowData, meaningSound: e.target.value })}
                            className="bg-slate-50 p-1.5 rounded border border-slate-300 text-slate-900 font-bold"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">
                            {h.unit}
                          </span>
                          <span className="text-xl font-extrabold text-slate-900">{h.character}</span>
                          <span className="font-bold text-slate-700">{h.meaningSound}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        {isEditing ? (
                          <button
                            onClick={() => saveEditing(true)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditing(h)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(h.id, true)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs shadow-sm">
                  등록된 한자가 없습니다. 엑셀을 업로드하거나 직접 추가해보세요.
                </div>
              )
            ) : filteredWords.length > 0 ? (
              filteredWords.map((w) => {
                const isEditing = editingId === w.id;
                return (
                  <div
                    key={w.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-1 mr-2">
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            type="text"
                            value={editRowData.unit}
                            onChange={(e) => setEditRowData({ ...editRowData, unit: e.target.value })}
                            className="bg-slate-50 p-1.5 rounded border border-slate-300 text-slate-900 font-bold"
                          />
                          <input
                            type="text"
                            value={editRowData.word}
                            onChange={(e) => setEditRowData({ ...editRowData, word: e.target.value })}
                            className="bg-slate-50 p-1.5 rounded border border-slate-300 text-slate-900 font-bold text-center"
                          />
                          <input
                            type="text"
                            value={editRowData.sound || ''}
                            onChange={(e) => setEditRowData({ ...editRowData, sound: e.target.value })}
                            placeholder="음 (한글 발음)"
                            className="bg-slate-50 p-1.5 rounded border border-slate-300 text-slate-900 font-bold"
                          />
                        </div>
                        <input
                          type="text"
                          value={editRowData.meaning}
                          onChange={(e) => setEditRowData({ ...editRowData, meaning: e.target.value })}
                          placeholder="뜻 (의미)"
                          className="w-full bg-slate-50 p-1.5 rounded border border-slate-300 text-slate-900 font-medium"
                        />
                      </div>
                    ) : (
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
                    )}

                    <div className="flex items-center space-x-1">
                      {isEditing ? (
                        <button
                          onClick={() => saveEditing(false)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditing(w)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteItem(w.id, false)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs shadow-sm">
                등록된 단어가 없습니다. 엑셀을 업로드하거나 직접 추가해보세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white p-5 rounded-2xl border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {activeAdminTab === 'hanja' ? '한자 직접 등록' : '단어 직접 등록'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">단원/과 구분</label>
                <input
                  type="text"
                  required
                  placeholder="예: 1과, 2과"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeAdminTab === 'hanja' ? '한자 (1글자)' : '한자 단어'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={activeAdminTab === 'hanja' ? '예: 孝' : '예: 孝道'}
                  value={newItemCharWord}
                  onChange={(e) => setNewItemCharWord(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold text-center text-base"
                />
              </div>

              {activeAdminTab === 'hanja' ? (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">뜻과 음</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 효도 효"
                    value={newItemMeaning}
                    onChange={(e) => setNewItemMeaning(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">음 (한글 발음)</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 효도"
                      value={newItemSound}
                      onChange={(e) => setNewItemSound(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">뜻 (의미)</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="예: 부모를 정성껏 잘 섬김"
                      value={newItemMeaning}
                      onChange={(e) => setNewItemMeaning(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
