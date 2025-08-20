# Complete Project Build Prompt: Buddy Ride Web Application

## Project Overview

Build a comprehensive ride-sharing web application for AIUB (American International University-Bangladesh) students using React, TypeScript, and Supabase. This is a Progressive Web App (PWA) that allows students to share rides, chat with each other, and coordinate transportation efficiently.

## Tech Stack Requirements

### Frontend

- **Framework**: React 18.2+ with TypeScript
- **Build Tool**: Vite 5.4+
- **Styling**: Tailwind CSS with custom gradients and animations
- **State Management**: Zustand for lightweight state management
- **Routing**: React Router v6 with protected routes
- **Icons**: Lucide React for consistent iconography
- **Notifications**: React Hot Toast for user feedback
- **PWA**: Vite PWA plugin with service worker support

### Backend & Database

- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Authentication**: Supabase Auth with email verification
- **Real-time**: Supabase real-time subscriptions for chat and notifications
- **Storage**: Supabase for any file uploads (if needed)

## Database Schema

### Tables Structure

```sql
-- Profiles table (user information)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  student_id TEXT UNIQUE,
  department TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  phone_number VARCHAR(20),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  notification_preferences JSONB DEFAULT '{"ride_requests": true, "system_alerts": true, "phone_requests": true, "push_notifications": true, "email_notifications": true}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  ride_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ride requests table
CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  phone_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, requester_id)
);

-- Messages table for chat functionality
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  phone_shared BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Rides policies
CREATE POLICY "Anyone can read rides" ON rides FOR SELECT USING (true);
CREATE POLICY "Users can insert their own rides" ON rides FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own rides" ON rides FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own rides" ON rides FOR DELETE USING (user_id = auth.uid());

-- Ride requests policies
CREATE POLICY "Ride requests access policy" ON ride_requests FOR SELECT USING (
  requester_id = auth.uid() OR
  EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_requests.ride_id AND rides.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own ride requests" ON ride_requests FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Ride owners can update requests for their rides" ON ride_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM rides WHERE rides.id = ride_requests.ride_id AND rides.user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Messages access policy" ON messages FOR SELECT USING (
  -- User is ride owner
  EXISTS (SELECT 1 FROM rides WHERE rides.id = messages.ride_id AND rides.user_id = auth.uid()) OR
  -- User has sent messages to this ride
  EXISTS (SELECT 1 FROM messages m2 WHERE m2.ride_id = messages.ride_id AND m2.sender_id = auth.uid()) OR
  -- User has ANY request for this ride
  EXISTS (SELECT 1 FROM ride_requests WHERE ride_requests.ride_id = messages.ride_id AND ride_requests.requester_id = auth.uid()) OR
  -- Others have made requests to user's ride
  EXISTS (SELECT 1 FROM ride_requests rr JOIN rides r ON rr.ride_id = r.id WHERE rr.ride_id = messages.ride_id AND r.user_id = auth.uid())
);

CREATE POLICY "Ride participants can insert messages" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND (
    -- User is ride owner
    EXISTS (SELECT 1 FROM rides WHERE rides.id = messages.ride_id AND rides.user_id = auth.uid()) OR
    -- User has ANY request for this ride
    EXISTS (SELECT 1 FROM ride_requests WHERE ride_requests.ride_id = messages.ride_id AND ride_requests.requester_id = auth.uid())
  )
);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
```

### Database Functions

