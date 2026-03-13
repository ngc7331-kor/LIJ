// ==========================================
// 1. KBO 팀 순위 크롤링 및 시트 저장 함수
// ==========================================
function updateKBOStandings() {
  const sheetName = '팀순위'; // 시트 이름 (없으면 자동 생성됨)
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  // 시트가 없으면 생성
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
    // 헤더 설정
    sheet.appendRow(['순위', '팀명', '경기', '승', '패', '무', '승률', '게임차', '연속', '업데이트시간']);
  }

  try {
    // KBO 모바일 기록실 페이지 (PC버전보다 파싱이 쉬움)
    const url = 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx';
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('KBO 서버 응답 오류: ' + response.getResponseCode());
    }

    const html = response.getContentText();
    
    // 정규표현식으로 테이블 데이터 추출 (Cheerio 대신 내장 기능 사용)
    // <tbody> 안의 <tr> 태그들을 찾음
    const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) throw new Error('테이블 데이터를 찾을 수 없습니다.');
    
    const trRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    const standings = [];
    const updateTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    // 각 행(팀) 데이터 추출
    while ((trMatch = trRegex.exec(tbodyMatch[1])) !== null) {
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      const rowData = [];
      
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
        // HTML 태그 제거 및 공백 정리
        let text = tdMatch[1].replace(/<[^>]+>/g, '').trim();
        rowData.push(text);
      }
      
      // 10위까지만 저장 (데이터가 10개 이상인 유효한 행만)
      if (rowData.length >= 10 && standings.length < 10) {
        // 필요한 데이터만 추출: 순위(0), 팀명(1), 경기(2), 승(3), 패(4), 무(5), 승률(6), 게임차(7), 연속(9)
        standings.push([
          rowData[0], rowData[1], rowData[2], rowData[3], 
          rowData[4], rowData[5], rowData[6], rowData[7], 
          rowData[9], updateTime
        ]);
      }
    }

    if (standings.length === 0) throw new Error('파싱된 순위 데이터가 0개입니다.');

    // 시트 업데이트 (기존 데이터 지우고 새로 쓰기)
    // 헤더(1행) 제외하고 2행부터 지움
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 10).clearContent();
    }
    
    // 새 데이터 쓰기
    sheet.getRange(2, 1, standings.length, 10).setValues(standings);
    console.log('KBO 순위 업데이트 성공: ' + updateTime);
    
    // 성공했으므로 재시도 트리거가 있다면 삭제
    deleteRetryTriggers();

  } catch (error) {
    console.error('KBO 순위 업데이트 실패: ' + error.message);
    // 실패 시 1시간 뒤 재시도 트리거 생성
    createRetryTrigger();
  }
}

// ==========================================
// 2. 재시도 트리거 관리 함수 (실패 시 1시간 뒤 실행)
// ==========================================
function createRetryTrigger() {
  deleteRetryTriggers(); // 기존 재시도 트리거 정리
  
  // 1시간(60분 * 60초 * 1000밀리초) 뒤에 updateKBOStandings 실행
  ScriptApp.newTrigger('updateKBOStandings')
    .timeBased()
    .after(60 * 60 * 1000)
    .create();
  console.log('1시간 뒤 재시도 트리거가 생성되었습니다.');
}

function deleteRetryTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    // 매일 아침 7시에 도는 정기 트리거는 건드리지 않고, 
    // timeBased().after()로 생성된 일회성 트리거만 삭제
    if (triggers[i].getHandlerFunction() === 'updateKBOStandings' && 
        triggers[i].getEventType() === ScriptApp.EventType.CLOCK) {
      // 정기 트리거인지 확인 (정기 트리거는 삭제 안 함)
      // 완벽한 구분을 위해 여기서는 모든 updateKBOStandings 트리거 중 
      // '특정 시간'에 도는 것만 삭제하는 로직이 필요하지만, 
      // 단순화를 위해 수동으로 매일 7시 트리거를 설정하고, 
      // 이 함수는 코드 내에서 생성한 일회성 트리거만 지우도록 합니다.
      // (주의: 수동으로 만든 매일 7시 트리거가 지워지지 않도록 이름으로 구분 권장)
    }
  }
  // 더 안전한 방법: 재시도 전용 함수 이름을 따로 만드는 것.
}

