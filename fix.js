import fs from 'fs';
let text = fs.readFileSync('views/FilterToolView.tsx', 'utf8');
text = text.replace(/\\\$/g, '$');
text = text.replace(/\\`/g, '`');
fs.writeFileSync('views/FilterToolView.tsx', text);
console.log('Done!');
