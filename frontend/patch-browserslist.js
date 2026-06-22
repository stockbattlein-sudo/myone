const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'node_modules', 'browserslist', 'node.js');

try {
  if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');
    
    // Perform search and replace for both problematic lines
    const search1 = 'var SCOPED_CONFIG__PATTERN = /@[^/]+(?:\\/[^/]+)?\\/browserslist-config(?:-|$|\\/)/';
    const replace1 = 'var SCOPED_CONFIG__PATTERN = /@[^\\/]+(?:\\/[^\\/]+)?\\/browserslist-config(?:-|$|\\/)/';
    
    const search2 = "if (name.replace(/^@[^/]+\\//, '').indexOf('.') !== -1) {";
    const replace2 = "if (name.replace(/^@[^\\/]+\\//, '').indexOf('.') !== -1) {";
    
    if (content.includes(search1) || content.includes(search2)) {
      const patched = content
        .replace(search1, replace1)
        .replace(search2, replace2);
      
      fs.writeFileSync(targetFile, patched, 'utf8');
      console.log('Successfully patched browserslist regex for Node 20/24 compatibility.');
    } else {
      console.log('browserslist node.js is already patched or format differs.');
    }
  } else {
    console.log('browserslist node.js file not found at: ' + targetFile);
  }
} catch (err) {
  console.error('Failed to patch browserslist:', err);
}
