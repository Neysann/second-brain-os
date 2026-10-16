# PLAN D'ARCHITECTURE ET D'IMPLÉMENTATION — SYNTROPY OS

**Projet** : Syntropy (Système de Productivité & Connaissances - inspiré de Notion, Obsidian et Templation)  
**Nom Firebase** : `second-brain-os-e6a83` (`evris-syntropy-os`)  
**URL de Déploiement** : https://second-brain-os-e6a83.web.app  
**Stack** : Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons, `@uiw/react-md-editor`, Firebase Cloud Firestore, Firebase Hosting & Auth.  
**Version** : V2.6.0 (Liquid Glass iOS Translucency & UI System)

---

## 1. Arborescence Exacte des Fichiers

```text
c:\PROJET ASSISTANT - JARVIS\
├── PLAN.md                          # Ce document d'architecture et de planification
├── patchnote.txt                    # Journal des modifications et versions
├── package.json                     # Scripts & Dépendances (Next, Electron, builder, Firebase)
├── electron-builder.json            # Configuration installateur Windows NSIS Syntropy-OS-Setup-2.5.0.exe
├── tsconfig.json                    # Configuration TypeScript
├── next.config.ts                   # Configuration Next.js (output: 'export', transpilePackages)
├── public/                          # Fichiers statiques et icônes (logo.png, favicon.ico)
├── build/                           # Ressources de build pour Electron (icon.ico, icon.png)
├── electron/
│   ├── main.js                      # Processus principal Electron (Alt+Espace, Tray, Auto-start, FS local)
│   ├── auto-updater.js              # Moteur modulaire de mises à jour automatiques (electron-updater)
│   └── preload.js                   # Pont IPC sécurisé exposant window.electronAPI
└── src/
    ├── app/
    │   ├── globals.css              # Thème global Tailwind, Obsidian dark mode (zinc-950)
    │   ├── layout.tsx               # Root Layout avec Providers
    │   ├── page.tsx                 # Dashboard Quotidien
    │   ├── quick-capture/           # Mini-fenêtre de capture rapide Alt+Espace (borderless / always-on-top)
    │   │   └── page.tsx
    │   ├── tasks/
    │   │   └── page.tsx             # Module Tâches & Projets (Méthode PARA, Vues Liste & Kanban)
    │   ├── notes/
    │   │   └── page.tsx             # Module Notes & Connaissances : Éditeur Hybride (Markdown + Stylus)
    │   └── settings/
    │       └── page.tsx             # Paramètres système & Onglet Administrateur
    ├── components/
    │   ├── AppShell.tsx             # Coquille applicative avec verrouillage administrateur desktop
    │   ├── AdminControlPanel.tsx    # Console d'administration & Téléchargement Syntropy-OS-Setup-2.5.0.exe
    │   ├── settings/
    │   │   └── AdminUpdateSection.tsx # Carte interactive de mise à jour (progression %, redémarrage)
    │   ├── Sidebar.tsx              # Sidebar latérale rétractable
    │   ├── WhatsNewModal.tsx        # Pop-up de présentation des versions et nouveautés
    │   ├── CommandPaletteModal.tsx  # Palette de commandes universelle
    │   └── ...
    ├── context/
    │   ├── AuthContext.tsx          # Gestion des sessions Firebase Auth & Rôles Admin
    │   ├── DataContext.tsx          # Synchronisation Cloud Firestore et mode local
    │   └── ...
    └── lib/
        ├── admin.ts                 # Privilèges administrateur, audit logs et gestion des comptes
        └── firebase.ts              # Configuration Firebase App & Firestore
```

> **Note d'intégration Cours & Devoirs** : Conformément à la stratégie d'unification du Second Brain, la prise de notes manuscrite et hybride est nativement intégrée dans le module centralisé **Notes & Connaissances** (`/notes`). Les cours, révisions et devoirs s'organisent via les dossiers thématiques et catégories PARA existants sans disperser les données dans une route `/devoirs` ou une collection `assignments` superflue.

---

## 2. Modèles de Données TypeScript

### 2.1 Types et Énumérations Fondamentales
```typescript
// Catégorisation selon la méthode PARA
export type ParaCategory = 'project' | 'area' | 'resource' | 'archive';

// Statuts des tâches
export type TaskStatus = 'todo' | 'in_progress' | 'done';

// Niveaux de priorité
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Statuts des projets
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

// Thème d'affichage
export type ThemeMode = 'dark' | 'light';
```

