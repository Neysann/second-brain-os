import JSZip from 'jszip';
import { NoteAttachment } from '@/types';
import { saveAttachmentLocally } from '@/lib/attachmentStorage';

export const MAX_ATTACHMENT_SYNC_SIZE = 25 * 1024 * 1024; // 25 Mo max pour la synchronisation fluide multi-appareils

export type SupportedDocType = 'pdf' | 'presentation' | 'spreadsheet' | 'word' | 'image' | 'text' | 'unknown';

export interface DocumentAnalysisResult {
  docType: SupportedDocType;
  cleanTitle: string;
  category: 'resource';
  tags: string[];
  initialContent: string;
  attachment: NoteAttachment;
  summary: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectDocumentType(fileName: string, mimeType?: string): SupportedDocType {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const mime = (mimeType || '').toLowerCase();

  // Images
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image';
  }

  // PDF
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }

  // Présentations PowerPoint
  if (
    ['pptx', 'ppt', 'odp', 'pps', 'ppsx', 'potx'].includes(ext) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return 'presentation';
  }

  // Tableurs Excel / CSV / Calc
  if (
    ['xlsx', 'xls', 'csv', 'tsv', 'ods', 'xlsm'].includes(ext) ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv')
  ) {
    return 'spreadsheet';
  }

  // Documents Word / Textes structurés
  if (
    ['docx', 'doc', 'odt', 'rtf', 'pages'].includes(ext) ||
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml')
  ) {
    return 'word';
  }

  // Fichiers texte brut / markdown
  if (['txt', 'md', 'json', 'yaml', 'yml', 'xml', 'log'].includes(ext) || mime.startsWith('text/')) {
    return 'text';
  }

  return 'unknown';
}

/**
 * Lit un fichier sous forme de Data URL (base64)
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Lit un fichier sous forme de texte brut
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

/**
 * Lit un fichier sous forme d'ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as ArrayBuffer) || new ArrayBuffer(0));
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convertit un contenu CSV ou TSV en tableau Markdown propre
 */
export function parseDelimitedTextToMarkdown(content: string, delimiter: string = ','): { markdown: string; rowCount: number; colCount: number } {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { markdown: '*Fichier tableur vide*', rowCount: 0, colCount: 0 };
  }

  // Découpage simple des cellules en gérant les guillemets éventuels
  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const rawRows = lines.map(parseLine);
  const maxCols = Math.max(...rawRows.map((r) => r.length));
  if (maxCols === 0) {
    return { markdown: '*Aucune colonne détectée*', rowCount: lines.length, colCount: 0 };
  }

  const normalizedRows = rawRows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) {
      padded.push('');
    }
    return padded.map((cell) => cell.replace(/\|/g, '\\|').replace(/\r?\n/g, ' '));
  });

  const headers = normalizedRows[0].map((h, idx) => (h ? h : `Col ${idx + 1}`));
  const separator = headers.map(() => '---');

  const maxPreviewRows = 40;
  const previewData = normalizedRows.slice(1, maxPreviewRows + 1);

  let md = `| ${headers.join(' | ')} |\n| ${separator.join(' | ')} |\n`;
  previewData.forEach((row) => {
    md += `| ${row.join(' | ')} |\n`;
  });

  if (normalizedRows.length - 1 > maxPreviewRows) {
    md += `\n> *Affichage limité aux ${maxPreviewRows} premières lignes sur un total de ${normalizedRows.length - 1} lignes.*`;
  }

  return {
    markdown: md,
    rowCount: normalizedRows.length - 1,
    colCount: maxCols,
  };
}

/**
 * Analyse et extrait le contenu textuel d'un document Word (.docx)
 */
async function extractDocxContent(arrayBuffer: ArrayBuffer): Promise<{ text: string; paragraphsCount: number }> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXmlFile = zip.file('word/document.xml');
    if (!documentXmlFile) {
      return { text: '', paragraphsCount: 0 };
    }

    const xmlText = await documentXmlFile.async('string');
    // Découpe les paragraphes <w:p>
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:p');

    const resultParagraphs: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = p.getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || '';
      }
      const trimmed = pText.trim();
      if (trimmed) {
        // Détecte si c'est un titre potentiel
        const isHeading = p.querySelector('w\\:pStyle[w\\:val*="Heading"], pStyle[val*="Heading"]');
        if (isHeading) {
          resultParagraphs.push(`### ${trimmed}`);
        } else {
          resultParagraphs.push(trimmed);
        }
      }
    }

    return {
      text: resultParagraphs.join('\n\n'),
      paragraphsCount: resultParagraphs.length,
    };
  } catch (err) {
    console.warn('Impossible d\'extraire le contenu Word DOCX en natif:', err);
    return { text: '', paragraphsCount: 0 };
  }
}

