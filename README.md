# @theermite/brain-training 🧠

> Cognitive exercises library with memory games and breathing exercises - Reusable React components for The Ermite platforms

[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Private-red)](./COPYRIGHT.md)

## 📋 Overview

`@theermite/brain-training` is a comprehensive cognitive training library featuring:

- **4 Memory Exercise Types**: MemoryCardGame, PatternRecall, SequenceMemory, ImagePairs
- **Breathing Exercises**: Guided breathing with audio frequencies (432Hz, 396Hz, 528Hz)
- **Theme System**: Predefined themes (ermite, shinkofa, esport) with full customization
- **Backend API**: Optional FastAPI backend for session management, scoring, and leaderboards
- **Mobile-First**: Touch-optimized, responsive design
- **Type-Safe**: Full TypeScript support

---

## 🚀 Quick Start

### Frontend Package Installation

```bash
# Install the package (local development)
cd brain-training/package
npm install

# Build the package
npm run build

# In your project
npm install /path/to/brain-training/package
```

### Basic Usage

```typescript
import { MemoryCardGame, BreathingExercise } from '@theermite/brain-training'
import { MemoryExerciseType, DifficultyLevel } from '@theermite/brain-training'

// Memory Card Game
function App() {
  const config = {
    exercise_type: MemoryExerciseType.MEMORY_CARDS,
    difficulty: DifficultyLevel.EASY,
    grid_rows: 4,
    grid_cols: 4,
    time_weight: 0.5,
    accuracy_weight: 0.5,
  }

  return (
    <MemoryCardGame
      config={config}
      theme="ermite"
      onComplete={(session) => console.log('Completed!', session)}
    />
  )
}

// Breathing Exercise
function BreathingApp() {
  return (
    <BreathingExercise
      theme="shinkofa"
      enableSound={true}
      onComplete={(session) => console.log('Breathing session ended', session)}
    />
  )
}
```

---

## 🎨 Theming

### Predefined Themes

```typescript
import { ermiteTheme, shinkofaTheme, esportTheme } from '@theermite/brain-training'

// Use string shorthand
<MemoryCardGame theme="ermite" config={config} />

// Or use theme object
<MemoryCardGame theme={ermiteTheme} config={config} />
```

### Custom Theme

```typescript
const customTheme = {
  variant: 'custom',
  colors: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    accent: 'bg-amber-500',
    accentHover: 'hover:bg-amber-600',
    background: 'bg-slate-950',
    backgroundSecondary: 'bg-slate-900',
    card: 'bg-slate-800',
    cardHover: 'hover:bg-slate-700',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-slate-700',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
  },
  borderRadius: 'xl',
  fontFamily: 'font-mono',
  shadows: 'lg',
}

<MemoryCardGame theme={customTheme} config={config} />
```

---

## 🔌 Backend Setup (Optional)

The backend provides session management, scoring, and leaderboards.

### Using Docker (Recommended)

```bash
cd brain-training/backend

# Start PostgreSQL + FastAPI
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Setup

```bash
cd brain-training/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
psql -U brain_training -d brain_training -f migrations/001_create_memory_exercise_sessions.sql

# Start server
uvicorn app.main:app --reload
```

### Connect Frontend to Backend

```typescript
import { configureDefaultClient, MemoryCardGame } from '@theermite/brain-training'

// Configure API client globally
configureDefaultClient({
  baseUrl: 'http://localhost:8000',
  authToken: 'your-auth-token', // Optional
  onError: (error) => console.error('API Error:', error),
})

// Use with auto-save
<MemoryCardGame
  config={config}
  exerciseId={123}
  autoSave={true}
  autoSaveInterval={5000}
  onComplete={(session) => console.log('Session saved!', session)}
