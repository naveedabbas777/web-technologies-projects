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

// Upload to Cloudinary (unsigned). Requires env vars: REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET
export async function uploadFileToCloudinary({ file, onProgress }) {
  if (!file) throw new Error('No file provided');
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const cloudName = env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'cmbtvqrs';
  const uploadPreset = env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'porfolio_upload';
  // If server signing is configured, request signature first
  const signingBase = env.REACT_APP_CLOUDINARY_SIGNING_URL;
  const url = signingBase
    ? `${signingBase.replace(/\/$/, '')}/cloudinary/sign`
    : null;

  // prefer signed upload when server signing endpoint available
  if (url) {
    // prepare form params
    const form = new FormData();
    form.append('file', file);
    try {
      const sigRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!sigRes.ok) throw new Error('Failed to fetch signature');
      const sigJson = await sigRes.json();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${sigJson.cloud_name}/auto/upload`;
      form.append('api_key', sigJson.api_key);
      form.append('timestamp', String(sigJson.timestamp));
      form.append('signature', sigJson.signature);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && typeof onProgress === 'function') {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress(pct);
          }
        };
        xhr.onload = () => {
          try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(res.secure_url || res.url);
            } else {
              reject(new Error(res.error?.message || 'Cloudinary signed upload failed'));
            }
          } catch (err) {
            reject(err);
          }
        };
        xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
        xhr.send(form);
      });
    } catch (err) {
      // If no unsigned preset is configured, surface the real signer error.
      if (!uploadPreset) {
        throw new Error(`Signed upload failed: ${err.message || err}. Start signing server or set REACT_APP_CLOUDINARY_UPLOAD_PRESET for unsigned uploads.`);
      }
      // fallback to unsigned below
      console.warn('Signed upload failed, falling back to unsigned:', err.message || err);
    }
  }

  if (!cloudName || !uploadPreset) throw new Error('Cloudinary not configured (REACT_APP_CLOUDINARY_CLOUD_NAME / REACT_APP_CLOUDINARY_UPLOAD_PRESET)');

  const unsignedUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const unsignedForm = new FormData();
  unsignedForm.append('file', file);
  unsignedForm.append('upload_preset', uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', unsignedUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(res.secure_url || res.url);
        } else {
          reject(new Error(res.error?.message || 'Cloudinary upload failed'));
        }
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
    xhr.send(unsignedForm);
  });
}

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
