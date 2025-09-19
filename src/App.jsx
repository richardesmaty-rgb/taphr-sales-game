import React, { useEffect, useMemo, useState } from 'react';
import { ensureAuth, logActivity, getLeaderboardSince } from './firebase';

const todayISO = () => new Date().toISOString().slice(0,10);
const uid = () => Math.random().toString(36).slice(2,9);
const xpForLevel = (level) => 100 + (level - 1) * 75;

const defaultQuests = [
  { id: uid(), title: "Prospecting call", points: 5, category: "Sales", emoji: "📞" },
  { id: uid(), title: "Book a meeting", points: 15, category: "Sales", emoji: "📅" },
  { id: uid(), title: "Send proposal/quote", points: 20, category: "Sales", emoji: "📨" },
  { id: uid(), title: "Close a deal", points: 75, category: "Sales", emoji: "🏁" },
  { id: uid(), title: "Source 5 candidates", points: 10, category: "Recruitment", emoji: "🧲" },
  { id: uid(), title: "Screen candidate", points: 10, category: "Recruitment", emoji: "🗣️" },
  { id: uid(), title: "Client intake call", points: 15, category: "Recruitment", emoji: "🎧" },
  { id: uid(), title: "Candidate submitted to client", points: 15, category: "Recruitment", emoji: "📤" },
  { id: uid(), title: "Offer accepted", points: 100, category: "Recruitment", emoji: "🤝" },
];

const defaultState = {
  quests: defaultQuests,
  history: [], xp: 0, level: 1, name: ""
};
const STORAGE_KEY = "sm-game-firebase-v1";

export default function App(){
  const [state,setState] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||defaultState; }catch{return defaultState;}
  });
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); },[state]);
  useEffect(()=>{ ensureAuth(state.name||'').catch(console.error); },[state.name]);

  const dateToday = todayISO();
  const historyToday = useMemo(()=> state.history.filter(h=>h.date===dateToday),[state.history]);

  async function completeQuest(q){
    const entry = {id:uid(),date:dateToday,title:q.title,points:q.points,emoji:q.emoji,timestamp:Date.now(),category:q.category};
    setState(s=>({...s, history:[entry,...s.history], xp:s.xp+q.points}));
    await logActivity({ title:q.title, points:q.points, category:q.category, dateISO:dateToday });
  }

  return <div className="p-6 max-w-3xl mx-auto">
    <h1 className="text-2xl font-bold mb-4">TAP‑HR Sales & Marketing Game</h1>
    <input className="border p-2 mb-4" placeholder="Your name" value={state.name} onChange={e=>setState(s=>({...s,name:e.target.value}))}/>
    <div className="grid gap-3">
      {state.quests.map(q=>(
        <div key={q.id} className="p-3 border rounded flex justify-between items-center">
          <span>{q.emoji} {q.title} ({q.points} pts)</span>
          <button onClick={()=>completeQuest(q)} className="px-3 py-1 bg-black text-white rounded">Complete</button>
        </div>
      ))}
    </div>
    <Leaderboard/>
  </div>;
}

function Leaderboard(){
  const [rows,setRows] = useState([]);
  useEffect(()=>{
    const start=new Date(); start.setDate(start.getDate()-7);
    getLeaderboardSince(start.toISOString().slice(0,10)).then(setRows);
  },[]);
  return <div className="mt-6">
    <h2 className="font-semibold mb-2">Leaderboard (Last 7 days)</h2>
    <ul>{rows.map((r,i)=><li key={r.uid}>{i+1}. {r.name||'—'} — {r.points} pts</li>)}</ul>
  </div>;
}