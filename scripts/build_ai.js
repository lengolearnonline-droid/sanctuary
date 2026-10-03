const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '../build-ai/vosk_bridge');
const PYTHON_DIR = path.join(BUILD_DIR, 'python');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Building AI bridge...');
  
  if (process.platform !== 'win32') {
    console.log('Only Windows is supported for this portable build right now. Skipping.');
    // Just copy the script
    fs.mkdirSync(BUILD_DIR, { recursive: true });
    fs.copyFileSync(path.join(__dirname, '../src/main/ai/vosk_bridge.py'), path.join(BUILD_DIR, 'vosk_bridge.py'));
    return;
  }

  // Clean build dir
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PYTHON_DIR, { recursive: true });

  console.log('Downloading Python embeddable...');
  const pyZip = path.join(BUILD_DIR, 'python.zip');
  await download('https://www.python.org/ftp/python/3.10.11/python-3.10.11-embed-amd64.zip', pyZip);

  console.log('Extracting Python...');
  execSync(`tar -xf "${pyZip}" -C "${PYTHON_DIR}"`);
  fs.unlinkSync(pyZip);

  // Enable site-packages in python embeddable
  const pthFile = path.join(PYTHON_DIR, 'python310._pth');
  let pthContent = fs.readFileSync(pthFile, 'utf8');
  pthContent = pthContent.replace('#import site', 'import site');
  fs.writeFileSync(pthFile, pthContent);

  console.log('Downloading get-pip.py...');
  const getPip = path.join(PYTHON_DIR, 'get-pip.py');
  await download('https://bootstrap.pypa.io/get-pip.py', getPip);

  console.log('Installing pip...');
  execSync(`"${path.join(PYTHON_DIR, 'python.exe')}" "${getPip}"`);

  console.log('Installing vosk...');
  execSync(`"${path.join(PYTHON_DIR, 'python.exe')}" -m pip install vosk`);

  console.log('Copying bridge script...');
  fs.copyFileSync(path.join(__dirname, '../src/main/ai/vosk_bridge.py'), path.join(BUILD_DIR, 'vosk_bridge.py'));

  console.log('AI bridge build complete.');
}

main().catch(console.error);
