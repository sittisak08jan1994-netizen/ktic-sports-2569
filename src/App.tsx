import React, { useState, useEffect } from "react";
import {
  Trophy, Medal, Lock, Unlock, Settings, AlertCircle,
  Calendar, Flag, ArrowRight, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

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
const EVENTS_REF = () => doc(db, "ktic_sports", "2026_events_data");
const MATCHES_REF = () => doc(db, "ktic_sports", "2026_matches_data");
const SCHEDULE_REF = () => doc(db, "ktic_sports", "2026_schedule_data");

// ── Types ──────────────────────────────────────────────────────────────────
interface Team { id: string; name: string; color: string; bgLight: string; text: string; border: string; }

const TEAMS: Record<string, Team> = {
  red:    { id:"red",    name:"สีแดง",   color:"bg-red-500",    bgLight:"bg-red-50",    text:"text-red-700",    border:"border-red-300" },
  blue:   { id:"blue",  name:"สีฟ้า",    color:"bg-blue-500",   bgLight:"bg-blue-50",   text:"text-blue-700",   border:"border-blue-300" },
  green:  { id:"green", name:"สีเขียว", color:"bg-green-500",  bgLight:"bg-green-50",  text:"text-green-700",  border:"border-green-300" },
  yellow: { id:"yellow",name:"สีเหลือง",color:"bg-yellow-400", bgLight:"bg-yellow-50", text:"text-yellow-700", border:"border-yellow-300" },
};

interface SportEvent {
  id: string;
  name: string;
  category: string;
  type: string; // ball / net / track / target
}

type MedalType = "" | "gold" | "silver" | "bronze";

// Match result: ผลการแข่งขัน 1 รอบ/นัด
// ถ้า isMedalRound = true จะมีการให้เหรียญทั้งฝั่ง A และ B แยกกัน (กรรมการเลือกเอง)
interface MatchResult {
  id: string;
  eventId: string;
  round: string;       // เช่น รอบคัดเลือก, รอบชิงชนะเลิศ
  isMedalRound: boolean;
  teamA: string;
  teamB: string;        // ว่าง = ไม่มีคู่แข่ง (กรีฑา/รายบุคคล)
  scoreA: string;
  scoreB: string;
  note: string;
  medalA: MedalType;    // เหรียญของ teamA
  medalB: MedalType;    // เหรียญของ teamB (ถ้ามี)
}

interface TeamScore { id: string; name: string; color: string; bgLight: string; text: string; border: string; gold: number; silver: number; bronze: number; }

interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  event: string;
  location: string;
}

// ── Initial Data ────────────────────────────────────────────────────────────
const INITIAL_EVENTS: SportEvent[] = [
  { id:"e1",  name:"ฟุตบอล 7 คน",          category:"ชาย",     type:"ball"   },
  { id:"e2",  name:"ฟุตซอล",               category:"ชาย",     type:"ball"   },
  { id:"e3",  name:"ฟุตซอล",               category:"หญิง",    type:"ball"   },
  { id:"e4",  name:"เซปักตะกร้อ",           category:"ชาย",     type:"net"    },
  { id:"e5",  name:"เซปักตะกร้อ",           category:"หญิง",    type:"net"    },
  { id:"e6",  name:"วอลเลย์บอล",            category:"ชาย",     type:"net"    },
  { id:"e7",  name:"วอลเลย์บอล",            category:"หญิง",    type:"net"    },
  { id:"e8",  name:"เปตอง",                 category:"ทีมชาย",  type:"target" },
  { id:"e9",  name:"เปตอง",                 category:"ทีมหญิง", type:"target" },
  { id:"e10", name:"กรีฑา 100 เมตร",        category:"ชาย",     type:"track"  },
  { id:"e11", name:"กรีฑา 100 เมตร",        category:"หญิง",    type:"track"  },
  { id:"e12", name:"กรีฑา 200 เมตร",        category:"ชาย",     type:"track"  },
  { id:"e13", name:"กรีฑา 200 เมตร",        category:"หญิง",    type:"track"  },
  { id:"e14", name:"กรีฑา 400 เมตร",        category:"ชาย",     type:"track"  },
  { id:"e15", name:"กรีฑา 400 เมตร",        category:"หญิง",    type:"track"  },
  { id:"e16", name:"กรีฑา 800 เมตร",        category:"ชาย",     type:"track"  },
  { id:"e17", name:"กรีฑา 800 เมตร",        category:"หญิง",    type:"track"  },
  { id:"e18", name:"กรีฑา ผลัด 4x100 เมตร", category:"ชาย",    type:"track"  },
  { id:"e19", name:"กรีฑา ผลัด 4x100 เมตร", category:"หญิง",   type:"track"  },
  { id:"e20", name:"กรีฑา ผลัด 4x400 เมตร", category:"ชาย",    type:"track"  },
  { id:"e21", name:"กรีฑา ผลัด 4x400 เมตร", category:"หญิง",   type:"track"  },
];

const INITIAL_MATCHES: MatchResult[] = [];

