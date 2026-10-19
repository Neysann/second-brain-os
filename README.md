<div align="center">

  <h1>🧠 Syntropy OS</h1>
  <h3>Système d'Exploitation de Productivité Personnelle & Second Cerveau</h3>
  <p><em>Personal Productivity Operating System & Second Brain</em></p>

  <p>
    <a href="https://second-brain-os-e6a83.web.app"><img src="https://img.shields.io/badge/Live_Demo-Syntropy_Web-6366f1?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live Demo" /></a>
    <a href="https://github.com/Neysann/second-brain-os/releases"><img src="https://img.shields.io/badge/Desktop_App-Windows_x64-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows App" /></a>
    <a href="https://github.com/Neysann/second-brain-os/releases/latest"><img src="https://img.shields.io/badge/Version-v2.6.21-10b981?style=for-the-badge" alt="Version" /></a>
    <a href="#license"><img src="https://img.shields.io/badge/License-MIT-amber?style=for-the-badge" alt="License" /></a>
  </p>

  <p>
    <a href="#-aper%C3%A7u-du-projet--overview">Aperçu</a> •
    <a href="#-fonctionnalit%C3%A9s-cl%C3%A9s--key-features">Fonctionnalités</a> •
    <a href="#-directions-artistiques--design-system">Design System</a> •
    <a href="#-application-desktop-electron">Application Desktop</a> •
    <a href="#%EF%B8%8F-pile-technologique--tech-stack">Technologies</a> •
    <a href="#-installation--d%C3%A9marrage">Installation</a>
  </p>

</div>

---

## 🇫🇷 Français

### 🌟 Aperçu du Projet

**Syntropy OS** est un système d'exploitation de productivité tout-en-un conçu pour centraliser la gestion de vos connaissances, vos objectifs, votre temps et vos finances au sein d'une interface fluide, esthétique et hautement personnalisable.

Inspiré des principes du **Second Brain** de Tiago Forte et de la méthode organisationnelle **PARA**, Syntropy OS transforme le chaos informationnel quotidien en clarté stratégique et en momentum d'exécution.

