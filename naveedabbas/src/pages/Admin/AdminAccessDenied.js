import { auth } from '../../firebase';

export default function AdminAccessDenied() {
  return (
    <section className="admin-panel" style={{ padding: '60px 10%' }}>
      <h2>Admin Panel</h2>
      <div className="glass">
        <h3 style={{ marginTop: 0 }}>Access denied — Admin only</h3>
        <p className="lead">
          You are signed in as <strong>{auth.currentUser?.email || 'unknown'}</strong> but you do not have admin privileges.
        </p>
        <p>Please ask the site owner to grant your account admin access. Two common ways to grant admin rights:</p>
        <ol>
          <li>
            Set a Firestore users doc: open <code>Firestore → users → {`<your-uid>`}</code> in Firebase Console and add{' '}
            <code>{'{ "isAdmin": true }'}</code>. (The console or server can write this — clients are prevented by security rules.)
          </li>
          <li>
            Use the Firebase Admin SDK to add a custom claim to the user token:
            <pre style={{ background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 8, overflowX: 'auto' }}>
              {`const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.auth().setCustomUserClaims('<USER_UID>', { admin: true });`}
            </pre>
          </li>
        </ol>
        <p className="lead">
          After the owner grants admin access, sign out and sign back in so the client picks up the new token claim.
        </p>
      </div>
    </section>
  );
}
