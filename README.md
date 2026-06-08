# StudyLogs

A modern React + Vite study logging app built with Firebase Auth and Firestore.

Users can sign in with Google, create rich study logs, organize entries into folders, track streaks, and browse public or partner logs.

## Features

- Google sign-in authentication
- Rich study log editor with:
	- text formatting
	- code blocks
	- task lists
	- highlights
- Public/private visibility for logs
- Folder organization
- Feed view with filters for all logs, your logs, and partner logs
- Profile and streak tracking
- Responsive desktop and mobile navigation

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase Auth
- Firebase Firestore
- Tiptap rich text editor
- Monaco editor integration
- React Router DOM

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with your Firebase values:

```env
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
VITE_FIREBASE_FIRESTORE_DATABASE_ID=your-firestore-database-id
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in your browser at `http://localhost:3000`.

## Firebase Requirements

The app uses Firebase Auth and Firestore. Your Firebase project should include:

- Google sign-in enabled in Authentication
- A Firestore database
- Collections used by the app:
	- `users`
	- `logs`
	- `folders`

If your Firestore database is not the default database, set `VITE_FIREBASE_FIRESTORE_DATABASE_ID` in `.env`.

## Project Structure

- `src/App.tsx` — app routing and auth gating
- `src/contexts/AuthContext.tsx` — Firebase auth and user profile state
- `src/lib/firebase.ts` — Firebase initialization from Vite env vars
- `src/pages/Feed.tsx` — study log feed with filters and public/partner views
- `src/pages/EditorPage.tsx` — rich editor for creating and publishing logs
- `src/components/Layout.tsx` — sidebar and mobile navigation
- `src/components/Login.tsx` — Google sign-in page
- `src/extensions/MonacoCodeBlockExtension.ts` — custom code block support

## Scripts

- `npm run dev` — start development server
- `npm run build` — build production bundle
- `npm run preview` — preview production build
- `npm run lint` — run TypeScript type check

## Notes

- Firebase configuration is loaded through Vite env variables in `src/lib/firebase.ts`.
- Keep `.env` out of version control.
- The app is designed to be responsive and works on desktop and mobile devices.