> 🌐 **Application Web en direct** : [https://second-brain-os-e6a83.web.app](https://second-brain-os-e6a83.web.app)  
> 🖥️ **Application Bureau Windows** : Téléchargeable depuis la section [Releases GitHub](https://github.com/Neysann/second-brain-os/releases).

---

### ⚡ Fonctionnalités Clés

#### 1. 🧠 Tableau de Bord & Cockpit Cognitif
- Salutations dynamiques adaptées au moment de la journée, suivi de l'énergie cognitive et focus prioritaire quotidien.
- Widgets interactifs : citation inspirante du jour, matrice de progression, calendrier temps réel et météo intégrée.
- Lecteur audio ambiant pour sessions de concentration et de travail profond.

#### 2. 🎯 Gestion de Projets & Tâches (Méthode PARA)
- Organisation complète selon l'architecture **PARA** :
  - **Projets** (objectifs avec échéance claire et progression active).
  - **Domaines** (sphères de responsabilité à long terme : santé, carrière, études).
  - **Ressources** (bibliothèque de références et veille documentaire).
  - **Archives** (éléments inactifs mais consultables).
- Vues multiples (Kanban interactif, liste ordonnée, filtres par statut et matrice de priorités).
- Système de sous-tâches hiérarchiques et tags personnalisés.

#### 3. 📝 Coffre-fort de Notes & Connaissances (Markdown + KaTeX)
- Éditeur Markdown plein écran avec coloration syntaxique, rendu en temps réel et support des formules mathématiques et scientifiques **KaTeX**.
- Organisation par dossiers, tags multiples, épinglage favori et moteur de recherche instantané à indexation locale.
- Exportation automatique et sauvegarde en fichiers `.md` locaux.

#### 4. 📅 Calendrier & Synchronisation Universelle
- Vues par mois, semaine et journée avec planification visuelle par blocs de temps.
- **Synchronisation Google Agenda & Apple Calendrier** :
  - Téléchargement direct natif dans l'application de bureau (contournement transparent des restrictions CORS).
  - Gestion des abonnements iCal / WebCal en temps réel.
  - Import / export par glisser-déposer de fichiers `.ics`.

#### 5. 🔥 Habitudes & Suivi des Séries (Streaks)
- Heatmap annuelle de régularité inspirée des contributions GitHub.
- Compteurs de séries actives (streaks), taux de complétion et statistiques d'adhérence aux rituels.

#### 6. 💰 Gestion de Budget & Finances Personnelles
- Suivi des revenus et dépenses par catégories personnalisables.
- Plafonds budgétaires mensuels, jauge d'alerte visuelle et bilan financier mensuel.

---

### 🎨 Directions Artistiques & Design System

Syntropy OS intègre des moteurs graphiques de pointe offrant une expérience visuelle d'exception :

- **Liquid Glass (iOS Glassmorphism)** : Effet de verre dépoli avec flou d'arrière-plan (`backdrop-filter blur`), reflets spéculaires et niveau de translucidité ajustable (de 0% à 45%).
- **Mode Sombre Absolu (Nothing OS Signature)** : Expérience discrète inspirée de l'écosystème Nothing. Fond noir pur OLED (`#000000`), typographie matricielle à points officielle (NDot 57), accentuation rouge vermillon Nothing (`#D71920`), anneau Glyph LED dynamique et schématique matérielle transparente.
- **Thème Aether Cyberpunk** : Dégradé exclusif bleu électrique ➔ indigo ➔ violet néon (`#3b82f6` ➔ `#6366f1` ➔ `#8b5cf6`) avec aurore boréale ambiante.

---

### 🖥️ Application Desktop Windows (Electron)

Syntropy OS est également packagé sous forme d'application native Windows x64 (`Syntropy-OS-Setup-*.exe`) offrant des fonctionnalités exclusives :

- ⚡ **Capture Rapide Globale (`Alt + Espace`)** : Ouvrez instantanément une fenêtre flottante légère pour noter une tâche ou une idée sans quitter votre jeu ou logiciel en cours.
- 🔔 **Notifications Natives Windows Toast** : Rappels interactifs avec boutons d'action directs (*« Terminé »* ou *« Reporter »*).
- 📌 **Icône System Tray (Zone de notification)** : Accès rapide en tâche de fond, démarrage automatique avec Windows (`openAtLogin`).
- 📂 **Sauvegarde Locale & Export** : Enregistrement direct des données en local et exportation des notes au format `.md` sur votre disque dur.
- 🚀 **Mises à Jour Automatiques** : Intégration d'`electron-updater` avec vérification et téléchargement transparents depuis GitHub Releases.

---

## 🇬🇧 English

### 🌟 Project Overview

**Syntropy OS** is an all-in-one personal productivity operating system engineered to centralize knowledge, goals, calendars, habits, and personal finances into a fluid, aesthetic, and customizable interface.

Grounded in Tiago Forte's **Second Brain** methodology and the **PARA framework**, Syntropy OS channels daily information overload into execution momentum and strategic clarity.

---

### ⚡ Key Capabilities

- **🧠 Cognitive Dashboard**: Adaptive greetings, daily focus tracking, focus audio player, and real-time productivity score.
- **🎯 PARA Projects & Task Engine**: Structure life into Projects, Areas, Resources, and Archives with Kanban/list views, subtasks, and priority tagging.
- **📝 Markdown & KaTeX Knowledge Vault**: Rich text notes with real-time preview, KaTeX mathematical typesetting, tagging, and local `.md` export.
- **📅 Universal Calendar & Direct iCal Sync**: Full agenda view with Google Calendar & Apple Calendar sync powered by a native Electron bridge (bypassing browser CORS restrictions).
- **🔥 Habit Tracker & Heatmap**: GitHub-inspired streak visualization, daily rituals, and completion rate analytics.
- **💰 Personal Budget**: Expense tracking, category breakdowns, and dynamic monthly spending caps.
- **🎨 Premium Visual Themes**: iOS-style Liquid Glass with real-time blur, secret Nothing OS OLED dark mode with NDot 57 matrix typography, and Aether blue-purple neon gradients.
- **🖥️ Native Desktop Experience**: Global shortcut (`Alt + Space`) Quick Capture, Windows toast notifications, system tray integration, and auto-updates.

---

## 🛠️ Pile Technologique / Tech Stack

| Couche | Technologies |
| :--- | :--- |
| **Frontend Web** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styles & Effets** | [Tailwind CSS](https://tailwindcss.com/), Glassmorphism, CSS Variables, Lucide Icons |
| **Desktop Runtime** | [Electron 28+](https://www.electronjs.org/), Electron Builder, Electron Updater |
| **Backend & Cloud** | [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore, Firebase Hosting) |
| **Édition & Données** | [@uiw/react-md-editor](https://uiwjs.github.io/react-md-editor/), KaTeX, JSZip |

---

## 🚀 Installation & Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) v18.0.0 ou supérieur
- Gestionnaire de paquets `npm`

### 1. Cloner le dépôt
```bash
git clone https://github.com/Neysann/second-brain-os.git
cd second-brain-os
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
Créez un fichier `.env.local` à la racine contenant vos clés de configuration Firebase :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_projet_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

### 4. Lancer le serveur de développement
```bash
# Mode Web uniquement (http://localhost:3000)
npm run dev

# Mode Desktop complet (Next.js + Electron fenêtré)
npm run dev:desktop
```

### 5. Compiler pour la production
```bash
# Compilation du site web statique pour Firebase Hosting
npm run build

# Compilation du paquet d'installation exécutable Windows (.exe)
npm run build:win
```

### 6. Publication automatisée (GitHub & Firebase)
```bash
npm run release
```

---

## 📄 Licence

Distribué sous licence **MIT**. Consultez le fichier `LICENSE` pour plus de détails.

---

<div align="center">
  <p>Conçu avec passion par <strong>Nathan Debeaupuis</strong></p>
  <p>
    <a href="https://second-brain-os-e6a83.web.app">Syntropy OS Live</a> •
    <a href="https://github.com/Neysann/second-brain-os/issues">Signaler un bug</a> •
    <a href="https://github.com/Neysann/second-brain-os/pulls">Contribuer</a>
  </p>
</div>
