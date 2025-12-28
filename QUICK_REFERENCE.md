# 🚀 Référence Rapide - Brain Training

## Commandes à Connaître par Cœur

### 🔨 Développement Quotidien

```bash
# Mode développement auto-rebuild (GARDE OUVERT)
cd /home/ubuntu/brain-training/package && npm run dev

# Build unique
cd /home/ubuntu/brain-training/package && npm run build

# Réinstaller + test
cd /home/ubuntu/brain-training/examples/test-demo && \
rm -rf node_modules/.vite node_modules/@theermite && \
npm install ../../package --legacy-peer-deps --force && \
npm run dev
```

### 📝 Git - Versionning

```bash
# Commit rapide
git add .
git commit -m "fix: description du fix"
git push

# Nouvelle version
cd /home/ubuntu/brain-training/package
npm version patch    # 1.0.0 → 1.0.1 (bug fix)
npm version minor    # 1.0.0 → 1.1.0 (nouveau jeu)
npm version major    # 1.0.0 → 2.0.0 (breaking change)
git push --tags
```

---

## 🎮 Créer un Nouveau Jeu - Checklist

### ✅ Étapes

- [ ] 1. Copier un jeu similaire dans `/package/src/components/`
- [ ] 2. Renommer et modifier le composant
- [ ] 3. Ajouter export dans `/package/src/index.ts`
- [ ] 4. Build : `npm run build`
- [ ] 5. Ajouter dans `/examples/test-demo/src/App.tsx`
- [ ] 6. Test : Réinstaller + `npm run dev`
- [ ] 7. Si OK : `npm version minor` + `git push --tags`

### 📋 Template Minimal

```tsx
// /package/src/components/MonJeu.tsx
import { useState } from 'react'
import { resolveTheme, getThemeClasses, mergeThemeClasses } from '../themes'
import { ExerciseBaseProps } from '../types'

export interface MonJeuProps extends ExerciseBaseProps {
  difficulty?: 'easy' | 'medium' | 'hard'
}

export function MonJeu({ difficulty = 'medium', className, theme, onComplete }: MonJeuProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const currentTheme = resolveTheme(theme)
  const themeClasses = getThemeClasses(currentTheme)

  return (
    <div className={mergeThemeClasses(
      `h-full flex flex-col ${themeClasses.bgMain} ${themeClasses.textMain}`,
      className
    )}>
      {/* Ton jeu ici */}
    </div>
  )
}
```

```typescript
// /package/src/index.ts - Ajouter :
export { MonJeu } from './components/MonJeu'
export type { MonJeuProps } from './components/MonJeu'
```

---

## 🎨 Classes Tailwind Utiles

### Layout
```tsx
// Container principal
className="h-full flex flex-col"

// Centrer contenu
className="flex items-center justify-center"

// Grid responsive
className="grid grid-cols-2 md:grid-cols-4 gap-4"

// Espacement
className="p-4 m-4 mb-6 mt-2"  // padding, margin
```

### Boutons
```tsx
// Bouton principal
className={`px-6 py-3 ${themeClasses.bgPrimary} ${themeClasses.borderRadius} transition-all hover:scale-105`}

// Bouton secondaire
className={`px-6 py-3 ${themeClasses.bgCard} ${themeClasses.border} border`}

// Bouton danger
className={`px-6 py-3 ${themeClasses.bgError} hover:opacity-90`}
```

### Effets
```tsx
// Shadow
className={themeClasses.shadow}

// Animations
className="transition-all duration-300"
className="hover:scale-105 active:scale-95"
className="animate-pulse"

// Touch-friendly
className="touch-manipulation select-none"
```

---

## 🐛 Dépannage Express

### Problème : Changements non visibles
```bash
# Solution 1 : Clear cache Vite
rm -rf /home/ubuntu/brain-training/examples/test-demo/node_modules/.vite

# Solution 2 : Rebuild complet
cd /home/ubuntu/brain-training/package && npm run build
cd /home/ubuntu/brain-training/examples/test-demo
rm -rf node_modules/@theermite
npm install ../../package --force

# Solution 3 : Hard refresh navigateur
# Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
```

### Problème : Erreur TypeScript
```bash
# Vérifier les types
cd /home/ubuntu/brain-training/package
npm run type-check

# Si erreur dans les imports
# Vérifier que tu as bien exporté dans /package/src/index.ts
```

### Problème : SSL / Domaine
```bash
# Vérifier nginx
sudo nginx -t
sudo systemctl reload nginx

# Vérifier certificat
sudo certbot certificates

# Renouveler si expiré
sudo certbot renew
```

---

## 📊 Thèmes Disponibles

