# Buddy Ride Web App

A React web application for AIUB student ride sharing, converted from the React Native version.

## Features

- **User Authentication** - AIUB student email verification
- **Profile Management** - Setup and manage student profiles
- **Ride Posting** - Post rides with location, time, and notes
- **Ride Discovery** - Find and request to join rides
- **Dynamic Requests** - Request/accept system for ride connections
- **Real-time Chat** - Chat with ride buddies after acceptance
- **Responsive Design** - Works on desktop and mobile browsers

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Backend**: Supabase (Database, Auth, Real-time)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Setup Instructions

### 1. Install Dependencies

```bash
cd buddy-ride-web
npm install
```

### 2. Environment Configuration

Copy the environment example file:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Make sure you've applied the database schema and updates from the parent directory:

- Run the SQL commands in `../supabase-schema.sql`
- Run the SQL commands in `../database-updates.sql`

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, etc.)
│   ├── layouts/        # Layout components
│   └── LocationPicker.tsx
├── pages/              # Page components
│   ├── AuthPage.tsx
│   ├── ProfileSetupPage.tsx
│   ├── HomePage.tsx
│   ├── FindBuddyPage.tsx
│   ├── PostRidePage.tsx
│   ├── ChatsPage.tsx
│   ├── ChatPage.tsx
│   └── ProfilePage.tsx
├── stores/             # Zustand state management
│   ├── authStore.ts
│   └── rideStore.ts
├── types/              # TypeScript type definitions
│   ├── index.ts
│   └── supabase.ts
├── utils/              # Utility functions
│   ├── formatters.ts
│   ├── validation.ts
│   └── cn.ts
├── lib/                # External service configurations
│   └── supabase.ts
└── main.tsx           # App entry point
```

## Key Differences from React Native Version

1. **Navigation**: React Router instead of React Navigation
2. **Styling**: Tailwind CSS classes instead of React Native styles
3. **Icons**: Lucide React instead of Expo Vector Icons
4. **Notifications**: React Hot Toast instead of Alert
5. **Components**: HTML elements instead of React Native components
6. **Responsive**: Desktop and mobile responsive design

## Features Implementation Status

- ✅ User Authentication (AIUB email validation)
- ✅ Profile Setup (Department, Gender, Student ID)
- ✅ Ride Posting (With notes and location dropdown)
- ✅ Ride Discovery (Search and filter)
- ✅ Request System (Dynamic ride connections)
- ✅ Real-time Chat (After request acceptance)
- ✅ Profile Management (View rides, change password)
- ✅ Responsive Design

## Usage

1. **Sign Up/In**: Use your AIUB student email (@student.aiub.edu)
2. **Setup Profile**: Complete your profile with student details
3. **Post Rides**: Share your travel plans with time and notes
4. **Find Buddies**: Search for rides and send requests
5. **Accept Requests**: Approve/decline join requests for your rides
6. **Chat**: Communicate with ride buddies after acceptance

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

This is a converted version of the React Native Buddy Ride app. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes as part of AIUB student ride sharing system.
