import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

const firebaseConfig = window.__FIREBASE_CONFIG__;
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function ensureAuth(displayName) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const cred = await signInAnonymously(auth);
          user = cred.user;
        }
        if (displayName && (!user.displayName || user.displayName !== displayName)) {
          await updateProfile(user, { displayName });
        }
        resolve(user);
      } catch (e) { reject(e); }
    });
  });
}

export async function logActivity({ title, points, category, dateISO }) {
  const user = auth.currentUser;
  if (!user) return;
  await addDoc(collection(db, 'activities'), {
    uid: user.uid,
    name: user.displayName || 'Anonymous',
    title, points, category,
    date: dateISO,
    createdAt: serverTimestamp(),
  });
}

export async function getLeaderboardSince(startISO) {
  const col = collection(db, 'activities');
  const q = query(col, where('date', '>=', startISO), orderBy('date'));
  const snap = await getDocs(q);
  const totals = new Map();
  snap.forEach(doc => {
    const { uid, name, points } = doc.data();
    const o = totals.get(uid) || { name, points:0 };
    o.points += points;
    totals.set(uid, o);
  });
  return Array.from(totals.entries()).map(([uid, o]) => ({ uid, name:o.name, points:o.points }))
    .sort((a,b)=>b.points-a.points).slice(0,50);
}
