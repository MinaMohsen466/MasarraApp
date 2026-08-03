# Play Console — Data Safety answers

Answers derived from the code, not from assumptions. Play cross-checks this form
against observed app behaviour, so each entry below cites where it comes from.
Re-check this file whenever data handling changes.

**Package:** `com.masarrakw.app`
**Last derived from code:** 2026-08-02

---

## Data collected and shared

| Category | Item | Collected | Shared | Required | Purpose |
| --- | --- | --- | --- | --- | --- |
| Personal info | Name | Yes | No | Yes | Account, booking |
| Personal info | Email address | Yes | No | Yes | Account, sign-in, order email |
| Personal info | Phone number | Yes | No | Optional | Vendor contact about a booking |
| Personal info | Physical address | Yes | Yes¹ | Optional | Delivery of the booked service |
| Photos | Photos | Yes | No | Optional | Profile picture, vendor application |
| Location | Approximate location | Yes | Yes² | Optional | Filling in a delivery address |
| Location | Precise location | Yes | Yes² | Optional | Placing the map pin for an address |
| Financial info | Purchase history | Yes | No | Yes | Order history, refunds |
| Messages | Other in-app messages | Yes | No | Optional | Customer↔vendor chat |
| App activity | App interactions | Yes | No | Optional | Recent searches, wishlist, cart |

¹ The delivery address is visible to the vendor fulfilling that booking.
² Coordinates are sent to OpenStreetMap Nominatim to turn a map pin into a
street address (`src/constants/mapHtml.ts`, `src/components/AddressSelection`).

### Not collected — worth stating explicitly

- **No payment card data.** Card number, expiry and CVV are entered inside
  MyFatoorah's own cross-origin iframe (`#MFEmbeddedIframe`). They never reach
  the app's JavaScript or the Masarra server — a DOM inspection of the payment
  screen confirmed the gateway renders every field itself.
- **No advertising or analytics SDK.** No tracking libraries in `package.json`.
- **No contacts, calendar, microphone, or camera.** The app opens the system
  gallery only; it never launches the camera.
- **No device or advertising identifiers collected.**

---

## Security practices

| Question | Answer | Basis |
| --- | --- | --- |
| Encrypted in transit? | **Yes** | All API traffic is HTTPS to `masarrakw.com`; images from S3 over HTTPS |
| Can users request deletion? | **Yes** | Account deletion is supported server-side; also reachable via support contact |
| Committed to Play Families policy? | Not applicable | App is not aimed at children |
| Independent security review? | No | — |

### Data stored on the device

- **Android Keystore** (`react-native-keychain`): auth token, cached user
  profile, and — when the user enables "remember me" — their password.
  All written with `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- **AsyncStorage** (not encrypted): language, recent searches, remembered email
  address, cart and wishlist, plus UI state flags.

---

## Third parties that receive data

| Party | What it receives | Why |
| --- | --- | --- |
| MyFatoorah | Card details (directly, never via Masarra), amount, booking reference | Payment processing |
| Amazon Web Services (S3) | Uploaded images | File storage |
| Amazon Web Services (SES) | Email address | Verification and order emails |
| OpenStreetMap Nominatim | Coordinates | Reverse geocoding an address |
| CARTO basemaps | Map tile requests | Rendering the map |

---

## Permissions declared, and why

| Permission | Used by | Notes |
| --- | --- | --- |
| `INTERNET` | Everything | — |
| `READ_MEDIA_IMAGES` | `EditProfile`, `BecomeSeller` | Android 13+ gallery access |
| `READ_EXTERNAL_STORAGE` | same | Android ≤ 12 only (`maxSdkVersion="32"`) |
| `ACCESS_FINE_LOCATION` | `Addresses`, `AddressSelection` | Map pin for a delivery address |
| `ACCESS_COARSE_LOCATION` | same | Fallback when precise is denied |

**Removed before release:** `CAMERA` and `WRITE_EXTERNAL_STORAGE`. Both were
declared but no code path ever requested either — the app only calls
`launchImageLibrary`, never `launchCamera`, and never writes to shared storage.
