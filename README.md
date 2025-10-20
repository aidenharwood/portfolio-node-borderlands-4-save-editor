# Borderlands 4 Save Editor PWA

A Progressive Web App (PWA) for editing Borderlands 4 save files, built with Vue 3, TypeScript, and Vite.

## Features

- 📱 **Progressive Web App** - Install on any device and use offline
- 🎮 **Save File Editing** - Modify Borderlands 4 save files
- 🌙 **Dark/Light Theme** - Automatic theme switching
- 📦 **Offline Support** - Works without internet connection
- 🔄 **Auto-Updates** - Seamless updates when new versions are available

## PWA Installation

### Desktop (Chrome, Edge, Firefox)
1. Visit the app in your browser
2. Look for the install icon in the address bar
3. Click "Install" when prompted
4. The app will be added to your desktop and start menu

### Mobile (iOS Safari)
1. Open the app in Safari
2. Tap the Share button (📤)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### Mobile (Android Chrome)
1. Open the app in Chrome
2. Tap the menu button (⋮)
3. Select "Add to Home screen"
4. Tap "Add" to confirm

## Development

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## PWA Features

- **Offline Functionality**: Once loaded, the app works offline
- **Install Prompts**: Browser will prompt users to install the app
- **Update Notifications**: Users are notified when updates are available
- **App-like Experience**: Runs in standalone mode when installed
- **Responsive Design**: Works on all screen sizes

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Vite PWA Plugin** - PWA functionality
- **Tailwind CSS** - Utility-first CSS framework
- **Vue Router** - Client-side routing

## Serial Format Documentation

This project uses the new deserialized format for Borderlands 4 item serials as documented in:
- [zjfeiye/borderlands4-item-analyzer-editor](https://github.com/zjfeiye/borderlands4-item-analyzer-editor/blob/main/README.md)

### Deserialized Format
```
itemType, version, field_id, field_value| field_id, field_value|| {part_id} {part_id:[values]}|
```

**Example:**
```
Serial:       @Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
Deserialized: 269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|
```

Where:
- `269` = Item type
- `0` = Version
- `1, 28|` = Level field (field ID 1 = level, value = 28)
- `2, 1611||` = Random seed field (field ID 2 = seed, value = 1611)
- `{5}` `{7}` = Part IDs
- `{243:[106 101]}` = Part ID 243 with chunk values

### Implementation Notes

See `SERIAL_DECODER_NOTES.md` for detailed documentation on:
- Data types (Varint5, Varbit5)
- Field identifiers
- Binary encoding details
- Reference implementations

### Test Serials

```typescript
// Level 28 item
@Ugr$ZCm/%Dy!fa}wMLp_#G}@#ZYSj7O0ss
// => 269, 0, 1, 28| 2, 1611|| {5} {7} {243:[106 101]} {6} {243:87}|

// Level 30 item
@Ugd77*Fg_4rx=zp;RG}I*T&N7HBq}9pC29=n4yqJt7iug5
// => 7, 0, 1, 30| 2, 2477|| {19} {2} {6} {1:11} {18} {66} {68} {69} {17} {27} {34} {45} {81}|

// Level 10 item
@UgwSAs2}T1VOz#USjp~P5)S(jfsJ*DNsIaI@g+bLpr9!Pj^+J_H00
// => 20, 0, 1, 10| 2, 3037|| {98} {62} {5} {3} {4} {7} {93} {82} {80} {11} {16} {26} {36} {37} {46} {50}|
```
