
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.build.extraResources = pkg.build.extraResources.filter(r => r.from !== '.');

pkg.build.extraResources.push(
  {
    from: 'src/main/ai',
    to: '.',
    filter: [
      'ai_bridge.py'
    ]
  }
);

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

