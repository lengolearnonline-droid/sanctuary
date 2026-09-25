
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

delete pkg.scripts['package'];
delete pkg.scripts['package:dir'];
pkg.scripts['package:win'] = 'electron-builder --win';
pkg.scripts['package:mac'] = 'electron-builder --mac';
pkg.scripts['package:all'] = 'electron-builder --win --mac';

if (pkg.build && pkg.build.win) {
  delete pkg.build.win.icon;
}
if (pkg.build && pkg.build.files) {
  pkg.build.files = pkg.build.files.filter(f => f !== 'assets/**/*');
}

pkg.build.mac = {
  category: 'public.app-category.productivity',
  target: [
    { target: 'dmg', arch: ['x64', 'arm64'] },
    { target: 'zip', arch: ['x64', 'arm64'] }
  ]
};

pkg.build.dmg = {
  title: 'Sanctuary'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

