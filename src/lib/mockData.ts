import { Task, Project, Note } from '@/types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Lancement Syntropy OS V1',
    description: 'Développer et finaliser le MVP du système de productivité personnelle Syntropy.',
    category: 'project',
    status: 'active',
    color: '#6366f1', // Indigo
    deadline: '2026-10-15',
    tags: ['Next.js', 'Firebase', 'Dev'],
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-03T09:30:00Z',
  },
  {
    id: 'proj-2',
    title: 'Routine Matinale & Santé',
    description: 'Maintenir un équilibre de vie : méditation, hydratation et 30 min de sport quotidien.',
    category: 'area',
    status: 'active',
    color: '#10b981', // Emerald
    deadline: '2026-12-31',
    tags: ['Santé', 'Habitudes', 'Bien-être'],
    createdAt: '2026-09-20T08:00:00Z',
    updatedAt: '2026-10-02T18:00:00Z',
  },
  {
    id: 'proj-3',
    title: 'Base de Connaissances IA & Prompt Engineering',
    description: 'Compiler les meilleurs patterns de prompts, agents autonomes et architectures LLM.',
    category: 'resource',
    status: 'active',
    color: '#8b5cf6', // Violet
    deadline: '2026-11-30',
    tags: ['IA', 'Ressources', 'Learning'],
    createdAt: '2026-09-15T14:00:00Z',
    updatedAt: '2026-10-01T11:20:00Z',
  },
  {
    id: 'proj-4',
    title: 'Refonte Site Personnel 2025',
    description: 'Ancien portfolio archivé après mise en ligne.',
    category: 'archive',
    status: 'completed',
    color: '#71717a', // Zinc
    deadline: '2025-12-01',
    tags: ['Portfolio', 'Archive'],
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-12-05T00:00:00Z',
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Configurer les règles de sécurité Firestore',
    description: 'Vérifier les permissions de lecture/écriture par utilisateur pour tasks, projects et notes.',
    status: 'in_progress',
    priority: 'urgent',
    category: 'project',
    projectId: 'proj-1',
    dueDate: '2026-10-04',
    tags: ['Sécurité', 'Firebase'],
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-03T11:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Tester la réactivité du Markdown Editor sur mobile',
    description: 'S\'assurer que la prévisualisation et la barre d\'outils @uiw/react-md-editor s\'affichent proprement.',
    status: 'todo',
    priority: 'high',
    category: 'project',
    projectId: 'proj-1',
    dueDate: '2026-10-05',
    tags: ['UI/UX', 'Mobile'],
    createdAt: '2026-10-02T11:30:00Z',
    updatedAt: '2026-10-02T11:30:00Z',
  },
  {
    id: 'task-3',
    title: 'Séance de HIIT 25 minutes',
    description: 'Cardio et renforcement musculaire du matin.',
    status: 'done',
    priority: 'medium',
    category: 'area',
    projectId: 'proj-2',
    dueDate: '2026-10-03',
    completedAt: '2026-10-03T08:30:00Z',
    tags: ['Fitness', 'Santé'],
    createdAt: '2026-10-03T07:00:00Z',
    updatedAt: '2026-10-03T08:30:00Z',
  },
  {
    id: 'task-4',
    title: 'Rédiger une synthèse sur les architectures RAG',
    description: 'Comparer BM25, embeddings hybrides et reranking de documents.',
    status: 'todo',
    priority: 'medium',
    category: 'resource',
    projectId: 'proj-3',
    dueDate: '2026-10-08',
    tags: ['IA', 'Recherche'],
    createdAt: '2026-10-01T15:00:00Z',
    updatedAt: '2026-10-01T15:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Optimiser le bundle Next.js et polices système',
    description: 'Vérifier la taille des chunks et charger les polices avec next/font.',
    status: 'in_progress',
    priority: 'high',
    category: 'project',
    projectId: 'proj-1',
    dueDate: '2026-10-04',
    tags: ['Performance', 'Next.js'],
    createdAt: '2026-10-02T16:00:00Z',
    updatedAt: '2026-10-03T10:15:00Z',
  },
  {
    id: 'task-6',
    title: 'Nettoyer les backups disque du mois dernier',
    description: 'Archivage des snapshots mensuels.',
    status: 'done',
    priority: 'low',
    category: 'archive',
    projectId: 'proj-4',
    dueDate: '2026-09-30',
    completedAt: '2026-09-30T17:00:00Z',
    tags: ['Maintenance'],
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: '2026-09-30T17:00:00Z',
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Principes du Second Brain (Méthode CODE & PARA)',
    content: `# Principes Fondamentaux du Second Brain

> "Votre cerveau est fait pour avoir des idées, pas pour les stocker." — David Allen

## 1. La Méthode CODE
- **C**apture : Noter ce qui résonne avec vous.
- **O**rganize : Structurer pour l'actionnabilité future.
- **D**istill : Trouver l'essence même de l'information.
- **E**xpress : Produire et partager votre travail.

## 2. La Méthode PARA
1. **Projects** : Série de tâches liées à un objectif avec date limite.
2. **Areas** : Sphères d'activité avec un standard de performance à maintenir.
3. **Resources** : Sujets ou thèmes d'intérêt continu.
4. **Archives** : Éléments inactifs conservés pour référence.

\`\`\`typescript
const brain = {
  focus: "Action immédiate",
  storage: "Syntropy OS",
  clarity: 100
};
\`\`\`
`,
    category: 'resource',
    projectId: 'proj-3',
    tags: ['Productivité', 'Méthode', 'SecondBrain'],
    isPinned: true,
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: '2026-10-03T08:45:00Z',
  },
  {
    id: 'note-2',
    title: 'Architecture Technique — Syntropy OS',
    content: `# Architecture Technique & Choix de Conception

## Stack Technologique
- **Framework** : Next.js 14+ (App Router)
- **Styling** : Tailwind CSS avec palette Obsidian \`zinc-950\`
- **Éditeur** : \`@uiw/react-md-editor\` avec support Live Preview
- **Backend & Temps Réel** : Firebase Cloud Firestore & Auth
- **Mode Dégradé** : LocalStorage & Mocking automatique si hors-ligne

## Modèle de Données
Chaque entité possède :
- Un ID unique
- Des timestamps ISO (\`createdAt\`, \`updatedAt\`)
- Une étiquette PARA (\`project\`, \`area\`, \`resource\`, \`archive\`)
- Des tags multiples pour recherche instantanée
`,
    category: 'project',
    projectId: 'proj-1',
    tags: ['Dev', 'Architecture', 'Next.js'],
    isPinned: true,
    createdAt: '2026-10-01T14:00:00Z',
    updatedAt: '2026-10-03T11:15:00Z',
  },
  {
    id: 'note-3',
    title: 'Guide d\'Alimentation & Clarté Mentale',
    content: `# Clarté Mentale & Alimentation

- **Hydratation** : 2.5L d'eau par jour avec électrolytes le matin.
- **Caféine** : Attendre 90 minutes après le réveil avant le premier café pour laisser le cortisol s'équilibrer.
- **Jeûne intermittent** : Fenêtre 16/8 de 12h à 20h pour maximiser la concentration matinale en état de cétose légère.
`,
    category: 'area',
    projectId: 'proj-2',
    tags: ['Santé', 'Biohacking', 'Focus'],
    isPinned: false,
    createdAt: '2026-09-25T11:00:00Z',
    updatedAt: '2026-10-02T19:00:00Z',
  },
];

export const MOTIVATIONAL_QUOTES = [
  {
    quote: "La simplicité est la sophistication suprême.",
    author: "Léonard de Vinci",
  },
  {
    quote: "Votre esprit est fait pour avoir des idées, pas pour les retenir.",
    author: "David Allen",
  },
  {
    quote: "Nous sommes ce que nous faisons de manière répétée. L'excellence n'est donc pas un acte mais une habitude.",
    author: "Aristote",
  },
  {
    quote: "Concentrez-vous sur le signal, pas sur le bruit.",
    author: "Elon Musk",
  },
  {
    quote: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment, c'est maintenant.",
    author: "Proverbe chinois",
  },
  {
    quote: "L'organisation ne consiste pas à être parfait, elle consiste à être efficace.",
    author: "Tiago Forte",
  },
];