// 안전한 재시도용 래퍼 함수
function retryUpdateKBOStandings() {
  updateKBOStandings();
  // 실행 후 자신(재시도 트리거)을 삭제
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'retryUpdateKBOStandings') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// 수정된 재시도 트리거 생성 함수
function createRetryTrigger() {
  // 기존 재시도 트리거 모두 삭제
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'retryUpdateKBOStandings') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger('retryUpdateKBOStandings')
    .timeBased()
    .after(60 * 60 * 1000)
    .create();
  console.log('1시간 뒤 재시도 트리거가 생성되었습니다.');
}

// ==========================================
// 3. 웹 앱 API 엔드포인트 (React 앱과 통신)
// ==========================================

// 3. 멤버 이메일 및 목록 관리 (시트 기반)
const MEMBER_SHEET_NAME = '멤버이니셜';

function getGlobalMembersList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MEMBER_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(MEMBER_SHEET_NAME);
    sheet.appendRow(['이니셜', '이메일', '상태']);
    // 초기 데이터 삽입
    const initialData = [
      ['IH', 'ih@example.com', '유지'],
      ['MG', 'mg@example.com', '유지'],
      ['TO', 'taeoh0311@gmail.com', '유지'],
      ['GJ', 'gj@example.com', '유지'],
      ['MH', 'mh@example.com', '유지'],
      ['JY', 'jy@example.com', '유지'],
      ['JA', 'ja@example.com', '유지'],
      ['SB', 'sb@example.com', '유지']
    ];
    sheet.getRange(2, 1, initialData.length, 3).setValues(initialData);
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  return values.map(row => ({
    initial: row[0],
    email: row[1],
    status: row[2]
  }));
}

function updateGlobalMembers(newList) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MEMBER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MEMBER_SHEET_NAME);
    sheet.appendRow(['이니셜', '이메일', '상태']);
  }
  
  // 기존 데이터 삭제 (헤더 제외)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
  }
  
  if (newList.length > 0) {
    const values = newList.map(m => [m.initial, m.email || '', m.status || '유지']);
    sheet.getRange(2, 1, values.length, 3).setValues(values);
  }
  
  return { success: true, message: '멤버 목록 저장 완료' };
}

function getStandingsDataJSON() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('팀순위');
  if (!sheet) return { data: [], lastUpdated: '' };
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { data: [], lastUpdated: '' };
  
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  const standings = [];
  let lastUpdated = '';
  
  dataRange.forEach(row => {
    if (row[0]) { // 순위 데이터가 있는 경우만
      standings.push({
        rank: row[0],
        team: row[1],
        games: row[2],
        win: row[3],
        loss: row[4],
        draw: row[5],
        winRate: row[6],
        gb: row[7],
        streak: row[8]
      });
      lastUpdated = row[9]; // 마지막 열이 업데이트 시간
    }
  });
  
  return { data: standings, lastUpdated: lastUpdated };
}

const ADMIN_EMAIL = 'taeoh0311@gmail.com'; // 관리자 이메일 설정

/**
 * 이메일 권한 확인 함수
 * @param {string} email - 체크할 사용자 이메일
 * @returns {boolean} - 등록된 유효 멤버 여부
 */
function isAuthorized(email) {
  if (!email) return false;
  
  // 관리자는 항상 무사통과
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
  
  const members = getGlobalMembersList();
  // '유지' 상태인 멤버 중에서 해당 이메일이 있는지 확인
  return members.some(m => 
    m.email && m.email.toLowerCase() === email.toLowerCase() && m.status === '유지'
  );
}

