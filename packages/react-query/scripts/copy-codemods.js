const fs = require('fs')

fs.cp('../codemods/src', './build/codemods', { recursive: true }, (err) => {
  if (err) {
    console.error(err);
  }
});
