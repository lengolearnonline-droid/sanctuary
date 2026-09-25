import fs from 'fs';
import path from 'path';
import { DatabaseService } from './src/core/database/DatabaseService';
import { BibleImporter } from './src/main/bible/BibleImporter';

async function run() {
  const dataDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config'), 'sanctuary');
  
  console.log('Initializing database at:', dataDir);
  const dbService = new DatabaseService(dataDir);
  await dbService.initialize();
  
  const importer = new BibleImporter(dbService.getDatabase());
  
  const biblesDir = 'C:\\Users\\OBITECH\\Documents\\Bible';
  const files = fs.readdirSync(biblesDir).filter(f => f.endsWith('.xml'));
  
  for (const file of files) {
    const fullPath = path.join(biblesDir, file);
    console.log(`Importing ${file}...`);
    try {
      const result = await importer.importXml(fullPath);
      console.log('Success:', result);
    } catch (e) {
      console.error(`Failed to import ${file}:`, e);
    }
  }
  
  console.log('All done!');
  process.exit(0);
}

run();
