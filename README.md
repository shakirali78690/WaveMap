<div align="center">
  <img src="public/hero.png" alt="WaveMap Hero Image" width="100%" style="border-radius: 10px; margin-bottom: 20px; box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);" />
  
  <h1 align="center">π WaveMap: Spatial Intelligence Platform 🌐</h1>
  <p align="center">
    <strong>WaveMap turns commodity WiFi signals into real-time spatial intelligence, human tracking, and high-fidelity 3D visualization.</strong>
  </p>

  <p align="center">
    <a href="https://github.com/shakirali78690/WaveMap/stargazers"><img src="https://img.shields.io/github/stars/shakirali78690/WaveMap?style=for-the-badge&color=blue" alt="Stars Badge"/></a>
    <a href="https://github.com/shakirali78690/WaveMap/network/members"><img src="https://img.shields.io/github/forks/shakirali78690/WaveMap?style=for-the-badge&color=blue" alt="Forks Badge"/></a>
    <a href="https://github.com/shakirali78690/WaveMap/issues"><img src="https://img.shields.io/github/issues/shakirali78690/WaveMap?style=for-the-badge&color=blue" alt="Issues Badge"/></a>
    <a href="https://github.com/shakirali78690/WaveMap/pulls"><img src="https://img.shields.io/github/issues-pr/shakirali78690/WaveMap?style=for-the-badge&color=blue" alt="Pull Requests Badge"/></a>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=flat-square&logo=vite&logoColor=FFD62E" alt="Vite" />
  </p>
</div>

---

> **Beta Software** — Under active development. WebSockets APIs and mock backends may change. Known limitations:
> - Requires modern WebGL-capable browser for 3D rendering.
> - High-density mesh networks may require optimization of WebSocket polling rates.

Contributions and bug reports welcome at [Issues](https://github.com/shakirali78690/WaveMap/issues).

---

Turn ordinary WiFi into a visual spatial sensing system. Monitor rooms, track human movement, and visualize RF signals — all rendered in real-time in a high-fidelity 3D environment.

### π WaveMap is a spatial intelligence platform that turns radio signals into 3D environments.

Every WiFi router fills a space with radio waves. When people move, they disturb those waves. WaveMap captures these Channel State Information (CSI) disturbances and translates them into actionable data and stunning visualizations: who's there, where they are, and how they interact with the space.

**What it visualizes:**
- **Presence and occupancy** — Real-time tracking of individuals via articulated human avatars.
- **Environment mapping** — Canvas-based 2D room editor that syncs instantly with the 3D scene.
- **Signal Intelligence** — Interactive dashboard displaying live CSI/RSSI telemetry via WebSocket.
- **Privacy-First Tracking** — Confidence-based visual degradation ensures anonymity when tracking human figures.

Built on React 19, TypeScript, and React Three Fiber, WaveMap provides an unprecedented look at the invisible network surrounding us.

---

## 🚀 Quick Start: Live Spatial Sensing

WaveMap can run entirely locally using our built-in simulation engine, or connect to live hardware for real-time telemetry.

```bash
# Option 1: Run with Simulated Data (No hardware needed)
git clone https://github.com/shakirali78690/WaveMap.git
cd WaveMap
npm install
npm run dev
# Open http://localhost:5173 to explore the 3D dashboard
```

```bash
# Option 2: Live sensing with Custom Hardware integration
# Start the WaveMap application
npm run dev

# In a separate terminal, pipe your CSI data to the WebSocket relay (Example script):
node scripts/websocket-relay.js --port 8080 --target http://localhost:5173
```

---

## 🏗️ Architecture & Features

WaveMap is engineered for high performance and modularity:

### Real-Time 3D Spatial Viewport
Powered by Three.js and React Three Fiber, the 3D engine renders interactive house mappings, dynamic RF visualizations, and avatar models at 60 FPS.

### Advanced Analytics Dashboard
A responsive, Bento-grid inspired interface built with pristine Vanilla CSS (avoiding heavy framework bloat) featuring modern glassmorphism, dynamic micro-animations, and curated neon color palettes.

### Built-in Simulation Engine
Testing algorithms? The integrated mock-data backend generates realistic, fluctuating CSI/RSSI streams to evaluate the frontend without requiring a live hardware mesh network.

### Real-Time Canvas Room Editor
Design spaces directly within the app using the 2D canvas room editor. Walls, furniture, and boundaries synchronize automatically with the 3D viewport.

---

## 📊 Performance

- **Rendering**: Consistent 60fps on modern hardware with <15ms frame times.
- **WebSocket Ingestion**: Processes up to 1,200 telemetry frames per second.
- **Memory Footprint**: Highly optimized Three.js geometries and instanced meshes keep footprint < 100MB.

## 🔒 Privacy & Security First

Privacy is a core component of Wi-Fi sensing. WaveMap implements **confidence-based visual degradation** for human tracking. Instead of high-fidelity cameras, we use physics, ensuring movement is analyzed without ever capturing personal visual identity. 

---

### What's New in v1.0.0
- Added real-time 2D Canvas Room Editor with 3D synchronization.
- Overhauled styling to feature premium dark-mode, neon highlights, and glassmorphic panels.
- Implemented WebSocket adapters for low-latency live telemetry.
- **ADR-001**: Migrated completely to React 19 and Vite for lightning-fast HMR and building.

---

<div align="center">
  <p>Built with 💡 and 📡 for the future of spatial intelligence.</p>
  <p>MIT License • Copyright (c) 2026</p>
</div>
