const fs = require('fs');
const path = require('path');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

async function main() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  console.log('Reading source logo from:', logoPath);

  if (!fs.existsSync(logoPath)) {
    throw new Error('Source logo not found at: ' + logoPath);
  }

  // 1. Convert PNG to ICO
  const icoBuf = await pngToIco(logoPath);
  console.log('Successfully generated ICO buffer, length:', icoBuf.length);

  const targets = [
    path.join(__dirname, '..', 'build', 'icon.ico'),
    path.join(__dirname, '..', 'build', 'installerIcon.ico'),
    path.join(__dirname, '..', 'build', 'uninstallerIcon.ico'),
    path.join(__dirname, '..', 'build', 'installerHeaderIcon.ico'),
    path.join(__dirname, '..', 'electron', 'icon.ico'),
    path.join(__dirname, '..', 'public', 'favicon.ico'),
    path.join(__dirname, '..', 'public', 'icon.ico'),
    path.join(__dirname, '..', 'src', 'app', 'favicon.ico'),
    path.join(__dirname, '..', 'out', 'favicon.ico'),
    path.join(__dirname, '..', 'out', 'icon.ico'),
  ];

  for (const target of targets) {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, icoBuf);
    console.log('Wrote ICO to:', target, 'size:', fs.statSync(target).size);
  }

  // 2. Ensure icon.png is an exact copy of the real logo.png
  const logoBuf = fs.readFileSync(logoPath);
  const pngTargets = [
    path.join(__dirname, '..', 'build', 'icon.png'),
    path.join(__dirname, '..', 'electron', 'icon.png'),
    path.join(__dirname, '..', 'public', 'icon.png'),
    path.join(__dirname, '..', 'out', 'icon.png'),
    path.join(__dirname, '..', 'out', 'logo.png'),
  ];

  for (const target of pngTargets) {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, logoBuf);
    console.log('Wrote PNG to:', target, 'size:', fs.statSync(target).size);
  }

  console.log('All real synaptic brain icons generated successfully!');
}

main().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