```tsx
// 1. Theme Ermite (défaut)
<MonJeu theme="ermite" />

// 2. Theme dark
<MonJeu theme="dark" />

// 3. Theme light
<MonJeu theme="light" />

// 4. Theme personnalisé
<MonJeu theme={{
  name: 'custom',
  bgMain: 'bg-purple-900',
  bgPrimary: 'bg-purple-600',
  // ... etc
}} />
```

### Classes Thème Communes
```tsx
const themeClasses = getThemeClasses(currentTheme)

themeClasses.bgMain         // Background principal
themeClasses.bgPrimary      // Boutons principaux
themeClasses.bgSecondary    // Cards
themeClasses.bgCard         // Éléments secondaires
themeClasses.textMain       // Texte principal
themeClasses.textSecondary  // Texte secondaire
themeClasses.borderRadius   // Arrondi uniforme
themeClasses.shadow         // Ombre
```

---

## 🎯 Props Standard pour Tous les Jeux

```tsx
interface MesPropsStandard extends ExerciseBaseProps {
  // Spécifiques à ton jeu
  duration?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

// ExerciseBaseProps inclut automatiquement :
// - className?: string
// - theme?: string | ThemeConfig
// - onComplete?: (session: SessionResult) => void
// - onProgress?: (progress: any) => void
```

---

## 📦 Structure d'une Session Complète

```tsx
// Toujours envoyer ces infos au onComplete
if (onComplete) {
  onComplete({
    exercise_type: 'mon_jeu',           // Type unique
    difficulty: difficulty,              // easy/medium/hard
    is_completed: true,                  // true si terminé
    score: finalScore,                   // Score final
    time_elapsed_ms: elapsedTime,       // Temps en millisecondes
    accuracy: accuracyPercent,          // Précision en %
    total_moves: totalMoves,            // Nombre d'actions
    correct_moves: correctMoves,        // Actions correctes
    incorrect_moves: incorrectMoves,    // Actions incorrectes
    // ... autres métriques spécifiques
  })
}
```

---

## 🔗 URLs de Test

```
Local (VPS):
http://localhost:5173/

IP directe:
http://217.182.206.127:5173/

Domaine (SSL):
https://brain-training.theermite.com
```

---

## 💡 Astuces Pro

### Performance
```tsx
// ✅ BON : Utiliser useCallback pour fonctions
const handleClick = useCallback(() => {
  // logique
}, [dependencies])

// ✅ BON : useMemo pour calculs lourds
const expensiveValue = useMemo(() => {
  return heavyCalculation(data)
}, [data])
```

### Cleanup
```tsx
// ⚠️ IMPORTANT : Toujours cleanup les timers
useEffect(() => {
  const timer = setInterval(() => { ... }, 1000)

  return () => {
    clearInterval(timer)  // ← NE JAMAIS OUBLIER
  }
}, [])
```

### Mobile-First
```tsx
// Penser mobile d'abord
className="text-sm sm:text-base md:text-lg"
className="p-2 sm:p-4 md:p-6"
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4"

// Touch-friendly (44px minimum)
style={{ minWidth: '44px', minHeight: '44px' }}
```

---

## 🚨 Erreurs à Éviter

### ❌ NE JAMAIS
```tsx
// ❌ Modifier directement dans /dist/
vim /home/ubuntu/brain-training/package/dist/index.js

// ❌ Oublier de build
// (modifier dans /src/ puis lancer test-demo sans rebuild)

// ❌ Hardcoder des couleurs
<div className="bg-blue-500">  // ❌ BAD

// ❌ Oublier le cleanup
useEffect(() => {
  setInterval(() => { ... }, 1000)
  // ❌ Pas de return cleanup = memory leak !
}, [])
```

### ✅ TOUJOURS
```tsx
// ✅ Utiliser les themeClasses
<div className={themeClasses.bgPrimary}>

// ✅ Build avant de tester
npm run build

// ✅ Cleanup les effets
return () => clearInterval(timer)

// ✅ Types TypeScript
interface MonJeuProps extends ExerciseBaseProps { ... }
```

---

## 📱 Workflow Mobile Testing

```bash
# 1. Vérifier responsive dans DevTools
# Chrome: F12 > Toggle device toolbar (Ctrl+Shift+M)

# 2. Test sur vrai mobile
# Ouvrir : https://brain-training.theermite.com
# Sur le mobile connecté au même réseau

# 3. Debug mobile
# Chrome://inspect sur PC
# Activer USB debugging sur mobile
```

---

**🔖 Garde ce fichier sous la main !**

*Créé par Jay "The Ermite" Goncalves*