### 2.2 Modèle Tâche (`Task`)
```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: ParaCategory;
  projectId?: string;        // Référence au projet parent (optionnel)
  dueDate?: string;          // Format ISO YYYY-MM-DD
  completedAt?: string;      // Date de complétion
  tags: string[];            // Tags (ex: ["urgent", "dev", "design"])
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
  userId?: string;           // Identifiant utilisateur Firebase Auth
}
```

### 2.3 Modèle Projet (`Project`)
```typescript
export interface Project {
  id: string;
  title: string;
  description?: string;
  category: ParaCategory;
  status: ProjectStatus;
  color?: string;            // Couleur d'identification (Hex ou Tailwind)
  deadline?: string;         // Date limite (ISO YYYY-MM-DD)
  progress?: number;         // Pourcentage calculé (0-100%)
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}
```

### 2.4 Modèle Note (`Note`) & Dessin Stylus Vectoriel
```typescript
export type InkPenTool = 'pen' | 'fountain' | 'highlighter';
export type InkTool = InkPenTool | 'eraser' | 'lasso';
export type InkEraserMode = 'stroke' | 'pixel';
export type InkBackground = 'dark' | 'lined' | 'dots';
export type InkWidthPreset = 'thin' | 'medium' | 'thick';

export interface InkStroke {
  id: string;
  tool: InkPenTool;
  color: string;
  width: number;            // Largeur de base en unités monde
  points: number[];         // [x, y, pressure, x, y, pressure, ...]
}

export interface InkDocument {
  version: 1;
  background: InkBackground;
  strokes: InkStroke[];
}

export interface Note {
  id: string;
  title: string;
  content: string;           // Contenu au format Markdown
  category: ParaCategory;
  folderId?: string;         // Dossier parent
  projectId?: string;        // Liaison optionnelle avec un projet
  tags: string[];            // Tags pour le filtrage
  isPinned?: boolean;        // Épinglée en haut de liste
  attachments?: NoteAttachment[];
  format?: 'text' | 'ink';   // Format actif (éditeur Markdown ou Manuscrit)
  ink?: string | null;       // Données vectorielles encodées (compact g1: gzip/base64)
  inkChunks?: number;        // Nombre de chunks si > 800 Ko (sous-collection Firestore)
  createdAt: string;
  updatedAt: string;
  userId?: string;
}
```

---

## 3. Structure des Collections Cloud Firestore

L'architecture Firestore est organisée en collections racines sécurisées par utilisateur et sous-collections modulaires :

### 3.1 Collection `tasks`
- **Chemin** : `/tasks/{taskId}`
- **Schéma Document** :
  - `id`: `string`
  - `title`: `string` (Requis)
  - `description`: `string` (Optionnel)
  - `status`: `'todo' | 'in_progress' | 'done'`
  - `priority`: `'low' | 'medium' | 'high' | 'urgent'`
  - `category`: `'project' | 'area' | 'resource' | 'archive'`
  - `projectId`: `string | null`
  - `dueDate`: `string | null` (Format YYYY-MM-DD)
  - `completedAt`: `string | null`
  - `tags`: `array of strings`
  - `createdAt`: `timestamp / string ISO`
  - `updatedAt`: `timestamp / string ISO`
  - `userId`: `string`

### 3.2 Collection `projects`
- **Chemin** : `/projects/{projectId}`
- **Schéma Document** :
  - `id`: `string`
  - `title`: `string` (Requis)
  - `description`: `string` (Optionnel)
  - `category`: `'project' | 'area' | 'resource' | 'archive'`
  - `status`: `'active' | 'on_hold' | 'completed' | 'archived'`
  - `color`: `string` (ex: `#6366f1`)
  - `deadline`: `string | null`
  - `tags`: `array of strings`
  - `createdAt`: `timestamp / string ISO`
  - `updatedAt`: `timestamp / string ISO`
  - `userId`: `string`

### 3.3 Collection `notes`
- **Chemin** : `/notes/{noteId}`
- **Schéma Document** :
  - `id`: `string`
  - `title`: `string` (Requis)
  - `content`: `string` (Markdown complet)
  - `category`: `'project' | 'area' | 'resource' | 'archive'`
  - `folderId`: `string | null`
  - `projectId`: `string | null`
  - `tags`: `array of strings`
  - `isPinned`: `boolean`
  - `attachments`: `array of NoteAttachment`
  - `format`: `'text' | 'ink'` (Mode actif)
  - `ink`: `string | null` (Données vectorielles encodées compactes inline si <= 800 Ko)
  - `inkChunks`: `number` (Nombre de chunks en sous-collection si > 800 Ko)
  - `createdAt`: `timestamp / string ISO`
  - `updatedAt`: `timestamp / string ISO`
  - `userId`: `string`

