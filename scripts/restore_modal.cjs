const fs = require('fs');

const pNew = 'c:/Users/tony_/OneDrive/Desktop/VarietalApp/views/RecipesView.tsx';
const pOld = '/tmp/old_recipes_utf8.tsx';

const txtNew = fs.readFileSync(pNew, 'utf8');
const txtOld = fs.readFileSync(pOld, 'utf8');

// The old file has the missing code starting exactly at:
//       {view === 'guide' && (
// And ending exactly before:
//       </div>
//     </div>
//   );
// };

const match = txtOld.match(/(\s*\{view === 'guide' && \([\s\S]*?createPortal\([\s\S]*?document\.body\s*\)\s*\})/);

if (match && match[1]) {
  const missingCode = match[1];
  
  // Now we need to insert this missingCode into txtNew, right before the final `</div>` of FilterView
  // In txtNew, it ends with:
  //       </div>
  //     </div>
  //   );
  // };
  // export const RecipesView
  
  const targetEnd = /\s*<\/div>\s*<\/div>\s*\);\s*\};\s*export const RecipesView/;
  
  if (targetEnd.test(txtNew)) {
    const newContent = txtNew.replace(targetEnd, `\n${missingCode}\n      </div>\n    </div>\n  );\n};\n\nexport const RecipesView`);
    fs.writeFileSync(pNew, newContent, 'utf8');
    console.log('Successfully restored missing code block!');
  } else {
    console.error('Could not find target end point in new file');
  }
} else {
  console.error('Could not extract missing code from old file');
}
