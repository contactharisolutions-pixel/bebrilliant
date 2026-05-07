const fs = require('fs');
const path = 'g:/My Projects/BlinkOpticals/public/admin/js/erp-views.js';

const lines = fs.readFileSync(path, 'utf8').split('\n');
console.log('Total lines before:', lines.length);

// Remove lines 4566-4758 (1-indexed = index 4565-4757)
const keep = lines.filter((_, i) => i < 4565 || i > 4757);
console.log('Total lines after:', keep.length);
console.log('Lines removed:', lines.length - keep.length);

fs.writeFileSync(path, keep.join('\n'), 'utf8');
console.log('Done');
process.exit(0);
