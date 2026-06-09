import React, { useState, useEffect } from "react";
import {
  Trophy, Medal, Lock, Unlock, Settings, AlertCircle,
  Calendar, Flag, ArrowRight, Plus, Trash2, Edit2, Check, X,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASnnjEXJgvCvOAgpONRNELgCUcGiFmS-w",
  authDomain: "ktic-sports-2569.firebaseapp.com",
  projectId: "ktic-sports-2569",
  storageBucket: "ktic-sports-2569.firebasestorage.app",
  messagingSenderId: "860695337439",
  appId: "1:860695337439:web:496db5a1ba444686080c6a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const getDbRef = () => doc(db, "ktic_sports", "2026_events_data");
const getScheduleRef = () => doc(db, "ktic_sports", "2026_schedule_data");

const TEAMS: { [key: string]: { id: string; name: string; color: string; bgLight: string; text: string; border: string; hex: string } } = {
  red:    { id: "red",    name: "สีแดง",   color: "bg-red-500",    bgLight: "bg-red-50",    text: "text-red-700",    border: "border-red-300",    hex: "#ef4444" },
  blue:   { id: "blue",  name: "สีฟ้า",    color: "bg-blue-500",   bgLight: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-300",   hex: "#3b82f6" },
  green:  { id: "green", name: "สีเขียว", color: "bg-green-500",  bgLight: "bg-green-50",  text: "text-green-700",  border: "border-green-300",  hex: "#22c55e" },
  yellow: { id: "yellow",name: "สีเหลือง",color: "bg-yellow-400", bgLight: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300", hex: "#eab308" },
};

interface ScoreDetail {
  teamA: string | null;
  teamB: string | null;
  scoreA: string;
  scoreB: string;
  note: string;
}

interface EventResult {
  gold: string | null;
  silver: string | null;
  bronze: string | null;
  detail: ScoreDetail;
}

interface SportEvent {
  id: string;
  name: string;
  category: string;
  type: string;
  status: string;
  results: EventResult;
}

interface TeamScore {
  id: string; name: string; color: string; bgLight: string;
  text: string; border: string; hex: string;
  gold: number; silver: number; bronze: number;
}

interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  event: string;
  location: string;
}

const INITIAL_EVENTS: SportEvent[] = [
  "ฟุตบอล 7 คน|ชาย|ball","ฟุตซอล|ชาย|ball","ฟุตซอล|หญิง|ball",
  "เซปักตะกร้อ|ชาย|net","เซปักตะกร้อ|หญิง|net",
  "วอลเลย์บอล|ชาย|net","วอลเลย์บอล|หญิง|net",
  "เปตอง|ทีมชาย|target","เปตอง|ทีมหญิง|target",
  "กรีฑา 100 เมตร|ชาย|track","กรีฑา 100 เมตร|หญิง|track",
  "กรีฑา 200 เมตร|ชาย|track","กรีฑา 200 เมตร|หญิง|track",
  "กรีฑา 400 เมตร|ชาย|track","กรีฑา 400 เมตร|หญิง|track",
  "กรีฑา 800 เมตร|ชาย|track","กรีฑา 800 เมตร|หญิง|track",
  "กรีฑา ผลัด 4x100 เมตร|ชาย|track","กรีฑา ผลัด 4x100 เมตร|หญิง|track",
  "กรีฑา ผลัด 4x400 เมตร|ชาย|track","กรีฑา ผลัด 4x400 เมตร|หญิง|track",
].map((s, i) => {
  const [name, category, type] = s.split("|");
  return { id: `evt_${i}`, name, category, type, status: "pending",
    results: { gold: null, silver: null, bronze: null,
      detail: { teamA: null, teamB: null, scoreA: "", scoreB: "", note: "" } } };
});

const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: "s0", date: "6 มิ.ย. 2569", time: "08:30", event: "พิธีเปิดการแข่งขันกีฬาสี ประจำปี 2569", location: "สนามกีฬากลาง" },
  { id: "s1", date: "6 มิ.ย. 2569", time: "10:00", event: "ฟุตบอล 7 คน (รอบคัดเลือก)", location: "สนามฟุตบอล 1" },
  { id: "s2", date: "6 มิ.ย. 2569", time: "13:00", event: "เซปักตะกร้อ ชาย/หญิง (รอบคัดเลือก)", location: "ลานกีฬาอเนกประสงค์" },
  { id: "s3", date: "7 มิ.ย. 2569", time: "09:00", event: "วอลเลย์บอล ชาย/หญิง (รอบแรก)", location: "โรงยิมเนเซียม" },
  { id: "s4", date: "7 มิ.ย. 2569", time: "13:30", event: "เปตอง ชาย/หญิง (รอบแรก-ชิงชนะเลิศ)", location: "สนามเปตอง" },
  { id: "s5", date: "8 มิ.ย. 2569", time: "09:00", event: "ฟุตซอล ชาย/หญิง (รอบคัดเลือก)", location: "โรงยิมเนเซียม" },
  { id: "s6", date: "9 มิ.ย. 2569", time: "09:00", event: "กรีฑา 100m, 200m (รอบคัดเลือก)", location: "ลู่วิ่งสนามกลาง" },
  { id: "s7", date: "9 มิ.ย. 2569", time: "13:00", event: "กรีฑา 400m, 800m (ชิงชนะเลิศ)", location: "ลู่วิ่งสนามกลาง" },
  { id: "s8", date: "10 มิ.ย. 2569", time: "09:00", event: "ฟุตบอล / ฟุตซอล (ชิงชนะเลิศ)", location: "สนามฟุตบอล/โรงยิม" },
  { id: "s9", date: "10 มิ.ย. 2569", time: "13:00", event: "กรีฑา ผลัด 4x100m, 4x400m (ชิงชนะเลิศ)", location: "ลู่วิ่งสนามกลาง" },
  { id: "s10", date: "10 มิ.ย. 2569", time: "15:30", event: "พิธีปิดและมอบถ้วยรางวัลรวม", location: "สนามกีฬากลาง" },
];

