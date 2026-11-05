/**
 * Module d'importation intelligent de fichiers Markdown (.md / .markdown) pour Syntropy OS
 * Analyse le frontmatter YAML (type Obsidian, Hugo, Jekyll), extrait les métadonnées
 * (titre, tags, catégorie, date), détecte le premier titre H1 (# Titre) et prépare
 * une note propre sans pièce jointe binaire superflue.
 */

export interface ParsedMarkdownNote {
  fileName: string;
  title: string;
  content: string;
  tags: string[];
  category: 'resource' | 'project' | 'area' | 'archive';
  createdAt?: string;
  hasFrontmatter: boolean;
  rawText: string;
}

/**
 * Lit un fichier sous forme de chaîne de caractères UTF-8
 */
export function readMarkdownFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = (err) => reject(err);
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Analyse intelligemment le texte brut d'un fichier Markdown
 */
export function parseMarkdownContent(rawText: string, fileName: string): ParsedMarkdownNote {
  // 1. Normaliser les sauts de ligne Windows \r\n vers \n
  const normalized = rawText.replace(/\r\n/g, '\n');

  let title = '';
  let tags: string[] = [];
  let category: 'resource' | 'project' | 'area' | 'archive' = 'resource';
  let createdAt: string | undefined = undefined;
  let cleanContent = normalized;
  let hasFrontmatter = false;

  // 2. Détecter le frontmatter YAML délimité par des lignes "---" au tout début
  const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (frontmatterMatch) {
    hasFrontmatter = true;
    const yamlBlock = frontmatterMatch[1];
    // Supprimer le bloc de métadonnées pour conserver uniquement le corps de texte Markdown
    cleanContent = normalized.substring(frontmatterMatch[0].length).trim();

    const yamlLines = yamlBlock.split('\n');
    let inTagsList = false;

    for (const rawLine of yamlLines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      // Gestion des tags au format liste YAML multi-lignes :
      // tags:
      //   - tag1
      //   - tag2
      if (inTagsList) {
        if (line.startsWith('- ')) {
          const t = line.replace(/^- /, '').replace(/['"]/g, '').trim();
          if (t) tags.push(t);
          continue;
        } else if (!line.startsWith('-')) {
          inTagsList = false;
        }
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const value = line.slice(colonIndex + 1).trim();

        if (key === 'title') {
          title = value.replace(/^["']|["']$/g, '').trim();
        } else if (key === 'tags' || key === 'tag') {
          if (!value) {
            inTagsList = true;
          } else if (value.startsWith('[') && value.endsWith(']')) {
            // Format tableau JSON : ["tag1", "tag2"]
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                tags.push(...parsed.map(String));
              }
            } catch {
              const items = value
                .slice(1, -1)
                .split(',')
                .map((s) => s.replace(/['"]/g, '').trim())
                .filter(Boolean);
              tags.push(...items);
            }
          } else {
            // Format CSV ou tag unique : tag1, tag2
            const items = value
              .split(',')
              .map((s) => s.replace(/['"]/g, '').trim())
              .filter(Boolean);
            tags.push(...items);
          }
        } else if (key === 'category') {
          const cat = value.replace(/^["']|["']$/g, '').trim().toLowerCase();
          if (['project', 'area', 'resource', 'archive'].includes(cat)) {
            category = cat as any;
          }
        } else if (key === 'createdat' || key === 'created' || key === 'date') {
          createdAt = value.replace(/^["']|["']$/g, '').trim();
        }
      }
    }
  }

  // 3. Si aucun titre n'a été spécifié dans le frontmatter, chercher le premier titre H1 (# Titre)
  if (!title) {
    const h1Match = cleanContent.match(/^#\s+([^\n]+)/m);
    if (h1Match) {
      title = h1Match[1].trim();
    }
  }

  // 4. Si toujours aucun titre, déduire à partir du nom du fichier
  if (!title) {
    title = fileName
      .replace(/\.(md|markdown|txt)$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();
    if (!title) title = 'Note Markdown importée';
  }

  // 5. Nettoyage et déduplication des tags
  const sanitizedTags = Array.from(
    new Set(
      tags
        .map((t) => t.replace(/^[#]/, '').trim())
        .filter((t) => t.length > 0 && t.length < 50)
    )
  );

  return {
    fileName,
    title,
    content: cleanContent,
    tags: sanitizedTags,
    category,
    createdAt,
    hasFrontmatter,
    rawText,
  };
}

