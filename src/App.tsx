import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, CalendarDays, Calendar as CalendarIcon, Settings, ChevronLeft, ChevronRight, Users, ArrowLeft, Plus, User } from 'lucide-react';
import initialScheduleData from './data/schedule2026.json';

type MockUser = {
  email: string;
  photoURL?: string;
};

function SettingsView({ schedule, setSchedule, members, setMembers, user }: any) {
  const [currentView, setCurrentView] = useState<'main' | 'members' | 'schedule' | 'confirmed'>('main');
  
  // Member State
  const [memberList, setMemberList] = useState(() => members.map((m: string) => ({ id: m, name: m, status: 'keep', isNew: false })));

  // Schedule State
  const [selectedDate, setSelectedDate] = useState('');
  const [editTeam, setEditTeam] = useState('KIA');
  const [editLocation, setEditLocation] = useState('홈');
  const [editHour, setEditHour] = useState('18');
  const [editMinute, setEditMinute] = useState('30');
  const [isNoGame, setIsNoGame] = useState(false);

  const teams = ['KIA', '삼성', 'LG', '두산', 'KT', 'SSG', '롯데', '한화', 'NC', '키움'];
  const locations = ['홈', '원정'];
  const hours = Array.from({ length: 15 }, (_, i) => String(i + 9).padStart(2, '0'));
  const minutes = ['00', '30'];

  const handleEnterMembers = () => {
    setMemberList(members.map((m: string) => ({ id: m, name: m, status: 'keep', isNew: false })));
    setCurrentView('members');
  };

  const handleSaveMembers = () => {
    const newMembers = memberList
      .filter((m: any) => m.status === 'keep' && m.name.trim() !== '')
      .map((m: any) => m.name.trim());
    setMembers(newMembers);
    alert('멤버가 저장되었습니다.');
    setCurrentView('main');
  };

  const addMemberInput = () => {
    setMemberList([...memberList, { id: Math.random().toString(), name: '', status: 'keep', isNew: true }]);
  };

  const updateMember = (id: string, field: string, value: string) => {
    setMemberList(memberList.map((m: any) => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (schedule[date as keyof typeof schedule]) {
      setIsNoGame(false);
      const matchStr = (schedule[date as keyof typeof schedule] as any).match || '';
      const matchRegex = /^(.+?)\((.+?)\)\s*(.*)$/;
      const match = matchStr.match(matchRegex);
      if (match) {
        setEditTeam(match[1]);
        setEditLocation(match[2]);
        const [h, m] = match[3].split(':');
        setEditHour(h || '18');
        setEditMinute(m || '30');
      } else {
        setEditTeam('KIA');
        setEditLocation('홈');
        setEditHour('18');
        setEditMinute('30');
      }
    } else {
      setIsNoGame(true);
      setEditTeam('KIA');
      setEditLocation('홈');
      setEditHour('18');
      setEditMinute('30');
    }
  };

  const handleSaveSchedule = () => {
    if (!selectedDate) return;
    setSchedule((prev: any) => {
      const newSchedule = { ...prev };
      if (isNoGame) {
        delete newSchedule[selectedDate];
      } else {
        const existingMembers = prev[selectedDate]?.members || {};
        newSchedule[selectedDate] = {
          match: `${editTeam}(${editLocation}) ${editHour}:${editMinute}`,
          members: existingMembers
        };
      }
      return newSchedule;
    });
    alert('일정이 저장되었습니다.');
    setCurrentView('main');
  };

  if (currentView === 'members') {
    return (
      <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900 flex flex-col min-h-0">
        <div className="flex items-center mb-6 shrink-0">
          <button 
            onClick={() => setCurrentView('main')}
            className="p-2 mr-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">멤버 설정</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 shrink-0">참여 멤버 목록</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 shrink-0">멤버를 추가하거나 탈퇴 처리할 수 있습니다.</p>
          
          <div className="space-y-3 mb-6 overflow-y-auto flex-grow pr-1">
            {memberList.map((member: any) => (
              <div key={member.id} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                {member.isNew ? (
                  <input 
                    type="text" 
                    value={member.name}
                    onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                    placeholder="이니셜 입력"
                    className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <div className="flex-grow font-bold text-gray-900 dark:text-gray-100 px-2">{member.name}</div>
                )}
                <select
                  value={member.status}
                  onChange={(e) => updateMember(member.id, 'status', e.target.value)}
                  className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary font-medium ${member.status === 'remove' ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  <option value="keep">유지</option>
                  <option value="remove">탈퇴</option>
                </select>
              </div>
            ))}
            <button 
              onClick={addMemberInput}
              className="w-full flex items-center justify-center py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5 mr-1" />
              <span className="text-sm font-bold">멤버 추가</span>
            </button>
          </div>

          <button onClick={handleSaveMembers} className="bg-primary text-white px-4 py-3 rounded-xl text-sm font-bold w-full shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98] shrink-0">
            저장하기
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'schedule') {
    return (
      <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900 flex flex-col min-h-0">
        <div className="flex items-center mb-6 shrink-0">
          <button 
            onClick={() => setCurrentView('main')}
            className="p-2 mr-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">경기 일정 수정</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">날짜 선택</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={handleDateSelect}
            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl p-3 mb-6 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:[color-scheme:dark]"
          />
          
          {selectedDate && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">경기 정보</label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isNoGame} 
                    onChange={(e) => setIsNoGame(e.target.checked)}
                    className="rounded text-primary focus:ring-primary bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 w-4 h-4"
                  />
                  <span className="font-medium">경기 없음</span>
                </label>
              </div>

              {!isNoGame && (
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">구단</label>
                    <select 
                      value={editTeam} 
                      onChange={e => setEditTeam(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">위치</label>
                    <select 
                      value={editLocation} 
                      onChange={e => setEditLocation(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      {locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex-[1.5]">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">시간</label>
                    <div className="flex space-x-2">
                      <select 
                        value={editHour} 
                        onChange={e => setEditHour(e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                      </select>
                      <select 
                        value={editMinute} 
                        onChange={e => setEditMinute(e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              <button onClick={handleSaveSchedule} className="bg-primary text-white px-4 py-3 rounded-xl text-sm font-bold w-full shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98]">
                일정 저장하기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'confirmed') {
    return (
      <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900 flex flex-col min-h-0">
        <div className="flex items-center mb-6 shrink-0">
          <button 
            onClick={() => setCurrentView('main')}
            className="p-2 mr-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">관람 확정일 설정</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">날짜 선택</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={handleDateSelect}
            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl p-3 mb-6 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:[color-scheme:dark]"
          />
          
          {selectedDate && schedule[selectedDate] && !schedule[selectedDate].isConfirmed && (
            <button 
              onClick={() => {
                setSchedule((prev: any) => ({
                  ...prev,
                  [selectedDate]: { ...prev[selectedDate], isConfirmed: true }
                }));
                alert('관람 확정일로 지정되었습니다.');
              }}
              className="bg-primary text-white px-4 py-3 rounded-xl text-sm font-bold w-full shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98] mb-4"
            >
              관람 확정하기
            </button>
          )}

          {selectedDate && schedule[selectedDate]?.isConfirmed && (
            <button 
              onClick={() => {
                setSchedule((prev: any) => ({
                  ...prev,
                  [selectedDate]: { ...prev[selectedDate], isConfirmed: false }
                }));
                alert('관람 확정이 취소되었습니다.');
              }}
              className="bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-bold w-full shadow-sm hover:bg-red-600 transition-colors active:scale-[0.98] mb-4"
            >
              관람 확정 취소
            </button>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">현재 확정된 날짜</h3>
            <ul className="space-y-2">
              {Object.entries(schedule)
                .filter(([_, data]: any) => data.isConfirmed)
                .map(([date, data]: any) => (
                  <li key={date} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{date} ({data.match})</span>
                    <button 
                      onClick={() => {
                        setSchedule((prev: any) => ({
                          ...prev,
                          [date]: { ...prev[date], isConfirmed: false }
                        }));
                      }}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      취소
                    </button>
                  </li>
                ))}
              {Object.entries(schedule).filter(([_, data]: any) => data.isConfirmed).length === 0 && (
                <li className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">확정된 일정이 없습니다.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900 flex flex-col min-h-0">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 px-1">설정</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        <button 
          onClick={() => setCurrentView('confirmed')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">관람 확정일 설정</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">다같이 직관 가는 날짜 지정</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {user?.email === 'taeoh0311@gmail.com' && (
          <button 
            onClick={handleEnterMembers}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">멤버 설정</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">참여 멤버 추가 및 삭제</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        )}

        <button 
          onClick={() => setCurrentView('schedule')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">경기 일정 수정</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">특정 날짜의 경기 정보 변경</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

const mockStandings = [
  { rank: 1, team: 'KIA', games: 144, win: 87, draw: 2, loss: 55, winRate: '0.613', gb: '-', streak: '2승' },
  { rank: 2, team: '삼성', games: 144, win: 78, draw: 2, loss: 64, winRate: '0.549', gb: '9.0', streak: '1패' },
  { rank: 3, team: 'LG', games: 144, win: 76, draw: 2, loss: 66, winRate: '0.535', gb: '11.0', streak: '3승' },
  { rank: 4, team: '두산', games: 144, win: 74, draw: 2, loss: 68, winRate: '0.521', gb: '13.0', streak: '1승' },
  { rank: 5, team: 'KT', games: 144, win: 72, draw: 2, loss: 70, winRate: '0.507', gb: '15.0', streak: '1패' },
  { rank: 6, team: 'SSG', games: 144, win: 72, draw: 2, loss: 70, winRate: '0.507', gb: '15.0', streak: '4패' },
  { rank: 7, team: '롯데', games: 144, win: 66, draw: 4, loss: 74, winRate: '0.471', gb: '20.0', streak: '2패' },
  { rank: 8, team: '한화', games: 144, win: 66, draw: 2, loss: 76, winRate: '0.465', gb: '21.0', streak: '1승' },
  { rank: 9, team: 'NC', games: 144, win: 61, draw: 2, loss: 81, winRate: '0.430', gb: '26.0', streak: '2패' },
  { rank: 10, team: '키움', games: 144, win: 58, draw: 0, loss: 86, winRate: '0.403', gb: '30.0', streak: '5패' },
];

const teamColors: Record<string, string> = {
  'KIA': '#EA0029',
  '삼성': '#074CA1',
  'LG': '#C30452',
  '두산': '#131230',
  'KT': '#000000',
  'SSG': '#CE0E2D',
  '롯데': '#041E42',
  '한화': '#FF6600',
  'NC': '#315288',
  '키움': '#570514',
};

function StandingsView() {
  const [standings, setStandings] = useState<any[]>(mockStandings);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        // TODO: 실제 배포된 Google Apps Script Web App URL로 교체해야 합니다.
        // 현재는 임시로 사용자가 제공한 스프레드시트 URL을 사용하지만, 
        // 실제로는 '웹 앱으로 배포' 후 얻은 https://script.google.com/.../exec 형태의 URL이어야 합니다.
        const gasUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyARqUA6BP6sKGKUv5sYEf8d_oDGdpDgkLFszyWXdQ5azvqZx69yzb3wnzmVP7uKvkIgA/exec';
        
        const response = await fetch(`${gasUrl}?action=getStandings`);
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            setStandings(data.data);
            setLastUpdated(data.lastUpdated);
          } else {
            // Fallback to mock if no data
            setStandings(mockStandings);
            setLastUpdated(new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (임시 데이터)');
          }
        } else {
          throw new Error('Network response was not ok');
        }
        setIsLoading(false);

      } catch (error) {
        console.error('Failed to fetch standings from GAS:', error);
        setStandings(mockStandings);
        setLastUpdated(new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (임시 데이터 - 연결 실패)');
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, []);

  return (
    <div className="p-2 sm:p-4 flex flex-col flex-grow bg-gray-50 dark:bg-gray-900 min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2 sm:mb-4 px-1 shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">KBO 정규시즌 팀 순위</h2>
        {lastUpdated && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
            업데이트: {lastUpdated}
          </span>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-grow min-h-0">
        <div className="w-full overflow-auto flex-grow relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <table className="w-full h-full text-left relative">
            <thead className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 uppercase sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">순위</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">팀</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">경기</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">승</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">무</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">패</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">승률</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">승차</th>
                <th scope="col" className="px-1 sm:px-3 py-1.5 sm:py-3 text-center whitespace-nowrap">연속</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {standings.map((team, index) => (
                <tr key={team.team} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-[10px] sm:text-sm">
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center font-bold text-gray-900 dark:text-gray-100">{team.rank}</td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center font-bold whitespace-nowrap">
                    <span className="inline-block w-16 sm:w-20 px-2 py-1 rounded text-white text-[10px] sm:text-xs shadow-sm text-center" style={{ backgroundColor: teamColors[team.team] || '#ccc' }}>
                      {team.team}
                    </span>
                  </td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center text-gray-600 dark:text-gray-400">{team.games}</td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center text-gray-600 dark:text-gray-400">{team.win}</td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center text-gray-600 dark:text-gray-400">{team.draw}</td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center text-gray-600 dark:text-gray-400">{team.loss}</td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center font-semibold text-primary dark:text-blue-400">{team.winRate}</td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center text-gray-600 dark:text-gray-400">{team.gb}</td>
                  <td className="px-1 sm:px-3 py-1 sm:py-2 text-center text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-xs font-medium ${team.streak.includes('승') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {team.streak}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const [schedule, setSchedule] = useState<any>(initialScheduleData);
  const [members, setMembers] = useState<string[]>(['IH', 'MG', 'TO', 'GJ', 'MH', 'JY', 'JA', 'SB']);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar', 'settings'
  const [isEditMode, setIsEditMode] = useState(false);
  const [randomPick, setRandomPick] = useState("");
  const [user, setUser] = useState<MockUser | null>(null);
  const [adminEmail, setAdminEmail] = useState('taeoh0311@gmail.com');
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({
    'IH': 'ih@example.com',
    'MG': 'mg@example.com',
    'TO': 'taeoh0311@gmail.com',
    'GJ': 'gj@example.com',
    'MH': 'mh@example.com',
    'JY': 'jy@example.com',
    'JA': 'ja@example.com',
    'SB': 'sb@example.com',
  });
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = React.useRef(true);

  const [calendarHeight, setCalendarHeight] = useState(0);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const calendarContainerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const observer = new ResizeObserver((entries) => {
        setCalendarHeight(entries[0].contentRect.height);
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  // Load from Apps Script
  useEffect(() => {
    const loadData = async () => {
      const url = (import.meta as any).env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyARqUA6BP6sKGKUv5sYEf8d_oDGdpDgkLFszyWXdQ5azvqZx69yzb3wnzmVP7uKvkIgA/exec';
      if (!url) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(url);
        const data = await res.json();
        // Only update schedule if it's a valid object (not the empty array from placeholder GAS)
        if (data.schedule && !Array.isArray(data.schedule) && Object.keys(data.schedule).length > 0) {
          setSchedule(data.schedule);
        }
        if (data.members && Array.isArray(data.members) && data.members.length > 0) {
          setMembers(data.members);
        }
      } catch (e) {
        console.error("Failed to load data from server", e);
        // Fallback to initial state is already handled by useState defaults
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-save to Apps Script
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const url = (import.meta as any).env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyARqUA6BP6sKGKUv5sYEf8d_oDGdpDgkLFszyWXdQ5azvqZx69yzb3wnzmVP7uKvkIgA/exec';
      if (!url) return;
      
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save', schedule, members, user: user?.email })
      }).catch(console.error);
    }, 1500); // Debounce 1.5s
    
    return () => clearTimeout(timer);
  }, [schedule, members, user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    } else {
      // For preview purposes, default to a logged-in user
      const defaultUser = { email: 'taeoh0311@gmail.com', photoURL: '' };
      setUser(defaultUser);
      localStorage.setItem('mock_user', JSON.stringify(defaultUser));
    }
  }, []);

  useEffect(() => {
    const kboPicks = [
      "'공이 아닌 마음을 던진다.' - 최동원",
      "'혼을 담은 노력은 배신하지 않는다.' - 이승엽",
      "'내 사전에 내일은 없다.' - 선동열",
      "'야구 몰라요.' - 하일성",
      "'위기 뒤에 찬스, 찬스 뒤에 위기.' - 야구 격언",
      "1982년 3월 27일, KBO 리그 출범",
      "1984년 한국시리즈, 최동원 전무후무 4승",
      "2003년 이승엽, 아시아 최다 56호 홈런",
      "2008년 베이징 올림픽, 야구 9전 전승 금메달",
      "2010년 이대호, 세계 최초 9경기 연속 홈런",
      "2014년 서건창, KBO 최초 단일 시즌 200안타",
      "1982년 한국시리즈, OB 베어스 초대 우승",
      "2006년 WBC, 대한민국 야구 4강 신화",
      "2015년 WBSC 프리미어 12, 대한민국 초대 우승",
      "1993년 한국시리즈, '바람의 아들' 이종범 맹활약"
    ];
    setRandomPick(kboPicks[Math.floor(Math.random() * kboPicks.length)]);
  }, []);

  const handleLoginLogout = async () => {
    if (user) {
      if (window.confirm("로그아웃 하시겠습니까?")) {
        setUser(null);
        localStorage.removeItem('mock_user');
      }
    } else {
      const email = window.prompt("이메일을 입력하세요 (등록된 이메일만 로그인 가능)");
      if (email) {
        const isAllowed = email === adminEmail || Object.values(memberEmails).includes(email);
        if (isAllowed) {
          const newUser = { email, photoURL: '' };
          setUser(newUser);
          localStorage.setItem('mock_user', JSON.stringify(newUser));
        } else {
          alert("등록되지 않은 이메일입니다. 관리자에게 문의하세요.");
        }
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const setMyStatus = (dateStr: string, nextStatus: string) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    let currentMemberId = Object.keys(memberEmails).find(name => memberEmails[name] === user.email);
    if (!currentMemberId && user.email === adminEmail) {
      currentMemberId = 'IH'; // Default admin to IH if not in memberEmails
    }

    if (!currentMemberId) {
      alert("등록된 멤버 정보를 찾을 수 없습니다.");
      return;
    }

    setSchedule((prev: any) => {
      const newSchedule = { ...prev };
      if (newSchedule[dateStr]) {
        newSchedule[dateStr] = {
          ...newSchedule[dateStr],
          members: {
            ...(newSchedule[dateStr].members || {}),
            [currentMemberId]: nextStatus
          }
        };
      }
      return newSchedule;
    });
  };

  const { daysData, weeksCount } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calculatedWeeks = Math.ceil((startingDayOfWeek + daysInMonth) / 7);
    const totalSlots = calculatedWeeks * 7;
    
    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: prevMonthLastDay - i, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData: any = {
        date: i,
        dateStr,
        isCurrentMonth: true,
        isWeekend: new Date(year, month, i).getDay() === 6,
        isSunday: new Date(year, month, i).getDay() === 0,
        isToday: false,
        isConfirmed: false,
      };
      
      const daySchedule = (schedule as any)[dateStr];
      if (daySchedule) {
        dayData.isConfirmed = daySchedule.isConfirmed || false;
        const matchStr = daySchedule.match;
        const matchRegex = /^(.+?)\((.+?)\)\s*(.*)$/;
        const match = matchStr.match(matchRegex);
        
        if (match) {
          const team = match[1];
          const location = match[2];
          const time = match[3];
          
          let color = 'text-gray-900';
          if (team.includes('한화')) color = 'text-team-hanwha';
          else if (team.includes('삼성')) color = 'text-team-samsung';
          else if (team.includes('롯데')) color = 'text-team-lotte';
          else if (team.includes('두산')) color = 'text-team-doosan';
          else if (team.includes('NC')) color = 'text-team-nc';
          else if (team.includes('키움')) color = 'text-team-kiwoom';
          else if (team.includes('LG')) color = 'text-team-lg';
          else if (team.includes('KIA')) color = 'text-team-kia';
          else if (team.includes('SSG')) color = 'text-team-ssg';
          else if (team.includes('KT')) color = 'text-team-kt';
          
          const memberStatuses = members.map(m => ({
            id: m,
            status: daySchedule.members[m] || 'impossible'
          }));
          
          dayData.game = {
            team, location, time, color, isHome: location === '홈', members: memberStatuses
          };
        } else {
          dayData.game = {
            team: matchStr, location: '', time: '', color: 'text-gray-900', isHome: false, members: []
          };
        }
      } else {
        dayData.noGame = true;
      }
      
      days.push(dayData);
    }
    
    // Next month days
    const remainingDays = totalSlots - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: i, isCurrentMonth: false });
    }
    
    return { daysData: days, weeksCount: calculatedWeeks };
  }, [currentDate, schedule, members]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 5주 기준으로 화면을 꽉 채울 때의 이상적인 날짜칸 높이 계산 (최소 70px)
  const idealRowHeight = calendarHeight > 0 
    ? Math.max(70, (calendarHeight - 16) / 5) 
    : 70;

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 h-[100dvh] flex flex-col overflow-hidden">
      <header className="bg-white dark:bg-gray-800 shadow-sm shrink-0 pt-safe">
        <div className="relative py-3 px-4 flex justify-center items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-center space-x-2">
            <img alt="Life Is Jikgwan Logo" className="w-10 h-10 object-contain rounded-full" src="/logo.png" onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/111827/FFFFFF?text=Logo" }} />
            <div className="flex flex-col items-center justify-center">
              <h1 className="font-bold text-lg tracking-wider text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Arial, sans-serif' }}>Life Is Jikgwan</h1>
              <span className="text-[10px] font-bold tracking-[0.2em] mt-0.5 text-gray-600 dark:text-gray-400">엘.아이.제이</span>
            </div>
          </div>
          <button 
            onClick={handleLoginLogout}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={user ? "로그아웃" : "로그인"}
          >
            {user && user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <User className={`w-6 h-6 ${user ? 'text-primary' : 'text-gray-400'}`} />
            )}
          </button>
        </div>
        {activeTab === 'calendar' && (
          <>
            <div className="px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="w-full overflow-hidden">
                  <span className="text-[10px] sm:text-xs font-bold text-primary mb-0.5 sm:mb-1 block">Monthly Pick</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug truncate">
                    {randomPick}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center space-x-3">
                  <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 w-28 text-center">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                  </h2>
                  <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    if (!user) {
                      alert("로그인이 필요합니다.");
                      return;
                    }
                    setIsEditMode(!isEditMode);
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold shadow-md transition-all active:scale-95 whitespace-nowrap shrink-0 ${isEditMode ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-primary hover:bg-blue-700 text-white'}`}
                >
                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">{isEditMode ? '상태 변경 완료' : '나의 상태 변경'}</span>
                </button>
              </div>
              <div className="flex items-center justify-start text-[10px] sm:text-xs overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
                  <div className="flex items-center"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-status-possible mr-1 sm:mr-1.5"></span><span className="text-gray-600 dark:text-gray-400 font-medium">가능</span></div>
                  <div className="flex items-center"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-status-impossible mr-1 sm:mr-1.5"></span><span className="text-gray-600 dark:text-gray-400 font-medium">불가능</span></div>
                  <div className="flex items-center"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-status-pending mr-1 sm:mr-1.5"></span><span className="text-gray-600 dark:text-gray-400 font-medium">미정</span></div>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {activeTab === 'calendar' ? (
        <main className="p-1.5 sm:p-2 flex-grow flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-7 gap-1 mb-1 shrink-0">
            <div className="text-center text-[9px] sm:text-xs font-medium text-red-500">일</div>
            <div className="text-center text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">월</div>
            <div className="text-center text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">화</div>
            <div className="text-center text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">수</div>
            <div className="text-center text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">목</div>
            <div className="text-center text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">금</div>
            <div className="text-center text-[9px] sm:text-xs font-medium text-blue-500">토</div>
          </div>
          
          <div 
            ref={calendarContainerRef}
            className="flex-grow overflow-y-auto min-h-0 pr-1 -mr-1 custom-scrollbar flex flex-col"
          >
            <div 
              className="grid grid-cols-7 gap-1 shrink-0"
              style={{ 
                gridTemplateRows: `repeat(${weeksCount}, ${idealRowHeight}px)` 
              }}
            >
              {daysData.map((day, idx) => {
              if (!day.isCurrentMonth) {
                return (
                  <div key={idx} className="relative w-full h-full opacity-50 pointer-events-none">
                    <div className="absolute inset-0 flex flex-col">
                      <div className="text-[10px] sm:text-xs md:text-sm text-center text-gray-500 mb-0.5 shrink-0">{day.date}</div>
                      <div className="bg-surface-light dark:bg-surface-dark rounded border border-gray-100 dark:border-gray-800 flex-grow shadow-sm min-h-0"></div>
                    </div>
                  </div>
                );
              }

              if (day.noGame) {
                return (
                  <div key={idx} className="relative w-full h-full cursor-pointer group">
                    <div className="absolute inset-0 flex flex-col">
                      <div className={`flex justify-center items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs md:text-sm text-center mb-0.5 shrink-0 ${day.isSunday ? 'text-red-500' : day.isWeekend ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        <span>{day.date}</span>
                        {day.isConfirmed && <span className="bg-red-500 text-white text-[6px] sm:text-[7px] md:text-[8px] px-1 py-0.5 rounded-sm font-bold leading-none whitespace-nowrap">관람 확정</span>}
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800/50 rounded p-0.5 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-grow shadow-sm min-h-0">
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 font-medium">경기 없음</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (!day.game || !day.game.team) {
                return (
                  <div key={idx} className="relative w-full h-full cursor-pointer group">
                    <div className="absolute inset-0 flex flex-col">
                      <div className={`flex justify-center items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs md:text-sm text-center mb-0.5 shrink-0 ${day.isSunday ? 'text-red-500' : day.isWeekend ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        <span>{day.date}</span>
                        {day.isConfirmed && <span className="bg-red-500 text-white text-[6px] sm:text-[7px] md:text-[8px] px-1 py-0.5 rounded-sm font-bold leading-none whitespace-nowrap">관람 확정</span>}
                      </div>
                      <div className="bg-surface-light dark:bg-surface-dark rounded p-0.5 border border-gray-200 dark:border-gray-700 flex flex-col flex-grow shadow-sm min-h-0"></div>
                    </div>
                  </div>
                );
              }

              // For special events like "올스타 브레이크"
              if (!day.game.location) {
                return (
                  <div key={idx} className="relative w-full h-full cursor-pointer group">
                    <div className="absolute inset-0 flex flex-col">
                      <div className={`flex justify-center items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs md:text-sm text-center mb-0.5 shrink-0 ${day.isSunday ? 'text-red-500' : day.isWeekend ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        <span>{day.date}</span>
                        {day.isConfirmed && <span className="bg-red-500 text-white text-[6px] sm:text-[7px] md:text-[8px] px-1 py-0.5 rounded-sm font-bold leading-none whitespace-nowrap">관람 확정</span>}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded p-0.5 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-grow shadow-sm min-h-0">
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] text-blue-600 dark:text-blue-400 font-bold text-center leading-tight">{day.game.team}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="relative w-full h-full group">
                  <div className="absolute inset-0 flex flex-col">
                    <div className={`flex justify-center items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs md:text-sm text-center mb-0.5 shrink-0 ${day.isToday ? 'font-bold text-gray-900 dark:text-gray-100' : day.isSunday ? 'text-red-500' : day.isWeekend ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
                      <span>{day.date}</span>
                      {day.isConfirmed && <span className="bg-red-500 text-white text-[6px] sm:text-[7px] md:text-[8px] px-1 py-0.5 rounded-sm font-bold leading-none whitespace-nowrap">관람 확정</span>}
                    </div>
                    <div className={`${day.isToday ? 'bg-blue-50/50 dark:bg-blue-900/10 border border-primary ring-1 ring-primary/20' : day.game.isHome ? 'bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-300 dark:ring-gray-600 group-hover:border-primary group-hover:ring-1 group-hover:ring-primary' : 'bg-surface-light dark:bg-surface-dark group-hover:border-primary group-hover:ring-1 group-hover:ring-primary'} rounded p-0.5 sm:p-1 border border-gray-200 dark:border-gray-700 flex flex-col transition-all flex-grow shadow-sm min-h-0 overflow-hidden`}>
                    <div className="shrink-0 flex items-center justify-center py-0.5 w-full px-0.5">
                      <div className={`flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5 bg-white dark:bg-gray-100 px-1 py-0.5 sm:py-1 rounded shadow-sm border border-gray-100 dark:border-gray-300 ${day.game.color} w-full`}>
                        <span className="text-[7px] sm:text-[9px] md:text-[10px] font-bold leading-none text-center whitespace-nowrap">
                          {day.game.team}({day.game.location})
                        </span>
                        <span className="text-[6px] sm:text-[8px] md:text-[9px] font-medium opacity-90 leading-none text-center whitespace-nowrap">
                          {day.game.time}
                        </span>
                      </div>
                    </div>
                    {user && (
                      isEditMode ? (() => {
                        let currentMemberId = Object.keys(memberEmails).find(name => memberEmails[name] === user.email);
                        if (!currentMemberId && user.email === adminEmail) currentMemberId = 'IH';
                        const myStatus = currentMemberId ? day.game.members.find((m: any) => m.id === currentMemberId)?.status || 'impossible' : 'impossible';
                        
                        return (
                          <div className="flex flex-col items-center justify-center flex-grow mt-0.5 min-h-0 w-full px-0.5 pb-0.5">
                            <div className="flex flex-row sm:flex-col w-full h-full rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setMyStatus(day.dateStr, 'possible'); }}
                                className={`flex-1 min-h-0 overflow-hidden py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold leading-none transition-colors whitespace-nowrap flex items-center justify-center ${myStatus === 'possible' ? 'bg-status-possible text-white dark:text-white' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <span className="sm:hidden">가</span>
                                <span className="hidden sm:inline">가능</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setMyStatus(day.dateStr, 'impossible'); }}
                                className={`flex-1 min-h-0 overflow-hidden py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold leading-none transition-colors border-l border-r sm:border-l-0 sm:border-r-0 sm:border-t sm:border-b border-gray-200 dark:border-gray-700 whitespace-nowrap flex items-center justify-center ${myStatus === 'impossible' ? 'bg-status-impossible text-white dark:text-white' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <span className="sm:hidden">불</span>
                                <span className="hidden sm:inline">불가</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setMyStatus(day.dateStr, 'pending'); }}
                                className={`flex-1 min-h-0 overflow-hidden py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold leading-none transition-colors whitespace-nowrap flex items-center justify-center ${myStatus === 'pending' ? 'bg-status-pending text-white dark:text-white' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                              >
                                <span className="sm:hidden">미</span>
                                <span className="hidden sm:inline">미정</span>
                              </button>
                            </div>
                          </div>
                        );
                      })() : (
                        day.isConfirmed ? (
                          <div className="flex items-center justify-center flex-grow mt-0.5 min-h-0 overflow-hidden">
                            <img alt="Life Is Jikgwan Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full opacity-90" src="/logo.png" onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/111827/FFFFFF?text=Logo" }} />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 grid-rows-4 gap-x-0.5 gap-y-0 text-[6.5px] sm:text-[8px] md:text-[9px] font-bold text-center leading-none mt-0.5 flex-grow min-h-0 overflow-hidden">
                            {day.game.members.map((member: any, mIdx: number) => (
                              <div key={mIdx} className={`flex items-center justify-center truncate ${member.status === 'possible' ? 'text-status-possible' : member.status === 'impossible' ? 'text-status-impossible' : 'text-status-pending'}`}>
                                {member.id}
                              </div>
                            ))}
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            );
            })}
            </div>
          </div>
        </main>
      ) : activeTab === 'standings' ? (
        <StandingsView />
      ) : (
        <SettingsView schedule={schedule} setSchedule={setSchedule} members={members} setMembers={setMembers} user={user} />
      )}

      <nav className="w-full bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 flex justify-around py-1.5 sm:py-2 pb-safe shrink-0">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center p-1 sm:p-1.5 transition-colors ${activeTab === 'calendar' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[8px] sm:text-[9px] font-medium mt-0.5">달력</span>
        </button>
        <button 
          onClick={() => setActiveTab('standings')}
          className={`flex flex-col items-center p-1 sm:p-1.5 transition-colors ${activeTab === 'standings' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
            <path d="M2 20h.01"/>
            <path d="M7 20v-4"/>
            <path d="M12 20v-8"/>
            <path d="M17 20V8"/>
            <path d="M22 4v16"/>
          </svg>
          <span className="text-[8px] sm:text-[9px] font-medium mt-0.5">팀순위</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center p-1 sm:p-1.5 transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[8px] sm:text-[9px] font-medium mt-0.5">설정</span>
        </button>
      </nav>
    </div>
  );
}
