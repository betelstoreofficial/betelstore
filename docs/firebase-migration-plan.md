# Migrate The Betel Store from Supabase to Firebase

## Context
Supabase domains (`*.supabase.co`) are being blocked by some Indian ISPs. While we have a proxy workaround, this plan evaluates a full migration to Firebase as a more permanent solution. Firebase uses `*.googleapis.com` / `*.firebaseapp.com` which are not blocked.

## Scope
Replace **all** Supabase features (Auth, Database, Storage) with Firebase equivalents. Keep Next.js + Vercel + Razorpay + Nodemailer unchanged.

---

## Phase 0: Firebase Project Setup
1. Create Firebase project in Firebase Console
2. Enable Firebase Auth with Google sign-in provider
3. Create Firestore database (production mode)
4. Create Firebase Storage bucket
5. Generate Admin SDK service account key
6. Install packages: `firebase`, `firebase-admin` (remove `@supabase/ssr`, `@supabase/supabase-js`)

**New env vars:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_KEY          # server-only, JSON string
```

**Remove env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Phase 1: Create Firebase Client Libraries

**Delete:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/middleware.ts`

**Create:**
- `lib/firebase/client.ts` — Browser-side singleton: Firebase App, Auth, Firestore, Storage
- `lib/firebase/admin.ts` — Server-side Admin SDK: Auth, Firestore, Storage (replaces both server + admin Supabase clients)

---

## Phase 2: Auth Migration

### Login flow (simpler than current)
- **Current:** Manual Google OAuth redirect → callback route → exchange code → `signInWithIdToken`
- **Firebase:** `signInWithPopup(auth, googleProvider)` — one line, no callback route needed

**Files:**
| File | Change |
|------|--------|
| `lib/auth-context.tsx` | Rewrite: `onAuthStateChanged()`, `signOut()`, expose `getIdToken()` helper |
| `app/auth/login/page.tsx` | Replace OAuth redirect with `signInWithPopup()` |
| `app/auth/callback/route.ts` | **DELETE** — no longer needed |

### Server-side auth (session cookies)
Firebase doesn't set cookies automatically. We need a session cookie flow for middleware + API routes:

1. After Firebase login, client calls `POST /api/auth/session` with the Firebase ID token
2. Server creates a session cookie via `admin.auth().createSessionCookie()`
3. Middleware reads + verifies cookie with `admin.auth().verifySessionCookie()`
4. On logout, client calls `DELETE /api/auth/session` to clear the cookie

**Files:**
| File | Change |
|------|--------|
| `app/api/auth/session/route.ts` | **CREATE** — POST (set cookie), DELETE (clear cookie) |
| `middleware.ts` | Rewrite: verify Firebase session cookie instead of Supabase auth |
| `lib/admin-api.ts` | Rewrite: `verifySessionCookie()` instead of `supabase.auth.getUser()` |

---

## Phase 3: Database Migration (Postgres → Firestore)

### Firestore Data Model
```
/products/{productId}
  name, origin, grade, price_per_100, bulk_price_per_1000,
  bulk_min_qty, unit, available, description, tag, image_url, created_at

/orders/{orderId}
  user_id, user_email, user_name,   ← denormalized (no JOINs in Firestore)
  order_number, items (array of maps), subtotal, discount, total,
  status, payment_status, razorpay_order_id, razorpay_payment_id,
  created_at, updated_at

/mandi_rates/{rateId}
  product_id, variety, today_price, yesterday_price, change, updated_at

/profiles/{userId}                   ← keyed by Firebase Auth UID
  full_name, avatar_url, email, business_name, phone, gst_number, address

/site_settings/config                ← single document
  phone, email, whatsapp, address, business_hours_weekday, business_hours_weekend
```

**Key change:** `order_items` becomes embedded in the order document as `items` array (already stored as JSONB). No separate collection needed. User email/name denormalized onto orders at creation time (replaces JOINs with profiles).

### Files to rewrite

**Client-side reads — `lib/db.ts`:**
- `getProducts()` → `getDocs(query(collection(db, 'products'), orderBy('name')))`
- `getOrders(userId)` → `getDocs(query(collection(db, 'orders'), where('user_id', '==', userId), orderBy('created_at', 'desc')))`
- `getOrderItems(orderId)` → Read from order doc's `items` array

