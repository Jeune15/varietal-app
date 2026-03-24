const fs = require('fs');
const p = 'c:/Users/tony_/OneDrive/Desktop/VarietalApp/views/RecipesView.tsx';
let txt = fs.readFileSync(p, 'utf8');
txt = txt.replace(/pourType: 'centro'/g, "pourType: 'central'");
fs.writeFileSync(p, txt, 'utf8');
console.log('Fixed centro to central');
