// estradiol.js — Ctrl+Alt+E to toggle pink mode (syncs to Firebase)
import { auth, db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';

const LS_KEY = 'nivelato-estradiol';
let enabled = false;
let keyBuffer = '';
let currentUserId = null;

function applyTheme(state) {
  enabled = state;
  document.body.classList.toggle('estradiol-mode', state);
  localStorage.setItem(LS_KEY, state ? '1' : '0');
}

async function saveToFirebase(state) {
  if (!currentUserId) return;
  try {
    await updateDoc(doc(db, 'users', currentUserId), { 'settings.estradiol': state });
  } catch (e) { /* theme still works locally */ }
}

async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const d = snap.data();
      if (d.settings && typeof d.settings.estradiol === 'boolean') {
        applyTheme(d.settings.estradiol);
        return true;
      }
    }
  } catch (e) { /* fall through to localStorage */ }
  return false;
}

function loadFromLocal() {
  if (localStorage.getItem(LS_KEY) === '1') applyTheme(true);
}

async function toggle() {
  const next = !enabled;
  applyTheme(next);
  await saveToFirebase(next);
}

function handleKeySequence(e) {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  const key = e.key?.toLowerCase();
  if (!key || key.length !== 1) return;
  keyBuffer = (keyBuffer + key).slice(-12);
  if (keyBuffer === 'im a cishet') {
    keyBuffer = '';
    if (enabled) { applyTheme(false); saveToFirebase(false); }
  }
}

function handleShortcut(e) {
  if (e.ctrlKey && e.altKey && (e.key === 'E' || e.key === 'e')) {
    e.preventDefault();
    toggle();
  }
}

function init() {
  document.addEventListener('keydown', handleShortcut);
  document.addEventListener('keydown', handleKeySequence);
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      if (!(await loadFromFirebase(user.uid))) loadFromLocal();
    } else {
      loadFromLocal();
    }
  });
}

init();
