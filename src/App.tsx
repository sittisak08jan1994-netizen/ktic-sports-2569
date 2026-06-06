import React, { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Lock,
  Unlock,
  Settings,
  AlertCircle,
  Calendar,
  Flag,
  ArrowRight,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// =========================================================================
// 1. Firebase Config ของวิทยาลัยการอาชีพคลองท่อม (ktic-sports-2569)
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyASnnjEXJgvCvOAgpONRNELgCUcGiFmS-w",
  authDomain: "ktic-sports-2569.firebaseapp.com",
  projectId: "ktic-sports-2569",
  storageBucket: "ktic-sports-2569.firebasestorage.app",
  messagingSenderId: "860695337439",
  appId: "1:860695337439:web:496db5a1ba444686080c6a"
};

// เริ่มต้นการเชื่อมต่อ Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ตำแหน่งเก็บข้อมูลใน Firestore Database
const getDbRef = () => {
  return doc(db, "ktic_sports", "2026_events_data");
};

// =========================================================================
// 2. ข้อมูลตั้งต้นของระบบ
// =========================================================================
const TEAMS = {
  red: {
    id: "red",
    name: "สีแดง",
    color: "bg-red-500",
    bgLight: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  blue: {
    id: "blue",
    name: "สีฟ้า",
    color: "bg-blue-500",
    bgLight: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  green: {
    id: "green",
    name: "สีเขียว",
    color: "bg-green-500",
    bgLight: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  yellow: {
    id: "yellow",
    name: "สีเหลือง",
    color: "bg-yellow-500",
    bgLight: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
};

const INITIAL_EVENTS = [
  {
    id: "fb7_m",
    name: "ฟุตบอล 7 คน",
    category: "ชาย",
    type: "ball",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "fs_m",
    name: "ฟุตซอล",
    category: "ชาย",
    type: "ball",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "fs_w",
    name: "ฟุตซอล",
    category: "หญิง",
    type: "ball",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "tk_m",
    name: "เซปักตะกร้อ",
    category: "ชาย",
    type: "net",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "tk_w",
    name: "เซปักตะกร้อ",
    category: "หญิง",
    type: "net",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "vb_m",
    name: "วอลเลย์บอล",
    category: "ชาย",
    type: "net",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "vb_w",
    name: "วอลเลย์บอล",
    category: "หญิง",
    type: "net",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "pt_m",
    name: "เปตอง",
    category: "ทีมชาย",
    type: "target",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "pt_w",
    name: "เปตอง",
    category: "ทีมหญิง",
    type: "target",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r100_m",
    name: "กรีฑา 100 เมตร",
    category: "ชาย",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r100_w",
    name: "กรีฑา 100 เมตร",
    category: "หญิง",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r200_m",
    name: "กรีฑา 200 เมตร",
    category: "ชาย",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r200_w",
    name: "กรีฑา 200 เมตร",
    category: "หญิง",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r400_m",
    name: "กรีฑา 400 เมตร",
    category: "ชาย",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r400_w",
    name: "กรีฑา 400 เมตร",
    category: "หญิง",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r800_m",
    name: "กรีฑา 800 เมตร",
    category: "ชาย",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r800_w",
    name: "กรีฑา 800 เมตร",
    category: "หญิง",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r4x100_m",
    name: "กรีฑา ผลัด 4x100 เมตร",
    category: "ชาย",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r4x100_w",
    name: "กรีฑา ผลัด 4x100 เมตร",
    category: "หญิง",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r4x400_m",
    name: "กรีฑา ผลัด 4x400 เมตร",
    category: "ชาย",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
  {
    id: "r4x400_w",
    name: "กรีฑา ผลัด 4x400 เมตร",
    category: "หญิง",
    type: "track",
    status: "pending",
    results: { gold: null, silver: null, bronze: null },
  },
];

const MOCK_SCHEDULE = [
  {
    date: "6 มิ.ย. 2569",
    time: "08:30",
    event: "พิธีเปิดการแข่งขันกีฬาสี ประจำปี 2569",
    location: "สนามกีฬากลาง",
  },
  {
    date: "6 มิ.ย. 2569",
    time: "10:00",
    event: "ฟุตบอล 7 คน (รอบคัดเลือก)",
    location: "สนามฟุตบอล 1",
  },
  {
    date: "6 มิ.ย. 2569",
    time: "13:00",
    event: "เซปักตะกร้อ ชาย/หญิง (รอบคัดเลือก)",
    location: "ลานกีฬาอเนกประสงค์",
  },
  {
    date: "7 มิ.ย. 2569",
    time: "09:00",
    event: "วอลเลย์บอล ชาย/หญิง (รอบแรก)",
    location: "โรงยิมเนเซียม",
  },
  {
    date: "7 มิ.ย. 2569",
    time: "13:30",
    event: "เปตอง ชาย/หญิง (รอบแรก-ชิงชนะเลิศ)",
    location: "สนามเปตอง",
  },
  {
    date: "8 มิ.ย. 2569",
    time: "09:00",
    event: "ฟุตซอล ชาย/หญิง (รอบคัดเลือก)",
    location: "โรงยิมเนเซียม",
  },
  {
    date: "9 มิ.ย. 2569",
    time: "09:00",
    event: "กรีฑา 100m, 200m (รอบคัดเลือก)",
    location: "ลู่วิ่งสนามกลาง",
  },
  {
    date: "9 มิ.ย. 2569",
    time: "13:00",
    event: "กรีฑา 400m, 800m (ชิงชนะเลิศ)",
    location: "ลู่วิ่งสนามกลาง",
  },
  {
    date: "10 มิ.ย. 2569",
    time: "09:00",
    event: "ฟุตบอล / ฟุตซอล (ชิงชนะเลิศ)",
    location: "สนามฟุตบอล/โรงยิม",
  },
  {
    date: "10 มิ.ย. 2569",
    time: "13:00",
    event: "กรีฑา ผลัด 4x100m, 4x400m (ชิงชนะเลิศ)",
    location: "ลู่วิ่งสนามกลาง",
  },
  {
    date: "10 มิ.ย. 2569",
    time: "15:30",
    event: "พิธีปิดและมอบถ้วยรางวัลรวม",
    location: "สนามกีฬากลาง",
  },
];

export default function SportsDayApp() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [calculatedScores, setCalculatedScores] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  // ระบบล็อกอินอัตโนมัติเพื่อให้ทุกคนอ่านข้อมูลได้
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ระบบซิงค์ข้อมูลคะแนนเรียลไทม์
  useEffect(() => {
    if (!user) return;

    const docRef = getDbRef();
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setEvents(docSnap.data().eventsList);
        } else {
          // ถ้ายังไม่มีข้อมูลในฐานข้อมูล ให้สร้างข้อมูลเริ่มต้น
          setDoc(docRef, { eventsList: INITIAL_EVENTS }, { merge: true });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Subscribe Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ระบบคำนวณคะแนนรวมอัตโนมัติ
  useEffect(() => {
    const newScores = {
      red: { ...TEAMS.red, gold: 0, silver: 0, bronze: 0 },
      blue: { ...TEAMS.blue, gold: 0, silver: 0, bronze: 0 },
      green: { ...TEAMS.green, gold: 0, silver: 0, bronze: 0 },
      yellow: { ...TEAMS.yellow, gold: 0, silver: 0, bronze: 0 },
    };

    events.forEach((event) => {
      if (event.results.gold && newScores[event.results.gold])
        newScores[event.results.gold].gold += 1;
      if (event.results.silver && newScores[event.results.silver])
        newScores[event.results.silver].silver += 1;
      if (event.results.bronze && newScores[event.results.bronze])
        newScores[event.results.bronze].bronze += 1;
    });

    setCalculatedScores(newScores);
  }, [events]);

  // ฟังก์ชันอัปเดตเหรียญรางวัล
  const handleUpdateEventResult = async (eventId, medalType, teamId) => {
    if (!isAdmin || !user) return;

    const updatedEvents = events.map((ev) => {
      if (ev.id === eventId) {
        const newTeamId = ev.results[medalType] === teamId ? null : teamId;
        return {
          ...ev,
          status: "completed",
          results: { ...ev.results, [medalType]: newTeamId },
        };
      }
      return ev;
    });

    const finalEvents = updatedEvents.map((ev) => {
      if (
        ev.id === eventId &&
        !ev.results.gold &&
        !ev.results.silver &&
        !ev.results.bronze
      ) {
        return { ...ev, status: "pending" };
      }
      return ev;
    });

    setEvents(finalEvents);

    try {
      const docRef = getDbRef();
      await setDoc(docRef, { eventsList: finalEvents }, { merge: true });
    } catch (err) {
      console.error("Update Error:", err);
      alert(
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล โปรดตรวจสอบการตั้งค่า Firestore Rules"
      );
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinCode === "2569") {
      // รหัสผ่านกรรมการ (แก้ได้ตามต้องการ)
      setIsAdmin(true);
      setShowLogin(false);
      setPinCode("");
      setLoginError("");
    } else {
      setLoginError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  const calculateTotalPoints = (team) => {
    return team.gold * 5 + team.silver * 3 + team.bronze * 1; // ทอง=5, เงิน=3, ทองแดง=1
  };

  const rankedTeams = Object.values(calculatedScores).sort((a, b) => {
    const scoreA = calculateTotalPoints(a);
    const scoreB = calculateTotalPoints(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    if (b.gold !== a.gold) return b.gold - a.gold;
    return b.silver - a.silver;
  });

  const filteredEvents =
    filterType === "all" ? events : events.filter((e) => e.type === filterType);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">
          กำลังเชื่อมต่อระบบฐานข้อมูล KTIC...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* App Header */}
      <header className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2.5 rounded-xl shadow-inner">
              <Trophy className="h-7 w-7 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight">
                ระบบกีฬาสี KTIC 2569
              </h1>
              <p className="text-indigo-200 text-xs md:text-sm">
                วิทยาลัยการอาชีพคลองท่อม (6-10 มิ.ย. 69)
              </p>
            </div>
          </div>
          <button
            onClick={() => (isAdmin ? setIsAdmin(false) : setShowLogin(true))}
            className={`mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
              isAdmin
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            }`}
          >
            {isAdmin ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span>{isAdmin ? "ออกจากระบบกรรมการ" : "โหมดกรรมการ"}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex space-x-1 overflow-x-auto pb-0 scrollbar-hide">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === "overview"
                ? "bg-slate-50 text-indigo-900 shadow-sm"
                : "text-indigo-100 hover:bg-indigo-700"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>สรุปเหรียญ</span>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === "events"
                ? "bg-slate-50 text-indigo-900 shadow-sm"
                : "text-indigo-100 hover:bg-indigo-700"
            }`}
          >
            <Flag className="h-4 w-4" />
            <span>ผลการแข่งขัน</span>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === "schedule"
                ? "bg-slate-50 text-indigo-900 shadow-sm"
                : "text-indigo-100 hover:bg-indigo-700"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>ตารางแข่งขัน</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span>เชื่อมต่อฐานข้อมูล KTIC เรียบร้อย</span>
              </div>
              <div className="text-xs text-slate-500">
                ประมวลผลจาก{" "}
                {events.filter((e) => e.status === "completed").length} /{" "}
                {events.length} รายการ
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                <h2 className="text-lg font-bold text-indigo-900">
                  ตารางอันดับคะแนนรวม
                </h2>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                      <th className="px-6 py-4 font-medium w-16 text-center">
                        อันดับ
                      </th>
                      <th className="px-6 py-4 font-medium">สี</th>
                      <th className="px-4 py-4 font-medium text-center bg-yellow-50/50">
                        <span className="flex flex-col items-center justify-center">
                          <Medal className="h-4 w-4 text-yellow-500 mb-1" /> ทอง
                          (5)
                        </span>
                      </th>
                      <th className="px-4 py-4 font-medium text-center bg-slate-50">
                        <span className="flex flex-col items-center justify-center">
                          <Medal className="h-4 w-4 text-slate-400 mb-1" /> เงิน
                          (3)
                        </span>
                      </th>
                      <th className="px-4 py-4 font-medium text-center bg-orange-50/50">
                        <span className="flex flex-col items-center justify-center">
                          <Medal className="h-4 w-4 text-orange-500 mb-1" />{" "}
                          ทองแดง (1)
                        </span>
                      </th>
                      <th className="px-6 py-4 font-bold text-center text-indigo-700 bg-indigo-50/30">
                        คะแนนรวม
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedTeams.map((team, index) => (
                      <tr
                        key={team.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400"
                                : index === 1
                                ? "bg-slate-200 text-slate-700"
                                : index === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-5 h-5 rounded-md shadow-sm ${team.color}`}
                            ></div>
                            <span className={`font-bold text-lg ${team.text}`}>
                              {team.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-lg bg-yellow-50/30">
                          {team.gold}
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-lg">
                          {team.silver}
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-lg bg-orange-50/30">
                          {team.bronze}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-indigo-600 text-2xl bg-indigo-50/20">
                          {calculateTotalPoints(team)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rankedTeams.map((team) => (
                <div
                  key={`card-${team.id}`}
                  className={`bg-white rounded-xl shadow-sm border-t-4 ${team.border} p-4 flex flex-col items-center justify-center`}
                >
                  <div
                    className={`w-3 h-3 rounded-full mb-2 ${team.color}`}
                  ></div>
                  <span className="font-bold text-slate-800 mb-1">
                    {team.name}
                  </span>
                  <span className="text-2xl font-black text-slate-800">
                    {calculateTotalPoints(team)}{" "}
                    <span className="text-xs text-slate-500 font-normal">
                      pts
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Events */}
        {activeTab === "events" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {isAdmin && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start shadow-sm">
                <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-indigo-900">
                    โหมดบันทึกผลการแข่งขัน (ระบบเชื่อมต่อฐานข้อมูลแล้ว)
                  </h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    คลิกเลือกสีที่ได้รับเหรียญ
                    ระบบจะบันทึกลงฐานข้อมูลและคำนวณคะแนนรวมอัตโนมัติให้ทุกคนเห็นตรงกัน
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  filterType === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterType("track")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  filterType === "track"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                กรีฑา
              </button>
              <button
                onClick={() => setFilterType("ball")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  filterType === "ball"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                ฟุตบอล/ฟุตซอล
              </button>
              <button
                onClick={() => setFilterType("net")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  filterType === "net"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                วอลเลย์/ตะกร้อ
              </button>
              <button
                onClick={() => setFilterType("target")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  filterType === "target"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                เปตอง
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl shadow-sm border ${
                    event.status === "completed"
                      ? "border-green-200"
                      : "border-slate-200"
                  } p-5 hover:shadow-md transition`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        {event.name}
                      </h3>
                      <div className="flex space-x-2 mt-1.5">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                          {event.category}
                        </span>
                      </div>
                    </div>
                    {event.status === "completed" ? (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-md flex items-center">
                        ✓ มีผลการแข่งขัน
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium rounded-md">
                        รอแข่ง
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {/* Gold */}
                    <div className="flex items-center">
                      <div className="w-20 flex items-center text-sm font-bold text-slate-700 bg-yellow-100/50 py-1.5 px-2 rounded-l border-y border-l border-yellow-200">
                        <Medal className="h-4 w-4 text-yellow-500 mr-1.5" /> ทอง
                      </div>
                      <div className="flex-1 flex bg-white border border-yellow-200 rounded-r overflow-hidden">
                        {Object.values(TEAMS).map((team) => (
                          <button
                            key={`${event.id}-gold-${team.id}`}
                            disabled={!isAdmin}
                            onClick={() =>
                              handleUpdateEventResult(event.id, "gold", team.id)
                            }
                            className={`flex-1 h-9 text-xs font-bold transition-all border-r border-slate-100 last:border-r-0 ${
                              event.results.gold === team.id
                                ? `${team.color} text-white`
                                : isAdmin
                                ? `bg-transparent text-slate-400 hover:${team.bgLight} hover:${team.text}`
                                : "bg-transparent text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            {event.results.gold === team.id
                              ? team.name
                              : isAdmin
                              ? "เลือก"
                              : "-"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Silver */}
                    <div className="flex items-center">
                      <div className="w-20 flex items-center text-sm font-bold text-slate-700 bg-slate-200/50 py-1.5 px-2 rounded-l border-y border-l border-slate-300">
                        <Medal className="h-4 w-4 text-slate-500 mr-1.5" /> เงิน
                      </div>
                      <div className="flex-1 flex bg-white border border-slate-300 rounded-r overflow-hidden">
                        {Object.values(TEAMS).map((team) => (
                          <button
                            key={`${event.id}-silver-${team.id}`}
                            disabled={!isAdmin}
                            onClick={() =>
                              handleUpdateEventResult(
                                event.id,
                                "silver",
                                team.id
                              )
                            }
                            className={`flex-1 h-9 text-xs font-bold transition-all border-r border-slate-100 last:border-r-0 ${
                              event.results.silver === team.id
                                ? `${team.color} text-white`
                                : isAdmin
                                ? `bg-transparent text-slate-400 hover:${team.bgLight} hover:${team.text}`
                                : "bg-transparent text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            {event.results.silver === team.id
                              ? team.name
                              : isAdmin
                              ? "เลือก"
                              : "-"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Bronze */}
                    <div className="flex items-center">
                      <div className="w-20 flex items-center text-sm font-bold text-slate-700 bg-orange-100/50 py-1.5 px-2 rounded-l border-y border-l border-orange-200">
                        <Medal className="h-4 w-4 text-orange-500 mr-1.5" />{" "}
                        ทองแดง
                      </div>
                      <div className="flex-1 flex bg-white border border-orange-200 rounded-r overflow-hidden">
                        {Object.values(TEAMS).map((team) => (
                          <button
                            key={`${event.id}-bronze-${team.id}`}
                            disabled={!isAdmin}
                            onClick={() =>
                              handleUpdateEventResult(
                                event.id,
                                "bronze",
                                team.id
                              )
                            }
                            className={`flex-1 h-9 text-xs font-bold transition-all border-r border-slate-100 last:border-r-0 ${
                              event.results.bronze === team.id
                                ? `${team.color} text-white`
                                : isAdmin
                                ? `bg-transparent text-slate-400 hover:${team.bgLight} hover:${team.text}`
                                : "bg-transparent text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            {event.results.bronze === team.id
                              ? team.name
                              : isAdmin
                              ? "เลือก"
                              : "-"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Schedule */}
        {activeTab === "schedule" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
            <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600" />{" "}
                ตารางการแข่งขันกีฬาสี
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_SCHEDULE.map((item, index) => (
                <div
                  key={index}
                  className="p-4 sm:p-6 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
                >
                  <div className="md:w-40 flex-shrink-0 flex md:flex-col gap-2 md:gap-0">
                    <div className="font-bold text-slate-800">{item.date}</div>
                    <div className="text-indigo-600 font-semibold">
                      {item.time} น.
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">
                      {item.event}
                    </h4>
                  </div>
                  <div className="md:w-48 flex-shrink-0">
                    <span className="inline-flex items-center text-sm text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg w-full md:w-auto justify-center md:justify-start">
                      📍 {item.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>เข้าสู่ระบบจัดการสำหรับกรรมการ</span>
              </h3>
              <button
                onClick={() => setShowLogin(false)}
                className="text-indigo-200 hover:text-white transition bg-indigo-700/50 hover:bg-indigo-700 rounded-full p-1.5"
              >
                ✕
              </button>
            </div>
            <div className="p-6 md:p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    รหัสผ่าน (PIN 4 หลัก)
                  </label>
                  <input
                    type="password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-2xl tracking-[0.5em] text-center font-bold"
                    placeholder="****"
                    maxLength={4}
                    autoFocus
                  />
                  <div className="mt-3 text-xs text-slate-500 text-center bg-slate-100 p-2 rounded-lg">
                    รหัสสำหรับทดสอบระบบคือ:{" "}
                    <strong className="text-slate-800 text-sm tracking-wider">
                      2569
                    </strong>
                  </div>
                  {loginError && (
                    <div className="mt-4 text-sm text-red-600 flex items-center justify-center space-x-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">{loginError}</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2"
                >
                  <span>ยืนยันเพื่อเข้าสู่ระบบ</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
