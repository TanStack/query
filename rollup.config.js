require("ts-node").register({
  compilerOptions: {
    esModuleInterop: true,
  },
});

module.exports = require("./rollup.config.ts");
