import * as XLSX from 'xlsx';

/**
 * Parses uploaded Excel or CSV file for Hanja items.
 * Required columns: 과(Lesson/Unit), 한자(Character), 뜻과 음(Meaning & Sound)
 */
export const parseHanjaFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length < 2) {
          throw new Error('파일에 데이터가 없습니다. (최소 1개의 헤더 행과 1개의 데이터 행 필요)');
        }

        // Detect column indices based on header row
        const headers = jsonData[0].map(h => String(h || '').trim());
        
        let unitIdx = headers.findIndex(h => h.includes('과') || h.toLowerCase().includes('unit') || h.toLowerCase().includes('lesson'));
        let charIdx = headers.findIndex(h => h.includes('한자') || h.toLowerCase().includes('char'));
        let meaningIdx = headers.findIndex(h => h.includes('뜻') || h.includes('음') || h.toLowerCase().includes('meaning'));

        // Fallback to default positional columns [0: 과, 1: 한자, 2: 뜻과 음] if headers not matched
        if (unitIdx === -1) unitIdx = 0;
        if (charIdx === -1) charIdx = 1;
        if (meaningIdx === -1) meaningIdx = 2;

        const results = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const unit = String(row[unitIdx] || '1과').trim();
          const character = String(row[charIdx] || '').trim();
          const meaningSound = String(row[meaningIdx] || '').trim();

          if (character && meaningSound) {
            results.push({
              unit,
              character,
              meaningSound,
            });
          }
        }

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses uploaded Excel or CSV file for Word items.
 * Columns: 과, 단어, 음, 뜻
 */
export const parseWordFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonData || jsonData.length < 2) {
          throw new Error('파일에 데이터가 없습니다. (최소 1개의 헤더 행과 1개의 데이터 행 필요)');
        }

        const headers = jsonData[0].map(h => String(h || '').trim());

        let unitIdx = headers.findIndex(h => h.includes('과') || h.toLowerCase().includes('unit'));
        let wordIdx = headers.findIndex(h => h.includes('단어') || h.includes('한자') || h.toLowerCase().includes('word'));
        let soundIdx = headers.findIndex(h => h.includes('음') || h.includes('소리') || h.toLowerCase().includes('sound') || h.toLowerCase().includes('reading'));
        let meaningIdx = headers.findIndex(h => h.includes('뜻') || h.toLowerCase().includes('meaning'));

        // Fallbacks [0: 과, 1: 단어, 2: 음, 3: 뜻]
        if (unitIdx === -1) unitIdx = 0;
        if (wordIdx === -1) wordIdx = 1;
        if (soundIdx === -1) soundIdx = 2;
        if (meaningIdx === -1) meaningIdx = 3;

        const results = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const unit = String(row[unitIdx] || '1과').trim();
          const word = String(row[wordIdx] || '').trim();
          const sound = String(row[soundIdx] || '').trim();
          const meaning = String(row[meaningIdx] || '').trim();

          if (word && (sound || meaning)) {
            results.push({
              unit,
              word,
              sound: sound || word,
              meaning: meaning || sound,
            });
          }
        }

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Downloads sample Excel file for Hanja or Words
 */
export const downloadTemplate = (type = 'hanja') => {
  const isHanja = type === 'hanja';
  
  const headers = isHanja 
    ? [['과', '한자', '뜻과 음']]
    : [['과', '단어', '음', '뜻']];

  const sampleData = isHanja
    ? [
        ['1과', '孝', '효도 효'],
        ['1과', '忠', '충성 충'],
        ['2과', '學', '배울 학'],
        ['2과', '習', '익힐 습'],
      ]
    : [
        ['1과', '孝道', '효도', '부모를 정성껏 잘 섬김'],
        ['1과', '忠誠', '충성', '마음에서 우러나오는 참된 정성'],
        ['2과', '學習', '학습', '지식이나 기술을 배우고 익힘'],
      ];

  const wsData = [...headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isHanja ? '한자업로드양식' : '단어업로드양식');

  const filename = isHanja ? '한자_업로드_양식.xlsx' : '단어_업로드_양식.xlsx';
  XLSX.writeFile(wb, filename);
};