### 3.4 Sous-collection `notes/{noteId}/inkChunks` (Segmentation haute capacité)
- **Chemin** : `/notes/{noteId}/inkChunks/{chunkIndex}`
- **Schéma Document** :
  - `i`: `number` (Index séquentiel du chunk 0, 1, 2...)
  - `data`: `string` (Segment encodé base64 de 700 Ko max)
- **Objectif** : Permettre des toiles manuscrites vectorielles de plusieurs mégabytes tout en respectant la contrainte stricte de 1 Mo par document Firestore.

---

## 4. Direction Artistique & Expérience Utilisateur (DA)

- **Palette Sombre Principale** :
  - Fond de page : `zinc-950` (`#09090b`)
  - Cartes et panneaux : `zinc-900` (`#18181b`)
  - Éléments surélevés / popovers : `zinc-850` / `zinc-800` (`#27272a`)
  - Bordures subtiles : `zinc-800/80` et `zinc-700/50`
  - Typographie principale : `zinc-100` (`#f4f4f5`)
  - Texte secondaire et métadonnées : `zinc-400` / `zinc-500`
  - Accents d'action : `indigo-500` / `violet-500` avec lueurs discrètes (`emerald-500` pour terminé, `amber-500` pour en cours, `rose-500` pour urgent).
- **Mode Clair** :
  - Fond : `zinc-50`, cartes : `white`, bordures : `zinc-200`, texte : `zinc-900`.
- **Navigation latérale** :
  - Rétractable avec transition fluide, icônes Lucide nettes, infobulles et badge de statut du stockage (Cloud vs Local).

---

## 5. Plan Étape par Étape de l'Implémentation

1. **Étape 1 : Création de la documentation contractuelle**  
   - Génération de `PLAN.md` et `patchnote.txt` à la racine.
2. **Étape 2 : Configuration de l'environnement & Dépendances**  
   - Unification du projet racine avec les scripts Next.js et dépendances requises (`firebase`, `lucide-react`, `@uiw/react-md-editor`, `clsx`, `tailwind-merge`).
   - Configuration de `.env.example` et `.env.local` pour `Second-brain-OS`.
3. **Étape 3 : Types TypeScript & Détection du Mode Dégradé**  
   - Implémentation de `src/types/index.ts`.
   - Implémentation de `src/lib/firebase.ts` avec vérification dynamique de présence des variables d'environnement.
   - Création de `src/lib/mockData.ts` avec un jeu complet de données de démonstration (tâches PARA, projets actifs, notes documentées).
   - Couche `src/lib/dataService.ts` offrant une interface unifiée Firestore / LocalStorage.
4. **Étape 4 : Contextes React & Design System**  
   - `src/context/ThemeContext.tsx` : support dynamique sombre/clair.
   - `src/context/DataContext.tsx` : gestion d'état centralisée et réactive avec synchronisation temps réel.
   - `src/app/globals.css` : configuration soignée du thème Obsidian/Notion.
5. **Étape 5 : Navigation & Shell Global**  
   - `src/components/Sidebar.tsx` : navigation rétractable, profil, indicateur de persistance, toggle mode sombre/clair.
   - `src/components/GlobalSearchModal.tsx` : recherche rapide universelle (tâches, notes, projets).
   - `src/app/layout.tsx` : intégration de la structure globale.
6. **Étape 6 : Module 1 - Dashboard Quotidien (`src/app/page.tsx`)**  
   - Salutation dynamique selon l'heure (matin/après-midi/soir) et date formatée en français.
   - Citation inspirante motivante aléatoire ou rafraîchissable.
   - Statistiques globales (tâches faites, tâches en cours, projets actifs, notes).
   - Widgets des tâches prioritaires du jour (actions rapides de complétion).
   - Aperçu des dernières notes récemment modifiées avec tags.
   - Aperçu des projets actifs avec barres de complétion.
7. **Étape 7 : Module 2 - Projets & Tâches - Méthode PARA (`src/app/tasks/page.tsx`)**  
   - Filtrage PARA : Projets, Domaines, Ressources, Archives.
   - Commutateur de vue : Vue Liste tabulaire épurée et Vue Kanban dynamique à 3 colonnes (À faire, En cours, Terminé).
   - Filtres de priorité, de statut et recherche textuelle instantanée.
   - Modals interactifs pour créer et modifier des tâches et des projets (`TaskModal.tsx`, `ProjectModal.tsx`).
