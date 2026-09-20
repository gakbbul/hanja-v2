import {
  INITIAL_SETS,
  INITIAL_HANJA,
  INITIAL_WORDS,
  saveStudySets,
  saveHanjaItems,
  saveWordItems,
  getStudySets,
  getHanjaItems,
  getWordItems,
} from './storage.js';

// Default Google Spreadsheet ID (gakbbul's sheet)
export const DEFAULT_SHEET_ID = '1sTBhsLHpxH4nr24mW0MUuvOXHIf8wUuCr_Ey1F6U8HQ';
const SHEET_ID_KEY = 'hanja_google_sheet_id';

/**
 * Get active Google Sheet ID from localStorage or fallback to default
 */
export const getActiveSheetId = () => {
  try {
    return localStorage.getItem(SHEET_ID_KEY) || DEFAULT_SHEET_ID;
  } catch {
    return DEFAULT_SHEET_ID;
  }
};

/**
 * Save custom Google Sheet ID to localStorage
 */
export const saveActiveSheetId = (id) => {
  try {
    if (!id || !id.trim()) {
      localStorage.setItem(SHEET_ID_KEY, DEFAULT_SHEET_ID);
    } else {
      localStorage.setItem(SHEET_ID_KEY, id.trim());
    }
  } catch (e) {
    console.error('Failed to save Sheet ID:', e);
  }
};

/**
 * Extract Google Sheet ID from full Google Spreadsheet URL or raw ID
 */
export const extractSheetId = (input) => {
  if (!input) return DEFAULT_SHEET_ID;
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

/**
 * Robust CSV parser handling quotes, escaped quotes, commas and newlines
 */
const parseCSV = (text) => {
  const lines = [];
  let row = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      lines.push(row.map((cell) => cell.trim()));
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }

  if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
    lines.push(row.map((cell) => cell.trim()));
  }

  return lines;
};

/**
 * Fetch a single sheet tab as CSV from Google Visualization API
 */
const fetchSheetTabCSV = async (sheetId, tabName) => {
  const timestamp = Date.now(); // cache-buster
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}&_t=${timestamp}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`구글 시트 '${tabName}' 탭을 불러오지 못했습니다. (Status ${response.status})`);
  }

  const csvText = await response.text();
  return parseCSV(csvText);
};

/**
 * Main service function to fetch all study data from Google Spreadsheet.
 * Fetches [세트], [한자], [한문] tabs in parallel.
 * Falls back to localStorage cache if sheet is empty or offline.
 */