const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id:"s0",  date:"6 มิ.ย. 2569",  time:"08:30", event:"พิธีเปิดการแข่งขันกีฬาสี ประจำปี 2569",        location:"สนามกีฬากลาง" },
  { id:"s1",  date:"6 มิ.ย. 2569",  time:"10:00", event:"ฟุตบอล 7 คน (รอบคัดเลือก)",                   location:"สนามฟุตบอล 1" },
  { id:"s2",  date:"6 มิ.ย. 2569",  time:"13:00", event:"เซปักตะกร้อ ชาย/หญิง (รอบคัดเลือก)",          location:"ลานกีฬาอเนกประสงค์" },
  { id:"s3",  date:"7 มิ.ย. 2569",  time:"09:00", event:"วอลเลย์บอล ชาย/หญิง (รอบแรก)",                location:"โรงยิมเนเซียม" },
  { id:"s4",  date:"7 มิ.ย. 2569",  time:"13:30", event:"เปตอง ชาย/หญิง (รอบแรก-ชิงชนะเลิศ)",          location:"สนามเปตอง" },
  { id:"s5",  date:"8 มิ.ย. 2569",  time:"09:00", event:"ฟุตซอล ชาย/หญิง (รอบคัดเลือก)",               location:"โรงยิมเนเซียม" },
  { id:"s6",  date:"9 มิ.ย. 2569",  time:"09:00", event:"กรีฑา 100m, 200m (รอบคัดเลือก)",              location:"ลู่วิ่งสนามกลาง" },
  { id:"s7",  date:"9 มิ.ย. 2569",  time:"13:00", event:"กรีฑา 400m, 800m (ชิงชนะเลิศ)",               location:"ลู่วิ่งสนามกลาง" },
  { id:"s8",  date:"10 มิ.ย. 2569", time:"09:00", event:"ฟุตบอล / ฟุตซอล (ชิงชนะเลิศ)",                location:"สนามฟุตบอล/โรงยิม" },
  { id:"s9",  date:"10 มิ.ย. 2569", time:"13:00", event:"กรีฑา ผลัด 4x100m, 4x400m (ชิงชนะเลิศ)",      location:"ลู่วิ่งสนามกลาง" },
  { id:"s10", date:"10 มิ.ย. 2569", time:"15:30", event:"พิธีปิดและมอบถ้วยรางวัลรวม",                  location:"สนามกีฬากลาง" },
];

const TYPE_LABELS: Record<string, string> = { ball:"⚽ ฟุตบอล / ฟุตซอล", net:"🏐 วอลเลย์ / ตะกร้อ", target:"🎯 เปตอง", track:"🏃 กรีฑา" };
const MEDAL_OPTIONS: { v: MedalType; label: string }[] = [
  { v:"", label:"ไม่มีเหรียญ" }, { v:"gold", label:"🥇 ทอง" }, { v:"silver", label:"🥈 เงิน" }, { v:"bronze", label:"🥉 ทองแดง" },
];
const MEDAL_ICON: Record<MedalType, string> = { "":"", gold:"🥇", silver:"🥈", bronze:"🥉" };

// ── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => `m_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

