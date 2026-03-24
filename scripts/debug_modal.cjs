const fs = require('fs');

const pNew = 'c:/Users/tony_/OneDrive/Desktop/VarietalApp/views/RecipesView.tsx';
let txt = fs.readFileSync(pNew, 'utf8');

// The misplaced block starts at "{view === 'guide' && ("
const startStr = "{view === 'guide' && (\\n        <div className=\"w-full\">\\n          <FilterCalibrationGuide";
const startIndex = txt.indexOf("{view === 'guide' && (");

// It ends before "export const RecipesView"
const endStr = "export const RecipesView";
const endIndex = txt.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end!");
  process.exit(1);
}

// We extract everything from startIndex to endIndex
const blockToMove = txt.substring(startIndex, endIndex);

// Remove it from the current location
txt = txt.substring(0, startIndex) + txt.substring(endIndex);

// Where does it belong? At the end of FilterView.
// FilterView ends right before 'const FilterBrewView'
// So we find 'const FilterBrewView: React.FC'
const filterBrewIndex = txt.indexOf('const FilterBrewView: React.FC');

if (filterBrewIndex === -1) {
  console.log("Could not find FilterBrewView");
  process.exit(1);
}

// But wait, the block we extracted contains the closing tags of FilterBrewView:
//       </div>
//     </div>
//   );
// };
// Because my regex from before inserted it before export const RecipesView!

// Wait! If the block 'blockToMove' contains the closing tags of FilterBrewView, we need to separate them.
// Let's see what 'blockToMove' actually is:
console.log("BLOCK TO MOVE:");
console.log(blockToMove.substring(blockToMove.length - 200));

// We need to write this to a safe location first so we don't mess up.
fs.writeFileSync('c:/Users/tony_/OneDrive/Desktop/VarietalApp/scripts/debug_block.txt', blockToMove, 'utf8');
