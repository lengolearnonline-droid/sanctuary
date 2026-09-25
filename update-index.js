
const fs = require('fs');
let content = fs.readFileSync('src/main/index.ts', 'utf8');
content = content.replace(/fullscreen: true,/g, 'fullscreen: false,\n    useContentSize: true,');
fs.writeFileSync('src/main/index.ts', content);

