import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';

export async function isUserAdmin(db, user) {
  if (!user) return false;

  try {
    const token = await user.getIdTokenResult(true);
    if (token?.claims?.admin === true) return true;
  } catch (_) {
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return Boolean(userDoc.exists() && userDoc.data()?.isAdmin === true);
  } catch (_) {
    return false;
  }
}

export async function addOrderedItem(db, collectionName, payload, currentLength = 0) {
  const nextOrder = currentLength > 0 ? currentLength + 1 : 1;
  await addDoc(collection(db, collectionName), {
    ...payload,
    order: nextOrder,
    createdAt: serverTimestamp(),
  });
}

export async function updateItem(db, collectionName, id, payload) {
  await updateDoc(doc(db, collectionName, id), payload);
}

export async function removeItem(db, collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function reorderItems(db, collectionName, orderedIds = []) {
  const writes = orderedIds.map((id, index) => updateDoc(doc(db, collectionName, id), { order: index + 1 }));
  await Promise.all(writes);
}

export async function saveSettingsDoc(db, settingsId, payload) {
  await setDoc(doc(db, 'settings', settingsId), payload, { merge: true });
}

export async function saveUserDoc(db, uid, payload) {
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

export async function setProfileImage({ auth, db, normalizedUrl }) {
  if (!auth.currentUser) throw new Error('Not signed in');

  try {
    await saveUserDoc(db, auth.currentUser.uid, { photoURL: normalizedUrl });
  } catch (_) {
  }

  try {
    await updateProfile(auth.currentUser, { photoURL: normalizedUrl });
    await auth.currentUser.getIdToken(true);
  } catch (_) {
  }
}

export function uploadFileToStorage({ storage, file, subpath, onProgress }) {
  return new Promise((resolve, reject) => {
    const path = `images/${subpath}-${Date.now()}-${file.name}`;
    const targetRef = storageRef(storage, path);
    const task = uploadBytesResumable(targetRef, file);

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        if (typeof onProgress === 'function') onProgress(pct);
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function exportCollectionCsv(db, collectionName, orderedBy = 'createdAt', direction = 'desc') {
  const q = query(collection(db, collectionName), orderBy(orderedBy, direction));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