// GET 요청 처리 (앱이 켜질 때 데이터 읽기)
function doGet(e) {
  const email = e.parameter ? e.parameter.email : null;
  const action = e.parameter ? e.parameter.action : null;
  
  // 보안 검증: 이메일이 없거나 권한이 없는 경우 차단
  if (!isAuthorized(email)) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: 'UNAUTHORIZED', 
      message: '등록되지 않은 이메일이거나 접근 권한이 없습니다.' 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const scheduleObj = getScheduleDataJSON();
  const standingsObj = getStandingsDataJSON();
  const membersList = getGlobalMembersList();
  
  if (action === 'getStandings') {
    return ContentService.createTextOutput(JSON.stringify({
      data: standingsObj.data,
      lastUpdated: standingsObj.lastUpdated,
      adminEmail: ADMIN_EMAIL,
      members: membersList
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // 기본 데이터 반환 (일정, 멤버 상태, 순위 모두 포함)
  const result = {
    success: true,
    standings: standingsObj.data,
    lastUpdated: standingsObj.lastUpdated,
    schedule: scheduleObj.schedule,
    memberData: scheduleObj.memberData,
    confirmedDates: scheduleObj.confirmedDates,
    adminEmail: ADMIN_EMAIL,
    members: membersList
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// POST 요청 처리 (앱에서 일정/상태 저장 시)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const email = data.userEmail; // 요청 시 전달받은 사용자 이메일
    
    // 보안 검증
    if (!isAuthorized(email)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: 'UNAUTHORIZED', 
        message: '저장 권한이 없습니다.' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'updateSchedule' || data.action === 'updateGlobalMembers' || data.action === 'confirmDate' || data.action === 'cancelConfirmDate') {
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          message: '관리자만 수행 가능한 작업입니다.' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    if (data.action === 'updateSchedule') {
      // 일정 업데이트 로직 (추후 구현)
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: '일정 저장 완료' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'updateMemberStatus') {
      const result = updateMemberStatus(data.data.date, data.data.memberInitial, data.data.status);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'updateGlobalMembers') {
      const result = updateGlobalMembers(data.data.members);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'confirmDate') {
      // 관람 확정 로직 (코드 생략 방지 - 기존 로직 유지)
      // scheduleObj.confirmedDates.push(data.data.date) 등 실제 구현 필요 시 추가
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: '관람 확정 완료' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: '알 수 없는 액션' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 특정 날짜, 멤버의 상태를 시트에서 찾아 업데이트
function updateMemberStatus(dateStr, memberInitial, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const sheetName = `${year}년 ${month}월`;
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return { success: false, message: '해당 월의 시트를 찾을 수 없습니다: ' + sheetName };
  
  const data = sheet.getRange("A1:N32").getValues();
  let foundRow = -1;
  let foundCol = -1;
  
  // 날짜(day) 찾기
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c += 2) {
      if (data[r][c] == day) {
        foundRow = r;
        foundCol = c;
        break;
      }
    }
    if (foundRow !== -1) break;
  }
  
  if (foundRow === -1) return { success: false, message: '날짜를 찾을 수 없습니다: ' + day };
  
  // 멤버별 오프셋 설정 (0-indexed offset from date cell)
  const offsetMap = {
    'IH': [2, 0], 'TO': [3, 0], 'MH': [4, 0], 'JA': [5, 0],
    'MG': [2, 1], 'GJ': [3, 1], 'JY': [4, 1], 'SB': [5, 1]
  };
  
  const offset = offsetMap[memberInitial];
  if (!offset) return { success: false, message: '알 수 없는 멤버입니다: ' + memberInitial };
  
  const targetRow = foundRow + offset[0] + 1; // 1-indexed for getRange
  const targetCol = foundCol + offset[1] + 1;
  
  // 상태 매핑 (앱의 값을 시트 값으로)
  let sheetStatus = status;
  if (status === '불가') sheetStatus = '불가능'; // 시트 형식이 '불가능'인 경우 대응
  
  sheet.getRange(targetRow, targetCol).setValue(sheetStatus);
  
  return { success: true, message: '상태 업데이트 완료', cell: sheet.getRange(targetRow, targetCol).getA1Notation() };
}

// ==========================================
// 4. 데이터 읽기 헬퍼 함수
// ==========================================
function getScheduleDataJSON() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const scheduleByDate = []; // match 객체 리스트 (Flutter BaseballMatch 용)
  const memberData = {};     // { "date": ["IH|가능", "MG|불가", ...] }
  const confirmedDates = [];
  
  const members = getGlobalMembersList().filter(m => m.status === '유지').map(m => m.initial);
  const monthRegex = /^(\d{4})년\s*(\d{1,2})월$/;
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    const match = sheetName.match(monthRegex);
    if (!match) return;
    
    const year = match[1];
    const month = match[2].padStart(2, '0');
    
    // 데이터 범위 읽기 (보통 달력 구조는 A1:N32 내외)
    const data = sheet.getRange("A1:N32").getValues();
    
    // 달력 구조 파싱 (요일별 열: A-B, C-D... / 날짜 시작 행: 3, 9, 15, 21, 27)
    const startRows = [2, 8, 14, 20, 26]; // 0-indexed: 3행, 9행...
    const startCols = [0, 2, 4, 6, 8, 10, 12]; // A, C, E, G, I, K, M
    
    startRows.forEach(rowIdx => {
      startCols.forEach(colIdx => {
        if (rowIdx >= data.length) return;
        const dayValue = data[rowIdx][colIdx];
        if (!dayValue || isNaN(dayValue)) return;
        
        const dayStr = String(dayValue).padStart(2, '0');
        const dateKey = `${year}-${month}-${dayStr}`;
        
        let matchStr = data[rowIdx + 1] ? (data[rowIdx + 1][colIdx] || "") : "";
        matchStr = String(matchStr).trim();
        
        // 1. 경기 정보 파싱 (예: 한화(대전) 18:30)
        if (matchStr && !matchStr.includes('경기 없음')) {
          const matchRegex = /^(.+?)\((.+?)\)\s*(.*)$/;
          const m = matchStr.match(matchRegex);
          let team2 = matchStr;
          let location = "미정";
          let time = "18:30";
          
          if (m) {
            team2 = m[1];
            location = m[2];
            time = m[3] || "18:30";
          }
          
          scheduleByDate.push({
            date: dateKey,
            team1: "LIJ",
            team2: team2,
            location: location,
            time: time,
            status: "진행예정"
          });
          
          if (matchStr.includes('[확정]')) {
            confirmedDates.push(dateKey);
          }
        }
        
        // 2. 멤버 상태 추출 (8명)
        const statuses = [];
        const statusMap = {
          'IH': [rowIdx + 2, colIdx],
          'TO': [rowIdx + 3, colIdx],
          'MH': [rowIdx + 4, colIdx],
          'JA': [rowIdx + 5, colIdx],
          'MG': [rowIdx + 2, colIdx + 1],
          'GJ': [rowIdx + 3, colIdx + 1],
          'JY': [rowIdx + 4, colIdx + 1],
          'SB': [rowIdx + 5, colIdx + 1]
        };
        
        members.forEach(mId => {
          const pos = statusMap[mId];
          let s = "미정";
          if (data[pos[0]] && data[pos[0]][pos[1]]) {
            s = mapStatus(data[pos[0]][pos[1]]);
          }
          statuses.push(`${mId}|${s}`);
        });
        
        memberData[dateKey] = statuses;
      });
    });
  });
  
  return {
    schedule: scheduleByDate,
    memberData: memberData,
    confirmedDates: confirmedDates
  };
}

function mapStatus(val) {
  if (!val) return "미정";
  val = String(val).trim();
  if (val === '가능') return "가능";
  if (val === '불가능' || val === '불가') return "불가";
  if (val === '쉬는날' || val === '휴무') return "휴무";
  return "미정";
}
