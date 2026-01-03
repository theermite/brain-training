# Tools-Games-Project-Overview

> Vue d'ensemble complète de la plateforme @theermite/brain-training
>
> **Auteur**: Jay "The Ermite" Goncalves
> **Version**: 1.0.0
> **Dernière mise à jour**: Janvier 2026

---

## 📋 Table des matières

1. [Vision du projet](#-vision-du-projet)
2. [Fonctionnalités utilisateur](#-fonctionnalités-utilisateur)
3. [Architecture technique](#-architecture-technique)
4. [Technologies utilisées](#-technologies-utilisées)
5. [Structure du projet](#-structure-du-projet)
6. [Développements futurs](#-développements-futurs)
7. [Maintenance et organisation](#-maintenance-et-organisation)

---

## 🎯 Vision du projet

**@theermite/brain-training** est une plateforme d'entraînement cognitif et gaming complète qui combine :

- **Entraînement cognitif** : Exercices de mémoire, concentration et réflexes
- **Entraînement gaming** : Outils spécifiques pour améliorer les performances en jeux compétitifs (MOBA)
- **Bien-être** : Exercices de respiration guidée avec fréquences audio thérapeutiques
- **Réutilisabilité** : Bibliothèque NPM modulaire et personnalisable pour intégration dans d'autres projets

### Objectifs principaux

1. **Performance compétitive** : Améliorer les compétences gaming (précision, farming, dodge)
2. **Développement cognitif** : Renforcer mémoire, attention et vitesse de réaction
3. **Santé mentale** : Offrir des outils de relaxation et de gestion du stress
4. **Accessibilité** : Interface mobile-first optimisée pour tous les appareils

---

## 🎮 Fonctionnalités utilisateur

La plateforme propose actuellement **12 exercices interactifs** répartis en 4 catégories :

### 1️⃣ Exercices de mémoire (4)

#### MemoryCardGame
- **Type** : Jeu de mémoire classique
- **Objectif** : Trouver les paires de cartes identiques
- **Configuration** : Grille personnalisable (4x4, 6x6, etc.)
- **Features** :
  - Emojis ou images personnalisées
  - Limite de temps optionnelle
  - Système de scoring basé sur temps et précision

#### PatternRecall
- **Type** : Mémorisation de motifs colorés
- **Objectif** : Reproduire un motif de couleurs après visualisation
- **Configuration** :
  - Taille de grille variable
  - Palette de couleurs personnalisable
  - Durée de prévisualisation ajustable
- **Progression** : Difficulté croissante

#### SequenceMemory
- **Type** : Jeu style "Simon"
- **Objectif** : Reproduire des séquences de plus en plus longues
- **Configuration** :
  - Longueur de séquence initiale et maximale
  - Vitesse de présentation
  - Grille variable
- **Challenge** : Chaque niveau augmente la séquence

#### ImagePairs
- **Type** : Association contextuelle
- **Objectif** : Associer des images liées (question/réponse)
- **Features** :
  - Images personnalisées
  - Limite de temps
  - Scoring de précision

### 2️⃣ Exercices de réflexes et précision (5)

#### ReactionTime
- **Type** : Test de temps de réaction
- **Objectif** : Cliquer le plus rapidement possible sur un stimulus
- **Métriques** :
  - Temps de réaction moyen
  - Meilleur temps
  - Consistance
- **Modes** : Visuel, audio (planifié)

#### PeripheralVision
- **Type** : Entraînement de vision périphérique
- **Objectif** : Détecter des éléments en périphérie du champ visuel
- **Usage** : Amélioration de la conscience spatiale en jeu
- **Difficulté** : Zone de détection ajustable

#### MultiTask
- **Type** : Gestion multi-tâches
- **Objectif** : Gérer plusieurs stimuli simultanément
- **Skills** :
  - Attention divisée
  - Priorisation
  - Coordination main-œil
- **Challenge** : Plusieurs objectifs en parallèle

#### DodgeMaster
- **Type** : Esquive de projectiles
- **Objectif** : Éviter des projectiles en mouvement
- **Features** :
  - Patterns de projectiles variés
  - Difficulté progressive
  - Zone de jeu dynamique
- **Application gaming** : Améliore les reflexes de dodge en MOBA/FPS

#### TrackingFocus ⭐ NOUVEAU
- **Type** : Suivi d'objets en mouvement
- **Objectif** : Suivre visuellement des cibles parmi des distracteurs
- **Phases** :
  1. **Mémorisation** : Identifier les cibles (marquées)
  2. **Tracking** : Suivre les cibles pendant qu'elles se mélangent
  3. **Sélection** : Identifier les cibles d'origine
- **Difficulté** :
  - **Easy** : 6 cercles, 2 cibles, 8s de tracking
  - **Medium** : 9 cercles, 3 cibles, 12s de tracking
  - **Hard** : 12 cercles, 4 cibles, 15s de tracking
- **Métriques** :
  - Sélections correctes/incorrectes
  - Cibles manquées
  - Taux de précision
  - Rounds complétés

### 3️⃣ Entraînement MOBA (2)

#### SkillshotTrainer
- **Type** : Précision de skillshots (compétences directionnelles)
- **Objectif** : Toucher des cibles mouvantes avec 3 types de compétences
- **Types de skillshots** :
  - **Line** : Projectile linéaire rapide (style Ezreal Q)
  - **Circle** : Zone circulaire avec délai (style Lux E)
  - **Cone** : Zone conique (style Annie W)
- **Features** :
  - Contrôles mobiles optimisés (joystick + boutons d'aptitudes)
  - Cibles avec patterns de mouvement variés
  - Système de combo
  - Stats : précision, combos, temps de survie
- **Format** : Paysage 16:9 (1280x720) pour gaming mobile
- **Difficulté** : Easy, Medium, Hard, Survival

#### LastHitTrainer
- **Type** : Entraînement au farming MOBA
- **Objectif** : Last hit des creeps pour maximiser l'or
- **Gameplay** :
  - Lane stylisée MOBA (angle 37.5°)
  - 3 types de creeps (Melee, Ranged, Cannon)
  - Adversaires qui attaquent les creeps
  - Système de combo pour les last hits parfaits
- **Mécaniques** :
  - Champions Melee (courte portée, dégâts élevés)
  - Champions Ranged (longue portée, dégâts moyens)
  - Gestion de la santé des creeps
  - Timing des attaques
- **Stats** :
  - Gold collecté
  - CS (Creep Score)
  - CS manqués
  - Précision
  - Perfect Hits
  - Max Combo
- **Système de particules** : Effets visuels pour or, hits, combos
- **Difficulté** : Easy, Medium, Hard, Survival
- **Format** : Paysage 16:9 optimisé MOBA

### 4️⃣ Bien-être (1)

#### BreathingExercise
- **Type** : Exercice de respiration guidée
- **Objectif** : Relaxation et régulation du système nerveux
- **Patterns disponibles** :
  - **Cohérence Cardiaque** : 5s inspiration / 5s expiration (432 Hz)
  - **Relaxation 4-7-8** : 4s inspire / 7s retiens / 8s expire (396 Hz)
  - **Énergisant Box Breathing** : 4-4-4-4 (528 Hz)
- **Features** :
  - Animation visuelle de guide respiratoire
  - Sons binauraux thérapeutiques (432Hz, 396Hz, 528Hz)
  - Tracking de session
  - Interface apaisante
- **Bénéfices** : Réduction du stress, amélioration de la concentration

---

## 🏗️ Architecture technique

### Frontend (Package NPM)

#### Structure modulaire
```
package/
├── src/
│   ├── components/          # 12 composants React
│   ├── themes/             # Système de thématisation
│   ├── api/                # Client API REST
│   ├── types/              # TypeScript definitions
│   └── index.ts            # Exports publics
```

#### Composants React
- **Framework** : React 18 avec TypeScript
- **Styling** : Tailwind CSS (system de classes utilitaires)
- **État** : useState, useRef, useCallback hooks
- **Animation** : Canvas API + requestAnimationFrame
- **Audio** : Web Audio API pour exercices de respiration

#### Système de thèmes
- **Thèmes prédéfinis** :
  - `ermite` : Bleu/violet, style tech
  - `shinkofa` : Orange/marron, chaleureux
  - `esport` : Cyan/magenta, compétitif
- **Personnalisation complète** :
  - Couleurs (primary, accent, backgrounds, états)
  - Border radius
  - Font family
  - Shadows
- **Intégration** : Via prop `theme` sur chaque composant

#### Client API
- **Type-safe** : Interfaces TypeScript pour toutes les requêtes
- **Configuration globale** :
  ```ts
  configureDefaultClient({
    baseUrl: 'http://localhost:8000',
    authToken: 'optional-token',
    onError: (error) => handleError(error)
  })
  ```
- **Features** :
  - Auto-save de sessions
  - Gestion d'erreurs
  - Leaderboards
  - Statistiques utilisateur

#### Exports
- **12 composants** d'exercices
- **Types TypeScript** complets
- **Enums** : MemoryExerciseType, DifficultyLevel
- **Thèmes** et utilitaires
- **Client API** configuré

### Backend (FastAPI)

#### Stack technique
- **Framework** : FastAPI 0.109
- **Database** : PostgreSQL
- **ORM** : SQLAlchemy
- **Validation** : Pydantic schemas
- **Containerisation** : Docker + Docker Compose

#### Structure
```
backend/
├── app/
│   ├── main.py              # Application FastAPI
│   ├── core/
│   │   ├── config.py        # Configuration (env vars)
│   │   └── database.py      # Database engine
│   ├── models/              # SQLAlchemy models
│   │   └── memory_exercise.py
│   ├── schemas/             # Pydantic schemas
│   │   └── memory_exercise.py
│   ├── routes/              # API endpoints
│   │   └── memory_exercises.py
│   └── services/            # Business logic
│       └── memory_exercise_service.py
├── migrations/              # SQL migrations
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

#### API Endpoints
```
POST   /api/v1/memory-exercises/sessions              # Créer session
PUT    /api/v1/memory-exercises/sessions/{id}         # Mettre à jour
GET    /api/v1/memory-exercises/sessions/{id}         # Récupérer
GET    /api/v1/memory-exercises/sessions              # Historique
GET    /api/v1/memory-exercises/leaderboard           # Classement
GET    /api/v1/memory-exercises/stats                 # Statistiques
GET    /api/v1/memory-exercises/presets/{type}        # Presets config
GET    /health                                         # Health check
```

#### Features backend
- **CORS** configuré pour développement local et production
- **Validation** automatique via Pydantic
- **Documentation** auto-générée (Swagger UI + ReDoc)
- **Sessions** : Création, update, récupération avec scoring
- **Leaderboards** : Classements par type d'exercice
- **Stats** : Agrégation de performances utilisateur
- **Presets** : Configurations recommandées par difficulté

#### Database Schema
- **Tables** :
  - `memory_exercise_sessions` : Sessions d'exercices
    - id, user_id, exercise_type, config
    - start_time, end_time, completed
    - moves, time_taken_ms
    - score, score_breakdown
  - Extensible pour autres types d'exercices

### Déploiement

#### Frontend
- **Build** : tsup (CJS + ESM + TypeScript declarations)
- **Installation** : Local via `npm install /path/to/package`
- **Publication** : NPM registry (privé actuellement)
- **Bundle size** : Optimisé avec tree-shaking

#### Backend
- **Docker** : `docker-compose up -d` (PostgreSQL + FastAPI)
- **Manuel** : Python venv + uvicorn
- **Environnement** : `.env` pour configuration
- **Database** : Migrations SQL manuelles

---

## 🛠️ Technologies utilisées

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.x | Framework UI |
| TypeScript | 5.1+ | Type safety |
| Tailwind CSS | 3.3+ | Styling |
| tsup | 7.1+ | Build tool |
| lucide-react | 0.263+ | Icônes |
| ESLint | 8.45+ | Linting |
| Canvas API | Native | Rendering gaming exercises |
| Web Audio API | Native | Breathing frequencies |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Python | 3.11+ | Langage backend |
| FastAPI | 0.109 | Framework web |
| PostgreSQL | 15+ | Database |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | 2.0+ | Validation |
| Uvicorn | Latest | ASGI server |
| Docker | Latest | Containerisation |
| pytest | Latest | Tests (planifié) |

### DevOps & Tooling
- **Git** : Version control
- **npm** : Package management
- **Docker Compose** : Orchestration
- **GitHub** : Repository hosting

---

## 📦 Structure du projet

```
brain-training/
│
├── package/                              # 📦 NPM Package (Frontend)
│   ├── src/
│   │   ├── components/
│   │   │   ├── MemoryCardGame.tsx       # Jeu de mémoire
│   │   │   ├── PatternRecall.tsx        # Motifs colorés
│   │   │   ├── SequenceMemory.tsx       # Simon game
│   │   │   ├── ImagePairs.tsx           # Paires d'images
│   │   │   ├── BreathingExercise.tsx    # Respiration guidée
│   │   │   ├── ReactionTime.tsx         # Temps de réaction
│   │   │   ├── PeripheralVision.tsx     # Vision périphérique
│   │   │   ├── MultiTask.tsx            # Multi-tâches
│   │   │   ├── DodgeMaster.tsx          # Esquive projectiles
│   │   │   ├── SkillshotTrainer.tsx     # Précision skillshots
│   │   │   ├── LastHitTrainer.tsx       # Farming MOBA
│   │   │   └── TrackingFocus.tsx        # Suivi d'objets ⭐
│   │   ├── themes/
│   │   │   ├── index.ts                 # Thèmes prédéfinis
│   │   │   └── types.ts                 # Types thèmes
│   │   ├── api/
│   │   │   └── client.ts                # Client API REST
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript types
│   │   └── index.ts                     # Exports publics
│   ├── dist/                            # Build output
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                              # 🔧 FastAPI Backend
│   ├── app/
│   │   ├── main.py                      # Application principale
│   │   ├── core/
│   │   │   ├── config.py                # Configuration
│   │   │   └── database.py              # Database setup
│   │   ├── models/
│   │   │   ├── base.py                  # Base model
│   │   │   └── memory_exercise.py       # Memory exercise model
│   │   ├── schemas/
│   │   │   └── memory_exercise.py       # Pydantic schemas
│   │   ├── routes/
│   │   │   └── memory_exercises.py      # API routes
│   │   └── services/
│   │       └── memory_exercise_service.py # Business logic
│   ├── migrations/
│   │   └── 001_create_memory_exercise_sessions.sql
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
│
├── examples/                             # 🧪 Applications de démonstration
│   └── test-demo/                       # Vite + React demo
│       ├── src/
│       │   ├── App.tsx                  # Démo des 12 exercices
│       │   └── main.tsx
│       └── package.json
│
├── Tools-Games-Project-Overview.md       # 📄 Ce document
├── README.md                             # Documentation principale
├── USER-GUIDE.md                         # Guide utilisateur
└── COPYRIGHT.md                          # Licence propriétaire
```

---

## 🚀 Développements futurs

### Court terme (3-6 mois)

#### 🎮 Nouveaux exercices gaming
- [ ] **AimTrainer** : Entraînement de visée style FPS
  - Cibles statiques et mouvantes
  - Patterns de spawn variés
  - Tracking de flick shots vs tracking aim
- [ ] **AbilityCombo** : Entraînement de combos de compétences
  - Séquences de touches à reproduire
  - Timing windows précis
  - Combos MOBA classiques
- [ ] **MapAwareness** : Mini-map awareness training
  - Détecter événements en périphérie
  - Gestion attention principale + mini-map

#### 🧠 Nouveaux exercices cognitifs
- [ ] **NumberMemory** : Mémorisation de suites de chiffres
- [ ] **VerbalMemory** : Reconnaissance de mots
- [ ] **ChimpTest** : Test du chimpanzé (Human Benchmark)

#### 🎨 Améliorations UX
- [ ] **Statistiques avancées** : Graphiques de progression
- [ ] **Système de médailles** : Achievements/Badges
- [ ] **Modes de jeu** :
  - Mode entraînement libre
  - Mode compétitif chronométré
  - Mode challenge quotidien
- [ ] **Profils utilisateurs** : Sauvegarde de progression
- [ ] **Dark mode** automatique

### Moyen terme (6-12 mois)

#### 🌐 Backend & Infrastructure
- [ ] **Authentification complète** :
  - JWT tokens
  - OAuth2 (Google, Discord)
  - Session management
- [ ] **Système de classement global** :
  - Leaderboards temps réel
  - Classements par région
  - Saisons compétitives
- [ ] **Analytics** :
  - Dashboard admin
  - Métriques d'usage
  - Heatmaps de performances
- [ ] **API pour mobile** :
  - Support React Native
  - Endpoints optimisés mobile

#### 🎯 Gaming esport integration
- [ ] **Intégration jeux spécifiques** :
  - Honor of Kings (HOK) presets
  - League of Legends presets
  - Mobile Legends presets
- [ ] **Replay system** : Revoir ses sessions
- [ ] **Coaching AI** : Recommandations basées sur performances
- [ ] **Tournois intégrés** : Compétitions communautaires

#### 📱 Mobilité
- [ ] **Application mobile native** (React Native)
  - Version iOS
  - Version Android
  - Synchronisation cloud
- [ ] **Progressive Web App (PWA)**
  - Offline mode
  - Installation sur écran d'accueil
  - Notifications push

### Long terme (12+ mois)

#### 🤖 Intelligence Artificielle
- [ ] **Adaptation difficulté dynamique** :
  - Analyse performances en temps réel
  - Ajustement automatique
  - Courbe d'apprentissage optimale
- [ ] **Recommandations personnalisées** :
  - Exercices suggérés selon faiblesses
  - Plans d'entraînement sur mesure
- [ ] **Prédiction de performances** :
  - Estimation progression future
  - Objectifs intelligents

#### 🌍 Social & Communauté
- [ ] **Système d'amis** :
  - Comparaison de scores
  - Défis entre amis
- [ ] **Guildes/Teams** :
  - Classements d'équipe
  - Entraînement collectif
- [ ] **Partage social** :
  - Partage de scores
  - Clips de meilleures performances
- [ ] **Commentaires et tips communautaires**

#### 🎓 Éducation & Recherche
- [ ] **Mode éducatif** :
  - Exercices pour écoles
  - Rapports pour professeurs
- [ ] **Partenariats recherche** :
  - Études neurosciences
  - Données anonymisées
- [ ] **Certification** :
  - Certificats de progression
  - Niveaux de compétence validés

#### 💰 Monétisation (optionnel)
- [ ] **Version Premium** :
  - Exercices exclusifs
  - Analytics avancés
  - Sans publicité
- [ ] **Cosmétiques** :
  - Thèmes premium
  - Effets de particules
  - Avatars/Bordures
- [ ] **Coaching** : Sessions avec coachs esport

---

## 🔧 Maintenance et organisation

### Stratégie de maintenance

#### 🔄 Versioning
- **Semantic Versioning** : MAJOR.MINOR.PATCH
  - MAJOR : Breaking changes
  - MINOR : Nouvelles features
  - PATCH : Bug fixes
- **Git Flow** :
  - `master` : Production stable
  - `develop` : Développement actif
  - `feature/*` : Nouvelles fonctionnalités
  - `hotfix/*` : Corrections urgentes

#### 📊 Priorités
1. **Critique (P0)** : Bugs bloquants, sécurité
2. **Haute (P1)** : Features promises, bugs majeurs
3. **Moyenne (P2)** : Améliorations UX, optimisations
4. **Basse (P3)** : Nice-to-have, refactoring non urgent

#### 🧪 Tests
- [ ] **Tests unitaires** : Jest/Vitest pour composants
- [ ] **Tests intégration** : API endpoints
- [ ] **Tests E2E** : Playwright/Cypress pour flows utilisateur
- [ ] **CI/CD** : GitHub Actions
  - Lint sur chaque PR
  - Tests automatiques
  - Build verification

#### 📝 Documentation
- **README.md** : Vue d'ensemble, installation, usage
- **USER-GUIDE.md** : Guide détaillé utilisateur
- **API Documentation** : Swagger/ReDoc auto-généré
- **CHANGELOG.md** : Historique des versions
- **Code comments** : JSDoc pour fonctions publiques

### Organisation du développement

#### 🎯 Roadmap trimestrielle
- **Q1 2026** :
  - ✅ LastHitTrainer
  - ✅ SkillshotTrainer
  - ✅ TrackingFocus
  - 🔄 AimTrainer
  - 🔄 Statistiques avancées

- **Q2 2026** :
  - AbilityCombo
  - MapAwareness
  - Système d'authentification
  - Application mobile (début)

- **Q3 2026** :
  - Leaderboards globaux
  - Système de médailles
  - PWA
  - Tests complets

- **Q4 2026** :
  - IA adaptive
  - Social features
  - Optimisations performances
  - Préparation v2.0

#### 📦 Index des projets

| Projet | Statut | Priorité | Dépendances |
|--------|--------|----------|-------------|
| **brain-training (core)** | 🟢 Actif | P0 | - |
| AimTrainer | 🟡 Planifié | P1 | Canvas API |
| AbilityCombo | 🟡 Planifié | P2 | - |
| MapAwareness | 🟡 Planifié | P2 | - |
| Authentification JWT | 🟡 Planifié | P1 | Backend |
| Application mobile | 🟡 Planifié | P1 | React Native |
| IA adaptive | 🔴 Recherche | P3 | ML models |
| Social features | 🔴 Recherche | P2 | Backend auth |

#### 🔗 Intégrations prévues

**Plateformes The Ermite** :
- **Shinkofa platform** : Exercices bien-être
- **Esport coaching platform** : Gaming exercises
- **Personal website** : Démo publique
- **Mobile apps** : Applications dédiées

**Ecosystème externe** :
- Discord bot : Défis communautaires
- Twitch extension : Overlay pour streamers
- Analytics platforms : Google Analytics, Mixpanel

### Bonnes pratiques

#### 💻 Code quality
- **TypeScript strict mode** : Type safety maximale
- **ESLint** : Pas de warnings en production
- **Prettier** : Formatage automatique
- **Commits conventionnels** :
  - `feat:` Nouvelle feature
  - `fix:` Bug fix
  - `refactor:` Refactoring
  - `docs:` Documentation
  - `chore:` Maintenance
  - `test:` Tests

#### 🔒 Sécurité
- **Pas de secrets dans le code** : .env pour tout
- **Validation input** : Côté client ET serveur
- **HTTPS** en production
- **Rate limiting** sur API
- **CORS** configuré strictement
- **SQL injection** : ORM + parameterized queries
- **XSS prevention** : React auto-escaping

#### 📈 Performance
- **Lazy loading** : Components à la demande
- **Code splitting** : Bundles optimisés
- **Memoization** : React.memo, useMemo, useCallback
- **Canvas optimization** : requestAnimationFrame, off-screen rendering
- **Database indexing** : Sur colonnes fréquemment requêtées
- **Caching** : Redis pour leaderboards (futur)

---

## 📊 Métriques de succès

### KPIs Utilisateur
- **Rétention** : Utilisateurs actifs quotidiens/hebdomadaires
- **Engagement** : Sessions moyennes par utilisateur
- **Progression** : Amélioration scores dans le temps
- **Satisfaction** : NPS (Net Promoter Score)

### KPIs Techniques
- **Performance** :
  - Temps de chargement < 2s
  - 60 FPS sur exercices Canvas
  - API response time < 100ms
- **Fiabilité** :
  - Uptime > 99.5%
  - Error rate < 0.1%
- **Qualité code** :
  - Test coverage > 80%
  - 0 critical security issues

### KPIs Business (si monétisation)
- **Conversion** : Free to Premium rate
- **LTV** : Lifetime Value utilisateur
- **CAC** : Cost Acquisition Client
- **Churn** : Taux de désabonnement

---

## 🤝 Contribution et licence

### Licence
**Propriétaire** - Copyright © 2025-2026 Jay "The Ermite" Goncalves

Usage personnel uniquement. Voir [COPYRIGHT.md](./COPYRIGHT.md) pour détails.

### Contribution
Projet personnel en développement actif.

Contact : Jay "The Ermite" Goncalves

---

## 📚 Ressources

### Documentation
- [README.md](./README.md) - Documentation technique
- [USER-GUIDE.md](./USER-GUIDE.md) - Guide utilisateur
- API Docs : http://localhost:8000/docs (en local)

### Références externes
- **React** : https://react.dev
- **TypeScript** : https://www.typescriptlang.org
- **Tailwind CSS** : https://tailwindcss.com
- **FastAPI** : https://fastapi.tiangolo.com
- **Canvas API** : https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

**Document généré le** : 2026-01-03
**Version du projet** : 1.0.0
**Dernière révision** : Ajout de TrackingFocus exercise

---

🧠 Projet @theermite/brain-training - Entraînement cognitif et gaming de nouvelle génération
