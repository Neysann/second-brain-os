const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const gitDir = fs.existsSync(path.join(rootDir, 'second-brain-os', '.git'))
  ? path.join(rootDir, 'second-brain-os')
  : rootDir;

console.log('====================================================');
console.log('🚀 PUBLICATION AUTOMATIQUE — SYNTROPY OS');
console.log('====================================================');
console.log(`📁 Répertoire source : ${rootDir}`);
console.log(`📁 Répertoire Git    : ${gitDir}`);

// 1. Lire la version
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;
const tagName = `v${version}`;
console.log(`🏷️ Version cible     : ${tagName}\n`);

// 2. Synchronisation récursive vers second-brain-os si sous-dossier Git
function copyRecursiveSync(src, dest, ignoreList = []) {
  if (!fs.existsSync(src)) return;
  const baseName = path.basename(src);
  if (ignoreList.includes(baseName)) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child), ignoreList);
    }
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

if (gitDir !== rootDir) {
  console.log('📦 Synchronisation des fichiers vers second-brain-os/...');
  const dirsToSync = ['src', 'public', 'electron', '.github', 'scripts'];
  const filesToSync = [
    'package.json',
    'patchnote.txt',
    'next.config.ts',
    'tsconfig.json',
    'firebase.json',
    'firestore.rules',
    '.firebaserc',
  ];
  const ignoreList = [
    'node_modules',
    '.next',
    'dist',
    'out',
    '.git',
    '.agents',
    'scratch',
    'check-domains.js',
    'sync-firebase-auth.js',
    '.env',
    '.env.local'
  ];

  for (const d of dirsToSync) {
    copyRecursiveSync(path.join(rootDir, d), path.join(gitDir, d), ignoreList);
  }
  for (const f of filesToSync) {
    const srcF = path.join(rootDir, f);
    const dstF = path.join(gitDir, f);
    if (fs.existsSync(srcF)) {
      fs.copyFileSync(srcF, dstF);
    }
  }
  console.log('✅ Synchronisation locale terminée.\n');
}

function run(cmd, cwd = gitDir) {
  console.log(`> [${path.basename(cwd)}] ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 3. Git commit & push sur GitHub
try {
  console.log('🐙 Publication sur GitHub...');
  run('git add -A', gitDir);

  let hasChanges = false;
  try {
    execSync('git diff-index --quiet HEAD --', { cwd: gitDir });
  } catch (e) {
    hasChanges = true;
  }

  if (hasChanges) {
    run(`git commit -m "chore(release): ${tagName} - patch note & updates"`, gitDir);
    run('git push origin main', gitDir);
    console.log('✅ Modifications poussées sur la branche main de GitHub.');
  } else {
    console.log('ℹ️ Aucun changement en attente de commit Git.');
  }

  // Push Tag
  try {
    const existingTags = execSync('git tag', { cwd: gitDir, encoding: 'utf8' })
      .split('\n')
      .map((t) => t.trim());
    if (existingTags.includes(tagName)) {
      run(`git tag -fa "${tagName}" -m "Release ${tagName}"`, gitDir);
      run(`git push origin "${tagName}" --force`, gitDir);
    } else {
      run(`git tag -a "${tagName}" -m "Release ${tagName}"`, gitDir);
      run(`git push origin "${tagName}"`, gitDir);
    }
    console.log(`✅ Tag ${tagName} poussé sur GitHub (déclenchement des GitHub Actions).`);
  } catch (tagErr) {
    console.warn(`⚠️ Avertissement lors de la création/push du tag Git:`, tagErr.message);
  }
} catch (gitErr) {
  console.error('❌ Erreur lors de la publication Git:', gitErr.message);
}

// 4. Build et déploiement Firebase Hosting
try {
  console.log('\n🔥 Déploiement sur Firebase Hosting...');
  console.log('🔨 Compilation de l\'application Next.js (production build)...');
  run('npm run build', rootDir);

  console.log('☁️ Téléversement sur Firebase Hosting...');
  run('npx --yes firebase-tools deploy --only hosting', rootDir);
  console.log('✅ Déploiement Firebase terminé avec succès !');
} catch (fbErr) {
  console.error('❌ Erreur lors du déploiement Firebase:', fbErr.message);
}

console.log('\n====================================================');
console.log('🎉 PUBLICATION TERMINÉE');
console.log(`🌐 Site Web en direct : https://second-brain-os-e6a83.web.app`);
console.log(`🐙 Dépôt GitHub       : https://github.com/Neysann/second-brain-os`);
console.log('====================================================\n');
