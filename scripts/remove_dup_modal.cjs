const fs = require('fs');

const pNew = 'c:/Users/tony_/OneDrive/Desktop/VarietalApp/views/RecipesView.tsx';
let txt = fs.readFileSync(pNew, 'utf8');

const targetStr = "{view === 'guide' && (";
const firstIndex = txt.indexOf(targetStr);
const secondIndex = txt.indexOf(targetStr, firstIndex + 1);

if (secondIndex !== -1) {
  // We want to delete from secondIndex to the end of that block.
  // The block ends at "document.body\n      )}"
  // Wait, let's search for "document.body" AFTER secondIndex
  const endBody = "document.body";
  let endIndex = txt.indexOf(endBody, secondIndex);
  
  // Actually, we want to delete until after the `)}`
  const closeTag = ")}";
  const closeIndex = txt.indexOf(closeTag, endIndex);
  
  if (closeIndex !== -1) {
    const textToRemove = txt.substring(secondIndex, closeIndex + closeTag.length);
    console.log("Removing duplicated code block from length", textToRemove.length);
    txt = txt.replace(textToRemove, "");
    fs.writeFileSync(pNew, txt, 'utf8');
    console.log("Successfully removed second occurrence.");
  } else {
    console.log("Could not find the end of the second block.");
  }
} else {
  console.log("Second occurrence not found?!");
}