/**
 * Analyse et extrait le contenu textuel d'une présentation PowerPoint (.pptx)
 */
async function extractPptxContent(arrayBuffer: ArrayBuffer): Promise<{ slidesCount: number; slidesSummary: string }> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files).filter((path) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(path)
    );

    // Tri numérique des diapositives
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    const slidesCount = slideFiles.length;
    const parser = new DOMParser();
    const slidesData: { index: number; texts: string[] }[] = [];

    for (let idx = 0; idx < Math.min(slidesCount, 25); idx++) {
      const filePath = slideFiles[idx];
      const file = zip.file(filePath);
      if (!file) continue;

      const xmlText = await file.async('string');
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const textElements = xmlDoc.getElementsByTagName('a:t');

      const texts: string[] = [];
      for (let t = 0; t < textElements.length; t++) {
        const str = (textElements[t].textContent || '').trim();
        if (str && !texts.includes(str)) {
          texts.push(str);
        }
      }

      if (texts.length > 0) {
        slidesData.push({ index: idx + 1, texts });
      }
    }

    let slidesSummary = '';
    if (slidesData.length > 0) {
      slidesSummary = slidesData
        .map((s) => {
          const title = s.texts[0] || `Diapositive ${s.index}`;
          const body = s.texts.slice(1).map((t) => `- ${t}`).join('\n');
          return `### 📽️ Diapositive ${s.index} : ${title}\n${body ? `${body}\n` : ''}`;
        })
        .join('\n\n');
    }

    return { slidesCount, slidesSummary };
  } catch (err) {
    console.warn('Impossible d\'extraire le contenu PowerPoint PPTX en natif:', err);
    return { slidesCount: 0, slidesSummary: '' };
  }
}

/**
 * Analyse et extrait le contenu d'un tableur Excel (.xlsx)
 */
async function extractXlsxContent(arrayBuffer: ArrayBuffer): Promise<{ sheetsCount: number; previewTable: string }> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const workbookFile = zip.file('xl/workbook.xml');
    const sharedStringsFile = zip.file('xl/sharedStrings.xml');

    let sheetsCount = 1;
    const parser = new DOMParser();

    // Récupération des chaînes partagées
    const sharedStrings: string[] = [];
    if (sharedStringsFile) {
      const sharedXml = await sharedStringsFile.async('string');
      const sharedDoc = parser.parseFromString(sharedXml, 'application/xml');
      const siElements = sharedDoc.getElementsByTagName('si');
      for (let i = 0; i < siElements.length; i++) {
        const tElements = siElements[i].getElementsByTagName('t');
        let full = '';
        for (let j = 0; j < tElements.length; j++) {
          full += tElements[j].textContent || '';
        }
        sharedStrings.push(full.trim());
      }
    }

    // Récupération des noms de feuilles
    const sheetNames: string[] = [];
    if (workbookFile) {
      const wbXml = await workbookFile.async('string');
      const wbDoc = parser.parseFromString(wbXml, 'application/xml');
      const sheetEls = wbDoc.getElementsByTagName('sheet');
      sheetsCount = sheetEls.length;
      for (let i = 0; i < sheetEls.length; i++) {
        const name = sheetEls[i].getAttribute('name');
        if (name) sheetNames.push(name);
      }
    }

    // Extraction des 15 premières lignes de sheet1.xml
    const sheet1File = zip.file('xl/worksheets/sheet1.xml');
    let previewTable = '';
    if (sheet1File) {
      const sheetXml = await sheet1File.async('string');
      const sheetDoc = parser.parseFromString(sheetXml, 'application/xml');
      const rowEls = sheetDoc.getElementsByTagName('row');

      const rows: string[][] = [];
      for (let r = 0; r < Math.min(rowEls.length, 20); r++) {
        const cellEls = rowEls[r].getElementsByTagName('c');
        const rowCells: string[] = [];
        for (let c = 0; c < Math.min(cellEls.length, 10); c++) {
          const cell = cellEls[c];
          const type = cell.getAttribute('t');
          const valEl = cell.getElementsByTagName('v')[0];
          let val = valEl ? valEl.textContent || '' : '';
          if (type === 's') {
            const strIdx = parseInt(val, 10);
            if (!isNaN(strIdx) && sharedStrings[strIdx]) {
              val = sharedStrings[strIdx];
            }
          }
          rowCells.push(val.replace(/\|/g, '\\|').trim());
        }
        if (rowCells.some((c) => c.length > 0)) {
          rows.push(rowCells);
        }
      }

      if (rows.length > 0) {
        const maxCols = Math.max(...rows.map((r) => r.length));
        const headers = rows[0].map((h, i) => (h ? h : `Col ${i + 1}`));
        while (headers.length < maxCols) headers.push(`Col ${headers.length + 1}`);
        const separator = headers.map(() => '---');

        let md = `| ${headers.join(' | ')} |\n| ${separator.join(' | ')} |\n`;
        rows.slice(1).forEach((r) => {
          const padded = [...r];
          while (padded.length < maxCols) padded.push('');
          md += `| ${padded.join(' | ')} |\n`;
        });
        previewTable = md;
      }
    }

    return { sheetsCount, previewTable };
  } catch (err) {
    console.warn('Impossible d\'extraire le contenu Excel XLSX en natif:', err);
    return { sheetsCount: 1, previewTable: '' };
  }
}

