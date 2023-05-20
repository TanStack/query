const fs = require('fs')

fs.cp('./build/lib/index.d.ts', './build/lib/index.prod.d.ts', (err) => {
  if (err) {
    console.error(err);
  }
});
