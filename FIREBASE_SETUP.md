# Firebase Setup Guide for Resvio

## 1. Required npm packages

Run the following in the project root:

```bash
npm install firebase firebase-admin
```

| Package          | Purpose                                      |
|------------------|----------------------------------------------|
| `firebase`       | Client-side Auth & Firestore SDK             |
| `firebase-admin` | Server-side token verification & Admin SDK   |

---

## 2. Firebase project setup (step by step)

### 2.1 Create a project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** and follow the wizard (Analytics is optional).
3. After creation, open the project dashboard.

### 2.2 Register a Web app

1. In the project overview, click the **</>** (Web) icon to add a web app.
2. Name it `resvio-web`.
3. Copy the `firebaseConfig` object — you'll need it for the `NEXT_PUBLIC_*` env vars below.

### 2.3 Enable Authentication

1. In the left sidebar, go to **Build → Authentication**.
2. Click **Get started**.
3. Enable the following sign-in providers:
   - **Email/Password** — toggle on
   - **Google** — toggle on, select your support email

### 2.4 Create a Firestore database

1. Go to **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode** (we'll deploy security rules next).
4. Select your preferred region (e.g. `europe-west1` for European users).

### 2.5 Deploy Firestore security rules

From the project root, run:

```bash
npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Or paste the content of `lib/firebase/firestore.rules` into the Firebase Console under
**Firestore → Rules** and click **Publish**.

### 2.6 Generate a service account key (Admin SDK)

1. Go to **Project settings → Service accounts**.
2. Click **Generate new private key** → confirm.
3. A JSON file downloads — keep it secret (do **not** commit it).
4. Extract `project_id`, `client_email`, and `private_key` from the JSON.

---

## 3. Environment variables

### `.env.local` (local development — never commit this file)

```env
# ── Client-side (safe to expose in browser) ──
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123

# ── Server-side / Admin SDK (keep secret) ──
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# Paste the entire private key, including -----BEGIN/END CERTIFICATE----- lines.
# In .env.local you can use literal newlines inside double quotes:
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMII...\n-----END RSA PRIVATE KEY-----\n"
```

### Vercel dashboard

Add the same variables under **Project → Settings → Environment Variables**.

For `FIREBASE_PRIVATE_KEY` on Vercel, paste the raw key with literal `\n` characters
(Vercel stores it verbatim; the Admin SDK initialiser in `lib/firebase/admin.ts` already
calls `.replace(/\\n/g, '\n')` to restore real newlines).

---

## 4. Firestore rules deployment

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Authenticate
firebase login

# Initialise (only needed once; choose "Firestore" when prompted)
firebase init firestore --project YOUR_PROJECT_ID

# Deploy rules
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

The rules file is at `lib/firebase/firestore.rules`. If Firebase CLI expects it at
`firestore.rules` (project root), either copy it or point `firebase.json` to the lib path:

```json
{
  "firestore": {
    "rules": "lib/firebase/firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

---

## 5. Migrate existing `data/profile.json` to Firestore

Use the following one-off script. Run it locally with `ts-node` (or `npx tsx`):

```typescript
// scripts/migrate-profile.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialise Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../service-account.json'), 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrate() {
  const profilePath = path.resolve(__dirname, '../data/profile.json');
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

  // Replace with the Firebase UID of the existing user
  const uid = 'REPLACE_WITH_EXISTING_USER_UID';

  await db
    .collection('users')
    .doc(uid)
    .collection('profile')
    .doc('data')
    .set(profile, { merge: true });

  console.log('Migration complete for uid:', uid);
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
```

Run with:

```bash
npx tsx scripts/migrate-profile.ts
```

To find the UID, sign in once through the Resvio auth page, then look it up in
**Firebase Console → Authentication → Users**.

---

## 6. How the auth flow works end-to-end

```
Browser                          Next.js Server           Firebase
───────                          ──────────────           ────────
1. User signs in (email/Google)
2. Firebase Client SDK returns
   an ID token (JWT, 1hr TTL)
3. POST /api/auth/session
   { idToken }
                                 4. Admin SDK verifies token
                                 5. createSessionCookie (7d)
                                 6. Set httpOnly cookie
7. Redirect to /

Any subsequent SSR request:
8. Cookie sent automatically
                                 9. GET /api/auth/me
                                    verifySessionCookie
                                    fetch Firestore profile
                                 10. Return user + profile JSON
```

The session cookie is `httpOnly` so JavaScript cannot read it — it's sent automatically
by the browser on every request, providing CSRF-safe authentication.
