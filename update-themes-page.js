const fs = require('fs');
let content = fs.readFileSync('src/renderer/pages/Themes/ThemesPage.tsx', 'utf8');

const newFields = \
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label>Reference Pill Background (RGBA)</label>
                    <input 
                      type="text" 
                      value={activeTheme.colors.referenceBackground || ""}
                      onChange={(e) => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, referenceBackground: e.target.value}})}
                      className="input-field"
                      placeholder="e.g. rgba(255,255,255,0.2) or transparent"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label>Reference Text Color</label>
                    <input 
                      type="color" 
                      value={activeTheme.colors.referenceText || activeTheme.colors.reference || "#9CA3AF"}
                      onChange={(e) => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, referenceText: e.target.value}})}
                      className="input-field"
                    />
                  </div>
\;

content = content.replace(
  /<div className="form-group" style=\{\{ marginBottom: '12px' \}\}>\s*<label>Text Box Background \\(RGBA\\)<\/label>/,
  newFields + "\n                  <div className=\"form-group\" style={{ marginBottom: '12px' }}>\n                    <label>Text Box Background (RGBA)</label>"
);

fs.writeFileSync('src/renderer/pages/Themes/ThemesPage.tsx', content);
console.log('Done');