8. **Étape 8 : Module 3 - Notes & Connaissances (`src/app/notes/page.tsx`)**  
   - Interface triple volet façon Obsidian / Notion.
   - Sidebar de notes avec filtres par tags cliquables, recherche temps réel, et création en un clic.
   - Zone d'édition avec `@uiw/react-md-editor` (via `MarkdownEditorWrapper.tsx` avec `ssr: false`).
   - Sauvegarde automatique en temps réel avec indicateur visuel discret ("Enregistré").
9. **Étape 9 : Validation & Revue de Qualité**  
   - Vérification du build Next.js (`npm run build`).
   - Validation du mode dégradé (sans clés Firebase) et du mode connecté.
   - Mise à jour finale du fichier `patchnote.txt`.

---

## 6. Architecture Moteur Desktop Native Windows (.exe) & Procédure de Compilation (V2.5.0)

### 6.1 Pile Technique Desktop
- **Conteneur & Processus Système** : Electron 44+ avec pont IPC sécurisé (`contextBridge`) et `electron-builder` 26+.
- **Génération d'Exécutable** : Cible NSIS Windows 64-bit générant le package autonome `Syntropy-OS-Setup-2.5.0.exe` dans le répertoire `dist/`.
- **Ressources Visuelles** : Icône haute résolution `.ico` assignée pour l'installateur, le bureau et la barre des tâches (`build/icon.ico`).
- **Serveur de Production Embarqué** : En mode packagé, un serveur HTTP local Node.js sert les fichiers du dossier statique `out/` sur `http://127.0.0.1:38200` afin de préserver l'intégrité de l'authentification Firebase OAuth sans conflit de protocole `file://`.

### 6.2 Fonctionnalités Natives Système Déployées
1. **Raccourci Clavier Global & Capture Flottante (`Alt + Espace`)** :
   - Enregistrement dans le processus principal via `globalShortcut.register('Alt+Space')`.
   - Ouverture d'une fenêtre mini-capture sans bordures (*frameless*), centrée et en premier plan permanent (*always-on-top*).
   - Route `/quick-capture` dédiée à la saisie ultrarapide de notes, tâches ou idées (Inbox PARA) avec dictée vocale intégrée et sauvegarde directe Firestore.
2. **Zone de Notification (System Tray)** :
   - Icône violette synaptique dans la zone de notification Windows.
   - Réduction automatique en arrière-plan lors du clic sur le bouton de fermeture [X].
   - Menu contextuel au clic droit :
     * ⏯️ Démarrer / Pause Pomodoro
     * 📋 Aperçu du Top 3 des tâches du jour
     * 📝 Nouvelle Note rapide (Alt+Espace)
     * 🚪 Quitter Syntropy OS
3. **Démarrage Automatique au Boot (Auto-Start)** :
   - Exploitation de l'API native `app.setLoginItemSettings()` d'Electron.
   - Commutateur interactif dans l'onglet Paramètres Administrateur permettant d'activer ou désactiver le lancement automatique à l'ouverture de Windows.
4. **Notifications Natives Interactives** :
   - Déclenchement de notifications Windows Toast avec boutons d'action intégrés (*"Terminé"*, *"Reporter de 15 min"*).
5. **Accès & Sauvegarde dans le Système de Fichiers Local** :
   - Boîte de dialogue de sélection de dossier via `dialog.showOpenDialog`.
   - Écriture directe des sauvegardes JSON intégrales et exportation en masse des notes au format Markdown (`.md`) via le module Node.js `fs.promises`.
6. **Vérification de Sécurité au Lancement Desktop** :
   - Contrôle d'authentification Firebase au démarrage de l'application desktop.
   - Si la session connectée n'est pas un administrateur (`role === 'admin'` ou `isAdmin`), affichage d'un écran de verrouillage haute sécurité avec option de déconnexion ou de fermeture de l'application.

### 6.3 Moteur de Mises à Jour Automatiques Silencieuses (`electron-updater`)
- **Canal de Publication** : GitHub Releases configuré dans `electron-builder.json` (`owner: "Neysann"`, `repo: "second-brain-os"`).
- **Vérification au Démarrage** : Déclenchée silencieusement 4 secondes après le lancement de l'application desktop.
- **Téléchargement Silencieux** : `autoUpdater.autoDownload = true` télécharge automatiquement les différentiels et nouveaux installeurs en arrière-plan.
- **Notification Interactive** : À l'achèvement du téléchargement, émission d'un événement `update-status: downloaded` et d'une notification Toast Windows invitant l'administrateur à redémarrer (`autoUpdater.quitAndInstall()`).
- **Contrôles dans l'Interface** :
  * Bouton interactif *« Vérifier les mises à jour »* dans l'onglet Paramètres Administrateur.
  * Bouton dynamique *« Redémarrer et Installer »* lors de la disponibilité d'un correctif.
  * Entrée *« 🔄 Rechercher des mises à jour »* dans le menu contextuel du System Tray.

