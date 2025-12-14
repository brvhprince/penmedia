# PenMedia

Use your phone's camera as a webcam for your PC. Stream high-quality video with filters and effects.

## Features

- **Cross-platform**: Desktop app for Windows, macOS, and Linux. Mobile app for iOS and Android.
- **Low latency streaming**: WebSocket-based protocol optimized for real-time video
- **Virtual camera**: Creates a virtual webcam device that works with Zoom, Teams, Meet, and more
- **Camera controls**: Switch cameras, toggle flash, adjust zoom, exposure, and focus
- **Video filters**: Background blur, beauty mode, low-light enhancement, color adjustments
- **Easy pairing**: QR code scanning or manual IP connection
- **Multiple resolutions**: Support for 360p, 480p, 720p, and 1080p

## Project Structure

```
penmedia/
├── apps/
│   ├── mobile/          # React Native app (iOS & Android)
│   └── desktop/         # Tauri 2.0 desktop app (Windows, macOS, Linux)
├── packages/
│   ├── shared-types/    # TypeScript type definitions
│   ├── protocol/        # Streaming protocol implementation
│   └── filters/         # Video filters and effects
├── pnpm-workspace.yaml
├── package.json
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Rust (for desktop app)
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
# Clone the repository
git clone https://github.com/penmedia/penmedia.git
cd penmedia

# Install dependencies
pnpm install

# Build shared packages
pnpm build
```

### Development

#### Desktop App

```bash
# Run development server
pnpm dev:desktop

# Build for production
cd apps/desktop
pnpm tauri:build
```

#### Mobile App

```bash
# iOS
cd apps/mobile
pnpm ios

# Android
pnpm android
```

## Usage

1. **Start the desktop app** and click "Start Server"
2. **Open the mobile app** and scan the QR code displayed on desktop
3. **Grant camera permissions** on your phone
4. **Start streaming** - your phone camera is now a webcam!
5. **Select "PenMedia Camera"** in your video conferencing app

## Architecture

### Protocol

PenMedia uses a custom binary protocol over WebSocket for low-latency video streaming:

- **Handshake**: Device info exchange and capability negotiation
- **Video frames**: H.264/VP8/VP9/JPEG encoded frames with headers
- **Control commands**: Camera switching, flash toggle, settings updates
- **Status updates**: Battery level, temperature, FPS statistics

### Virtual Camera

- **Windows**: DirectShow virtual camera filter
- **macOS**: CoreMediaIO DAL plugin
- **Linux**: v4l2loopback kernel module

## Filters

| Filter | Description |
|--------|-------------|
| Blur Background | Blur the background while keeping the subject sharp |
| Beauty | Smooth skin and enhance features |
| Low Light | Enhance visibility in dark conditions |
| Grayscale | Black and white conversion |
| Sepia | Warm vintage tone |
| Warm | Add orange/yellow warmth |
| Cool | Add blue cool tones |
| Vintage | Classic film-like effect |
| Vignette | Darken edges for focus |

## Tech Stack

- **Mobile**: React Native, Vision Camera, Zustand
- **Desktop**: Tauri 2.0, React, TypeScript, Rust
- **Shared**: TypeScript, WebSocket, Custom binary protocol
- **Build**: Turborepo, pnpm workspaces

## License

MIT License - see [LICENSE](LICENSE) for details.
