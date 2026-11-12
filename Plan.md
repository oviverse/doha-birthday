# Project Plan: Doha Fetouh's 21st Birthday Surprise Website ❤️

**Created by:** Abhi Vaidya  
**For:** Doha Fetouh (21st Birthday)  
**Goal:** A romantic, interactive, mobile-first digital birthday journey where each stage unlocks the next surprise, making Doha feel loved, special, and celebrated.

---

## 1. Tech Stack & Architecture

- **Framework:** Next.js (App Router) or Vite + React + TypeScript (static-friendly, fast mobile load).
- **Styling:** Tailwind CSS with custom CSS variables for the romantic pastel palette.
- **Animations:** Framer Motion (page transitions, card flips, envelope opening, wheel physics) + `canvas-confetti` for celebrations.
- **Audio & Sensors (Client-Side Only):**
  - **Web Audio API:** Real-time microphone volume/frequency detection for candle blowing (with tap/swipe fallback).
  - **MediaDevices API (`getUserMedia`):** Live camera preview + HTML5 `<canvas>` capture for frames, filters, and local image download.
  - **Background Music:** HTML5 `<audio>` with a persistent, unobtrusive mute/unmute toggle.
- **Music Embeds:** Official Spotify `<iframe>` embeds.
- **Privacy:** All camera frames and microphone audio are processed 100% locally in the browser—no media is uploaded or stored on any server.

---

## 2. Design System & Global Experience

- **Color Palette:**
  - Blush Pink (`#FADADD`), Rose Gold (`#B76E79`), Lavender (`#E6E6FA`), Cream (`#FFFDD0` / `#FFF8F0`), Deep Plum/Charcoal for readable text.
- **Typography:**
  - Display/Headings: Elegant serif (e.g., *Playfair Display* or *Cormorant Garamond*).
  - Love Letter: Handwriting-style font (e.g., *Dancing Script* or *Caveat*).
  - Body/UI: Clean sans-serif (e.g., *Plus Jakarta Sans* or *Inter*).
- **Global Ambient & "Spotify Wrapped"-Style Experience:**
  - **Story-Driven Pacing:** Full-screen (`100dvh`) story-like stages with segmented progress bars at the top, dynamic background gradient shifts per stage, and bold kinetic typography that animates in on beat.
  - **High Interactivity & Micro-Interactions:** Tap-to-reveal, swipeable cards, spring-physics buttons, haptic-like visual feedback (scale/glow/ripple), and interactive particle bursts on touch.
  - **Cinematic Transitions:** Smooth shared-element/morphing transitions, staggered text/card entrances, floating hearts, and soft sparkles running at 60fps.
  - **Audio & Controls:** Persistent, unobtrusive audio mute/unmute toggle and touch-optimized targets.

---

## 3. The 8-Stage Birthday Journey

### Stage 1: The Birthday Welcome – The Grand Opening 🎂
- **Visuals:** Prominent animated birthday cake in the center with glowing candles, floating hearts, sparkles, and gentle confetti.
- **Copy:** *"Happy 21st Birthday, My Love, Doha! ❤️"* + a short personalized welcome note from Abhi.
- **Interaction:** *"Open Your Birthday Surprise"* CTA button that triggers a smooth transition into Stage 2 (and optionally starts ambient background music on user gesture).

### Stage 2: A Personal Love Letter 💌
- **Visuals:** An interactive, sealed envelope centered on screen.
- **Interaction:** Tapping the envelope plays an opening animation, sliding out the letter.
- **Content:** Heartfelt letter from Abhi to Doha rendered in a handwriting-style font, with gradual text reveal.
- **Audio:** Subtle ambient background music with a visible mute/unmute toggle.
- **Navigation:** *"Continue to Next Surprise"* button at the end of the letter.

### Stage 3: The Love Prize Game – Romantic Jackpot Wheel 🎰❤️
- **Visuals:** Colorful, romantic casino-style prize wheel with 8 segments:
  - *Unlimited Hugs*, *1000 Kisses*, *A Romantic Date*, *A Surprise Gift*, *A Full Day Together*, *Unlimited Love*, *A Special Birthday Wish*, *Princess Treatment* (+ Grand Jackpot).
- **Gameplay Logic (3 Spins):**
  - **Spin 1 & Spin 2:** Land on fun, playful non-jackpot prizes with mini-celebrations.
  - **Spin 3 (Guaranteed Jackpot):** Longer spin duration, dramatic slow-down, glowing effects, heavy confetti burst, and reveal message:
    *"JACKPOT! ❤️ You've won the biggest prize of all – ALL MY LOVE, FOREVER!"*
