// auth-guard.js — protects index.html, injects user context, saves jobs to Firestore
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let currentUser = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  currentUserData = userDoc.data();

  // inject user info into header
  const logo = document.getElementById('app-logo');
  if (logo) logo.textContent = 'Nivelato';

  // owner/cotizador → show dashboard link
  if (currentUserData?.role === 'owner' || currentUserData?.role === 'cotizador') {
    const header = document.getElementById('app-header');
    if (header) {
      const dashBtn = document.createElement('a');
      dashBtn.href = 'dashboard.html';
      dashBtn.style.cssText = 'font-size:12px;color:#1971c2;text-decoration:none;font-weight:600;margin-right:4px;';
      dashBtn.textContent = 'Dashboard';
      header.insertBefore(dashBtn, header.lastChild);
    }
  }

  // account selector (replaces old bare "Salir" pill — single sign-out now)
  if (typeof window.initAccountSelector === 'function') {
    window.initAccountSelector({ user, userData: currentUserData });
  }
});

window._doLogout = async () => {
  await signOut(auth);
  window.location.href = 'login.html';
};

// saveJob — called from adhd.js on share
window.saveJobToFirestore = async (jobData) => {
  if (!currentUser || !currentUserData) return;
  try {
    const orgId = currentUserData.orgId;
    await addDoc(collection(db, 'orgs', orgId, 'jobs'), {
      ...jobData,
      installerUid:  currentUser.uid,
      installerName: currentUserData.name || currentUser.email,
      installerRole: currentUserData.role,
      orgId,
      createdAt: serverTimestamp()
    });
    console.log('[Nivelato] Job saved to Firestore');
  } catch(e) {
    console.error('[Nivelato] Failed to save job:', e);
  }
};