/**
 * Génère une miniature ultra-légère (< 10 Ko) pour affichage instantané sur tous les appareils
 */
export function generateImageThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 120;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    img.src = url;
  });
}

/**
 * Analyse complète et création de la note associée
 */
export async function processImportedFile(file: File): Promise<DocumentAnalysisResult> {
  if (file.size > MAX_ATTACHMENT_SYNC_SIZE) {
    throw new Error(`Le fichier "${file.name}" (${formatFileSize(file.size)}) dépasse la limite autorisée de 25 Mo pour la synchronisation multi-appareils.`);
  }

  const docType = detectDocumentType(file.name, file.type);
  const dataUrl = await readFileAsDataUrl(file);
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '').trim() || 'Document sans titre';
  const sizeFormatted = formatFileSize(file.size);

  let thumbnailUrl: string | undefined;
  if (docType === 'image') {
    try {
      thumbnailUrl = await generateImageThumbnail(file);
    } catch {
      thumbnailUrl = undefined;
    }
  }

  const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Enregistrement immédiat dans le cache permanent local IndexedDB
  await saveAttachmentLocally(attachmentId, dataUrl);

  const attachment: NoteAttachment = {
    id: attachmentId,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    dataUrl,
    thumbnailUrl,
    uploadedAt: new Date().toISOString(),
    isCloudSynced: false,
  };

  const tags: string[] = ['Document'];
  let initialContent = '';
  let summary = '';

  switch (docType) {
    case 'presentation': {
      tags.push('Présentation', 'PowerPoint');
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const isPptx = file.name.toLowerCase().endsWith('.pptx');
      let extractedSlides = { slidesCount: 0, slidesSummary: '' };

      if (isPptx) {
        extractedSlides = await extractPptxContent(arrayBuffer);
      }

      const slidesBadge = extractedSlides.slidesCount > 0
        ? ` (${extractedSlides.slidesCount} diapositives)`
        : '';

      initialContent = `# 📽️ ${cleanTitle}\n\n` +
        `> **Présentation PowerPoint importée** : \`${file.name}\` — Taille : **${sizeFormatted}**${slidesBadge}.\n\n` +
        `Le fichier original est joint à cette note et peut être téléchargé à tout moment depuis le volet des documents joints.\n\n` +
        `---\n\n`;

      if (extractedSlides.slidesSummary) {
        initialContent += `## 📑 Aperçu des diapositives extraites\n\n${extractedSlides.slidesSummary}\n\n---\n\n`;
      }

      initialContent += `### 💡 Notes de présentation\n\n- [ ] Préparer les points clés de la soutenance\n- [ ] Synthétiser les messages principaux\n`;
      summary = `Présentation PowerPoint importée (${sizeFormatted}${slidesBadge})`;
      break;
    }

    case 'spreadsheet': {
      tags.push('Tableur', 'Excel');
      const ext = file.name.toLowerCase().split('.').pop() || '';
      let tableMarkdown = '';
      let rowStats = '';

      if (ext === 'csv' || ext === 'tsv' || file.type === 'text/csv') {
        const text = await readFileAsText(file);
        const delimiter = ext === 'tsv' ? '\t' : text.includes(';') ? ';' : ',';
        const parsed = parseDelimitedTextToMarkdown(text, delimiter);
        tableMarkdown = parsed.markdown;
        rowStats = ` (${parsed.rowCount} lignes x ${parsed.colCount} colonnes)`;
      } else if (ext === 'xlsx') {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const parsed = await extractXlsxContent(arrayBuffer);
        tableMarkdown = parsed.previewTable;
        rowStats = ` (${parsed.sheetsCount} feuille${parsed.sheetsCount > 1 ? 's' : ''})`;
      }

      initialContent = `# 📊 ${cleanTitle}\n\n` +
        `> **Tableur importé** : \`${file.name}\` — Taille : **${sizeFormatted}**${rowStats}.\n\n` +
        `Le classeur source est attaché en haute fidélité dans les pièces jointes ci-dessous.\n\n` +
        `---\n\n`;

      if (tableMarkdown) {
        initialContent += `## 📋 Aperçu des données du tableau\n\n${tableMarkdown}\n\n---\n\n`;
      }

      initialContent += `### 🔍 Synthèse & Analyses\n\n- [ ] Vérifier les totaux et métriques clés\n- [ ] Identifier les tendances ou écarts\n`;
      summary = `Tableur importé (${sizeFormatted}${rowStats})`;
      break;
    }

    case 'word': {
      tags.push('Texte', 'Word');
      const isDocx = file.name.toLowerCase().endsWith('.docx');
      let docxText = '';
      let pCount = 0;

      if (isDocx) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const extracted = await extractDocxContent(arrayBuffer);
        docxText = extracted.text;
        pCount = extracted.paragraphsCount;
      }

      const pBadge = pCount > 0 ? ` (${pCount} paragraphes)` : '';

      initialContent = `# 📄 ${cleanTitle}\n\n` +
        `> **Document texte importé** : \`${file.name}\` — Taille : **${sizeFormatted}**${pBadge}.\n\n` +
        `---\n\n`;

      if (docxText) {
        initialContent += `## 📖 Contenu extrait du document\n\n${docxText}\n\n---\n\n`;
      }

      initialContent += `### ✍️ Commentaires & Révision\n\n- [ ] Relecture du document\n- [ ] Intégration dans la base de connaissances\n`;
      summary = `Document Word importé (${sizeFormatted}${pBadge})`;
      break;
    }

    case 'pdf': {
      tags.push('PDF');
      initialContent = `# 📕 ${cleanTitle}\n\n` +
        `> **Document PDF importé** : \`${file.name}\` (${sizeFormatted}).\n\n` +
        `Consultez le visualiseur intégré ci-dessous ou téléchargez le document à tout moment.`;
      summary = `Document PDF importé (${sizeFormatted})`;
      break;
    }

    case 'image': {
      tags.push('Image');
      initialContent = `# 🖼️ ${cleanTitle}\n\n` +
        `> **Image importée** : \`${file.name}\` — Taille : **${sizeFormatted}**.\n\n` +
        `Ce document visuel est synchronisé sur tous vos appareils. Vous pouvez l'afficher en plein écran ou le télécharger depuis le volet des documents joints ci-dessous.\n\n` +
        `---\n\n` +
        `*Aperçu disponible dans la grille des pièces jointes.*`;
      summary = `Image importée (${sizeFormatted})`;
      break;
    }

    case 'text': {
      tags.push('Note');
      const text = await readFileAsText(file);
      initialContent = text.startsWith('#')
        ? text
        : `# ${cleanTitle}\n\n${text}`;
      summary = `Fichier texte importé (${sizeFormatted})`;
      break;
    }

    default: {
      tags.push('Fichier');
      initialContent = `# 📦 ${cleanTitle}\n\n` +
        `> **Fichier joint** : \`${file.name}\` (${sizeFormatted}).\n\n` +
        `Ce document est sauvegardé dans votre système et téléchargeable via le panneau des pièces jointes.`;
      summary = `Document joint importé (${sizeFormatted})`;
      break;
    }
  }

  return {
    docType,
    cleanTitle,
    category: 'resource',
    tags,
    initialContent,
    attachment,
    summary,
  };
}