- **Navigation:** Unlock *"Continue"* button after the 3rd spin celebration.

### Stage 4: More Reasons Why I Love You ❤️
- **Visuals:** Interactive collection of personal love notes (e.g., tappable flip cards or a swipeable/interactive deck).
- **Content:** Genuine, personal messages about Doha's smile, personality, little habits, shared memories, and the happiness she brings.
- **Interaction:** Smooth flip/reveal animations on tap, encouraging her to explore all notes before moving on.

### Stage 5: The Birthday Photo Booth 📸
- **Permissions:** Graceful camera permission prompt (`navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })`) with clear fallback messaging if denied.
- **Features:**
  - Live mirrored camera preview.
  - Selectable romantic/birthday frames, heart overlays, and soft filters.
  - Large animated capture button.
- **Post-Capture:**
  - Displays the framed photo with *"Look at the birthday queen! You're absolutely beautiful! ❤️"*.
  - **Retake** button and **Save Photo** button (downloads composited canvas image directly to her device).

### Stage 6: Her Personal Music Corner 🎵
- **Heading:** *"Your Favorite Songs, Because Every Love Story Has a Soundtrack."*
- **Features:**
  - Curated playlist UI featuring Doha's favorite songs (title, artist, album art).
  - Responsive official Spotify `<iframe>` embeds so she can play tracks directly.
  - Smooth hover/tap animations and mobile-friendly scrolling.

### Stage 7: Blow Out Your Candles! 🎂🕯️
- **Visuals:** Realistic decorated birthday cake with **21 glowing, animated candles**.
- **Prompt:** *"It's time to make your 21st birthday wish, Doha! Close your eyes and blow out your candles. ❤️"*
- **Microphone Integration:**
  - Requests microphone permission (`getUserMedia({ audio: true })`).
  - Uses Web Audio API (`AnalyserNode`) to detect blowing intensity and duration.
  - Triggers wind/air particle animations, flickers candle flames, and gradually extinguishes all 21 candles.
- **Fallback:** If microphone access is denied or unavailable, allow her to **tap or swipe** across the candles to blow them out.
- **Celebration:** Once all 21 candles are out, trigger soft rising smoke, glowing sparkles, floating hearts, and transition to the finale.

### Stage 8: The Final Love Message 💖
- **Content:** Full emotional closing letter from Abhi Vaidya.
- **Closing Animation:** Ends with a memorable final screen displaying:
  *"21 Looks Beautiful on You, Doha. ❤️"*

---

## 4. Implementation Phases

1. **Phase 1 – Foundation & Design System:** Initialize project, configure Tailwind/fonts/colors, build global stage manager, ambient particles, and audio controller.
2. **Phase 2 – Stages 1 & 2:** Build Welcome screen with animated cake + Interactive Love Letter envelope.
3. **Phase 3 – Stages 3 & 4:** Build the 3-spin Romantic Jackpot Wheel + Interactive "Reasons I Love You" cards.
4. **Phase 4 – Stages 5 & 6:** Build the Camera Photo Booth (canvas compositing + download) + Spotify Music Corner.
5. **Phase 5 – Stages 7 & 8:** Build the 21-candle Microphone Blow-Out experience (with tap/swipe fallback) + Final Love Message.
6. **Phase 6 – Polish & Mobile Testing:** Optimize assets, test on iOS Safari & Android Chrome, verify permissions/fallbacks, and deploy.

---

## 5. Verification & Testing Checklist

- [ ] **Mobile Responsiveness:** Test on smartphone viewports (iOS Safari, Android Chrome) and desktop.
- [ ] **Stage Flow:** Verify all 8 stages transition smoothly in exact sequence.
- [ ] **Jackpot Wheel:** Confirm Spins 1 & 2 land on non-jackpot prizes and Spin 3 always lands on the Grand Jackpot.
- [ ] **Photo Booth:** Test camera permission grant/deny, frame/filter switching, retake, and local image download.
- [ ] **Candle Blowing:** Test microphone blowing detection on mobile browsers and verify the tap/swipe fallback works seamlessly.
- [ ] **Spotify Embeds:** Confirm embeds load and play cleanly on mobile and desktop.
- [ ] **Performance & Privacy:** Confirm no media leaves the browser and animations run smoothly without lag.
