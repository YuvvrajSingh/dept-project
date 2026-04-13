# Dept Timetable Project

A full-stack application for managing and viewing university timetables.

## Getting Started

### 1. Backend Setup
Navigate to the `time-table-backend` directory and start the server:
```bash
cd time-table-backend
npm run dev
```
The backend will run on `http://localhost:3001`.

### 2. Frontend Setup
Navigate to the `timetable-light` directory and start the web application:
```bash
cd timetable-light
npm run dev
```
The frontend will run on `http://localhost:3000`.

---

## Remote Access (Smartphone Viewing)

To view the timetable on your smartphone, you have two main options:

### Option A: Local Wi-Fi Access (Fastest)
1. Ensure your phone and laptop are on the **same Wi-Fi network**.
2. **Windows Check:** Set your Wi-Fi profile to **Private** (not Public) in Windows Settings.
3. Find your laptop's IP address (e.g., `192.168.1.40`).
4. Start the frontend bound to that IP:
   ```bash
   npm run dev -- -H 192.168.1.40
   ```
5. Open `http://192.168.1.40:3000/timetable` on your phone.

### Option B: Cloudflare Tunnel (Works Anywhere)
1. Start the frontend normally (`npm run dev`).
2. Start a Cloudflare tunnel:
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. Use the generated `trycloudflare.com` link provided in the terminal.
4. **Note:** Ensure the domain is added to `allowedDevOrigins` in `next.config.ts`.

---

## ⚠️ Windows Troubleshooting

### 1. Terminal Freeze (QuickEdit Mode)
If the website hangs on **"Loading..."** and doesn't finish, your backend terminal is likely frozen. 
- **Cause:** Clicking inside a Windows terminal window pauses the process.
- **Fix:** Click into the terminal window and press **`Enter`** or **`Esc`** to unfreeze.

### 2. Connection Blocked
If your phone says "Unreachable":
- Ensure you have a firewall rule allowing Port 3000.
- Ensure the Network Profile is set to **Private** in Windows settings.
