
const fs = require('fs');
let content = fs.readFileSync('src/renderer/components/presentation/SlideRenderer.tsx', 'utf8');
content = content.replace('fontSize: em,', 'fontSize: \${slide.theme?.typography?.referenceSize || 0.6}em\,');
fs.writeFileSync('src/renderer/components/presentation/SlideRenderer.tsx', content);

