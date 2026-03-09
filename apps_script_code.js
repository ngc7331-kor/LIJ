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

// 앱스 스크립트에서 관리할 멤버 이메일 목록
const ADMIN_EMAIL = 'taeoh0311@gmail.com';
const MEMBER_EMAILS = {
  'IH': 'ih@example.com',
  'MG': 'mg@example.com',
  'TO': 'taeoh0311@gmail.com',
  'GJ': 'gj@example.com',
  'MH': 'mh@example.com',
  'JY': 'jy@example.com',
  'JA': 'ja@example.com',
  'SB': 'sb@example.com'
};

// GET 요청 처리 (앱이 켜질 때 데이터 읽기)
function doGet(e) {
  const action = e.parameter ? e.parameter.action : null;
  
  if (action === 'getStandings') {
    return ContentService.createTextOutput(JSON.stringify({
      data: getStandingsDataJSON().data,
      lastUpdated: getStandingsDataJSON().lastUpdated,
      adminEmail: ADMIN_EMAIL,
      memberEmails: MEMBER_EMAILS
    })).setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getSchedule') {
    return ContentService.createTextOutput(JSON.stringify(getScheduleDataJSON()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 기본적으로 두 데이터 모두 반환
  return ContentService.createTextOutput(JSON.stringify({
    standings: getStandingsDataJSON(),
    schedule: getScheduleDataJSON(),
    adminEmail: ADMIN_EMAIL,
    memberEmails: MEMBER_EMAILS
  })).setMimeType(ContentService.MimeType.JSON);
}

// POST 요청 처리 (앱에서 일정/상태 저장 시)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'updateSchedule') {
      // 일정 업데이트 로직 (추후 구현)
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: '일정 저장 완료' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: '알 수 없는 액션' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 4. 데이터 읽기 헬퍼 함수
// ==========================================
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

function getScheduleDataJSON() {
  // 기존 달력 시트('일정' 또는 'Sheet1')에서 데이터를 읽어오는 로직
  // 현재는 임시 빈 배열 반환. 실제 시트 구조에 맞춰 수정 필요
  return []; 
}
