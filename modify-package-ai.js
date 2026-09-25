
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts['build:ai'] = 'python -m PyInstaller --onefile --distpath build-ai src/main/ai/ai_bridge.py';

// Remove the old ai_bridge.py from extraResources
pkg.build.extraResources = pkg.build.extraResources.filter(r => r.filter ? !r.filter.includes('ai_bridge.py') : true);

// Add the new built executable to extraResources
pkg.build.extraResources.push(
  {
    from: 'build-ai',
    to: '.',
    filter: [
      'ai_bridge.exe',
      'ai_bridge'
    ]
  }
);

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