// ---- Result Display Component ----
function ResultDisplay({ event }: { event: SportEvent }) {
  const { results } = event;
  const isTrack = event.type === "track";

  if (event.status !== "completed") {
    return <div className="text-center text-slate-400 text-sm py-2">ยังไม่มีผลการแข่งขัน</div>;
  }

  const goldTeam = results.gold ? TEAMS[results.gold] : null;
  const silverTeam = results.silver ? TEAMS[results.silver] : null;
  const bronzeTeam = results.bronze ? TEAMS[results.bronze] : null;
  const d = results.detail;

  // For ball/net/target: show match score if available
  const hasMatchScore = !isTrack && d.teamA && d.teamB && (d.scoreA !== "" || d.scoreB !== "");

  return (
    <div className="mt-3 space-y-2">
      {/* Match score card for ball/net/target sports */}
      {hasMatchScore && goldTeam && silverTeam && (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-700 text-white text-xs text-center py-1 font-medium tracking-wide">ผลการแข่งขัน (รอบชิงชนะเลิศ)</div>
          <div className="flex items-center bg-white">
            <div className={`flex-1 flex flex-col items-center py-3 px-2 ${TEAMS[d.teamA!]?.bgLight}`}>
              <div className={`w-4 h-4 rounded-full ${TEAMS[d.teamA!]?.color} mb-1`}></div>
              <span className={`font-bold text-sm ${TEAMS[d.teamA!]?.text}`}>{TEAMS[d.teamA!]?.name}</span>
            </div>
            <div className="flex items-center space-x-1 px-3">
              <span className="text-2xl font-black text-slate-800">{d.scoreA}</span>
              <span className="text-slate-400 font-light text-lg">-</span>
              <span className="text-2xl font-black text-slate-800">{d.scoreB}</span>
            </div>
            <div className={`flex-1 flex flex-col items-center py-3 px-2 ${TEAMS[d.teamB!]?.bgLight}`}>
              <div className={`w-4 h-4 rounded-full ${TEAMS[d.teamB!]?.color} mb-1`}></div>
              <span className={`font-bold text-sm ${TEAMS[d.teamB!]?.text}`}>{TEAMS[d.teamB!]?.name}</span>
            </div>
          </div>
          {d.note && <div className="text-xs text-center text-slate-500 bg-slate-50 py-1 px-2 border-t">{d.note}</div>}
        </div>
      )}

      {/* Medal summary */}
      <div className="flex gap-2">
        {goldTeam && (
          <div className="flex-1 flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1.5">
            <span className="text-base">🥇</span>
            <div className={`w-2.5 h-2.5 rounded-full ${goldTeam.color} flex-shrink-0`}></div>
            <span className={`text-xs font-bold ${goldTeam.text} truncate`}>{goldTeam.name}</span>
          </div>
        )}
        {silverTeam && (
          <div className="flex-1 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <span className="text-base">🥈</span>
            <div className={`w-2.5 h-2.5 rounded-full ${silverTeam.color} flex-shrink-0`}></div>
            <span className={`text-xs font-bold ${silverTeam.text} truncate`}>{silverTeam.name}</span>
          </div>
        )}
        {bronzeTeam && (
          <div className="flex-1 flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5">
            <span className="text-base">🥉</span>
            <div className={`w-2.5 h-2.5 rounded-full ${bronzeTeam.color} flex-shrink-0`}></div>
            <span className={`text-xs font-bold ${bronzeTeam.text} truncate`}>{bronzeTeam.name}</span>
          </div>
        )}
      </div>

      {/* Track note */}
      {isTrack && d.note && (
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-1">{d.note}</div>
      )}
    </div>
  );
}

