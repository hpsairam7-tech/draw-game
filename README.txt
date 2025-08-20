DRAW WITH FRIENDS — REAL-TIME DRAWING DEMO (FREE)

WHAT IS THIS?
A simple multiplayer drawing game demo (like Skribbl-style drawing board + chat) using:
- HTML + CSS + JavaScript
- Firebase Realtime Database (free tier)
- Works on phone + desktop

HOW TO SETUP (FREE):
1) Go to https://console.firebase.google.com and create a new project.
2) In Build → Realtime Database: create a database. Start in test mode (for demo).
3) In Project settings → Your apps (Web) → Register app → Copy the Firebase config.
4) Open config.js and paste your config object fields (apiKey, authDomain, databaseURL, etc.).
5) Open index.html in your browser (or host on GitHub Pages/Netlify).

HOW TO PLAY WITH FRIENDS:
- Open index.html. It will create a ROOM ID in the URL (e.g., #ab12cd).
- Click "Copy Invite Link" and send to friends.
- Everyone drawing in the same room sees live strokes and chat.
- Use the Word box to set a secret word for the round (scoring is not included in this demo).

HOSTING (FREE):
- GitHub Pages: push the folder to a public repo → Settings → Pages → Branch: main (root).
- Netlify/Vercel: drag-and-drop the folder to deploy.

NOTES:
- This is a minimal demo. You can add scoring, timer, turn rotation, and word lists later.
- For production, set database rules for security (restrict write/read by room, users, etc.).
