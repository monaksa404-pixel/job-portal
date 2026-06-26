
# User Flow Completion Plan

Goal: finish every user-facing page end-to-end against Supabase (no mocks), matching the Dashboard and Notifications mockups, with real-time updates and popups.

## 1. Schema fixes & additions (`db/schema.sql`)

Fix mismatches and add missing tables. Adds an idempotent second migration block so existing DBs upgrade cleanly.

- Align column names actually used by the app:
  - `notifications`: rename/add `body` (alias) and `read` boolean; add `type` (`job_alert | application_update | system`), `link` text.
  - `messages`: add `body` mirror of `message`; add `sender` (`admin | system`).
- New tables (with GRANTs + RLS scoped to `auth.uid()`):
  - `saved_jobs (user_id, job_id, created_at)` — UNIQUE(user_id, job_id).
  - `payments (user_id, application_id, amount, recharge_pin, status, created_at)` — read own; admin all.
  - `user_documents (user_id, kind, name, url, created_at)` — read/insert/delete own.
  - `notification_preferences (user_id PK, job_alerts bool, application_updates bool, system_updates bool)`.
  - `support_tickets (user_id, subject, message, status, created_at)`.
- Realtime: `alter publication supabase_realtime add table notifications, popups, messages, applications;`

## 2. Layout shell

- New `src/components/AppShell.tsx` — desktop sidebar (Dashboard, My Applications, Saved Jobs, Payments, Profile, Messages, Notifications, My Documents, Settings, Help & Support, Logout) + "Complete Your Profile" card. Mobile hamburger drawer + existing bottom nav.
- Update `Header.tsx`: real notification bell with unread count (live), profile dropdown (avatar, name, sign out), "Welcome back, {name}" on dashboard.
- Global `<PopupListener />` mounted in `__root.tsx`: subscribes to `popups` for current user, renders the celebratory modal ("Good News! Your application has been reviewed") with View Details / Close, marks `is_viewed=true` on dismiss.

## 3. Routes (frontend + Supabase wiring)

All under `_authenticated/` where signed-in only.

- `/dashboard` — stats cards (Total / In Review / Shortlisted / Rejected), Recent Applications list, Application Status donut (recharts), Quick Actions, Recommended Jobs (3 cards), Refer & Earn, Complete Profile progress.
- `/my-applications` — keep, restyle to match list rows from design, real-time.
- `/saved-jobs` — list from `saved_jobs` join `jobs`. Add save/unsave heart on `JobCard` + job detail.
- `/payments` — list user's payments with status badges; STC logo row.
- `/profile` — view/edit `profiles` (full_name, phone, email, nationality, country, gender, DOB), avatar upload to new `avatars` bucket, profile-completeness % drives sidebar card.
- `/messages` — inbox of `messages`, mark read on open, real-time.
- `/notifications` — rebuild to match mockup: tabs (All / Unread / Application Updates / Job Alerts) with counts, right column "Notification Preferences" (toggle rows persisting to `notification_preferences`) + Need Help card, "Mark all as read", real-time inserts highlight unread.
- `/my-documents` — list/upload/delete from `user_documents` (CV, Passport, Certificates) backed by `documents` bucket.
- `/settings` — password change, notification toggles mirror, language.
- `/help` — support ticket form → `support_tickets`, plus contact info.

## 4. Real-time

Single shared `useRealtime(user_id)` hook subscribing once per page where needed (notifications, popups, messages, applications) using `postgres_changes` filtered by `user_id=eq.{uid}` — drives badge counts, list refresh, popup overlay.

## 5. Design tokens

Match mockup colors precisely: navy header text, blue primary `#1E40FF`-ish, amber accent, soft pastel stat-card backgrounds (blue/green/amber/rose). Add semantic tokens in `src/styles.css` (`--stat-blue/green/amber/rose` + matching foregrounds) so cards use tokens not raw hex.

## 6. Order of execution

1. Schema migration block + types update.
2. AppShell + Header + PopupListener + sidebar route group `_authenticated`.
3. Dashboard.
4. Notifications redesign + preferences.
5. Saved Jobs (+ save button on cards/detail).
6. Profile + Documents + Payments.
7. Messages + Settings + Help.
8. Verify build & run a Playwright smoke pass on `/`, `/dashboard`, `/notifications`.

## Out of scope (next phase)

Admin dashboard (will start after this is approved as complete).

---

Confirm and I'll start at step 1 of execution. Anything to add/remove before I begin?
