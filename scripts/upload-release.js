const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Récupérer le token GitHub depuis git credential
function getGitHubToken() {
  try {
    const creds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\nusername=Neysann\n',
      encoding: 'utf8',
    });
    const match = creds.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch (err) {
    console.error('Erreur récupération credential:', err.message);
  }
  return null;
}

const token = getGitHubToken();
if (!token) {
  console.error('❌ Aucun token GitHub trouvé.');
  process.exit(1);
}

const OWNER = 'Neysann';
const REPO = 'second-brain-os';
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const TAG = `v${pkg.version}`;

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: endpoint,
        method,
        headers: {
          'User-Agent': 'Syntropy-Release-Publisher',
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          ...(data
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
              }
            : {}),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (c) => (respData += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: respData ? JSON.parse(respData) : null });
          } catch (_) {
            resolve({ statusCode: res.statusCode, body: respData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function uploadAsset(uploadUrlTemplate, filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);
    const uploadUrl = uploadUrlTemplate.replace(/\{.*\}/, '') + `?name=${encodeURIComponent(fileName)}`;
    const urlObj = new URL(uploadUrl);

    console.log(`📤 Téléversement de ${fileName} (${(stat.size / 1024 / 1024).toFixed(2)} Mo)...`);

    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'User-Agent': 'Syntropy-Release-Publisher',
          Authorization: `token ${token}`,
          'Content-Type': fileName.endsWith('.yml') ? 'text/yaml' : 'application/octet-stream',
          'Content-Length': stat.size,
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (c) => (respData += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${fileName} téléversé avec succès !`);
            resolve();
          } else {
            console.error(`❌ Échec téléversement ${fileName} (HTTP ${res.statusCode}):`, respData);
            reject(new Error(`HTTP ${res.statusCode}: ${respData}`));
          }
        });
      }
    );

    req.on('error', reject);
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(req);
  });
}

async function main() {
  console.log(`🔍 Vérification de la release ${TAG} sur GitHub...`);
  let release = null;
  const getRes = await apiRequest('GET', `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);

  if (getRes.statusCode === 200 && getRes.body?.id) {
    console.log(`ℹ️ La release ${TAG} existe déjà (ID: ${getRes.body.id}).`);
    release = getRes.body;
  } else {
    console.log(`➕ Création de la release ${TAG} sur GitHub...`);
    const createRes = await apiRequest('POST', `/repos/${OWNER}/${REPO}/releases`, {
      tag_name: TAG,
      target_commitish: 'main',
      name: `Syntropy OS ${TAG}`,
      draft: false,
      prerelease: false,
      generate_release_notes: true,
    });
    if (createRes.statusCode !== 201) {
      throw new Error(`Erreur création release : ${JSON.stringify(createRes.body)}`);
    }
    release = createRes.body;
    console.log(`✅ Release ${TAG} créée avec succès (ID: ${release.id}) !`);
  }

  const distDir = path.join(__dirname, '..', 'dist');
  const filesToUpload = [
    path.join(distDir, 'latest.yml'),
    path.join(distDir, `Syntropy-OS-Setup-${pkg.version}.exe`),
    path.join(distDir, `Syntropy-OS-Setup-${pkg.version}.exe.blockmap`),
  ];

  for (const f of filesToUpload) {
    if (!fs.existsSync(f)) {
      console.warn(`⚠️ Fichier non trouvé : ${f}`);
      continue;
    }
    // Supprimer l'asset existant si déjà présent pour le remplacer proprement
    const fileName = path.basename(f);
    const existingAsset = release.assets?.find((a) => a.name === fileName);
    if (existingAsset) {
      console.log(`🗑️ Suppression de l'ancien asset existant ${fileName} (ID: ${existingAsset.id})...`);
      await apiRequest('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`);
    }

    await uploadAsset(release.upload_url, f);
  }

  console.log(`\n🎉 Tous les fichiers de la release ${TAG} sont désormais publiés sur GitHub !`);
}

main().catch((e) => {
  console.error('❌ Erreur script upload-release:', e);
  process.exit(1);
});

