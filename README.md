# Frontend (React + TypeScript + Vite)

A modern React application that allows you to upload, list, search, bookmark, and analyze panorama images, with a panorama viewer and multilingual UI.

## Tech Stack

- React 18, TypeScript, Vite
- Ant Design (UI)
- React Router
- Axios for API requests
- Three.js for 3D panorama viewer
- i18next for localization

## Prerequisites

- Node.js and npm

## Environment Variables

Create a `.env` file with the following variables:

```
VITE_API_BASE_URL=http://localhost:5000
```

The app expects the backend API at `${VITE_API_BASE_URL}/api`.

## Install & Run (Development)

```
npm install
npm run dev
```

The server starts on `http://localhost:5173`.

## Build & Preview

```
npm run build
npm run preview
```

## Features Overview

- Authentication: register/login to obtain a JWT and access protected features
- Upload multiple images and auto-generate thumbnails
- List with pagination, sorting, filtering by tags and bookmark status
- Search by title/description
- Bookmark/unbookmark images and filter by status
- View analytics: total images, total size, total views, bookmarked vs unbookmarked pie chart
- AI-assisted metadata suggestions (if backend configured with OpenAI key)
- Panorama viewer powered by Three.js
- Localization with i18next

## API Configuration

All requests go through `src/api.ts` using Axios and will automatically attach `Authorization: Bearer <token>` if one exists in `localStorage`.

## Tips

- Ensure your browser can access `http://localhost:5000/uploads` for images
- Keep your JWT token secure; it is stored in `localStorage`