### 6.4 Commandes, Procédure de Compilation et Déploiement des Mises à Jour

```bash
# 1. Développement en mode Desktop connecté (Next.js dev + Electron live) :
npm run dev:desktop

# 2. Compilation de l'application Next.js (export statique dans out/) :
npm run build

# 3. Compilation complète de l'installateur natif Windows (.exe) :
npm run build:win

# 4. Publication d'une mise à jour vers GitHub Releases (génère latest.yml et l'installeur .exe) :
$env:GH_TOKEN = "votre_github_personal_access_token"
npx electron-builder --win nsis --publish always
```

> **Emplacement du livrable compilé** :  
> Le fichier installable est produit dans `c:\PROJET ASSISTANT - JARVIS\dist\Syntropy-OS-Setup-2.5.0.exe`.

---

## 7. Gestion de la Section d'Administration (`/settings`)

### 7.1 Contrôle d'Accès Strict
- L'onglet **« Paramètres Administrateur »** dans la page `/settings` est conditionné à la vérification stricte :  
  `user?.role === 'admin' || user?.isAdmin || isSiteAdmin(user?.email)`
- Pour les utilisateurs standards non-administrateurs :
  * L'onglet est masqué de la barre de navigation des paramètres.
  * Si l'onglet est forcé par URL (`/settings?tab=admin`), un composant de restriction d'accès rouge/ambre informe l'utilisateur du refus d'accréditation.

### 7.2 Carte de Téléchargement & Contrôles Desktop
- **Bouton principal** : *« Télécharger Syntropy-OS-Setup-2.5.0.exe »* relié à la release officielle GitHub avec badge *Admin Only*.
- **Bouton miroir** : *« Archive .zip (Miroir) »* hébergée sur Firebase Hosting pour téléchargement alternatif direct.
- **Panneau de pilotage natif** :
  * Carte Moteur de Mises à Jour Silencieuses (`electron-updater`) avec indicateur d'état en direct et bouton de vérification.
  * Interrupteur d'auto-start au boot (`app.setLoginItemSettings()`).
  * Sélecteur de dossier local pour les sauvegardes sur disque.
  * Boutons de déclenchement test pour le raccourci Alt+Espace et les notifications Toast.
  * Statut en direct de l'environnement d'exécution (Application Desktop Native vs Navigateur Web).

---

## 8. Système de Transparence des Surfaces & Liquid Glass iOS (V2.6.0)

### 8.1 Paramètres & Tokens CSS Centralisés
- Réglages dans `AppSettings` :
  * `surfaceTransparency?: number;` (0 à 45, défaut: 35)
  * `reduceTransparency?: boolean;` (défaut: false)
- Variables dynamiques injectées dans `:root` et `html.dark` via `SettingsContext.tsx` :
  * `--glass-transparency` : pourcentage effectif (0 si `reduceTransparency === true`).
  * `--glass-blur` : `Math.round((effectiveTransparency / 45) * 20)` px (0px si réduit).
  * `--glass-surface-bg` : rgba pour navigation (Sidebar, header, barres fixes).
  * `--glass-card-bg` : rgba avec alpha plus élevé pour les cartes de contenu.
  * `--glass-border` : bordure vitrée semi-transparente.
  * `--glass-accent-border` : bordure réactive à l'accent RGB.
- Classes Tailwind / CSS dans `src/app/globals.css` :
  * `.glass-surface`
  * `.glass-card`
  * `.glass-border-accent`

### 8.2 Débouncing Firestore (700ms)
- Les modifications de glissement du slider ou clics de preset mettent à jour le state local et le `localStorage` instantanément pour un rendu à 60fps.
- L'écriture Firestore est temporisée via un debounce de 700ms (`useRef` timer dans `SettingsContext`) pour préserver les quotas Firestore et éliminer tout lag réseau.

### 8.3 Panneau « Aperçu en direct »
- Colonne de droite dans `Paramètres → Apparence & UI` avec fond d'écran mesh vibrant et mini-tableau de bord Syntropy OS réactif en temps réel.
- Commutateur rapide miniature `[Sombre] / [Clair]` pour évaluer instantanément la lisibilité.



