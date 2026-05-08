# BeigeBoard

A cross-platform todo app with cassette futurism aesthetic that automatically reformats your calendar based on goals and completion.

## Features

- Todo management
- Calendar integration (planned)
- Cassette futurism UI with grain and pastels
- Server backend
- Web frontend
- Desktop app for Linux
- Mobile app for Android
- Mac widget (planned)

## Project Structure

- `backend/`: Node.js Express server with SQLite database
- `frontend/`: React web application
- `desktop/`: Electron desktop app
- `mobile/`: React Native mobile app
- `shared/`: Common code and types

## Setup

### Prerequisites

- Node.js
- npm
- For mobile: Android Studio and SDK
- For desktop: Electron

### Installation

1. Clone the repository
2. For each component, navigate to its directory and run `npm install`

#### Backend

```bash
cd backend
npm install
npm start
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

#### Desktop

```bash
cd desktop
npm install
npm start
```

#### Mobile

```bash
cd mobile
npm install
npx react-native run-android
```

## Development

- Backend runs on port 3000
- Frontend runs on port 3001 (default React)
- Desktop opens Electron window
- Mobile requires Android device/emulator

## Contributing

Create a GitHub repository and push this code.

## License

MIT