// ---- Admin Event Editor ----
function AdminEventEditor({ event, onSave }: { event: SportEvent; onSave: (ev: SportEvent) => void }) {
  const [draft, setDraft] = useState<SportEvent>(JSON.parse(JSON.stringify(event)));
  const isTrack = event.type === "track";

  const setMedal = (medal: keyof EventResult, teamId: string | null) => {
    setDraft(d => ({ ...d,
      status: "completed",
      results: { ...d.results, [medal]: d.results[medal] === teamId ? null : teamId }
    }));
  };

  const setDetail = (key: keyof ScoreDetail, val: string | null) => {
    setDraft(d => ({ ...d, results: { ...d.results, detail: { ...d.results.detail, [key]: val } } }));
  };

  const handleSave = () => {
    const r = draft.results;
    const hasAnyMedal = r.gold || r.silver || r.bronze;
    onSave({ ...draft, status: hasAnyMedal ? "completed" : "pending" });
  };

  return (
    <div className="mt-3 space-y-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
      {/* Medal assignment */}
      {(["gold", "silver", "bronze"] as const).map((medal) => {
        const cfg = { gold: { label: "🥇 ทอง", bg: "bg-yellow-100" }, silver: { label: "🥈 เงิน", bg: "bg-slate-100" }, bronze: { label: "🥉 ทองแดง", bg: "bg-orange-100" } };
        return (
          <div key={medal} className="flex items-center gap-2">
            <span className={`text-xs font-bold w-20 text-slate-600 ${cfg[medal].bg} px-2 py-1 rounded`}>{cfg[medal].label}</span>
            <div className="flex gap-1 flex-1 flex-wrap">
              {Object.values(TEAMS).map(team => (
                <button key={team.id} onClick={() => setMedal(medal, team.id)}
                  className={`px-2 py-1 rounded text-xs font-bold border transition ${draft.results[medal] === team.id ? `${team.color} text-white border-transparent` : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
                  {team.name}
                </button>
              ))}
              {draft.results[medal] && (
                <button onClick={() => setMedal(medal, null)} className="px-2 py-1 rounded text-xs bg-red-50 text-red-500 border border-red-200 hover:bg-red-100">ล้าง</button>
              )}
            </div>
          </div>
        );
      })}

      {/* Score detail for non-track */}
      {!isTrack && (
        <div className="border-t border-indigo-200 pt-3 space-y-2">
          <p className="text-xs font-semibold text-indigo-700">ผลการแข่งขัน (ไม่บังคับ)</p>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">ทีม A</label>
              <select value={draft.results.detail.teamA || ""} onChange={e => setDetail("teamA", e.target.value || null)}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white">
                <option value="">-- เลือกสี --</option>
                {Object.values(TEAMS).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="w-16">
              <label className="text-xs text-slate-500 mb-1 block">คะแนน A</label>
              <input value={draft.results.detail.scoreA} onChange={e => setDetail("scoreA", e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white text-center font-bold" placeholder="0" />
            </div>
            <span className="text-slate-400 font-bold mt-4">-</span>
            <div className="w-16">
              <label className="text-xs text-slate-500 mb-1 block">คะแนน B</label>
              <input value={draft.results.detail.scoreB} onChange={e => setDetail("scoreB", e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white text-center font-bold" placeholder="0" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">ทีม B</label>
              <select value={draft.results.detail.teamB || ""} onChange={e => setDetail("teamB", e.target.value || null)}
                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white">
                <option value="">-- เลือกสี --</option>
                {Object.values(TEAMS).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">หมายเหตุ (เช่น ต่อเวลา, ดวลจุดโทษ)</label>
            <input value={draft.results.detail.note} onChange={e => setDetail("note", e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white" placeholder="เช่น ชนะการดวลจุดโทษ 5-4" />
          </div>
        </div>
      )}

      {/* Track note only */}
      {isTrack && (
        <div className="border-t border-indigo-200 pt-2">
          <label className="text-xs text-slate-500 mb-1 block">หมายเหตุ (เช่น เวลาที่ทำได้)</label>
          <input value={draft.results.detail.note} onChange={e => setDetail("note", e.target.value)}
            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white" placeholder="เช่น 11.2 วินาที" />
        </div>
      )}

      <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1">
        <Check className="h-3 w-3" /> บันทึกผล
      </button>
    </div>
  );
}

export default function SportsDayApp() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [events, setEvents] = useState<SportEvent[]>(INITIAL_EVENTS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [calculatedScores, setCalculatedScores] = useState<{ [key: string]: TeamScore }>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Schedule edit state
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleItem | null>(null);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Omit<ScheduleItem, "id">>({ date: "", time: "", event: "", location: "" });

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); }
      catch (err) { console.error("Auth Error:", err); setLoading(false); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); if (!u) setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = getDbRef();
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setEvents(snap.data().eventsList);
      else setDoc(docRef, { eventsList: INITIAL_EVENTS }, { merge: true });
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ref = getScheduleRef();
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setSchedule(snap.data().items);
      else setDoc(ref, { items: INITIAL_SCHEDULE }, { merge: true });
    }, console.error);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const newScores: { [key: string]: TeamScore } = Object.fromEntries(
      Object.entries(TEAMS).map(([k, v]) => [k, { ...v, gold: 0, silver: 0, bronze: 0 }])
    );
    events.forEach((event) => {
      if (event.results.gold && newScores[event.results.gold]) newScores[event.results.gold].gold += 1;
      if (event.results.silver && newScores[event.results.silver]) newScores[event.results.silver].silver += 1;
      if (event.results.bronze && newScores[event.results.bronze]) newScores[event.results.bronze].bronze += 1;
    });
    setCalculatedScores(newScores);
  }, [events]);

  const saveEvents = async (updated: SportEvent[]) => {
    setEvents(updated);
    try { await setDoc(getDbRef(), { eventsList: updated }, { merge: true }); }
    catch (err) { console.error(err); alert("เกิดข้อผิดพลาดในการบันทึก"); }
  };

  const saveSchedule = async (updated: ScheduleItem[]) => {
    setSchedule(updated);
    try { await setDoc(getScheduleRef(), { items: updated }, { merge: true }); }
    catch (err) { console.error(err); alert("เกิดข้อผิดพลาดในการบันทึกตาราง"); }
  };

  const handleSaveEvent = (updatedEvent: SportEvent) => {
    const updated = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    saveEvents(updated);
    setEditingEventId(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode === "2569") { setIsAdmin(true); setShowLogin(false); setPinCode(""); setLoginError(""); }
    else setLoginError("รหัสผ่านไม่ถูกต้อง");
  };

  const calculateTotalPoints = (team: TeamScore) => team.gold * 5 + team.silver * 3 + team.bronze * 1;

  const rankedTeams = Object.values(calculatedScores).sort((a, b) => {
    const diff = calculateTotalPoints(b) - calculateTotalPoints(a);
    if (diff !== 0) return diff;
    if (b.gold !== a.gold) return b.gold - a.gold;
    return b.silver - a.silver;
  });

  const filteredEvents = filterType === "all" ? events : events.filter(e => e.type === filterType);

  // Schedule handlers
  const handleAddSchedule = () => {
    if (!newSchedule.event.trim()) return;
    const item: ScheduleItem = { ...newSchedule, id: `s_${Date.now()}` };
    saveSchedule([...schedule, item]);
    setNewSchedule({ date: "", time: "", event: "", location: "" });
    setShowAddSchedule(false);
  };

  const handleDeleteSchedule = (id: string) => {
    if (!window.confirm("ลบรายการนี้?")) return;
    saveSchedule(schedule.filter(s => s.id !== id));
  };

  const handleEditSchedule = (item: ScheduleItem) => {
    setEditingScheduleId(item.id);
    setScheduleDraft({ ...item });
  };

  const handleSaveSchedule = () => {
    if (!scheduleDraft) return;
    saveSchedule(schedule.map(s => s.id === scheduleDraft.id ? scheduleDraft : s));
    setEditingScheduleId(null);
    setScheduleDraft(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">กำลังเชื่อมต่อระบบฐานข้อมูล KTIC...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2.5 rounded-xl shadow-inner"><Trophy className="h-7 w-7 text-yellow-500" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight">ระบบกีฬาสี KTIC 2569</h1>
              <p className="text-indigo-200 text-xs md:text-sm">วิทยาลัยการอาชีพคลองท่อม (6-10 มิ.ย. 69)</p>
            </div>
          </div>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)}
            className={`mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${isAdmin ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/20"}`}>
            {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            <span>{isAdmin ? "ออกจากระบบกรรมการ" : "โหมดกรรมการ"}</span>
          </button>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex space-x-1 overflow-x-auto pb-0">
          {[{ key: "overview", label: "สรุปเหรียญ", icon: <Trophy className="h-4 w-4" /> },
            { key: "events", label: "ผลการแข่งขัน", icon: <Flag className="h-4 w-4" /> },
            { key: "schedule", label: "ตารางแข่งขัน", icon: <Calendar className="h-4 w-4" /> }]
            .map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? "bg-slate-50 text-indigo-900 shadow-sm" : "text-indigo-100 hover:bg-indigo-700"}`}>
                {tab.icon}<span>{tab.label}</span>
              </button>
            ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* ===== TAB: Overview ===== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span>เชื่อมต่อฐานข้อมูล KTIC เรียบร้อย</span>
              </div>
              <div className="text-xs text-slate-500">
                ประมวลผลจาก {events.filter(e => e.status === "completed").length} / {events.length} รายการ
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                <h2 className="text-lg font-bold text-indigo-900">ตารางอันดับคะแนนรวม</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                      <th className="px-6 py-4 font-medium w-16 text-center">อันดับ</th>
                      <th className="px-6 py-4 font-medium">สี</th>
                      <th className="px-4 py-4 font-medium text-center bg-yellow-50/50"><span className="flex flex-col items-center"><Medal className="h-4 w-4 text-yellow-500 mb-1" />ทอง (5)</span></th>
                      <th className="px-4 py-4 font-medium text-center"><span className="flex flex-col items-center"><Medal className="h-4 w-4 text-slate-400 mb-1" />เงิน (3)</span></th>
                      <th className="px-4 py-4 font-medium text-center bg-orange-50/50"><span className="flex flex-col items-center"><Medal className="h-4 w-4 text-orange-500 mb-1" />ทองแดง (1)</span></th>
                      <th className="px-6 py-4 font-bold text-center text-indigo-700 bg-indigo-50/30">คะแนนรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedTeams.map((team, index) => (
                      <tr key={team.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400" : index === 1 ? "bg-slate-200 text-slate-700" : index === 2 ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-500"}`}>{index + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-md shadow-sm ${team.color}`}></div>
                            <span className={`font-bold text-lg ${team.text}`}>{team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-lg bg-yellow-50/30">{team.gold}</td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-lg">{team.silver}</td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-lg bg-orange-50/30">{team.bronze}</td>
                        <td className="px-6 py-4 text-center font-black text-indigo-600 text-2xl bg-indigo-50/20">{calculateTotalPoints(team)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rankedTeams.map(team => (
                <div key={`card-${team.id}`} className={`bg-white rounded-xl shadow-sm border-t-4 ${team.border} p-4 flex flex-col items-center`}>
                  <div className={`w-3 h-3 rounded-full mb-2 ${team.color}`}></div>
                  <span className="font-bold text-slate-800 mb-1">{team.name}</span>
                  <span className="text-2xl font-black text-slate-800">{calculateTotalPoints(team)} <span className="text-xs text-slate-500 font-normal">pts</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TAB: Events ===== */}
        {activeTab === "events" && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start shadow-sm">
                <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-indigo-900">โหมดกรรมการ — คลิก "บันทึกผล" ที่การแข่งขันแต่ละรายการ</h3>
                  <p className="text-sm text-indigo-700 mt-1">เลือกเหรียญและใส่สกอร์ได้เลย ระบบจะซิงค์ให้ทุกคนเห็นพร้อมกัน</p>
                </div>
              </div>
            )}

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {[{ key: "all", label: "ทั้งหมด" }, { key: "track", label: "🏃 กรีฑา" },
                { key: "ball", label: "⚽ ฟุตบอล/ฟุตซอล" }, { key: "net", label: "🏐 วอลเลย์/ตะกร้อ" }, { key: "target", label: "🎯 เปตอง" }]
                .map(f => (
                  <button key={f.key} onClick={() => setFilterType(f.key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${filterType === f.key ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                    {f.label}
                  </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredEvents.map(event => (
                <div key={event.id} className={`bg-white rounded-xl shadow-sm border ${event.status === "completed" ? "border-green-200" : "border-slate-200"} p-5 hover:shadow-md transition`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{event.name}</h3>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200 mt-1 inline-block">{event.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.status === "completed"
                        ? <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-md">✓ มีผล</span>
                        : <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-xs rounded-md">รอแข่ง</span>}
                      {isAdmin && (
                        <button onClick={() => setEditingEventId(editingEventId === event.id ? null : event.id)}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition ${editingEventId === event.id ? "bg-red-50 border-red-200 text-red-600" : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"}`}>
                          {editingEventId === event.id ? <X className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student view: result display */}
                  {editingEventId !== event.id && <ResultDisplay event={event} />}

                  {/* Admin view: editor */}
                  {isAdmin && editingEventId === event.id && (
                    <AdminEventEditor event={event} onSave={handleSaveEvent} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TAB: Schedule ===== */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">กรรมการสามารถเพิ่ม/แก้ไข/ลบรายการได้</p>
                <button onClick={() => setShowAddSchedule(!showAddSchedule)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  <Plus className="h-4 w-4" /> เพิ่มรายการ
                </button>
              </div>
            )}

            {/* Add schedule form */}
            {isAdmin && showAddSchedule && (
              <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-4 space-y-3">
                <h3 className="font-semibold text-indigo-900 text-sm">เพิ่มรายการแข่งขันใหม่</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">วันที่</label>
                    <input value={newSchedule.date} onChange={e => setNewSchedule(s => ({ ...s, date: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น 10 มิ.ย. 2569" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">เวลา</label>
                    <input value={newSchedule.time} onChange={e => setNewSchedule(s => ({ ...s, time: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น 09:00" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">ชื่อรายการ</label>
                  <input value={newSchedule.event} onChange={e => setNewSchedule(s => ({ ...s, event: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น ฟุตซอล ชาย (รอบรองชนะเลิศ)" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">สถานที่</label>
                  <input value={newSchedule.location} onChange={e => setNewSchedule(s => ({ ...s, location: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น โรงยิมเนเซียม" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddSchedule} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 rounded-lg transition flex items-center justify-center gap-1">
                    <Check className="h-4 w-4" /> บันทึก
                  </button>
                  <button onClick={() => setShowAddSchedule(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg transition">
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" /> ตารางการแข่งขันกีฬาสี
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {schedule.map(item => (
                  <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50 transition">
                    {editingScheduleId === item.id && scheduleDraft ? (
                      /* Inline edit form */
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={scheduleDraft.date} onChange={e => setScheduleDraft(d => d ? { ...d, date: e.target.value } : d)}
                            className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-white" placeholder="วันที่" />
                          <input value={scheduleDraft.time} onChange={e => setScheduleDraft(d => d ? { ...d, time: e.target.value } : d)}
                            className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-white" placeholder="เวลา" />
                        </div>
                        <input value={scheduleDraft.event} onChange={e => setScheduleDraft(d => d ? { ...d, event: e.target.value } : d)}
                          className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 bg-white" placeholder="ชื่อรายการ" />
                        <input value={scheduleDraft.location} onChange={e => setScheduleDraft(d => d ? { ...d, location: e.target.value } : d)}
                          className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 bg-white" placeholder="สถานที่" />
                        <div className="flex gap-2">
                          <button onClick={handleSaveSchedule} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1">
                            <Check className="h-3 w-3" /> บันทึก
                          </button>
                          <button onClick={() => { setEditingScheduleId(null); setScheduleDraft(null); }}
                            className="flex-1 bg-slate-100 text-slate-600 text-xs font-medium py-1.5 rounded hover:bg-slate-200">
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal display */
                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                        <div className="md:w-40 flex-shrink-0 flex md:flex-col gap-2 md:gap-0">
                          <div className="font-bold text-slate-800 text-sm">{item.date}</div>
                          <div className="text-indigo-600 font-semibold text-sm">{item.time} น.</div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-slate-900">{item.event}</h4>
                          <span className="inline-flex items-center text-xs text-slate-500 mt-1">📍 {item.location}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleEditSchedule(item)}
                              className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteSchedule(item.id)}
                              className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {schedule.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">ยังไม่มีรายการแข่งขัน</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center space-x-2">
                <Settings className="h-5 w-5" /><span>เข้าสู่ระบบกรรมการ</span>
              </h3>
              <button onClick={() => setShowLogin(false)} className="text-indigo-200 hover:text-white bg-indigo-700/50 hover:bg-indigo-700 rounded-full p-1.5">✕</button>
            </div>
            <div className="p-6 md:p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">รหัสผ่าน (PIN 4 หลัก)</label>
                  <input type="password" value={pinCode} onChange={e => setPinCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-2xl tracking-[0.5em] text-center font-bold"
                    placeholder="****" maxLength={4} autoFocus />
                  <div className="mt-3 text-xs text-slate-500 text-center bg-slate-100 p-2 rounded-lg">
                    รหัสสำหรับทดสอบ: <strong className="text-slate-800">2569</strong>
                  </div>
                  {loginError && (
                    <div className="mt-4 text-sm text-red-600 flex items-center justify-center gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100">
                      <AlertCircle className="h-4 w-4" /><span>{loginError}</span>
                    </div>
                  )}
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                  <span>ยืนยัน</span><ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
