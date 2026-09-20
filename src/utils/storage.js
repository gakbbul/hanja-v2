// LocalStorage Key Definitions
const KEYS = {
  SETS: 'hanja_study_sets',
  HANJA: 'hanja_items',
  WORDS: 'hanja_word_items',
  ACTIVE_SET: 'hanja_active_set_id',
  QUIZ_HISTORY: 'hanja_quiz_history',
};

// Initial Seed Data
const INITIAL_SETS = [
  {
    id: 'set-suyu-2-2',
    title: '수유중 2-2 기말',
    description: '수유중학교 2학년 2학기 한자·한문 기말고사 대비',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'set-basic-100',
    title: '중학 필수 한자 100',
    description: '중학교 과정 꼭 알아야 할 기초 한자 모음',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_HANJA = [
  // 수유중 2-2 기말 - 1과
  { id: 'h1', setId: 'set-suyu-2-2', unit: '1과', character: '孝', meaningSound: '효도 효' },
  { id: 'h2', setId: 'set-suyu-2-2', unit: '1과', character: '忠', meaningSound: '충성 충' },
  { id: 'h3', setId: 'set-suyu-2-2', unit: '1과', character: '仁', meaningSound: '어질 인' },
  { id: 'h4', setId: 'set-suyu-2-2', unit: '1과', character: '義', meaningSound: '옳을 의' },
  { id: 'h5', setId: 'set-suyu-2-2', unit: '1과', character: '禮', meaningSound: '예도 예' },
  { id: 'h6', setId: 'set-suyu-2-2', unit: '1과', character: '智', meaningSound: '지혜 지' },
  { id: 'h7', setId: 'set-suyu-2-2', unit: '1과', character: '信', meaningSound: '믿을 신' },
  { id: 'h8', setId: 'set-suyu-2-2', unit: '1과', character: '敬', meaningSound: '공경할 경' },

  // 수유중 2-2 기말 - 2과
  { id: 'h9', setId: 'set-suyu-2-2', unit: '2과', character: '學', meaningSound: '배울 학' },
  { id: 'h10', setId: 'set-suyu-2-2', unit: '2과', character: '習', meaningSound: '익힐 습' },
  { id: 'h11', setId: 'set-suyu-2-2', unit: '2과', character: '溫', meaningSound: '따뜻할 온' },
  { id: 'h12', setId: 'set-suyu-2-2', unit: '2과', character: '故', meaningSound: '옛 고' },
  { id: 'h13', setId: 'set-suyu-2-2', unit: '2과', character: '知', meaningSound: '알 지' },
  { id: 'h14', setId: 'set-suyu-2-2', unit: '2과', character: '新', meaningSound: '새 신' },
  { id: 'h15', setId: 'set-suyu-2-2', unit: '2과', character: '師', meaningSound: '스승 사' },
  { id: 'h16', setId: 'set-suyu-2-2', unit: '2과', character: '友', meaningSound: '벗 우' },

  // 수유중 2-2 기말 - 3과
  { id: 'h17', setId: 'set-suyu-2-2', unit: '3과', character: '日', meaningSound: '날 일' },
  { id: 'h18', setId: 'set-suyu-2-2', unit: '3과', character: '月', meaningSound: '달 월' },
  { id: 'h19', setId: 'set-suyu-2-2', unit: '3과', character: '年', meaningSound: '해 년' },
  { id: 'h20', setId: 'set-suyu-2-2', unit: '3과', character: '時', meaningSound: '때 시' },
  { id: 'h21', setId: 'set-suyu-2-2', unit: '3과', character: '春', meaningSound: '봄 춘' },
  { id: 'h22', setId: 'set-suyu-2-2', unit: '3과', character: '夏', meaningSound: '여름 하' },
  { id: 'h23', setId: 'set-suyu-2-2', unit: '3과', character: '秋', meaningSound: '가을 추' },
  { id: 'h24', setId: 'set-suyu-2-2', unit: '3과', character: '冬', meaningSound: '겨울 동' },

  // 중학 필수 한자 100 - 1과
  { id: 'hb1', setId: 'set-basic-100', unit: '1과', character: '山', meaningSound: '메 산' },
  { id: 'hb2', setId: 'set-basic-100', unit: '1과', character: '川', meaningSound: '내 천' },
  { id: 'hb3', setId: 'set-basic-100', unit: '1과', character: '水', meaningSound: '물 수' },
  { id: 'hb4', setId: 'set-basic-100', unit: '1과', character: '火', meaningSound: '불 화' },
  { id: 'hb5', setId: 'set-basic-100', unit: '1과', character: '木', meaningSound: '나무 목' },
  { id: 'hb6', setId: 'set-basic-100', unit: '1과', character: '金', meaningSound: '쇠 금 / 성 김' },
  { id: 'hb7', setId: 'set-basic-100', unit: '1과', character: '土', meaningSound: '흙 토' },
];

const INITIAL_WORDS = [
  // 수유중 2-2 기말 - 1과
  { id: 'w1', setId: 'set-suyu-2-2', unit: '1과', word: '孝道', sound: '효도', meaning: '부모를 정성껏 잘 섬김' },
  { id: 'w2', setId: 'set-suyu-2-2', unit: '1과', word: '忠誠', sound: '충성', meaning: '마음에서 우러나오는 진실하고 참된 정성' },
  { id: 'w3', setId: 'set-suyu-2-2', unit: '1과', word: '仁義', sound: '인의', meaning: '어질고 의로움. 도덕의 으뜸' },
  { id: 'w4', setId: 'set-suyu-2-2', unit: '1과', word: '禮儀', sound: '예의', meaning: '존중과 공경의 마음을 나타내는 행동 의식' },

  // 수유중 2-2 기말 - 2과
  { id: 'w5', setId: 'set-suyu-2-2', unit: '2과', word: '學習', sound: '학습', meaning: '배우고 익힘. 지식과 기술을 배워 자기 것으로 만듦' },
  { id: 'w6', setId: 'set-suyu-2-2', unit: '2과', word: '溫故知新', sound: '온고지신', meaning: '옛것을 익히고 그것을 미루어 새것을 앎' },
  { id: 'w7', setId: 'set-suyu-2-2', unit: '2과', word: '師弟', sound: '사제', meaning: '스승과 제자' },
  { id: 'w8', setId: 'set-suyu-2-2', unit: '2과', word: '親友', sound: '친우', meaning: '친한 친구, 벗' },

  // 수유중 2-2 기말 - 3과
  { id: 'w9', setId: 'set-suyu-2-2', unit: '3과', word: '日月', sound: '일월', meaning: '해와 달, 또는 세월' },
  { id: 'w10', setId: 'set-suyu-2-2', unit: '3과', word: '春夏秋冬', sound: '춘하추동', meaning: '봄, 여름, 가을, 겨울의 사계절' },
  { id: 'w11', setId: 'set-suyu-2-2', unit: '3과', word: '歲月', sound: '세월', meaning: '흘러가는 시간과 세월' },

  // 중학 필수 한자 100 - 1과
  { id: 'wb1', setId: 'set-basic-100', unit: '1과', word: '山川', sound: '산천', meaning: '산과 강, 자연 풍경' },
  { id: 'wb2', setId: 'set-basic-100', unit: '1과', word: '水火', sound: '수화', meaning: '물과 불' },
];

export const initializeStorage = () => {
  try {
    if (!localStorage.getItem(KEYS.SETS)) {
      localStorage.setItem(KEYS.SETS, JSON.stringify(INITIAL_SETS));
    }
    if (!localStorage.getItem(KEYS.HANJA)) {
      localStorage.setItem(KEYS.HANJA, JSON.stringify(INITIAL_HANJA));
    }
    if (!localStorage.getItem(KEYS.WORDS)) {
      localStorage.setItem(KEYS.WORDS, JSON.stringify(INITIAL_WORDS));
    }
    if (!localStorage.getItem(KEYS.ACTIVE_SET)) {
      localStorage.setItem(KEYS.ACTIVE_SET, INITIAL_SETS[0].id);
    }
    if (!localStorage.getItem(KEYS.QUIZ_HISTORY)) {
      localStorage.setItem(KEYS.QUIZ_HISTORY, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Failed to initialize localStorage:', err);
  }
};

export const getStudySets = () => {
  initializeStorage();
  try {
    return JSON.parse(localStorage.getItem(KEYS.SETS)) || [];
  } catch {
    return INITIAL_SETS;
  }
};

export const getActiveSetId = () => {
  initializeStorage();
  try {
    return localStorage.getItem(KEYS.ACTIVE_SET) || INITIAL_SETS[0].id;
  } catch {
    return INITIAL_SETS[0].id;
  }
};

export const setActiveSetId = (setId) => {
  try {
    localStorage.setItem(KEYS.ACTIVE_SET, setId);
  } catch (e) {
    console.error(e);
  }
};

export const saveStudySets = (sets) => {
  try {
    localStorage.setItem(KEYS.SETS, JSON.stringify(sets));
  } catch (e) {
    console.error(e);
  }
};

export const getHanjaItems = (setId = null) => {
  initializeStorage();
  try {
    const items = JSON.parse(localStorage.getItem(KEYS.HANJA)) || [];
    return setId ? items.filter(item => item.setId === setId) : items;
  } catch {
    return [];
  }
};

export const saveHanjaItems = (items) => {
  try {
    localStorage.setItem(KEYS.HANJA, JSON.stringify(items));
  } catch (e) {
    console.error(e);
  }
};

export const getWordItems = (setId = null) => {
  initializeStorage();
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.WORDS)) || [];
    // Normalize words: ensure 'sound' and 'meaning' without 'literalMeaning'
    const items = raw.map(item => {
      const sound = item.sound || item.meaning || '';
      const meaning = item.literalMeaning || item.meaning || '';
      return {
        id: item.id,
        setId: item.setId,
        unit: item.unit,
        word: item.word,
        sound,
        meaning,
      };
    });
    return setId ? items.filter(item => item.setId === setId) : items;
  } catch {
    return [];
  }
};

export const saveWordItems = (items) => {
  try {
    localStorage.setItem(KEYS.WORDS, JSON.stringify(items));
  } catch (e) {
    console.error(e);
  }
};

export const getQuizHistory = () => {
  initializeStorage();
  try {
    return JSON.parse(localStorage.getItem(KEYS.QUIZ_HISTORY)) || [];
  } catch {
    return [];
  }
};

export const addQuizHistory = (record) => {
  const history = getQuizHistory();
  const newRecord = {
    id: `quiz-${Date.now()}`,
    date: new Date().toISOString(),
    ...record,
  };
  history.unshift(newRecord);
  try {
    localStorage.setItem(KEYS.QUIZ_HISTORY, JSON.stringify(history.slice(0, 50))); // Keep last 50
  } catch (e) {
    console.error(e);
  }
  return newRecord;
};

export { INITIAL_SETS, INITIAL_HANJA, INITIAL_WORDS };
