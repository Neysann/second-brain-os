const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Détecter le répertoire racine Git (.git)
const rootDir = process.cwd();
let gitDir = rootDir;
if (fs.existsSync(path.join(rootDir, '.git'))) {
  gitDir = rootDir;
} else if (fs.existsSync(path.join(rootDir, 'second-brain-os', '.git'))) {
  gitDir = path.join(rootDir, 'second-brain-os');
} else {
  console.error("❌ Aucun dépôt Git (.git) trouvé dans le dossier actuel ni dans second-brain-os/.");
  process.exit(1);
}

// 2. Synchroniser les fichiers modifiés vers second-brain-os si lancé depuis la racine
if (gitDir !== rootDir) {
  const syncDirs = ['src', '.github', 'electron', 'public'];
  // Synchroniser package.json
  const rootPkg = path.join(rootDir, 'package.json');
  const subPkg = path.join(gitDir, 'package.json');
  if (fs.existsSync(rootPkg) && fs.existsSync(subPkg)) {
    fs.copyFileSync(rootPkg, subPkg);
  }
}

// 3. Lire la version actuelle depuis package.json
const pkgPath = path.join(gitDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;
const tagName = `v${version}`;

console.log(`\n🚀 Préparation de la release GitHub pour Syntropy OS ${tagName}...`);
console.log(`📁 Répertoire Git cible : ${gitDir}`);

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: gitDir, stdio: 'inherit' });
}

try {
  // 4. Stager tous les fichiers modifiés
  run('git add -A');

  // 5. Commiter si des fichiers ont changé
  try {
    execSync('git diff-index --quiet HEAD --', { cwd: gitDir });
    console.log('ℹ️ Aucun nouveau changement à commiter.');
  } catch (e) {
    run(`git commit -m "Release ${tagName}"`);
    run('git push origin main');
  }

  // 6. Créer et pousser le tag
  console.log(`🏷️ Création du tag Git ${tagName}...`);
  const existingTags = execSync('git tag', { cwd: gitDir, encoding: 'utf8' })
    .split('\n')
    .map((t) => t.trim());

  if (existingTags.includes(tagName)) {
    console.warn(`⚠️ Le tag ${tagName} existe déjà localement. Remplacement avec force...`);
    run(`git tag -fa "${tagName}" -m "Release ${tagName}"`);
    run(`git push origin "${tagName}" --force`);
  } else {
    run(`git tag -a "${tagName}" -m "Release ${tagName}"`);
    run(`git push origin "${tagName}"`);
  }

  console.log(`\n✅ Tag ${tagName} poussé avec succès sur GitHub !`);
  console.log(`⚡ Le workflow GitHub Actions 'Release Syntropy OS Desktop' a été déclenché.`);
  console.log(`🔗 Suivez la compilation en direct sur : https://github.com/Neysann/second-brain-os/actions\n`);
} catch (error) {
  console.error(`\n❌ Échec de la commande de release :`, error.message);
  process.exit(1);
}
