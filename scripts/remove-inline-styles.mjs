import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function removeInlineStyles(dirPath) {
  walkDir(dirPath, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Regex to find things like: <style>{`@keyframes spin { ... }`}</style>
      // Or: <style>{`...`}</style>
      const styleRegex = /<style>\{`[^`]*`\}<\/style>/g;
      
      let modified = false;
      content = content.replace(styleRegex, (match) => {
        // Only remove if it's mostly just spin or hover-lift
        const isSpin = match.includes('spin');
        const isHoverLift = match.includes('hover-lift');
        
        // Let's only target our specific known redundant styles.
        // E.g. we don't want to remove complex unique styles.
        // We know we want to remove the ones defining spin and hover-lift
        if (isSpin || isHoverLift) {
            // we remove it by returning empty string
            modified = true;
            return '';
        }
        return match;
      });
      
      if (modified) {
        // Also remove any resulting completely empty lines that were left behind
        // if the style tag was on its own line
        content = content.replace(/^\s*\n/gm, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned up inline styles in ${filePath}`);
      }
    }
  });
}

removeInlineStyles('./src');
