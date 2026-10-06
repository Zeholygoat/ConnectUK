# connectUk

A dark, neon, real-time-style UK transport map built with React + Vite + MapLibre GL JS, designed to integrate with GeoNode/GeoServer and live transport APIs.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Netlify
1. Push this folder to GitHub/GitLab/Bitbucket.
2. Import the repository into Netlify.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Optional: add the variables from `.env.example` in Netlify → Site configuration → Environment variables.

The app starts in **SIMULATION** mode, so it has a useful animated experience without requiring API credentials. Turn on provider adapters when you have access to the relevant live feeds.

## GeoNode
Set `VITE_GEONODE_WMS_URL` to your GeoNode/GeoServer WMS endpoint. The frontend can render WMS overlays and the data layer is structured so WFS/REST can be added without replacing the map UI.

GeoNode supports WMS, WFS, WMTS, GeoNode APIs and other OGC services, making it suitable as the geospatial catalogue/layer backend.
