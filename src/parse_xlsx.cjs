const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('sheet.xlsx');
const targetSheets = [
  '2026년 4월',  '2026년 5월',
  '2026년 6월',  '2026년 7월',
  '2026년 8월',  '2026년 9월',
  '2026년 10월'
];

const schedule = {};

function excelDateToJSDate(serial) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  const year = date_info.getFullYear();
  const month = String(date_info.getMonth() + 1).padStart(2, '0');
  const day = String(date_info.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

targetSheets.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;
  const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  for (let r = 2; r < json.length; r += 6) {
    const datesRow = json[r];
    const matchesRow = json[r + 1];
    if (!datesRow || !matchesRow) continue;
    
    for (let c = 0; c < 13; c += 2) {
      const serial = datesRow[c];
      if (typeof serial === 'number') {
        const dateStr = excelDateToJSDate(serial);
        const matchInfo = matchesRow[c];
        
        if (matchInfo && matchInfo !== '이전달' && matchInfo !== '다음달' && matchInfo !== '경기 없는 요일' && matchInfo !== '홈경기' && matchInfo !== '어웨이') {
          const members = ['IH', 'MG', 'TO', 'GJ', 'MH', 'JY', 'JA', 'SB'];
          const memberStatuses = {};
          
          for (let i = 0; i < 4; i++) {
            const memberRow = json[r + 2 + i];
            if (memberRow) {
              const status1 = memberRow[c];
              const status2 = memberRow[c + 1];
              
              memberStatuses[members[i * 2]] = status1 === '가능' ? 'possible' : status1 === '불가능' ? 'impossible' : 'pending';
              memberStatuses[members[i * 2 + 1]] = status2 === '가능' ? 'possible' : status2 === '불가능' ? 'impossible' : 'pending';
            }
          }
          
          schedule[dateStr] = {
            match: matchInfo,
            members: memberStatuses
          };
        }
      }
    }
  }
});

if (!fs.existsSync('src/data')) {
  fs.mkdirSync('src/data');
}
fs.writeFileSync('src/data/schedule2026.json', JSON.stringify(schedule, null, 2));
console.log('Done parsing schedule.');