/>
```

---

## 📦 Package Structure

```
brain-training/
├── package/                    # NPM Package
│   ├── src/
│   │   ├── components/        # React Components
│   │   │   ├── MemoryCardGame.tsx
│   │   │   ├── PatternRecall.tsx
│   │   │   ├── SequenceMemory.tsx
│   │   │   ├── ImagePairs.tsx
│   │   │   └── BreathingExercise.tsx
│   │   ├── themes/            # Theme System
│   │   ├── api/               # API Client
│   │   ├── types/             # TypeScript Types
│   │   └── index.ts           # Main exports
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                   # FastAPI Backend
│   ├── app/
│   │   ├── models/           # SQLAlchemy Models
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── routes/           # API Routes
│   │   ├── services/         # Business Logic
│   │   ├── core/             # Config & Database
│   │   └── main.py           # FastAPI App
│   ├── migrations/           # SQL Migrations
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
│
├── COPYRIGHT.md
├── README.md
└── USER-GUIDE.md
```

---

## 🎮 Exercise Types

### 1. Memory Card Game
Match pairs of cards (emojis or images)

**Config:**
- `grid_rows`, `grid_cols`: Grid size (e.g., 4x4 = 8 pairs)
- `time_limit_ms`: Optional time limit

### 2. Pattern Recall
Memorize and reproduce color patterns

**Config:**
- `grid_rows`, `grid_cols`: Grid size
- `colors`: Array of color hex codes
- `preview_duration_ms`: Time to memorize pattern

### 3. Sequence Memory
Simon-style sequence game

**Config:**
- `grid_rows`, `grid_cols`: Grid size
- `initial_sequence_length`: Starting sequence
- `max_sequence_length`: Max level
- `preview_duration_ms`: Time per step

### 4. Image Pairs
Match contextual pairs (question/answer)

**Config:**
- `grid_rows`, `grid_cols`: Grid size
- `time_limit_ms`: Optional time limit

### 5. Breathing Exercise
Guided breathing with patterns and audio

**Patterns:**
- Cohérence Cardiaque (5s/5s) - 432 Hz
- Relaxation 4-7-8 - 396 Hz
- Énergisant (4-4-4-4) - 528 Hz

---

## 🛠️ Development

### Build Package

```bash
cd package
npm run build        # Build for production
npm run dev          # Watch mode
npm run type-check   # TypeScript check
npm run lint         # Lint code
npm run lint:fix     # Lint + auto-fix
```

### Test Backend

```bash
cd backend
pytest --cov --cov-report=html
```

---

## 📡 API Endpoints

### Memory Exercises

```
POST   /api/v1/memory-exercises/sessions              # Create session
PUT    /api/v1/memory-exercises/sessions/{id}         # Update session
GET    /api/v1/memory-exercises/sessions/{id}         # Get session
GET    /api/v1/memory-exercises/sessions              # Get user history
GET    /api/v1/memory-exercises/leaderboard           # Get leaderboard
GET    /api/v1/memory-exercises/stats                 # Get user stats
GET    /api/v1/memory-exercises/presets/{type}        # Get config presets
```

### Health Check

```
GET    /health                                         # Health check
```

**API Docs:** http://localhost:8000/docs

---

## 🔒 Security

- **Never commit `.env`** with real credentials
- **Change default passwords** in production
- **Use HTTPS** in production
- **Generate secure SECRET_KEY** for JWT tokens

```bash
# Generate secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📝 License

**Copyright © 2025 Jay "The Ermite" Goncalves. All rights reserved.**

This is proprietary software for personal use only. See [COPYRIGHT.md](./COPYRIGHT.md) for details.

---

## 🤝 Credits

**Developed by**: TAKUMI Agent (Jay The Ermite)
**Project**: @theermite/brain-training
**Date**: December 2025
**Version**: 1.0.0

---

## 📚 Additional Documentation

- [USER-GUIDE.md](./USER-GUIDE.md) - End-user documentation
- [COPYRIGHT.md](./COPYRIGHT.md) - License and copyright

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
