const path = require("path");
const resolveFrom = require("resolve-from");

const fixLinkedDependencies = (config) => {
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      react$: resolveFrom(path.resolve("node_modules"), "react"),
      "react-dom$": resolveFrom(path.resolve("node_modules"), "react-dom"),
    },
  };
  return config;
};

const includeSrcDirectory = (config) => {
  config.resolve = {
    ...config.resolve,
    modules: [path.resolve("src"), ...config.resolve.modules],
  };
  return config;
};

const allowOutsideSrc = (config) => {
  config.resolve.plugins = config.resolve.plugins.filter(
    (p) => p.constructor.name !== "ModuleScopePlugin"
  );
  return config;
};

module.exports = [
  ["use-babel-config", ".babelrc"],
  ["use-eslint-config", ".eslintrc"],
  fixLinkedDependencies,
  allowOutsideSrc,
  // includeSrcDirectory,
];
