# 🚀 MUSE - AI-Powered Athlete Biography Platform

Professional platform for creating athlete biographies using AI-powered interviews with voice agent support.

## ✨ Features

- 🎤 **Voice Agent** - Browser-based speech recognition and text-to-speech
- 🤖 **AI Interviewer** - Kelly Cole style short questions, athlete gives detailed answers
- 🏆 **Sport-Specific** - Cricket, Football, Boxing, Athletics, Tennis
- 📝 **Multi-Format Export** - DOCX, HTML, Markdown, TXT
- 🔗 **Shareable Links** - Global access with URL parameters
- 📊 **Progress Tracking** - Real-time word count and milestones
- 🎨 **Ultra HDR Design** - Professional, modern interface
- 🔐 **Secure Authentication** - Single admin login with 24-hour sessions

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_ADMIN_EMAIL=admin@muse.com
NEXT_PUBLIC_ADMIN_PASSWORD=Muse@2024#Secure!
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

Create `.env` file for backend:
```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Start Backend
```bash
node backend-simple.js
```

### 4. Start Frontend
```bash
npm run dev
```

### 5. Login
```
Email: admin@muse.com
Password: Muse@2024#Secure!
```

## 📖 How It Works

### For Publishers:
1. Login to dashboard
2. Add client (name, email, book title, sport)
3. Copy shareable link
4. Send link to athlete
5. Monitor progress

### For Athletes:
1. Open shareable link (no login needed)
2. Start interview
3. Answer AI questions
4. Voice mode available
5. Export book when done

## 🎯 Interview Style

AI asks **SHORT questions** (max 10 words):
```
AI: "Tell me about growing up."
Athlete: [Long detailed answer about childhood, family, etc.]
AI: "When did you start playing football?"
Athlete: [Long answer about first time playing]
AI: "Talk about your first big game."
```

## 🎤 Voice Agent

- Click "Start Voice" to enable
- AI speaks questions
- Click mic button to answer
- Speak naturally
- AI transcribes automatically
- No auto-listening after AI speaks

## 📦 Export Formats

- **DOCX** - Microsoft Word with formatting
- **HTML** - Web-ready with styling
- **Markdown** - Plain text with formatting
- **TXT** - Simple text file

## 🏗️ Tech Stack

### Frontend:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons

### Backend:
- Node.js + Express
- Groq AI (llama-3.3-70b-versatile)
- In-memory storage
- CORS configured

### AI:
- Model: llama-3.3-70b-versatile
- Temperature: 0.5
- Max tokens: 50 (short responses)
- Top P: 0.8

## 📁 Project Structure

```
muse-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main app
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   └── interview/
│   │       └── [clientId]/
│   │           └── page.tsx            # Interview page
│   ├── components/
│   │   ├── AuthScreen.tsx              # Login screen
│   │   ├── PublisherDashboard.tsx      # Dashboard
│   │   ├── ClientInterview.tsx         # Interview UI
│   │   ├── ProgressTimeline.tsx        # Progress tracker
│   │   └── ...
│   ├── utils/
│   │   ├── voiceAgent.ts               # Voice system
│   │   └── bookExport.ts               # Export functions
│   └── types/
│       └── athlete.ts                  # Type definitions
├── backend-simple.js                    # Backend server
├── .env                                 # Backend env
├── .env.local                           # Frontend env
├── package.json                         # Dependencies
└── README.md                            # This file
```

## 🔐 Security

- Environment variables for sensitive data
- Secure password hashing
- Session management (24-hour expiry)
- CORS protection
- Input validation

## 🌐 Production Deployment

### Vercel (Frontend):
```bash
vercel --prod
```

Add environment variables in Vercel dashboard:
```
NEXT_PUBLIC_ADMIN_EMAIL=admin@muse.com
NEXT_PUBLIC_ADMIN_PASSWORD=Muse@2024#Secure!
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

### Railway (Backend):
```bash
railway up
```

Add environment variables in Railway dashboard:
```
GROQ_API_KEY=your_key
PORT=5000
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

## 🐛 Troubleshooting

### Backend not starting?
- Check GROQ_API_KEY in `.env`
- Ensure port 5000 is free
- Run `npm install` first

### Frontend errors?
- Check `.env.local` has all variables
- Clear browser cache
- Try incognito mode
- Restart dev server

### Voice not working?
- Use Chrome/Edge (best support)
- Allow microphone permissions
- Check browser console for errors

### Login not working?
- Check credentials: admin@muse.com / Muse@2024#Secure!
- Clear localStorage
- Check `.env.local` has credentials

## 📝 License

MIT

## 🤝 Support

For issues or questions, check the troubleshooting section above.

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2024
