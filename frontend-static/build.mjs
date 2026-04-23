import fs from 'node:fs/promises';
import path from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const dist = path.join(root, 'dist');

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const file of ['index.html', 'styles.css', 'app.js']) {
  await fs.copyFile(path.join(root, file), path.join(dist, file));
}

const apiBaseUrl = process.env.FRONTEND_API_BASE_URL || 'http://localhost:3000/api';
const configContent = `window.APP_CONFIG = {\n  API_BASE_URL: ${JSON.stringify(apiBaseUrl)}\n};\n`;
await fs.writeFile(path.join(dist, 'config.js'), configContent, 'utf8');

console.log(`Built static site with API base URL: ${apiBaseUrl}`);
