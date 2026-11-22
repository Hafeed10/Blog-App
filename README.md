# CHRONICLE BLOG APP

A next-generation ("New Model Design") editorial blog application built with **React Native**, **Expo SDK 58**, and connected to **Supabase** cloud PostgreSQL.

---

## 📸 Key Features & "New Model Design"

- **Editorial Magazine & Bento Layout**: Glassmorphism cards, frosted headers, glowing category tags, and responsive typography.
- **Hero Trending Carousel**: Large featured cover story with multi-stop gradient overlays and reading time calculation.
- **Supabase Cloud Backend**: Connected to your live Supabase project with fallback offline resilience.
- **Live / Offline Dual Mode**: If database tables haven't been created yet, the app gracefully loads rich mock stories and provides a 1-click in-app status monitor without crashing.
- **Interactive Story Viewer**:
  - Immersive hero cover image with author follow button
  - **Audio Edition Widget**: Synthesized voice preview simulation with play/pause controls
  - Dynamic font-size resizer (scale typography for optimal reading comfort)
  - Interactive Like heart counter with optimistic instant updates
  - Offline Reading List bookmarking
  - Comments & responses with live addition
- **Compose & Publish Modal**:
  - Modern bottom sheet to compose stories
  - 5 high-res Unsplash preset cover photographs + custom URL support
  - Category selector pills
  - Markdown-friendly content area
  - Instant optimistic dispatch and Supabase cloud sync
- **Sleek Floating Pill Navigation Bar**:
  - **Explore**: Main editorial feed with instant search and category filtering
  - **Saved**: Reading list persisted in local device storage (`AsyncStorage`)
  - **(+) Center Action**: Compose & publish modal
  - **Database**: Real-time Supabase connection health check and SQL migration helper
- **Dark / Light Mode**: System-aware with instant toggle (OLED Obsidian Dark `#0B0D13` and Porcelain White `#F8FAFC`).


### Quick 1-Click Database Setup:
1. Open your Supabase Dashboard:
2. Click **SQL Editor** on the left navigation bar.
3. Copy its contents, paste them into the Supabase SQL Editor, and click **Run**.
4. Return to the app and tap **Database -> Test & Recheck Connection**. Your app will instantly switch to live cloud database mode!

---

## 🚀 Running the App

### 1. Start the Expo Dev Server:
```bash
npm start
```
From the interactive terminal:
- Press **`w`** to open in your web browser.
- Press **`a`** to open in Android Emulator / connected device.
- Press **`i`** to open in iOS Simulator (on macOS).
- Or scan the QR code with the **Expo Go** app on your iPhone or Android phone!

### 2. Direct Web Preview:
```bash
npm run web
```

### 3. Deploy to Vercel:
The project includes a `vercel.json` configuration for web deployment:
- **Build Command**: `npx expo export -p web` (or `npm run build`)
- **Output Directory**: `dist`
- **Deploy via Vercel CLI**:
  ```bash
  npx vercel
  ```
- **Deploy via Git**: Import the repository in your Vercel Dashboard, and Vercel will automatically detect the settings from `vercel.json`.

---


