const fs = require('fs');

const pNew = 'c:/Users/tony_/OneDrive/Desktop/VarietalApp/views/RecipesView.tsx';
let txt = fs.readFileSync(pNew, 'utf8');

// 1. Extract the misplaced block
// It starts with `{view === 'guide' && (`
// It ends exactly at `document.body\n      )}`
const startIndex = txt.indexOf("{view === 'guide' && (");
const endStr = "document.body\n      )}";
let endIndex = txt.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  // Wait, let's make endStr more resilient, maybe CRLF?
  const safeEndStr = "document.body\\r?\\n\\s*\\)\\}";
  const regex = new RegExp("(\\{view === 'guide' && \\([\\s\\S]*?" + safeEndStr + ")", "g");
  const match = txt.match(regex);
  if (match) {
    const misplacedCode = match[0];
    // Remove it from current spot:
    txt = txt.replace(misplacedCode, '');
    
    // 2. Find the end of FilterView
    // The target is:
    //       </div>
    //     </div>
    //   );
    // };
    // 
    // const FilterBrewView: React.FC
    const targetSpot = /([\s\S]*?)(\s*<\/div>\s*<\/div>\s*\);\s*\};\s*const FilterBrewView: React\.FC)/;
    const spotMatch = txt.match(targetSpot);
    
    if (spotMatch) {
      txt = txt.replace(targetSpot, `$1\n${misplacedCode}$2`);
      fs.writeFileSync(pNew, txt, 'utf8');
      console.log("Successfully moved the modal to FilterView!");
    } else {
      console.log("Could not find the insertion target before FilterBrewView!");
    }
  } else {
    console.log("Could not regex match the block!");
  }
} else {
  const misplacedCode = txt.substring(startIndex, endIndex + endStr.length);
  txt = txt.replace(misplacedCode, '');
  
  const targetSpot = /(\s*<\/div>\s*<\/div>\s*\);\s*\};\s*const FilterBrewView: React\.FC)/;
  if (targetSpot.test(txt)) {
    txt = txt.replace(targetSpot, `\n${misplacedCode}$1`);
    fs.writeFileSync(pNew, txt, 'utf8');
    console.log("Successfully moved the modal to FilterView!");
  } else {
    console.log("Could not find the insertion target before FilterBrewView!");
    // Maybe there are no newlines before const FilterBrewView?
    const fallbackTarget = /(};\s*const FilterBrewView: React\.FC)/;
    if (fallbackTarget.test(txt)) {
      txt = txt.replace(fallbackTarget, `\n${misplacedCode}\n$1`);
      fs.writeFileSync(pNew, txt, 'utf8');
      console.log("Successfully moved the modal to FilterView via fallback!");
    } else {
      console.log("Fallback also failed. Structure is completely unexpected.");
    }
  }
}
