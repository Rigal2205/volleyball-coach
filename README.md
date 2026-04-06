# 🏐 VolleyCoach

> A full-stack web app for volleyball coaches to manage students, broadcast weekend training slots via WhatsApp, and let an AI assistant automatically handle parent booking replies.

---

## What it does

| Feature | Description |
|---|---|
| **Student management** | Add, view, delete students with parent mobile numbers |
| **WhatsApp broadcast** | Send weekend availability to all parents in one click |
| **AI booking replies** | Parents reply naturally — AI books, cancels, reschedules automatically |
| **Schedule calendar** | Coach sees all bookings on a weekly calendar |
| **Inbox** | View all parent messages and AI replies in real time |

---

## How it works

```
Coach clicks "Send SMS"
      ↓
Parents receive WhatsApp with available slots
      ↓
Parent replies: "Saturday 12 to 2"
      ↓
AI reads message → checks availability → books slot
      ↓
AI replies: "Done! Rigal is in for Saturday 12 PM – 2 PM 👍"
      ↓
Coach sees booking in Schedule page
```

Parents never know they're talking to an AI — replies are short, casual, and random so they feel like the coach is personally texting them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js v24 + Express.js |
| Frontend | React.js 18 + Vite 5 |
| Database | Firebase Firestore (NoSQL) |
| WhatsApp | Twilio WhatsApp Sandbox |
| AI Engine | Regex parser (Claude AI optional) |
| Tunnel | ngrok (dev) / Railway (production) |

---

## Project Structure

```
volleycoach-backend/
├── .env                    ← secrets (never commit!)
├── .env.example            ← template for new devs
├── package.json
├── server.js               ← Express app + all routes + Twilio webhook
├── serviceAccountKey.json  ← Firebase credentials (never commit!)
└── lib/
    ├── firebase.js         ← Firebase Admin SDK init
    ├── bookings.js         ← slot logic (conflict, free slots, save)
    └── ai.js               ← message parser + reply generator

volleycoach-frontend/
├── .env                    ← VITE_API_URL
├── vite.config.js
└── src/
    ├── App.jsx             ← sidebar layout + navigation
    ├── index.css           ← global styles + CSS variables
    ├── main.jsx
    ├── lib/
    │   ├── api.js          ← REST client with mock fallback
    │   └── utils.js        ← shared helpers
    └── pages/
        ├── Dashboard.jsx   ← stats + weekend timeline
        ├── Students.jsx    ← roster + add/delete
        ├── SendSMS.jsx     ← compose + broadcast
        ├── Inbox.jsx       ← parent messages + AI replies
        └── Schedule.jsx    ← calendar view
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- Firebase account
- Twilio account
- ngrok account (free)

### 1. Clone and install

```bash
# Backend
cd volleycoach-backend
npm install

# Frontend
cd volleycoach-frontend
npm install
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project → Enable Firestore
3. Project Settings → Service accounts → **Generate new private key**
4. Move `serviceAccountKey.json` into `volleycoach-backend/`

### 3. Set up Twilio WhatsApp

1. Sign up at [twilio.com](https://www.twilio.com)
2. Go to **Messaging → Try it out → Send a WhatsApp message**
3. Note your sandbox number and join code
4. Note your Account SID and Auth Token

### 4. Configure environment variables

**Backend** — create `volleycoach-backend/.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

ANTHROPIC_API_KEY=sk-ant-xxxxxxxx  # optional

FIREBASE_PROJECT_ID=your-project-id

PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** — create `volleycoach-frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 5. Run locally

```bash
# Terminal 1 — Backend
cd volleycoach-backend
node server.js
# → Running on http://localhost:3001

# Terminal 2 — Frontend
cd volleycoach-frontend
npm run dev
# → Dashboard on http://localhost:5173

# Terminal 3 — ngrok tunnel
ngrok http 3001
# → https://xxxx.ngrok-free.app
```

### 6. Connect Twilio webhook

1. Go to Twilio → Messaging → Try it out → Send a WhatsApp message → **Sandbox settings**
2. Set **"When a message comes in"** to: `https://xxxx.ngrok-free.app/webhook/sms`
3. Method: **POST** → Save

### 7. Join the sandbox (for testing)

Have the parent send this from their WhatsApp to `+1 415 523 8886`:
```
join <your-sandbox-name>
```

---

## API Reference

### Students

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/students` | — | Get all students |
| POST | `/api/students` | `{ name, age, parentName, parentMobile }` | Add student |
| DELETE | `/api/students/:id` | — | Remove student |

### Bookings

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| GET | `/api/bookings` | `?weekendSat=YYYY-MM-DD` | Get bookings for weekend |
| POST | `/api/bookings` | `{ weekendSat, day, start, end, studentName, parentMobile }` | Add booking |
| DELETE | `/api/bookings/:id` | — | Remove booking |

### SMS

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/sms/broadcast` | `{ weekendSat, windowStart, windowEnd, studentIds }` | Send WhatsApp to parents |
| GET | `/api/sms/log` | — | Get last 50 parent messages |
| POST | `/webhook/sms` | Twilio format | Receive parent reply (Twilio calls this) |

---

## Firebase Collections

```
students/     { name, age, parentName, parentMobile, createdAt }
bookings/     { weekendSat, day, start, end, studentName, parentMobile, status, createdAt }
smsLog/       { from, message, reply, createdAt }
broadcasts/   { weekendSat, windowStart, windowEnd, sentTo[], createdAt }
```

---

## Parent Message Examples

| Parent sends | AI replies |
|---|---|
| `Saturday 12 to 2` | `Done! Rigal is in for Saturday 12 PM – 2 PM 👍` |
| `Sunday 1pm to 3pm` | `Ok confirmed! Sunday 1 PM – 3 PM is blocked for Rigal ✓` |
| Same slot again | `Hey, you're already booked for Saturday 12–2! See you then 👍` |
| `cancel my booking` | `Ok, cancelled Rigal's slot on Saturday 12–2. No problem!` |
| `switch to Sunday 2 to 4` | `Done! Switched Rigal to Sunday 2 PM – 4 PM 👍` |
| `yes` (after switch proposal) | `Updated! See Rigal on Sunday at 2 PM – 4 PM ✓` |
| `what's free?` | `This weekend: Sat: 2–3 PM, 3–4 PM / Sun: 1–3 PM. Which works?` |
| `hi` | `Hey! Let me know which day and time works for Rigal. Sat or Sun, 12-4pm 👍` |

---

### Update Twilio webhook

Replace the ngrok URL with your Railway URL in Twilio Sandbox Settings:
```
https://volleycoach.up.railway.app/webhook/sms
```

---

## Security

- `.env` and `serviceAccountKey.json` are in `.gitignore` — never commit them
- Frontend has zero Firebase access — all data goes through the backend API
- CORS is restricted to the frontend URL only
- Unknown phone numbers are rejected with a polite message
- Bookings are never deleted — only status updated to `cancelled` for audit trail

---

## Cost Estimate (20 students)

| Service | Cost |
|---|---|
| Firebase | Free (well within free tier) |
| Twilio messages | ~$0.20/weekend |
| Railway backend | $5/month |
| Vercel frontend | Free |
| **Total** | **~$6-8/month** |

---

## What Must Be Running

For the full WhatsApp flow to work locally:
1. Backend on port 3001
```bash 
node server.js
```
2. Public URL for Twilio webhook
```bash 
ngrok http 3001
```
3. frontend dashboard
```bash 
npm run dev
```

In production, only the Vercel frontend and Railway backend need to be deployed — no ngrok needed.

---
