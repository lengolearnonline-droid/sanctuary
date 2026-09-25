
const fs = require("fs");

let appContent = fs.readFileSync("src/renderer/App.tsx", "utf8");
appContent = appContent.split("reference: `${passage.book} ${passage.chapter}:${firstVerse.verse}`").join("reference: `${passage.book} ${passage.chapter}:${firstVerse.verse} (${passage.translationId || \"KJV\"})`");
fs.writeFileSync("src/renderer/App.tsx", appContent);

let bibleContent = fs.readFileSync("src/renderer/pages/Bible/BiblePage.tsx", "utf8");
bibleContent = bibleContent.split("reference: `${v.book} ${v.chapter}:${v.verse}`").join("reference: `${v.book} ${v.chapter}:${v.verse} (${selectedTranslation})`");
fs.writeFileSync("src/renderer/pages/Bible/BiblePage.tsx", bibleContent);

console.log("Done");

