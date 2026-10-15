export interface NoteTemplate {
  id: string;
  title: string;
  category: 'study' | 'project' | 'research' | 'meeting' | 'general';
  categoryLabel: string;
  badge: string;
  iconName: string;
  color: string;
  defaultTitle: string;
  defaultTags: string[];
  defaultPara: 'resource' | 'area' | 'project';
  summary: string;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'summary-reading',
    title: 'Fiche de Synthèse & Lecture (Livre / Article / Vidéo)',
    category: 'research',
    categoryLabel: 'Recherche & Culture',
    badge: 'Lecture & Synthèse',
    iconName: 'BookMarked',
    color: '#f59e0b',
    defaultTitle: 'Synthèse — [Titre de l\'œuvre / Article]',
    defaultTags: ['Lecture', 'Synthèse', 'Notes'],
    defaultPara: 'resource',
    summary:
      'Structure complète pour capturer la substantifique moelle d\'un livre, article, vidéo ou conférence : thèse centrale, points clés, citations fortes et plan d\'action.',
    content: `# 📖 Fiche de Synthèse : [Titre du Livre / Article / Conférence]

> **Auteur / Intervenant** : [Nom de l'auteur]  
> **Source / Référence** : [Livre / URL de l'article / Lien vidéo]  
> **Date de lecture** : [Date du jour]  
> **Note globale** : ⭐⭐⭐⭐⭐ (5/5)  
> **Thématique** : [Productivité / Entrepreneuriat / Philosophie / Sciences]

---

## 🎯 1. La Thèse Centrale (En 1 phrase)
> *[Résumez ici le message principal que l'auteur veut transmettre au lecteur. Quelle est la vérité contre-intuitive démontrée ?]*

---

## 🔑 2. Les 3 Idées Maîtresses

### 1. [Titre de la première idée clé]
- Explication claire et synthèse du principe.
- Exemple ou étude de cas illustratif cité dans l'œuvre.
- *Ce que cela remet en question dans ma façon de penser.*

### 2. [Titre de la deuxième idée clé]
- Détails de l'argumentation.
- Nuance importante apportée par l'auteur.

### 3. [Titre de la troisième idée clé]
- Conséquences pratiques et conceptuelles.

---

## 💬 3. Citations Marquantes
> *« Insérez ici une citation textuelle particulièrement percutante ou mémorable. »*  
> — Chapitre [X], Page [XX]

> *« Une seconde citation inspirante. »*

---

## 🚀 4. Applications Pratiques & Plan d'Action (Comment j'utilise ça ?)
- [ ] **Action 1** : Mettre en place [Action concrète] dès cette semaine
- [ ] **Action 2** : Adapter mon système / workflow pour intégrer [Principe]
- [ ] **Action 3** : Partager ou discuter de ce concept avec [Collaborateur / Ami]

---

## 💡 5. Critique & Bilan Personnel
- **Ce que j'ai adoré** : Clarté, rigueur, fraîcheur des exemples.
- **Les limites ou angles morts** : Points où je ne suis pas d'accord ou qui méritent d'être approfondis.
- **Connexion Second Brain** : Lié aux projets [[Nom du projet]] et notes [[Autre note liée]].
`,
  },
  {
    id: 'meeting-decisions',
    title: 'Compte-Rendu de Réunion & Plan d\'Action',
    category: 'meeting',
    categoryLabel: 'Organisation & Réunions',
    badge: 'Réunion & Actions',
    iconName: 'Users',
    color: '#ec4899',
    defaultTitle: 'Réunion — [Sujet / Client / Équipe]',
    defaultTags: ['Réunion', 'Décisions', 'Action'],
    defaultPara: 'area',
    summary:
      'Garantissez un suivi irréprochable de vos échanges : participants, points clés abordés, décisions validées et tableau d\'action (Qui fait Quoi pour Quand).',
    content: `# 🤝 Réunion : [Sujet ou Objet de la Réunion]

> **Date & Heure** : [YYYY-MM-DD — 10:00]  
> **Lieu / Visioconférence** : [Google Meet / Bureau / Téléphone]  
> **Participants** : [Nom 1, Nom 2, Nom 3]  
> **Responsable du compte-rendu** : [Votre nom]  
> **Projet rattaché** : [Nom du projet PARA]

---

## 📋 1. Ordre du Jour
1. [Point 1 : Bilan des livrables en cours]
2. [Point 2 : Arbitrage sur le problème technique / financier]
3. [Point 3 : Validation du planning des 2 prochaines semaines]

---

## 🗣️ 2. Synthèse des Échanges
- **Discussion sur le point 1** :
  - Consensus sur le fait que [...].
  - Remarque soulevée par [Nom] concernant [...].
- **Discussion sur le point 2** :
  - Deux options étaient envisagées : Option A [...] vs Option B [...].
  - L'équipe a retenu l'Option B pour des raisons de coût et de délai.

---

## ✅ 3. Décisions Fermes Arrêtées
- [x] **Décision 1** : Validation définitive de la proposition retenue.
- [x] **Décision 2** : Gel des fonctionnalités pour le jalon du [Date].
- [x] **Décision 3** : Prochain point d'étape fixé au [Date & Heure].

---

## ⚡ 4. Plan d'Action (Qui fait Quoi pour Quand ?)

| Tâche / Livrable | Responsable | Échéance (Deadline) | Statut |
| :--- | :--- | :--- | :---: |
| Rédiger le document de spécification | **[Nom 1]** | 12/10/2026 | 🟡 En cours |
| Mettre à jour la maquette et les visuels | **[Nom 2]** | 15/10/2026 | 🔴 À faire |
| Valider le budget et envoyer le bon de commande | **[Moi]** | 16/10/2026 | 🔴 À faire |
`,
  },
  {
    id: 'daily-journal',
    title: 'Journal Quotidien & Standup (Daily Log)',
    category: 'general',
    categoryLabel: 'Quotidien & Clarté',
    badge: 'Focus Quotidien',
    iconName: 'BookOpen',
    color: '#6366f1',
    defaultTitle: 'Journal — [Date du Jour]',
    defaultTags: ['Journal', 'Daily', 'Standup'],
    defaultPara: 'area',
    summary:
      'Clarifiez votre journée en 5 minutes le matin et le soir : vos 3 priorités absolues, notes au fil de l\'eau, blocages et gratitudes du soir.',
    content: `# ☀️ Journal de Bord : [Date du Jour]

> **Humeur & Énergie** : ⚡⚡⚡⚡⚪ (4/5)  
> **Mantra du jour** : *« Faire moins de choses, mais les faire exceptionnellement bien. »*

---

## 🎯 Les 3 Priorités Absolues de la Journée (The Big 3)
*Si je n'accomplis que ces 3 choses aujourd'hui, ma journée sera une réussite totale.*
- [ ] **1.** [Priorité 1 — Haute valeur ajoutée]
- [ ] **2.** [Priorité 2 — Échéance ou déblocage]
- [ ] **3.** [Priorité 3 — Tâche administrative ou suivi]

---

## 📝 Notes & Idées au Fil de l'Eau
- **09:30** : [Note ou réflexion importante sur un dossier]
- **11:15** : [Appel avec un client / partenaire]
- **15:00** : [Idée éclair ou opportunité à explorer plus tard]

---

## 🚧 Blocages & Difficultés Rencontrées
- *Obstacle* : [Difficulté survenue ou point bloquant]
- *Solution envisagée* : [Comment débloquer la situation rapidement]

---

## 🌙 Bilan du Soir & Gratitude
- **🏆 Victoire du jour** : [Ce dont je suis le plus fier aujourd'hui]
- **🙏 Gratitude** : [Une chose ou une personne pour laquelle je suis reconnaissant]
- **🔮 À préparer pour demain** : [La priorité n°1 au réveil]
`,
  },
  {
    id: 'brainstorming-ideas',
    title: 'Brainstorming & Idéation de Projet',
    category: 'project',
    categoryLabel: 'Productivité & Projets',
    badge: 'Idéation & Créativité',
    iconName: 'FolderGit2',
    color: '#10b981',
    defaultTitle: 'Idéation — [Thème / Défi à résoudre]',
    defaultTags: ['Brainstorming', 'Idées', 'Innovation'],
    defaultPara: 'project',
    summary:
      'Structurez vos séances d\'idéation pour transformer un problème flou en solutions innovantes et actions immédiates.',
    content: `# 💡 Session d'Idéation : [Problème ou Opportunité]

> **Contexte** : [Brève mise en situation du défi à relever]  
> **Objectif recherché** : [Ce que nous voulons obtenir au terme de la séance]  
> **Contraintes** : [Budget, délais, contraintes techniques]

---

## ❓ 1. La Question Clé (Comment pourrions-nous... ?)
> **« Comment pourrions-nous [accomplir l'objectif] tout en [respectant la contrainte majeure] ? »**

---

## 🌪️ 2. Boîte à Idées Brutes (Quantité > Qualité)
*Aucun jugement ici : on note toutes les idées possibles, des plus conventionnelles aux plus folles.*
- 💡 **Idée A** : [Description succincte]
- 💡 **Idée B** : [Description succincte]
- 💡 **Idée C** : [Description succincte]
- 💡 **Idée D** : [Description succincte]
- 💡 **Idée E** : [Description succincte]

---

## ⚖️ 3. Sélection & Matrice Impact vs Effort

| Idée | Impact Estimé (1-5) | Effort Requis (1-5) | Catégorie (Quick Win / Projet Majeur) |
| :--- | :---: | :---: | :--- |
| **Idée A** | 5/5 | 2/5 | 🚀 **Quick Win (À faire immédiatement)** |
| **Idée B** | 5/5 | 5/5 | 💎 **Projet Stratégique (Planifier)** |
| **Idée C** | 2/5 | 1/5 | ⚡ **Secondaire** |

---

## 🏁 4. L'Idée Retenue & Concept Final
> **Piste choisie** : [Détail de l'idée la plus prometteuse]  
> **Proposition de valeur** : [Pourquoi cette solution va fonctionner et ce qu'elle apporte d'unique.]

---

## 📌 5. Les 3 Prochaines Actions Immédiates (48h)
- [ ] **Action 1** : Créer une première maquette / brouillon rapide
- [ ] **Action 2** : Sonder 3 utilisateurs ou collègues pour tester la réceptivité
- [ ] **Action 3** : Chiffrer le coût et le temps de réalisation
`,
  },
  {
    id: 'sop-procedure',
    title: 'Procédure Opérationnelle & Guide Pas-à-Pas (SOP)',
    category: 'project',
    categoryLabel: 'Productivité & Projets',
    badge: 'Méthode & SOP',
    iconName: 'GraduationCap',
    color: '#06b6d4',
    defaultTitle: 'Procédure — [Nom de l\'opération / Tâche]',
    defaultTags: ['SOP', 'Procédure', 'Méthode'],
    defaultPara: 'resource',
    summary:
      'Standardisez vos méthodes de travail pour ne plus jamais rien oublier : prérequis, étapes séquentielles, pièges à éviter et critères de validation.',
    content: `# 🛠️ Procédure : [Nom de l'Opération ou Tâche]

> **Version** : 1.0  
> **Dernière révision** : [Date du jour]  
> **Auteur** : [Votre nom]  
> **Fréquence d'exécution** : [Hebdomadaire / Mensuelle / À la demande]  
> **Temps moyen estimé** : [Ex: 25 minutes]

---

## 🎯 1. Objectif de la Procédure
Cette procédure détaille pas à pas les instructions nécessaires pour exécuter [Tâche] de manière reproductible, sans erreur et conforme aux standards de qualité attendus.

---

## 🧰 2. Prérequis & Outils Nécessaires
Avant de commencer, s'assurer d'avoir :
- [ ] Accès au compte / outil : [Outil 1]
- [ ] Fichiers sources disponibles dans : [Dossier / Cloud]
- [ ] Droits d'administration ou autorisations requises

---

## 📝 3. Étapes Séquentielles Détaillées

### Étape 1 : Préparation & Vérification
1. Ouvrir l'application [Nom].
2. Vérifier que les données d'entrée correspondent à [...].
3. Exporter la sauvegarde de sécurité préliminaire.

### Étape 2 : Traitement Principal
1. Naviguer vers le menu **[Paramètres > Actions]**.
2. Renseigner les paramètres suivants :
   - Champ A : \`valeur_type\`
   - Champ B : \`mode_automatique\`
3. Lancer l'exécution en cliquant sur **[Valider]**.

### Étape 3 : Contrôle Qualité & Clôture
1. Vérifier que le résultat généré comporte bien [...].
2. Archiver le fichier final dans le dossier cible.

---

## ⚠️ 4. Pièges Fréquents & Avertissements
- ❌ **Erreur classique** : Oublier de cocher l'option [...], ce qui entraîne [...].
- ⚠️ **Attention** : Ne jamais relancer le processus deux fois sans vérifier [...].
- ✅ **Bonne pratique** : Toujours notifier l'équipe sur le canal dédié après validation.

---

## 🏁 5. Critères de Réussite (Definition of Done)
- [ ] Le livrable est testé et conforme
- [ ] Les parties prenantes ont reçu la notification
- [ ] Les fichiers temporaires ont été nettoyés
`,
  },
  {
    id: 'stylus-hybrid',
    title: 'Note Hybride (Texte Dactylographié & Schémas au Stylet)',
    category: 'study',
    categoryLabel: 'Études & Cours',
    badge: 'Syntropy Stylus',
    iconName: 'PenTool',
    color: '#a855f7',
    defaultTitle: 'Note Hybride — [Sujet]',
    defaultTags: ['Hybride', 'Stylet', 'Schémas'],
    defaultPara: 'resource',
    summary:
      'Idéale pour alterner notes textuelles structurées et surface vectorielle de dessin au stylet pour formules, croquis et diagrammes.',
    content: `# 🖊️ Note Hybride : [Titre du Sujet / Schémas]

> **Mode de travail** : Hybride (Texte structuré + Schémas manuscrits au stylet)  
> **Matière / Projet** : [Nom du sujet]  
> **Date** : [Date du jour]

---

## 📝 1. Cadre Théorique & Notions Textuelles
Présentez ici vos définitions, réflexions et énoncés sous forme dactylographiée :

- **Principe fondamental** : [Énoncé du principe]
- **Propriétés & Règles** : [Points clés à retenir]

---

## 🎨 2. Schémas, Formules & Démonstrations Graphiques
> 💡 **Conseil d'utilisation :**  
> Cliquez sur le bouton **« 🖊️ Stylet & Manuscrit »** en haut à droite pour basculer vers la surface d'écriture manuscrite vectorielle et dessiner vos schémas, flèches et calculs !

---

## 📌 3. Synthèse Rapide
- Synthèse rapide des conclusions apportées par l'illustration graphique.
- Prochaines actions à mener.
`,
  },
];
