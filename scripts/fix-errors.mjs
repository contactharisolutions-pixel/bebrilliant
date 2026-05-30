import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/api');
let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace error.message or e.message with 'Internal server error' for 500 status
    content = content.replace(/error:\s*e\.message\s*\}\s*,\s*\{\s*status:\s*500\s*\}/g, "error: 'Internal server error' }, { status: 500 }");
    content = content.replace(/error:\s*error\.message\s*\}\s*,\s*\{\s*status:\s*500\s*\}/g, "error: 'Internal server error' }, { status: 500 }");
    content = content.replace(/error:\s*err\.message\s*\}\s*,\s*\{\s*status:\s*500\s*\}/g, "error: 'Internal server error' }, { status: 500 }");
    // Also catch some common 400s if they leak raw DB messages? No, 400 is often a validation error which is fine to leak field details, but let's stick to 500s.

    if (content !== original) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log('Fixed:', file);
    }
}
console.log('Total files modified:', modifiedCount);
