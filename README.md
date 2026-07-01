# Nutq (Frontend)

Nutq's frontend is a **React + TypeScript** single-page application that serves three user roles — **Doctor**, **Patient**, and **Admin** — for a speech-therapy platform: therapy-plan management, gamified pronunciation exercises, and rich progress analytics.

---

## Tech Stack

| Category | Library |
|---|---|
| Framework | React 18 + TypeScript, bundled with **Vite** |
| Routing | `react-router-dom` |
| Styling | Tailwind CSS |
| HTTP | `axios` (with JWT auth interceptor) |
| Charts | `recharts` |
| Animation | `framer-motion` |
| Icons | `lucide-react` |
| Speech | Web Speech API (`SpeechRecognition`) via `src/utils/speechRecognition.ts` |

## Getting Started

```bash
npm install
npm run dev       # starts Vite dev server (http://localhost:5173)
npm run build      # production build
```

### Environment
The API base URL defaults to the deployed backend but can be overridden:

```
VITE_API_BASE_URL=http://localhost:5246
```

Used in `src/services/api/axios.ts`, `src/config.ts`, and `src/utils/mediaUrl.ts` (for resolving relative media URLs like profile pictures and diagnosis files).

---

## Project Structure

```
src/
├── App.tsx                  # Route definitions
├── contexts/AuthContext.tsx # Auth state (login/logout, localStorage-persisted JWT)
├── hooks/useAuth.ts          # Re-export of AuthContext hook
├── routes/
│   ├── ProtectedRoute.tsx    # Requires auth (+ optional role) or redirects to /login
│   └── PublicOnlyRoute.tsx   # Redirects authenticated users away from /login, /register
├── components/
│   ├── layouts/MainLayout.tsx    # Sidebar + role-based nav
│   ├── exercises/                 # Exercise UI: PhotoFrameExercise, CardMatchExercise, feedback summary
│   └── design-system.tsx          # Shared style tokens/components
├── pages/
│   ├── auth/                      # Login, Register (multi-step)
│   ├── admin/                     # Admin login + dashboard (doctor/patient blocking, code generation)
│   ├── doctor/                    # Patients list/detail, plans, exercises, analytics dashboards, transfers
│   └── patient/                   # Profile, plans, exercise player, reports, find/review doctor
├── services/api/                  # One module per backend resource (axios wrappers + types)
└── utils/                         # sessionAnalytics, patientAnalyticsCharts, speechRecognition, mediaUrl
```

---

## Authentication & Routing

- `AuthContext` exposes `loginDoctor`, `loginPatient`, `loginAdmin`, `logout`, persisting `{ token, user }` to `localStorage` (`authToken`, `user`).
- `axios` interceptor (`services/api/axios.ts`) attaches `Authorization: Bearer <token>` to every request.
- `ProtectedRoute` blocks unauthenticated access and can enforce a specific `requiredRole` (used for `/admin/dashboard`); other role-specific pages self-redirect inside `useEffect` if the logged-in role doesn't match.
- `App.tsx` defines all routes; doctor and patient areas are fully separated but share `MainLayout`.

---

## Role Feature Map

### Doctor
- **Patients** — list current/former patients, invite via code, view patient detail (diagnosis, therapy plans, weekly reports), release or transfer a patient.
- **Plan management** — create a plan (description + date range), select exercises with per-exercise repetition/duration, edit status/end date, delete exercises from active plans.
- **Analytics** — `PatientAnalyticsDashboardPage` (longitudinal trend, category trends, session history) and `PlanAnalyticsDashboardPage` (summary, sessions, word/category breakdown, strengths/weaknesses, progress deltas, clinical insights) using `recharts`.
- **Weekly reports** — create/edit notes tied to a plan.
- **Reviews** — read-only view of received patient ratings/comments (via `DoctorDetailPage`/`DoctorProfilePage`).
- **Transfers** — accept/reject incoming transfer requests (`DoctorTransferRequestsPage`).
- **Profile** — photo, CV upload, contact info, communication summary.

### Patient
- **Dashboard/Plans** — view assigned therapy plan(s), progress bars, per-exercise state (not started / started / completed).
- **Exercise player** — `PronounceWordExercisePage` renders either `PhotoFrameExercise` (speech-recognition pronunciation drill) or `CardMatchExercise` (listen-and-match game), depending on exercise category. Both track detailed per-word/per-attempt analytics client-side (`utils/sessionAnalytics.ts`) and submit a JSON payload on completion.
- **Reports** — view weekly reports left by their doctor.
- **Doctor relationship** — view assigned doctor's profile & reviews, leave a doctor, browse/request a new doctor (`PatientFindDoctorPage`), leave a review for a former doctor.
- **Profile** — photo, phone/DOB, password change.

### Admin
- Login, list/block/unblock doctors & patients, generate doctor invitation codes.

---

## Exercise & Analytics Data Flow

1. Exercise components (`PhotoFrameExercise` / `CardMatchExercise`) accumulate a `WordAttemptData[]` per repetition using helpers in `utils/sessionAnalytics.ts` (`recordSpeechAttempt`, `recordSkippedWord`, `computeOverallAccuracy`).
2. On repetition/exercise completion, `buildSessionPayload(...)` serializes the full session (`exerciseType`, `repetitions`, timings, overall accuracy) and posts it via `completeRepetition` / `completeExercise` (`services/api/patient-exercises.api.ts`).
3. The backend ingests this payload into training sessions, speech attempts, and derived analytics (see backend README).
4. Doctors consume the derived analytics through `plan-analytics.api.ts` and `dashboard.api.ts`, rendered with `recharts` line/bar charts and tabular breakdowns.

---

## Notable Utilities

- `utils/speechRecognition.ts` — wraps the Web Speech API, computes Levenshtein-based similarity (Arabic-aware normalization), and generates feedback/tips.
- `utils/patientAnalyticsCharts.ts` — shapes longitudinal session/category data into `recharts`-friendly series and formats dates/durations/trend labels.
- `utils/mediaUrl.ts` — resolves relative backend-hosted asset paths (profile pictures, CVs, diagnosis files) against `VITE_API_BASE_URL`.

---

## Known Gaps / Suggested Next Steps
- Several pages read `import.meta.env.VITE_API_BASE_URL` via a hard-coded fallback URL in multiple files (`axios.ts`, `mediaUrl.ts`, exercise components) — consider centralizing this into a single `config.ts` export used everywhere.
- Auth token/user are stored in plain `localStorage`; consider httpOnly cookies or short-lived tokens + refresh flow for production hardening.
- Some list/filter UI (e.g. `PatientsListPage` sort options) has placeholder logic (`case 'date': return 0;`) that isn't yet wired to real data.
- No automated frontend tests are currently present — consider adding component tests for the exercise players and analytics data transforms (`sessionAnalytics.ts`, `patientAnalyticsCharts.ts`), which contain the most business-critical logic.
