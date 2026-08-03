# API Configuration Guide

## Which server does the app talk to?

`getBaseUrl()` in `ClientSide/src/config/api.config.ts` decides this, and the
`USE_LOCAL_IN_DEV` flag is checked first:

| `USE_LOCAL_IN_DEV` | Debug build | Release build |
| --- | --- | --- |
| `false` (current) | **production** (`masarrakw.com`) | production |
| `true` | local server (see below) | production |

> ⚠️ While `USE_LOCAL_IN_DEV` is `false`, everything you do in a debug build —
> bookings, signups, deletions — runs against **live customer data**. Setting it
> to `true` requires a working local backend: `server/` needs a `.env` file
> (copy `server/.env.example`) plus a reachable MongoDB and Redis.

## How to Change the API Server IP Address

All API URLs in this application are centralized in a single configuration file,
so the address only needs to change in **ONE** place.

### Configuration File Location

```
ClientSide/src/config/api.config.ts
```

### What You Need to Change

Open `api.config.ts` and modify the `LOCAL_IP` constant (only used when
`USE_LOCAL_IN_DEV` is `true` and the build is a debug build):

```typescript
export const LOCAL_IP = '192.168.1.190'; // 🔧 Change your IP here
```

### Examples

#### For Local Development (localhost)
```typescript
const LOCAL_IP = 'localhost';
```

#### For Different Network IP
```typescript
const LOCAL_IP = '192.168.0.100';
```

#### For Production Server
```typescript
const LOCAL_IP = 'api.yourserver.com';
```

### What Gets Updated Automatically

When you change `LOCAL_IP`, the following URLs are automatically updated throughout the entire app:

1. **API_BASE_URL** - Base server URL (e.g., `http://192.168.1.190:3000`)
2. **API_URL** - API endpoint URL (e.g., `http://192.168.1.190:3000/api`)
3. **ADMIN_URL** - Admin panel URL (`${API_BASE_URL}/admin`)
4. **Image URLs** - All image paths from the server

### Platform-Specific Behavior

The configuration automatically handles different platforms:

- **Android Emulator**: Uses `10.0.2.2` to access your computer's localhost
- **iOS Simulator**: Uses your LOCAL_IP directly
- **Physical Devices**: Uses your LOCAL_IP directly

### Files That Use This Configuration

All API calls throughout the app now use the centralized configuration:

- ✅ `api.ts` - Core API functions
- ✅ `reviewsApi.ts` - Reviews API
- ✅ `servicesApi.ts` - Services API
- ✅ `vendorsApi.ts` - Vendors API
- ✅ `Chat.tsx` - Chat screen
- ✅ `ChatConversation.tsx` - Chat conversation
- ✅ `Cart.tsx` - Shopping cart
- ✅ `UserProfile.tsx` - User profile
- ✅ `EditProfile.tsx` - Edit profile
- ✅ `Header.tsx` - App header
- ✅ `About.tsx` - About page
- ✅ `Terms.tsx` - Terms page
- ✅ `Privacy.tsx` - Privacy page
- ✅ `Auth.tsx` - Authentication

### Admin Panel Configuration

The admin panel is served by the same origin as the API, so `ADMIN_URL` is just
`${API_BASE_URL}/admin` — there is no separate port to configure. Open it with
`ADMIN_URL` rather than a literal address, so it follows whichever server the
build is pointed at.

`getWebUrl()` is the matching helper for the public web client (it does use port
`5173` in local dev, where Vite serves the client separately). Note that links
meant to be *shared with other people* should use `PRODUCTION_URL` instead —
a local address is useless on someone else's device.

### Testing Your Changes

After changing the IP address:

1. Stop the React Native app
2. Clear the cache: `npx react-native start --reset-cache`
3. Rebuild the app
4. Test on both Android and iOS if possible

### Troubleshooting

#### Can't connect from Android Emulator?
- The app uses `10.0.2.2` automatically for Android Emulator
- Make sure your backend server is running on `0.0.0.0` (all interfaces), not just `localhost`

#### Can't connect from physical device?
- Make sure your phone and computer are on the same Wi-Fi network
- Check your firewall settings
- Use your computer's local network IP (e.g., `192.168.1.127`)

#### Images not loading?
- Verify your backend serves images from `/public/` directory
- Check that `getImageUrl()` is being used for all image paths

### Console Logging

The configuration includes helpful console logs to debug URL issues:

```
🔧 API Configuration:
   - Base URL: http://192.168.1.127:3000
   - API URL: http://192.168.1.127:3000/api
   - Admin URL: http://192.168.1.127:5173/admin
```

Look for these logs when the app starts to verify your configuration.
