import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'src', 'app');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file === 'route.ts') {
            console.log(`Rewriting ${fullPath}`);
            const content = fs.readFileSync(fullPath);
            fs.writeFileSync(fullPath, content);
        }
    }
}

console.log('Starting filesystem fix...');
walk(root);
console.log('Done!');