```sql
-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  IF is_admin(user_id) THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired rides
CREATE OR REPLACE FUNCTION cleanup_expired_rides_auto()
RETURNS VOID AS $$
BEGIN
  -- Delete messages for expired rides
  DELETE FROM messages WHERE ride_id IN (
    SELECT id FROM rides WHERE ride_time < NOW() - INTERVAL '24 hours'
  );

  -- Delete ride requests for expired rides
  DELETE FROM ride_requests WHERE ride_id IN (
    SELECT id FROM rides WHERE ride_time < NOW() - INTERVAL '24 hours'
  );

  -- Delete expired rides
  DELETE FROM rides WHERE ride_time < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Application Features & Pages

### 1. Authentication System

- **Sign Up**: Email verification required (must be @student.aiub.edu domain)
- **Sign In**: Email/password authentication
- **Password Reset**: Email-based password recovery
- **Protected Routes**: Redirect unauthenticated users

### 2. Profile Management

- **Profile Setup**: Name, Student ID, Department, Gender, Phone (optional)
- **Profile Editing**: Update personal information
- **Role Management**: Admin, user, moderator roles
- **Notification Preferences**: Configurable notification settings

### 3. Ride Management

- **Post Ride**: Create rides with from/to locations, time, notes
- **My Rides**: View and manage posted rides
- **Delete Rides**: Remove posted rides with cascade deletion
- **Gender Compatibility**: Only same-gender students can request rides

### 4. Ride Discovery

- **Find Buddies**: Search rides by location and gender
- **Advanced Filters**: Filter by from location, to location, gender
- **Real-time Updates**: Live ride availability
- **Request System**: Send requests to join rides

### 5. Request Management

- **Send Requests**: Request to join rides with optional message
- **Receive Requests**: View incoming requests on profile
- **Accept/Reject**: Approve or decline ride requests
- **Status Tracking**: Pending, accepted, rejected states

### 6. Real-time Chat System

- **Chat Access**: Available after request acceptance
- **Real-time Messaging**: Live message updates
- **Chat List**: View all active conversations
- **Welcome Messages**: Automatic welcome messages on acceptance
- **Phone Sharing**: Optional phone number sharing feature

### 7. Notification System

- **Real-time Notifications**: Live updates for requests and messages
- **Push Notifications**: Browser notifications (PWA)
- **Notification History**: View past notifications
- **Notification Preferences**: Customizable notification settings

### 8. Admin Panel

- **User Management**: View all users and their details
- **Ride Statistics**: Total rides, messages, requests
- **Admin Assignment**: Promote users to admin role
- **System Monitoring**: Monitor app usage and performance

## Detailed Component Structure

### Pages

```
src/pages/
├── AuthPage.tsx           # Sign in/up page
├── HomePage.tsx           # Landing page with features
├── ProfileSetupPage.tsx   # Initial profile setup
├── ProfilePage.tsx        # Profile management & ride requests
├── PostRidePage.tsx       # Create new rides
├── FindBuddyPage.tsx      # Search and request rides
├── ChatsPage.tsx          # Chat list view
├── ChatPage.tsx           # Individual chat interface
└── AdminPage.tsx          # Admin dashboard
```

### Components

```
src/components/
├── ui/
│   ├── Button.tsx         # Reusable button component
│   ├── Card.tsx           # Card container component
│   ├── Input.tsx          # Form input component
│   └── TextArea.tsx       # Textarea component
├── layouts/
│   └── DashboardLayout.tsx # Main app layout with navigation
├── LocationPicker.tsx     # Location selection component
└── LoadingStates.tsx      # Loading skeletons
```

### State Management

```
src/stores/
├── authStore.ts           # User authentication state
└── rideStore.ts           # Ride data management
```

### Utilities

```
src/utils/
├── cn.ts                  # CSS class name utility
├── formatters.ts          # Date/time formatting
├── validation.ts          # Form validation helpers
└── rideCleanup.ts         # Cleanup expired rides
```

## UI/UX Design Requirements

### Design System

- **Colors**: Purple/blue gradient theme (#8B5CF6 to #3B82F6)
- **Typography**: Clean, modern fonts with proper hierarchy
- **Spacing**: Consistent padding and margins using Tailwind
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design approach

### Key UI Features

- **Gradient Backgrounds**: Subtle gradients throughout the app
- **Glass Morphism**: Backdrop blur effects on cards
- **Smooth Animations**: Transform and opacity transitions
- **Interactive Elements**: Hover states and click feedback
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: Toast notifications and error states

### Mobile Optimization

- **Touch-Friendly**: Large tap targets and proper spacing
- **Safe Areas**: Proper handling of mobile safe areas
- **Swipe Gestures**: Natural mobile interactions
- **PWA Features**: Install prompt and offline capabilities

## Real-time Features Implementation

### Chat System

```typescript
// Real-time message subscription
const subscription = supabase
  .channel(`messages:${rideId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `ride_id=eq.${rideId}`,
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe();
```

### Notification System

```typescript
// Real-time notification subscription
const notificationSubscription = supabase
  .channel("notifications")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Show notification
    }
  )
  .subscribe();
```

## Security Implementation

### Authentication

- Email domain restriction (@student.aiub.edu)
- Password complexity requirements
- Session management with automatic refresh
- Protected route guards

### Data Security

- Row Level Security (RLS) policies
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Privacy Features

- Gender-based ride restrictions
- Optional phone number sharing
- Secure messaging system
- Data encryption at rest

## PWA Configuration

### Service Worker

```javascript
// vite.config.ts PWA configuration
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
      },
      manifest: {
        name: "Buddy Ride - AIUB Student Ride Sharing",
        short_name: "Buddy Ride",
        description:
          "Connect with fellow AIUB students for safe and convenient ride sharing",
        theme_color: "#8B5CF6",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
```

## Development Setup Instructions

### 1. Project Initialization

```bash
# Create React project with Vite
npm create vite@latest buddy-ride-web -- --template react-ts
cd buddy-ride-web

# Install dependencies
npm install react-router-dom zustand @supabase/supabase-js
npm install lucide-react react-hot-toast date-fns
npm install -D tailwindcss postcss autoprefixer @types/node
npm install -D vite-plugin-pwa workbox-window

# Initialize Tailwind CSS
npx tailwindcss init -p
```

### 2. Environment Configuration

```env
# .env.local
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
```

### 4. File Structure Setup

```
buddy-ride-web/
├── public/
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── manifest.json
├── src/
│   ├── components/
│   ├── pages/
│   ├── stores/
│   ├── utils/
│   ├── types/
│   ├── lib/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.local
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Specific Implementation Details

### Gender Compatibility Logic

```typescript
// Only allow same-gender ride requests
const isGenderCompatible = (userGender: string, rideOwnerGender: string) => {
  return userGender === rideOwnerGender;
};
```

### Chat Access Control

```typescript
// Users can access chat if:
// 1. They own the ride
// 2. They have sent messages
// 3. They have any request for the ride
// 4. Others have requested their ride
const checkChatAccess = async (rideId: string, userId: string) => {
  // Implementation in ChatPage.tsx
};
```

### Automatic Cleanup

```typescript
// Clean up expired rides automatically
const cleanupExpiredRides = async () => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 24);

  // Delete messages, requests, then rides
};
```

## Testing Requirements

### Unit Tests

- Component rendering tests
- Utility function tests
- State management tests
- Form validation tests

### Integration Tests

- Authentication flow tests
- Ride creation and request flow
- Chat functionality tests
- Real-time feature tests

### E2E Tests

- Complete user journey tests
- Cross-browser compatibility
- Mobile responsiveness tests
- PWA functionality tests

## Deployment Configuration

### Supabase Setup

1. Create new Supabase project
2. Set up authentication with email verification
3. Configure RLS policies
4. Enable real-time subscriptions
5. Set up database triggers for notifications

### Vercel Deployment

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### Environment Variables

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## Performance Optimization

### Code Splitting

- Lazy load pages with React.lazy()
- Dynamic imports for heavy components
- Route-based code splitting

### Caching Strategy

- Service worker caching for static assets
- Supabase query caching
- Image optimization and lazy loading

### Bundle Optimization

- Tree shaking for unused code
- Bundle analysis and size monitoring
- Minification and compression

## Accessibility Requirements

### WCAG Compliance

- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Inclusive Design

- Support for various screen sizes
- Touch and mouse interaction support
- Error message clarity
- Loading state indicators

## Additional Features to Implement

### Advanced Features

- Push notifications for PWA
- Offline functionality
- Location-based matching
- Rating and review system
- Route optimization suggestions

### Admin Features

- User management dashboard
- Ride analytics and statistics
- System health monitoring
- Content moderation tools

### Future Enhancements

- Integration with AIUB academic calendar
- Carpooling cost calculation
- Emergency contact features
- Integration with mapping services

## Quality Assurance Checklist

### Functionality

- [ ] User authentication works correctly
- [ ] Profile setup and editing functional
- [ ] Ride creation and management working
- [ ] Request system functioning properly
- [ ] Real-time chat operational
- [ ] Notifications working
- [ ] Admin panel accessible

### Performance

- [ ] Page load times under 3 seconds
- [ ] Smooth animations and transitions
- [ ] Responsive design on all devices
- [ ] PWA installation works
- [ ] Offline functionality (basic)

### Security

- [ ] RLS policies properly configured
- [ ] Input validation in place
- [ ] Authentication secure
- [ ] Data encryption working
- [ ] Privacy settings functional

### User Experience

- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Consistent design language
- [ ] Accessibility features working
- [ ] Mobile-friendly interface

This comprehensive prompt provides everything needed to rebuild the Buddy Ride project with all its features, security implementations, and user experience considerations. The project should be built incrementally, testing each feature thoroughly before moving to the next component.