**API routes (all use Admin SDK Firestore):**
| File | Key Changes |
|------|-------------|
| `api/orders/create/route.ts` | Batch get products, `addDoc` for order, no separate order_items insert |
| `api/orders/verify/route.ts` | `updateDoc` for order status |
| `api/admin/products/route.ts` | CRUD via `getDocs`/`addDoc`/`updateDoc`/`deleteDoc` + sync mandi_rates |
| `api/admin/orders/route.ts` | `getDocs` with `where` — no JOIN needed (user data denormalized on order) |
| `api/admin/orders/[orderId]/route.ts` | `getDoc` — items embedded, profile data on order |
| `api/admin/mandi-rates/route.ts` | `getDocs`/`updateDoc` + sync to products |
| `api/admin/stats/route.ts` | `getCountFromServer()` for counts, fetch paid orders for revenue sum |
| `api/admin/site-settings/route.ts` | `getDoc`/`setDoc` on single doc |
| `api/site-settings/route.ts` | `getDoc` |
| `api/mandi-rates/route.ts` | `getDocs` |

---

## Phase 4: Storage Migration

**`app/admin/products/page.tsx`** — Replace Supabase Storage with Firebase Storage:
- `uploadBytes(ref(storage, 'product-images/' + fileName), file)`
- `getDownloadURL(ref)` for public URL

---

## Phase 5: Cleanup

- `next.config.mjs` — Remove `rewrites()` section (no proxy needed)
- Remove `@supabase/ssr`, `@supabase/supabase-js` from `package.json`
- Delete `lib/supabase/` directory
- Delete `scripts/setup-db.js`, `scripts/check-db.js` (Supabase-specific)

---

## Phase 6: Data Migration (one-time script)

Create a local Node.js script that:
1. Reads all data from Supabase (products, orders, order_items, mandi_rates, profiles, site_settings)
2. Writes to Firestore with mapped IDs
3. Denormalizes user email/name onto order documents

---

## Phase 7: Security Rules

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if false;
    }
    match /orders/{orderId} {
      allow read: if request.auth != null && resource.data.user_id == request.auth.uid;
      allow write: if false;
    }
    match /mandi_rates/{rateId} {
      allow read: if true;
      allow write: if false;
    }
    match /site_settings/{docId} {
      allow read: if true;
      allow write: if false;
    }
    match /profiles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /product-images/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Implementation Order
1. Phase 0 — Firebase setup (manual, in Firebase Console)
2. Phase 1 — Firebase client libraries
3. Phase 2 — Auth (login + session cookies + middleware)
4. Phase 3 — Database (lib/db.ts first, then API routes one by one)
5. Phase 4 — Storage
6. Phase 5 — Cleanup
7. Phase 6 — Data migration script
8. Phase 7 — Security rules

---

## All Files Changed

| Action | File |
|--------|------|
| DELETE | `lib/supabase/client.ts`, `server.ts`, `admin.ts`, `middleware.ts` |
| DELETE | `app/auth/callback/route.ts` |
| CREATE | `lib/firebase/client.ts` |
| CREATE | `lib/firebase/admin.ts` |
| CREATE | `app/api/auth/session/route.ts` |
| REWRITE | `lib/auth-context.tsx` |
| REWRITE | `lib/db.ts` |
| REWRITE | `lib/admin-api.ts` |
| REWRITE | `middleware.ts` |
| REWRITE | `app/auth/login/page.tsx` |
| REWRITE | `app/api/orders/create/route.ts` |
| REWRITE | `app/api/orders/verify/route.ts` |
| REWRITE | `app/api/admin/products/route.ts` |
| REWRITE | `app/api/admin/orders/route.ts` |
| REWRITE | `app/api/admin/orders/[orderId]/route.ts` |
| REWRITE | `app/api/admin/mandi-rates/route.ts` |
| REWRITE | `app/api/admin/stats/route.ts` |
| REWRITE | `app/api/admin/site-settings/route.ts` |
| REWRITE | `app/api/site-settings/route.ts` |
| REWRITE | `app/api/mandi-rates/route.ts` |
| MODIFY | `app/admin/products/page.tsx` (storage upload only) |
| MODIFY | `next.config.mjs` (remove rewrites) |
| MODIFY | `package.json` (swap deps) |

**Total: ~23 files changed, 4 deleted, 3 created**

---

## Verification Checklist
1. Google login works — popup flow, session cookie set, user shown in nav
2. Logout clears session cookie, redirects properly
3. Admin routes protected — non-admin users redirected
4. Products page loads with data from Firestore
5. Add to cart + place order flow works (server-side price validation + Razorpay)
6. Payment verification updates order status
7. Admin CRUD — products, mandi rates, orders, site settings
8. Product image upload works via Firebase Storage
9. Mandi rates ↔ product price sync works
10. Email notifications still sent on order/payment/status change
