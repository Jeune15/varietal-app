const fs = require('fs');

const pNew = 'c:/Users/tony_/OneDrive/Desktop/VarietalApp/views/RecipesView.tsx';
let txt = fs.readFileSync(pNew, 'utf8');

// 1. Extract the misplaced block
// It starts with `{view === 'guide' && (`
// It ends right before `export const RecipesView`
const misplacedRegex = /(\s*\{view === 'guide' && \([\s\S]*?\s*\)\s*\})(\s*export const RecipesView)/;
const match = txt.match(misplacedRegex);

if (match && match[1]) {
  const misplacedCode = match[1];
  const trailingCode = match[2];
  
  // Remove the misplaced block from its current location
  txt = txt.replace(misplacedRegex, trailingCode);
  
  // 2. Find the end of FilterView.
  // It is the `};` right before `const FilterBrewView:`
  const endOfFilterViewRegex = /(\s*\}\s*;\s*)(const FilterBrewView: React\.FC)/;
  
  if (endOfFilterViewRegex.test(txt)) {
    // Insert the missing code right before the matching `};`
    // Wait, the end of FilterView is actually:
    //       </div>
    //     </div>
    //   );
    // };
    // We want to insert it before the last `</div>` of FilterView ? No, it belongs OUTSIDE the last grid column, but INSIDE the root div!
    // In old_recipes_utf8.tsx, it was:
    //       )}
    //       </div>
    //     </div>
    //   );
    // };
    // Let's insert it before the closing `</div>\n    </div>\n  );\n};\n\nconst FilterBrewView`
    
    // So the replacing target:
    //       </div>
    //     </div>
    //   );
    // };
    // const FilterBrewView
    
    // We replace that with:
    // ${misplacedCode}
    //       </div>
    //     </div>
    //   );
    // };
    // const FilterBrewView
    
    const insertTarget = /(\s*<\/div>\s*<\/div>\s*\);\s*\};\s*const FilterBrewView: React\.FC)/;
    
    if (insertTarget.test(txt)) {
      txt = txt.replace(insertTarget, `\n${misplacedCode}$1`);
      fs.writeFileSync(pNew, txt, 'utf8');
      console.log('Successfully moved the modal to the correct location!');
    } else {
      console.error('Could NOT find the end block of FilterView where we should insert the code!');
    }
  } else {
    console.error('Could NOT find const FilterBrewView');
  }
} else {
  console.error('Could NOT match the misplaced code at the bottom!');
}