export const fetchStudyDataFromGoogleSheets = async (customSheetId = null) => {
  const sheetId = customSheetId || getActiveSheetId();

  try {
    // 1. Parallel fetch of 3 tabs: 세트, 한자, 한문
    const [setsRows, hanjaRows, wordRows] = await Promise.all([
      fetchSheetTabCSV(sheetId, '세트').catch(() => []),
      fetchSheetTabCSV(sheetId, '한자').catch(() => []),
      fetchSheetTabCSV(sheetId, '한문').catch(() => []),
    ]);

    // 2. Parse [세트] Tab
    let parsedSets = [];
    if (setsRows && setsRows.length > 1) {
      const headers = setsRows[0].map((h) => h.toLowerCase());
      const idIdx = headers.findIndex((h) => h.includes('id') || h.includes('코드'));
      const titleIdx = headers.findIndex((h) => h.includes('제목') || h.includes('세트') || h.includes('title'));
      const descIdx = headers.findIndex((h) => h.includes('설명') || h.includes('desc'));

      for (let i = 1; i < setsRows.length; i++) {
        const row = setsRows[i];
        if (!row || row.length === 0 || !row.some(Boolean)) continue;

        const id = (idIdx !== -1 ? row[idIdx] : row[0]) || `set-${i}`;
        const title = (titleIdx !== -1 ? row[titleIdx] : row[1]) || `학습 세트 ${i}`;
        const description = (descIdx !== -1 ? row[descIdx] : row[2]) || '';

        parsedSets.push({ id, title, description, createdAt: new Date().toISOString() });
      }
    }

    // 3. Parse [한자] Tab
    let parsedHanja = [];
    if (hanjaRows && hanjaRows.length > 1) {
      const headers = hanjaRows[0].map((h) => h.toLowerCase());
      const setIdIdx = headers.findIndex((h) => h.includes('set') || h.includes('세트'));
      const unitIdx = headers.findIndex((h) => h.includes('과') || h.includes('단원') || h.includes('unit'));
      const charIdx = headers.findIndex((h) => h.includes('한자') || h.includes('char') || h.includes('글자'));
      const meaningIdx = headers.findIndex((h) => h.includes('뜻') || h.includes('음') || h.includes('meaning'));

      for (let i = 1; i < hanjaRows.length; i++) {
        const row = hanjaRows[i];
        if (!row || row.length === 0 || !row.some(Boolean)) continue;

        const setId = (setIdIdx !== -1 ? row[setIdIdx] : row[0]) || parsedSets[0]?.id || 'set-default';
        const unit = (unitIdx !== -1 ? row[unitIdx] : row[1]) || '1과';
        const character = (charIdx !== -1 ? row[charIdx] : row[2]) || '';
        const meaningSound = (meaningIdx !== -1 ? row[meaningIdx] : row[3]) || '';

        if (character && meaningSound) {
          parsedHanja.push({
            id: `h-sheet-${i}`,
            setId,
            unit,
            character,
            meaningSound,
          });
        }
      }
    }

    // 4. Parse [한문] (단어) Tab
    let parsedWords = [];
    if (wordRows && wordRows.length > 1) {
      const headers = wordRows[0].map((h) => h.toLowerCase());
      const setIdIdx = headers.findIndex((h) => h.includes('set') || h.includes('세트'));
      const unitIdx = headers.findIndex((h) => h.includes('과') || h.includes('단원') || h.includes('unit'));
      const wordIdx = headers.findIndex((h) => h.includes('단어') || h.includes('한문') || h.includes('word'));
      const soundIdx = headers.findIndex((h) => h.includes('음') || h.includes('발음') || h.includes('sound'));
      const meaningIdx = headers.findIndex((h) => h.includes('뜻') || h.includes('의미') || h.includes('meaning'));

      for (let i = 1; i < wordRows.length; i++) {
        const row = wordRows[i];
        if (!row || row.length === 0 || !row.some(Boolean)) continue;

        const setId = (setIdIdx !== -1 ? row[setIdIdx] : row[0]) || parsedSets[0]?.id || 'set-default';
        const unit = (unitIdx !== -1 ? row[unitIdx] : row[1]) || '1과';
        const word = (wordIdx !== -1 ? row[wordIdx] : row[2]) || '';
        const sound = (soundIdx !== -1 ? row[soundIdx] : row[3]) || word;
        const meaning = (meaningIdx !== -1 ? row[meaningIdx] : row[4]) || sound;

        if (word && (sound || meaning)) {
          parsedWords.push({
            id: `w-sheet-${i}`,
            setId,
            unit,
            word,
            sound,
            meaning,
          });
        }
      }
    }

    // 5. If spreadsheet data is completely empty (e.g. only header row exists currently)
    // Use fallback sample data so app continues working smoothly!
    const finalSets = parsedSets.length > 0 ? parsedSets : INITIAL_SETS;
    const finalHanja = parsedHanja.length > 0 ? parsedHanja : INITIAL_HANJA;
    const finalWords = parsedWords.length > 0 ? parsedWords : INITIAL_WORDS;

    // 6. Save to localStorage cache
    saveStudySets(finalSets);
    saveHanjaItems(finalHanja);
    saveWordItems(finalWords);

    return {
      studySets: finalSets,
      hanjaItems: finalHanja,
      wordItems: finalWords,
      source: parsedSets.length > 0 || parsedHanja.length > 0 ? 'google_sheets' : 'initial_fallback',
      updatedAt: new Date().toISOString(),
      stats: {
        setsCount: finalSets.length,
        hanjaCount: finalHanja.length,
        wordsCount: finalWords.length,
        fromSheet: parsedHanja.length > 0 || parsedWords.length > 0,
      },
    };
  } catch (error) {
    console.warn('Google Sheets fetch failed, using localStorage cache:', error);
    return {
      studySets: getStudySets(),
      hanjaItems: getHanjaItems(),
      wordItems: getWordItems(),
      source: 'local_cache',
      error: error.message,
    };
  }
};
