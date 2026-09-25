
const fs = require("fs");
let content = fs.readFileSync("src/renderer/pages/Bible/BiblePage.tsx", "utf8");
content = content.replace(/id: \\scripture_\\ \+ Date\.now\(\),/g, "id: `scripture_${Date.now()}`,");
fs.writeFileSync("src/renderer/pages/Bible/BiblePage.tsx", content);

