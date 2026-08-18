# Plan Scheduler

A mobile scheduling app built solo with React Native (Expo) and Supabase. Users can create plans/reminders with custom categories, repeat schedules, and reminder days — with a themeable dark mode UI unlocked via an in-app credit system.

> 🚧 Actively in development — core features work, polish and V2 features (like AI flyer generation) are in progress.

## Features

- **Plan creation** — title, time picker, category, and repeat scheduling with embedded reminder days
- **Authentication & session persistence** via Supabase + AsyncStorage
- **Dark mode & purchasable themes** managed through a custom ThemeContext
- **Credit system** — earn/spend credits to unlock color themes and extra reminder slots
- **Row-Level Security (RLS)** on Supabase to keep user data isolated and secure
- **Live data refresh** on navigation using `useFocusEffect`

## Tech Stack

- **Frontend:** React Native, Expo (SDK 54), expo-router 4.x
- **Backend:** Supabase (Postgres, Auth, RLS)
- **State/Persistence:** AsyncStorage, React Context (ThemeContext)

## Screenshots

*(Add a few screenshots here — home screen, add-plan form, theme picker)*

## Roadmap

- [ ] AI-generated event flyers (V2)
- [ ] Additional reminder customization
- [ ] iOS/Android store release

## Getting Started

```bash
git clone https://github.com/<your-username>/plan-scheduler.git
cd plan-scheduler
npm install
npx expo start
```

You'll need a Supabase project set up with the corresponding schema — `.env.example` shows required environment variables.

## Author

Built solo by Joshua Bello — a developer exploring mobile app development, backend design, and product decisions from the ground up.
