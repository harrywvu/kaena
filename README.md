# kaena

Stop debating. Kaena tells you exactly where to eat tonight.

---

## What it does

You answer a few questions. Kaena picks one place. You go.

No lists. No filters. No scrolling through reviews. One confident recommendation based on your location, budget, group size, and vibe — powered by real nearby places and an AI that actually reasons about the choice.

---

## Tech stack

- **React Native** (Expo)
- **Google Places API** — nearby restaurant discovery, reverse geocoding
- **Claude API** (claude-sonnet-4-20250514) — recommendation reasoning
- **AsyncStorage** — persisting last pick, session state, recommendation history
- **Expo Location** — device GPS

---

## Getting started

### Prerequisites

- Node.js 18+
- Expo CLI
- An Android or iOS device with Expo Go, or a simulator

### Install

```bash
git clone https://github.com/yourusername/kaena.git
cd kaena
npm install
```

### Environment variables

Create a `.env` file in the root:

```
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
```

Both keys are required. The app will not function without them.

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go on your device. Make sure your phone and machine are on the same network, or use `--tunnel` if you run into connection issues:

```bash
npx expo start --tunnel
```

---

## How it works

1. On first open, the user goes directly into the question flow
2. Answers are collected: budget, group size, and vibe
3. Device GPS resolves the current location
4. Four parallel Google Places queries run: restaurants, cafes, bakeries, and general food spots
5. Results are merged, deduplicated, and filtered by operational status
6. The candidate pool is shuffled and passed to Claude with the user's preferences
7. Claude returns one recommendation with a short reason
8. The result screen shows the place, a map, photos, and two actions:
   - **Redecide** — same preferences, different place
   - **Pick again** — full restart with new preferences

---

## Project structure

```
kaena/
├── app/
│   ├── index.jsx          # Lobby / home screen
│   ├── questions.jsx      # Question flow
│   └── result.jsx         # Recommendation result screen
├── services/
│   ├── places.js          # Google Places queries and merging
│   ├── location.js        # GPS and reverse geocoding
│   └── recommendation.js  # Claude API call and prompt
├── storage/
│   └── session.js         # AsyncStorage read/write helpers
├── constants/
│   └── theme.js           # Colors, fonts, spacing
└── .env
```

---

## Current state

This is an MVP. The core loop works — location, preferences, one recommendation.

What's intentionally not here yet:
- User accounts
- Reservation integration
- Recommendation history
- Social features

The goal right now is to make the single recommendation feel undeniably good before building anything else.

---

## Notes

- Works best in areas with sufficient Google Places coverage (Metro Manila, major Philippine cities and municipalities)
- Tested on Android via Expo Go
- Ilocos Norte works surprisingly well

---

## License

MIT