function TeamBadge({ teamId, size="sm" }: { teamId: string; size?: "sm"|"md" }) {
  const t = TEAMS[teamId];
  if (!t) return <span className="text-slate-400 text-xs">-</span>;
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${size==="md" ? "text-base" : "text-xs"}`}>
      <span className={`inline-block ${size==="md"?"w-3 h-3":"w-2.5 h-2.5"} rounded-full ${t.color}`}></span>
      <span className={t.text}>{t.name}</span>
    </span>
  );
}

// ── Result Table (Student view) ──────────────────────────────────────────────
function ResultsTable({ matches, isTrack }: { matches: MatchResult[]; isTrack: boolean }) {
  if (matches.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-3">ยังไม่มีผลการแข่งขัน</p>;
  }

  if (isTrack) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <th className="px-3 py-2 text-left font-medium">รอบ</th>
              <th className="px-3 py-2 text-left font-medium">สี</th>
              <th className="px-3 py-2 text-center font-medium">ผล/เวลา</th>
              <th className="px-3 py-2 text-center font-medium">เหรียญ</th>
              <th className="px-3 py-2 text-left font-medium">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(m => (
              <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-600">{m.round || "-"}</td>
                <td className="px-3 py-2"><TeamBadge teamId={m.teamA} /></td>
                <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">{m.scoreA || "-"}</td>
                <td className="px-3 py-2 text-center text-lg">{MEDAL_ICON[m.medalA] || "-"}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{m.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <th className="px-3 py-2 text-left font-medium">รอบ</th>
            <th className="px-3 py-2 text-center font-medium">ทีม A</th>
            <th className="px-3 py-2 text-center font-medium">สกอร์</th>
            <th className="px-3 py-2 text-center font-medium">ทีม B</th>
            <th className="px-3 py-2 text-center font-medium">เหรียญ A</th>
            <th className="px-3 py-2 text-center font-medium">เหรียญ B</th>
            <th className="px-3 py-2 text-left font-medium">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => (
            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-600">{m.round || "-"}</td>
              <td className={`px-3 py-2 text-center ${TEAMS[m.teamA]?.bgLight || ""}`}><TeamBadge teamId={m.teamA} /></td>
              <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">
                {(m.scoreA || m.scoreB) ? `${m.scoreA || "-"} : ${m.scoreB || "-"}` : "-"}
              </td>
              <td className={`px-3 py-2 text-center ${TEAMS[m.teamB]?.bgLight || ""}`}><TeamBadge teamId={m.teamB} /></td>
              <td className="px-3 py-2 text-center text-lg">{MEDAL_ICON[m.medalA] || "-"}</td>
              <td className="px-3 py-2 text-center text-lg">{MEDAL_ICON[m.medalB] || "-"}</td>
              <td className="px-3 py-2 text-slate-500 text-xs">{m.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Compact scoreboard (highlight medal rounds)
function MatchHighlight({ match }: { match: MatchResult }) {
  const isTrack = !match.teamB;
  if (isTrack) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {match.medalA && <span className="text-base">{MEDAL_ICON[match.medalA]}</span>}
          <TeamBadge teamId={match.teamA} />
          <span className="text-xs text-slate-400">{match.round}</span>
        </div>
        {match.scoreA && <span className="text-sm font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5">{match.scoreA}</span>}
      </div>
    );
  }
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-slate-600 text-white text-xs text-center py-1 font-medium">{match.round || "ผลการแข่งขัน"}</div>
      <div className="flex items-stretch bg-white">
        <div className={`flex-1 flex flex-col items-center justify-center py-3 px-2 ${TEAMS[match.teamA]?.bgLight}`}>
          {match.medalA && <span className="text-lg leading-none mb-0.5">{MEDAL_ICON[match.medalA]}</span>}
          <span className={`inline-block w-4 h-4 rounded-full ${TEAMS[match.teamA]?.color} mb-1`}></span>
          <span className={`font-bold text-sm ${TEAMS[match.teamA]?.text}`}>{TEAMS[match.teamA]?.name}</span>
        </div>
        <div className="flex flex-col items-center justify-center px-4 bg-white">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-slate-800">{match.scoreA || "-"}</span>
            <span className="text-slate-300 text-xl">:</span>
            <span className="text-2xl font-black text-slate-800">{match.scoreB || "-"}</span>
          </div>
          {match.note && <span className="text-xs text-slate-400 mt-0.5 text-center">{match.note}</span>}
        </div>
        <div className={`flex-1 flex flex-col items-center justify-center py-3 px-2 ${TEAMS[match.teamB]?.bgLight}`}>
          {match.medalB && <span className="text-lg leading-none mb-0.5">{MEDAL_ICON[match.medalB]}</span>}
          <span className={`inline-block w-4 h-4 rounded-full ${TEAMS[match.teamB]?.color} mb-1`}></span>
          <span className={`font-bold text-sm ${TEAMS[match.teamB]?.text}`}>{TEAMS[match.teamB]?.name}</span>
        </div>
      </div>
    </div>
  );
}

// ── Match Form (admin) ────────────────────────────────────────────────────────
function MatchForm({ eventId, isTrack, onSave, onCancel, initial, otherMatches }: {
  eventId: string; isTrack: boolean;
  onSave: (m: MatchResult) => void; onCancel: () => void;
  initial?: MatchResult;
  otherMatches: MatchResult[];
}) {
  const [form, setForm] = useState<MatchResult>(initial ?? {
    id: uid(), eventId, round: "", isMedalRound: false,
    teamA: "", teamB: "", scoreA: "", scoreB: "", note: "", medalA: "", medalB: "",
  });
  const set = (k: keyof MatchResult, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  // ── คำนวณเหรียญ/สี ที่ถูกใช้ไปแล้วจากนัดอื่นในรายการเดียวกัน ──
  // (otherMatches already excludes this match itself, so anything in usedMedals/usedTeams
  //  is genuinely used by a DIFFERENT match — no "exceptCurrent" needed)
  const usedMedals = new Set<MedalType>();
  const usedTeams = new Set<string>();
  otherMatches.forEach(m => {
    if (!m.isMedalRound) return;
    if (m.medalA) { usedMedals.add(m.medalA); if (m.teamA) usedTeams.add(m.teamA); }
    if (m.medalB) { usedMedals.add(m.medalB); if (m.teamB) usedTeams.add(m.teamB); }
  });

  const isTeamLocked = (teamId: string) => usedTeams.has(teamId);
  const isMedalLocked = (medal: MedalType) => medal !== "" && usedMedals.has(medal);

  const valid = !!form.teamA && (isTrack || !!form.teamB);

  // A value is a real conflict if it's locked by a DIFFERENT match
  const conflict =
    (!!form.teamA && isTeamLocked(form.teamA)) ||
    (!isTrack && !!form.teamB && isTeamLocked(form.teamB)) ||
    (form.isMedalRound && !!form.medalA && isMedalLocked(form.medalA)) ||
    (form.isMedalRound && !isTrack && !!form.medalB && isMedalLocked(form.medalB)) ||
    (form.isMedalRound && !isTrack && !!form.medalA && form.medalA === form.medalB);

  const canSave = valid && !conflict;

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">รอบการแข่งขัน</label>
        <input value={form.round} onChange={e => set("round", e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
          placeholder="เช่น รอบคัดเลือก, รอบรองชนะเลิศ, รอบชิงชนะเลิศ" />
      </div>

      <div className={`grid gap-2 ${isTrack ? "grid-cols-1" : "grid-cols-2"}`}>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">{isTrack ? "สีที่ได้อันดับ" : "ทีม A"}</label>
          <select value={form.teamA} onChange={e => set("teamA", e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <option value="">-- เลือกสี --</option>
            {Object.values(TEAMS).map(t => {
              const locked = isTeamLocked(t.id);
              return (
                <option key={t.id} value={t.id} disabled={locked}>
                  {t.name}{locked ? " (ได้เหรียญไปแล้ว)" : ""}
                </option>
              );
            })}
          </select>
        </div>
        {!isTrack && (
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">ทีม B</label>
            <select value={form.teamB} onChange={e => set("teamB", e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
              <option value="">-- เลือกสี --</option>
              {Object.values(TEAMS).filter(t => t.id !== form.teamA).map(t => {
                const locked = isTeamLocked(t.id);
                return (
                  <option key={t.id} value={t.id} disabled={locked}>
                    {t.name}{locked ? " (ได้เหรียญไปแล้ว)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      <div className={`grid gap-2 ${isTrack ? "grid-cols-1" : "grid-cols-2"}`}>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">{isTrack ? "เวลา / ระยะทาง / ผล" : "คะแนน ทีม A"}</label>
          <input value={form.scoreA} onChange={e => set("scoreA", e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-center font-bold"
            placeholder={isTrack ? "เช่น 11.2 วินาที" : "0"} />
        </div>
        {!isTrack && (
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">คะแนน ทีม B</label>
            <input value={form.scoreB} onChange={e => set("scoreB", e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-center font-bold" placeholder="0" />
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">หมายเหตุ (ไม่บังคับ)</label>
        <input value={form.note} onChange={e => set("note", e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
          placeholder="เช่น ต่อเวลาพิเศษ, ดวลจุดโทษ 4-3" />
      </div>

      {/* Medal round toggle */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <input type="checkbox" id={`medalRound-${form.id}`} checked={form.isMedalRound}
          onChange={e => set("isMedalRound", e.target.checked)}
          className="w-4 h-4 accent-amber-500" />
        <label htmlFor={`medalRound-${form.id}`} className="text-sm font-semibold text-amber-800 cursor-pointer">รอบที่มีเหรียญรางวัล (คิดคะแนนสะสม)</label>
      </div>

      {form.isMedalRound && (
        <div className={`grid gap-3 ${isTrack ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              เหรียญที่ {isTrack ? "สีนี้" : "ทีม A"} ได้รับ
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {MEDAL_OPTIONS.map(opt => {
                const locked = isMedalLocked(opt.v);
                return (
                  <button key={opt.v} type="button" disabled={locked}
                    onClick={() => !locked && set("medalA", opt.v)}
                    title={locked ? "เหรียญนี้ถูกใช้ไปแล้วในรอบอื่น" : ""}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      form.medalA === opt.v ? "bg-indigo-600 text-white border-indigo-600"
                      : locked ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                    }`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          {!isTrack && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">เหรียญที่ ทีม B ได้รับ</label>
              <div className="flex gap-1.5 flex-wrap">
                {MEDAL_OPTIONS.map(opt => {
                  const locked = isMedalLocked(opt.v) || (opt.v !== "" && opt.v === form.medalA);
                  return (
                    <button key={opt.v} type="button" disabled={locked}
                      onClick={() => !locked && set("medalB", opt.v)}
                      title={locked ? "เหรียญนี้ถูกใช้ไปแล้ว" : ""}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                        form.medalB === opt.v ? "bg-indigo-600 text-white border-indigo-600"
                        : locked ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500 col-span-full">
            💡 ตัวอย่าง: รอบชิงชนะเลิศ สีแดงชนะ สีฟ้า → เลือก ทีม A = 🥇ทอง, ทีม B = 🥈เงิน
          </p>
          {(usedMedals.size > 0) && (
            <p className="text-xs text-amber-600 col-span-full bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
              ⚠️ เหรียญที่ถูกใช้ไปแล้วในรายการนี้: {Array.from(usedMedals).map(m => MEDAL_ICON[m]).join(" ")}
              {usedTeams.size > 0 && <> | สีที่ได้เหรียญแล้ว: {Array.from(usedTeams).map(t => TEAMS[t]?.name).join(", ")}</>}
            </p>
          )}
        </div>
      )}

      {conflict && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
          ⚠️ มีการเลือกสีหรือเหรียญที่ถูกใช้ไปแล้วในรายการนี้ กรุณาเลือกใหม่
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => canSave && onSave(form)} disabled={!canSave}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 ${canSave ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
          <Check className="h-4 w-4" /> บันทึกผล
        </button>
        <button onClick={onCancel}
          className="flex-1 text-sm font-medium py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

// ── Event Card (Student view) ────────────────────────────────────────────────
function EventCard({ event, matches }: { event: SportEvent; matches: MatchResult[] }) {
  const [open, setOpen] = useState(false);
  const isTrack = event.type === "track";
  const medalMatches = matches.filter(m => m.isMedalRound && (m.medalA || m.medalB));
  const hasResults = matches.length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${hasResults ? "border-green-200" : "border-slate-200"} overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition">
        <div>
          <h3 className="font-bold text-slate-800">{event.name}</h3>
          <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded px-2 py-0.5 mt-1 inline-block">{event.category}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasResults
            ? <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-1 font-bold">✓ มีผล {matches.length} รอบ</span>
            : <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-md px-2 py-1">รอแข่ง</span>}
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
          {!hasResults && <p className="text-sm text-slate-400 text-center py-3">ยังไม่มีผลการแข่งขัน</p>}

          {medalMatches.length > 0 && (
            <div className="space-y-2 pt-3">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">🏅 รอบที่มีเหรียญ</p>
              {medalMatches.map(m => <MatchHighlight key={m.id} match={m} />)}
            </div>
          )}

          {matches.length > 0 && (
            <div className="space-y-2 pt-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">📋 ผลการแข่งขันทั้งหมด (ตาราง)</p>
              <ResultsTable matches={matches} isTrack={isTrack} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Admin Event Card ───────────────────────────────────────────────────────────
function AdminEventCard({ event, matches, onAddMatch, onDeleteMatch, onEditMatch, onDeleteEvent, onEditEvent }: {
  event: SportEvent; matches: MatchResult[];
  onAddMatch: (m: MatchResult) => void;
  onDeleteMatch: (id: string) => void;
  onEditMatch: (m: MatchResult) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (e: SportEvent) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchResult | null>(null);
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventDraft, setEventDraft] = useState(event);
  const isTrack = event.type === "track";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
        {editingEvent ? (
          <div className="flex-1 grid grid-cols-2 gap-2 mr-2">
            <input value={eventDraft.name} onChange={e => setEventDraft(d => ({ ...d, name: e.target.value }))}
              className="text-sm border border-slate-200 rounded px-2 py-1" placeholder="ชื่อกีฬา" />
            <input value={eventDraft.category} onChange={e => setEventDraft(d => ({ ...d, category: e.target.value }))}
              className="text-sm border border-slate-200 rounded px-2 py-1" placeholder="ชาย/หญิง" />
            <select value={eventDraft.type} onChange={e => setEventDraft(d => ({ ...d, type: e.target.value }))}
              className="text-sm border border-slate-200 rounded px-2 py-1 col-span-2">
              <option value="ball">ฟุตบอล/ฟุตซอล</option>
              <option value="net">วอลเลย์/ตะกร้อ</option>
              <option value="target">เปตอง</option>
              <option value="track">กรีฑา</option>
            </select>
          </div>
        ) : (
          <div>
            <span className="font-bold text-slate-800">{event.name}</span>
            <span className="ml-2 text-xs bg-slate-200 text-slate-600 rounded px-1.5 py-0.5">{event.category}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {editingEvent ? (
            <>
              <button onClick={() => { onEditEvent(eventDraft); setEditingEvent(false); }}
                className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => { setEventDraft(event); setEditingEvent(false); }}
                className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-3.5 w-3.5" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditingEvent(true)} className="p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => { if(window.confirm("ลบรายการแข่งขันนี้?")) onDeleteEvent(event.id); }}
                className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 border border-red-200"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        {matches.length === 0 && !showForm && (
          <p className="text-xs text-slate-400 text-center py-2">ยังไม่มีผลการแข่งขัน</p>
        )}
        {matches.map(m => (
          <div key={m.id}>
            {editingMatch?.id === m.id ? (
              <MatchForm eventId={event.id} isTrack={isTrack}
                initial={editingMatch}
                otherMatches={matches.filter(x => x.id !== m.id)}
                onSave={(updated) => { onEditMatch(updated); setEditingMatch(null); }}
                onCancel={() => setEditingMatch(null)} />
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1"><MatchHighlight match={m} /></div>
                <div className="flex flex-col gap-1 pt-1">
                  <button onClick={() => { setEditingMatch(m); setShowForm(false); }}
                    className="p-1.5 rounded bg-indigo-50 text-indigo-500 hover:bg-indigo-100 border border-indigo-200"><Edit2 className="h-3 w-3" /></button>
                  <button onClick={() => { if(window.confirm("ลบผลนัดนี้?")) onDeleteMatch(m.id); }}
                    className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 border border-red-200"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showForm && !editingMatch && (
          <MatchForm eventId={event.id} isTrack={isTrack}
            otherMatches={matches}
            onSave={(m) => { onAddMatch(m); setShowForm(false); }}
            onCancel={() => setShowForm(false)} />
        )}

        {!showForm && !editingMatch && (
          <button onClick={() => setShowForm(true)}
            className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 border border-dashed border-indigo-300 rounded-lg py-2 hover:bg-indigo-50 transition">
            <Plus className="h-3.5 w-3.5" /> เพิ่มผลการแข่งขัน
          </button>
        )}
      </div>
    </div>
  );
}

// ── Schedule Form (admin add/edit) ──────────────────────────────────────────────
function ScheduleForm({ initial, onSave, onCancel }: {
  initial?: ScheduleItem; onSave: (s: ScheduleItem) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<ScheduleItem>(initial ?? { id: uid(), date: "", time: "", event: "", location: "" });
  const set = (k: keyof ScheduleItem, v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.date.trim() && form.event.trim();

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">วันที่</label>
          <input value={form.date} onChange={e => set("date", e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น 10 มิ.ย. 2569" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">เวลา</label>
          <input value={form.time} onChange={e => set("time", e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น 09:00" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อรายการ</label>
        <input value={form.event} onChange={e => set("event", e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น ฟุตซอล ชาย (รอบรองชนะเลิศ)" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">สถานที่</label>
        <input value={form.location} onChange={e => set("location", e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น โรงยิมเนเซียม" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => valid && onSave(form)} disabled={!valid}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 ${valid ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
          <Check className="h-4 w-4" /> บันทึก
        </button>
        <button onClick={onCancel} className="flex-1 text-sm font-medium py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">ยกเลิก</button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function SportsDayApp() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [events, setEvents] = useState<SportEvent[]>(INITIAL_EVENTS);
  const [matches, setMatches] = useState<MatchResult[]>(INITIAL_MATCHES);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<SportEvent,"id">>({ name:"", category:"ชาย", type:"ball" });

  // Schedule admin states
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    const init = async () => { try { await signInAnonymously(auth); } catch(e) { console.error(e); setLoading(false); } };
    init();
    return onAuthStateChanged(auth, u => { setUser(u); if (!u) setLoading(false); });
  }, []);

  // Sync events
  useEffect(() => {
    if (!user) return;

    const ref = EVENTS_REF();

    return onSnapshot(ref, snap => {
      if (!snap.exists()) {
        // แสดงค่าเริ่มต้นเฉย ๆ แต่ไม่เขียนทับ Firestore อัตโนมัติ
        setEvents(INITIAL_EVENTS);
        setLoading(false);
        return;
      }

      const data = snap.data();

      if (data && Array.isArray(data.list)) {
        setEvents(data.list);
      } else {
        setEvents(INITIAL_EVENTS);
      }

      setLoading(false);
    }, e => {
      console.error(e);
      alert("โหลดรายการกีฬาจากฐานข้อมูลไม่สำเร็จ");
      setEvents(INITIAL_EVENTS);
      setLoading(false);
    });
  }, [user]);

  // Sync matches
  useEffect(() => {
    if (!user) return;

    const ref = MATCHES_REF();

    return onSnapshot(ref, snap => {
      if (!snap.exists()) {
        // ไม่มีเอกสาร = ยังไม่มีผลการแข่งขัน
        // สำคัญ: ห้าม setDoc({ list: [] }) อัตโนมัติ เพราะอาจล้างผลเดิมได้
        setMatches([]);
        return;
      }

      const data = snap.data();

      if (data && Array.isArray(data.list)) {
        // normalize old data shape (medal -> medalA) if present
        const normalized: MatchResult[] = data.list.map((m: any) => ({
          id: m.id ?? uid(),
          eventId: m.eventId ?? "",
          round: m.round ?? "",
          isMedalRound: !!m.isMedalRound,
          teamA: m.teamA ?? "",
          teamB: m.teamB ?? "",
          scoreA: m.scoreA ?? "",
          scoreB: m.scoreB ?? "",
          note: m.note ?? "",
          medalA: m.medalA ?? m.medal ?? "",
          medalB: m.medalB ?? "",
        }));

        setMatches(normalized);
      } else {
        setMatches([]);
      }
    }, e => {
      console.error(e);
      alert("โหลดผลการแข่งขันจากฐานข้อมูลไม่สำเร็จ");
    });
  }, [user]);

  // Sync schedule
  useEffect(() => {
    if (!user) return;

    const ref = SCHEDULE_REF();

    return onSnapshot(ref, snap => {
      if (!snap.exists()) {
        // แสดงค่าเริ่มต้นเฉย ๆ แต่ไม่เขียนทับ Firestore อัตโนมัติ
        setSchedule(INITIAL_SCHEDULE);
        return;
      }

      const data = snap.data();

      if (data && Array.isArray(data.list)) {
        setSchedule(data.list);
      } else {
        setSchedule(INITIAL_SCHEDULE);
      }
    }, e => {
      console.error(e);
      alert("โหลดตารางแข่งขันจากฐานข้อมูลไม่สำเร็จ");
      setSchedule(INITIAL_SCHEDULE);
    });
  }, [user]);

  const saveEvents = async (list: SportEvent[]) => {
    try {
      await setDoc(EVENTS_REF(), {
        list,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch(e) {
      console.error(e);
      alert("บันทึกรายการกีฬาไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตหรือ Firestore Rules");
    }
  };

  const saveMatches = async (list: MatchResult[]) => {
    try {
      await setDoc(MATCHES_REF(), {
        list,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch(e) {
      console.error(e);
      alert("บันทึกผลการแข่งขันไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตหรือ Firestore Rules");
    }
  };

  const saveSchedule = async (list: ScheduleItem[]) => {
    try {
      await setDoc(SCHEDULE_REF(), {
        list,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch(e) {
      console.error(e);
      alert("บันทึกตารางไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตหรือ Firestore Rules");
    }
  };

  // Compute scores: count medals from both teamA and teamB sides
  const scores = (() => {
    const s: Record<string, TeamScore> = Object.fromEntries(
      Object.entries(TEAMS).map(([k,v]) => [k, { ...v, gold:0, silver:0, bronze:0 }])
    );
    matches.forEach(m => {
      if (!m.isMedalRound) return;
      if (m.medalA && m.teamA && s[m.teamA]) {
        if (m.medalA === "gold") s[m.teamA].gold++;
        else if (m.medalA === "silver") s[m.teamA].silver++;
        else if (m.medalA === "bronze") s[m.teamA].bronze++;
      }
      if (m.medalB && m.teamB && s[m.teamB]) {
        if (m.medalB === "gold") s[m.teamB].gold++;
        else if (m.medalB === "silver") s[m.teamB].silver++;
        else if (m.medalB === "bronze") s[m.teamB].bronze++;
      }
    });
    return s;
  })();

  const pts = (t: TeamScore) => t.gold*5 + t.silver*3 + t.bronze*1;
  const ranked = Object.values(scores).sort((a,b) => pts(b)-pts(a) || b.gold-a.gold || b.silver-a.silver);

  const filteredEvents = filterType==="all" ? events : events.filter(e => e.type===filterType);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode==="2569") { setIsAdmin(true); setShowLogin(false); setPinCode(""); setLoginError(""); }
    else setLoginError("รหัสผ่านไม่ถูกต้อง");
  };

  const handleAddEvent = () => {
    if (!newEvent.name.trim()) return;
    const e: SportEvent = { ...newEvent, id: `e_${Date.now()}` };
    saveEvents([...events, e]);
    setNewEvent({ name:"", category:"ชาย", type:"ball" });
    setShowAddEvent(false);
  };

  // Schedule handlers
  const handleAddSchedule = (item: ScheduleItem) => {
    saveSchedule([...schedule, item]);
    setShowAddSchedule(false);
  };
  const handleEditSchedule = (updated: ScheduleItem) => {
    saveSchedule(schedule.map(s => s.id === updated.id ? updated : s));
    setEditingScheduleId(null);
  };
  const handleDeleteSchedule = (id: string) => {
    if (!window.confirm("ลบรายการนี้?")) return;
    saveSchedule(schedule.filter(s => s.id !== id));
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
      <p className="text-slate-500 font-medium">กำลังเชื่อมต่อระบบฐานข้อมูล KTIC...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2.5 rounded-xl"><Trophy className="h-7 w-7 text-yellow-500" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">ระบบกีฬาสี KTIC 2569</h1>
              <p className="text-indigo-200 text-xs">วิทยาลัยการอาชีพคลองท่อม (6-10 มิ.ย. 69)</p>
            </div>
          </div>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)}
            className={`mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isAdmin ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/20"}`}>
            {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isAdmin ? "ออกจากระบบกรรมการ" : "โหมดกรรมการ"}
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 mt-2 flex space-x-1 overflow-x-auto pb-0">
          {[{ k:"overview", l:"สรุปเหรียญ", ic:<Trophy className="h-4 w-4"/> },
            { k:"events", l:"ผลการแข่งขัน", ic:<Flag className="h-4 w-4"/> },
            { k:"schedule", l:"ตารางแข่งขัน", ic:<Calendar className="h-4 w-4"/> },
            { k:"admin", l:"จัดการ (Admin)", ic:<Settings className="h-4 w-4"/> }]
            .map(t => (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium whitespace-nowrap transition ${activeTab===t.k ? "bg-slate-50 text-indigo-900" : "text-indigo-100 hover:bg-indigo-700"}`}>
                {t.ic}{t.l}
              </button>
            ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">

        {/* ── TAB: Overview ── */}
        {activeTab==="overview" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                เชื่อมต่อฐานข้อมูล KTIC
              </div>
              <span className="text-xs text-slate-500">{matches.filter(m=>m.isMedalRound&&(m.medalA||m.medalB)).length} รอบที่มีเหรียญ จาก {events.length} รายการ</span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-indigo-900">ตารางคะแนนรวม</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-b">
                      <th className="px-4 py-3 text-center w-12">อันดับ</th>
                      <th className="px-4 py-3 text-left">สี</th>
                      <th className="px-3 py-3 text-center bg-yellow-50/60"><span className="flex flex-col items-center"><Medal className="h-4 w-4 text-yellow-500 mb-0.5"/>ทอง (5)</span></th>
                      <th className="px-3 py-3 text-center"><span className="flex flex-col items-center"><Medal className="h-4 w-4 text-slate-400 mb-0.5"/>เงิน (3)</span></th>
                      <th className="px-3 py-3 text-center bg-orange-50/60"><span className="flex flex-col items-center"><Medal className="h-4 w-4 text-orange-400 mb-0.5"/>ทองแดง (1)</span></th>
                      <th className="px-4 py-3 text-center font-bold text-indigo-700">คะแนน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((t,i) => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${i===0?"bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400":i===1?"bg-slate-200 text-slate-700":i===2?"bg-orange-100 text-orange-700":"bg-gray-100 text-gray-500"}`}>{i+1}</span>
                        </td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${t.color}`}/><span className={`font-bold ${t.text}`}>{t.name}</span></div></td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700 bg-yellow-50/30">{t.gold}</td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700">{t.silver}</td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700 bg-orange-50/30">{t.bronze}</td>
                        <td className="px-4 py-3 text-center font-black text-indigo-600 text-xl">{pts(t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ranked.map(t => (
                <div key={t.id} className={`bg-white rounded-xl border-t-4 ${t.border} p-4 text-center shadow-sm`}>
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1.5 ${t.color}`}/>
                  <div className={`font-bold text-sm ${t.text}`}>{t.name}</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{pts(t)}<span className="text-xs font-normal text-slate-400 ml-1">pts</span></div>
                  <div className="flex justify-center gap-2 mt-1 text-xs text-slate-500">
                    <span>🥇{t.gold}</span><span>🥈{t.silver}</span><span>🥉{t.bronze}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Events (Student view) ── */}
        {activeTab==="events" && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[["all","ทั้งหมด"],["ball","⚽ ฟุตบอล/ฟุตซอล"],["net","🏐 วอลเลย์/ตะกร้อ"],["target","🎯 เปตอง"],["track","🏃 กรีฑา"]].map(([k,l]) => (
                <button key={k} onClick={() => setFilterType(k)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${filterType===k ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>{l}</button>
              ))}
            </div>

            {filterType==="all"
              ? Object.entries(TYPE_LABELS).map(([type, label]) => {
                  const evs = events.filter(e => e.type===type);
                  if (!evs.length) return null;
                  return (
                    <div key={type}>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</h3>
                      <div className="space-y-2">
                        {evs.map(ev => <EventCard key={ev.id} event={ev} matches={matches.filter(m=>m.eventId===ev.id)} />)}
                      </div>
                    </div>
                  );
                })
              : <div className="space-y-2">{filteredEvents.map(ev => <EventCard key={ev.id} event={ev} matches={matches.filter(m=>m.eventId===ev.id)} />)}</div>
            }
          </div>
        )}

        {/* ── TAB: Schedule ── */}
        {activeTab==="schedule" && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">กรรมการสามารถเพิ่ม/แก้ไข/ลบรายการได้</p>
                <button onClick={() => { setShowAddSchedule(v => !v); setEditingScheduleId(null); }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  <Plus className="h-4 w-4"/> เพิ่มรายการ
                </button>
              </div>
            )}

            {isAdmin && showAddSchedule && (
              <ScheduleForm onSave={handleAddSchedule} onCancel={() => setShowAddSchedule(false)} />
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" /> ตารางการแข่งขันกีฬาสี
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {schedule.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">ยังไม่มีรายการแข่งขัน</div>
                )}
                {schedule.map(item => (
                  <div key={item.id} className="p-4 sm:p-5">
                    {editingScheduleId === item.id ? (
                      <ScheduleForm initial={item} onSave={handleEditSchedule} onCancel={() => setEditingScheduleId(null)} />
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 hover:bg-slate-50 transition rounded-lg p-1">
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
                            <button onClick={() => { setEditingScheduleId(item.id); setShowAddSchedule(false); }}
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
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Admin ── */}
        {activeTab==="admin" && (
          <div className="space-y-4">
            {!isAdmin ? (
              <div className="bg-white rounded-xl border border-amber-200 p-8 text-center shadow-sm">
                <Lock className="h-10 w-10 text-amber-400 mx-auto mb-3"/>
                <h3 className="font-bold text-slate-700 mb-1">ต้องเข้าสู่ระบบกรรมการก่อน</h3>
                <p className="text-sm text-slate-500 mb-4">กดปุ่ม "โหมดกรรมการ" ด้านบนขวา</p>
                <button onClick={() => setShowLogin(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">เข้าสู่ระบบ</button>
              </div>
            ) : (
              <>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="font-semibold text-indigo-900">โหมดกรรมการ — จัดการรายการแข่งขันและบันทึกผล</p>
                    <p className="text-sm text-indigo-700 mt-0.5">เพิ่ม/แก้ไข/ลบรายการ และกรอกผลแต่ละรอบได้ที่นี่ ถ้าเป็นรอบเหรียญ สามารถเลือกเหรียญของทั้งสองทีมเอง (ผู้แพ้ได้เงิน/ทองแดง/ไม่มีเหรียญ)</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-slate-700">รายการแข่งขันทั้งหมด ({events.length})</h2>
                  <button onClick={() => setShowAddEvent(v => !v)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                    <Plus className="h-4 w-4"/> เพิ่มรายการ
                  </button>
                </div>

                {showAddEvent && (
                  <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm space-y-3">
                    <h3 className="font-semibold text-indigo-800 text-sm">เพิ่มรายการแข่งขันใหม่</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-500 mb-1 block">ชื่อกีฬา</label>
                        <input value={newEvent.name} onChange={e => setNewEvent(n=>({...n,name:e.target.value}))}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="เช่น ฟุตบอล 11 คน"/>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">หมวด</label>
                        <input value={newEvent.category} onChange={e => setNewEvent(n=>({...n,category:e.target.value}))}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" placeholder="ชาย/หญิง"/>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">ประเภท</label>
                        <select value={newEvent.type} onChange={e => setNewEvent(n=>({...n,type:e.target.value}))}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                          <option value="ball">ฟุตบอล/ฟุตซอล</option>
                          <option value="net">วอลเลย์/ตะกร้อ</option>
                          <option value="target">เปตอง</option>
                          <option value="track">กรีฑา</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddEvent} className="flex-1 bg-indigo-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1">
                        <Check className="h-4 w-4"/> บันทึก
                      </button>
                      <button onClick={() => setShowAddEvent(false)} className="flex-1 bg-slate-100 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-200">ยกเลิก</button>
                    </div>
                  </div>
                )}

                {Object.entries(TYPE_LABELS).map(([type, label]) => {
                  const evs = events.filter(e => e.type===type);
                  if (!evs.length) return null;
                  return (
                    <div key={type}>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</h3>
                      <div className="space-y-3">
                        {evs.map(ev => (
                          <AdminEventCard key={ev.id} event={ev}
                            matches={matches.filter(m => m.eventId===ev.id)}
                            onAddMatch={m => saveMatches([...matches, m])}
                            onDeleteMatch={id => saveMatches(matches.filter(m => m.id!==id))}
                            onEditMatch={updated => saveMatches(matches.map(m => m.id===updated.id ? updated : m))}
                            onDeleteEvent={id => saveEvents(events.filter(e => e.id!==id))}
                            onEditEvent={updated => saveEvents(events.map(e => e.id===updated.id ? updated : e))}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Settings className="h-5 w-5"/>เข้าสู่ระบบกรรมการ</h3>
              <button onClick={() => setShowLogin(false)} className="text-indigo-200 hover:text-white bg-indigo-700/50 rounded-full p-1.5">✕</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">รหัสผ่าน PIN 4 หลัก</label>
                  <input type="password" value={pinCode} onChange={e=>setPinCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-2xl tracking-[0.5em] text-center font-bold"
                    placeholder="****" maxLength={4} autoFocus/>
                  {loginError && <p className="mt-2 text-sm text-red-600 text-center">{loginError}</p>}
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  ยืนยัน <ArrowRight className="h-4 w-4"/>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
