# 🎴 Dahala Pakad (Dehla Pakad / Mindi Coat)

A modern, responsive, 4-player mobile card game built with **HTML5, JavaScript, and Vite**, designed specifically for hosting on **GitHub Pages** with zero backend server costs.

---

## 🌟 Key Features

1. **Standard Rules Engine**:
   - **4 Players / 2 Teams**: You & North (Partner) vs East & West (Opponents).
   - **Cut Trump / Open Break Variant**: Trump suit is dynamically set by the suit of the first card played when a player breaks suit.
   - **Sweeping Center Stack**: Trick cards accumulate in the center until a player wins **2 consecutive tricks** (or wins the 13th last trick).
   - **Objective & Victory**: Goal is to capture 10s (*Dehlas*). Capturing all 4 tens wins a **Mindi Coat**!

2. **Multiplayer Networking Modes**:
   - 🤖 **Single Player / Offline Mode**: Play immediately against 3 smart AI bots.
   - 📶 **Local Room (WebRTC P2P)**: Connect with friends in the same room or network using **PeerJS**. No external database required!
   - 🌐 **Remote Online (Firebase DB)**: Connect 4 remote players from anywhere over mobile data using room codes.

3. **Mobile-First Responsive UI**:
   - Touch-friendly card fan and smooth animation effects.
   - Web Audio synthesizer for dealing, card play, cut trump reveal, sweep, and victory sound effects.
   - Victory celebration confetti animations.

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

Follow these steps to host your game for free on GitHub:

### Step 1: Initialize Git and Commit
Open terminal in your project folder and run:
```bash
git init
git add .
git commit -m "Initial commit of Dahala Pakad web app"
```

### Step 2: Push to GitHub
1. Create a new public repository on GitHub named `dahala-pakad-game`.
2. Connect and push your local code:
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/dahala-pakad-game.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository settings on GitHub: **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. The included `.github/workflows/deploy.yml` workflow will automatically build and publish your game!
4. Your game will be live at:
   `https://YOUR_GITHUB_USERNAME.github.io/dahala-pakad-game/`

---

## 🛠 Local Development & Testing

To test and develop locally:
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:5173` in your browser.
