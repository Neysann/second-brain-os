const fs = require('fs');
const path = require('path');

async function main() {
  const cfg = JSON.parse(fs.readFileSync('C:/Users/nathan.debeaupuis/.config/configstore/firebase-tools.json', 'utf8'));
  const refreshToken = cfg.tokens.refresh_token;

  const clientId = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
  const clientSecret = 'j9iVZfS8kkCEFUPaAeJV0sAi';

  console.log('Refreshing OAuth token...');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await res.json();
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
  }
  const token = tokenData.access_token;
  console.log('Got access token successfully.');

  const exePath = path.join(__dirname, '..', 'dist', 'Syntropy-OS-Setup-2.5.0.exe');
  if (!fs.existsSync(exePath)) {
    throw new Error('Exe not found at ' + exePath);
  }
  const exeStats = fs.statSync(exePath);
  console.log(`Exe size: ${exeStats.size} bytes (${(exeStats.size / 1024 / 1024).toFixed(2)} MB)`);

  // Try buckets: second-brain-os-e6a83.firebasestorage.app, second-brain-os-e6a83.appspot.com
  const buckets = ['second-brain-os-e6a83.firebasestorage.app', 'second-brain-os-e6a83.appspot.com'];
  let successfulUpload = null;

  for (const bucket of buckets) {
    console.log(`Trying upload to bucket: ${bucket}...`);
    try {
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=releases%2FSyntropy-OS-Setup-2.5.0.exe`;
      const fileStream = fs.readFileSync(exePath);

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: fileStream,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        console.log(`Upload successful to ${bucket}:`, uploadData.name);

        // Make it publicly readable or generate public download link
        // Set ACL to publicRead
        try {
          const aclRes = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucket}/o/releases%2FSyntropy-OS-Setup-2.5.0.exe/acl`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entity: 'allUsers',
              role: 'READER',
            }),
          });
          const aclData = await aclRes.json();
          console.log('ACL set to publicRead:', aclData);
        } catch (e) {
          console.warn('Could not set public ACL:', e.message);
        }

        const publicUrl = `https://storage.googleapis.com/${bucket}/releases/Syntropy-OS-Setup-2.5.0.exe`;
        const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/releases%2FSyntropy-OS-Setup-2.5.0.exe?alt=media`;

        console.log('Public Storage URL:', publicUrl);
        console.log('Firebase Storage Media URL:', firebaseUrl);
        successfulUpload = { bucket, publicUrl, firebaseUrl };
        break;
      } else {
        const errText = await uploadRes.text();
        console.warn(`Bucket ${bucket} upload returned ${uploadRes.status}: ${errText}`);
      }
    } catch (err) {
      console.warn(`Error uploading to ${bucket}:`, err.message);
    }
  }

  if (successfulUpload) {
    fs.writeFileSync(
      path.join(__dirname, '..', 'src', 'lib', 'storageDownloadUrl.json'),
      JSON.stringify(successfulUpload, null, 2)
    );
    console.log('Saved download URL to src/lib/storageDownloadUrl.json');
  } else {
    console.error('All bucket uploads failed.');
  }
}

main().catch(console.error);
