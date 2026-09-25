
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.build.extraResources.push(
  {
    from: '.',
    to: '.',
    filter: [
      'vosk_tcp.py',
      'vosk_ws.py',
      'vosk-model/**/*'
    ]
  }
);

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

