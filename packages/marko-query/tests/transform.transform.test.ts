import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The tag's transform is declared in the package's `marko.json`, so it only
// runs when a template is compiled against the package's own tag definitions.
// The test suite resolves tags through `tests/marko.json`, which points
// straight at `src/tags` and skips those definitions, so the transform is
// compiled here instead.
const require = createRequire(import.meta.url);
const compiler = require(
  require.resolve("@marko/compiler", {
    paths: [fileURLToPath(new URL("../node_modules/marko", import.meta.url))],
  }),
) as {
  compile: (
    source: string,
    filename: string,
    options: object,
  ) => Promise<{ code: string }>;
};

const compile = (source: string, name: string) =>
  compiler.compile(source, fileURLToPath(new URL(name, import.meta.url)), {
    output: "dom",
    modules: "esm",
  });

describe("<query-client-factory> transform", () => {
  it("injects the registration when the layout does not import it", async () => {
    const { code } = await compile(
      `import { createProbeClient } from "./probe-factory.ts";

<query-client-factory factory=createProbeClient/>
<main><\${input.content}/></main>
`,
      "./fixtures/factory-layout.marko",
    );

    expect(code).toContain(
      'import { setQueryClientFactory } from "@tanstack/marko-query"',
    );
    expect(code).toContain("setQueryClientFactory(createProbeClient)");
  });

  it("reuses a setQueryClientFactory the layout already imports", async () => {
    const { code } = await compile(
      `import { createProbeClient } from "./probe-factory.ts";
import { setQueryClientFactory } from "@tanstack/marko-query";

static setQueryClientFactory(createProbeClient);

<query-client-factory factory=createProbeClient/>
<main><\${input.content}/></main>
`,
      "./fixtures/factory-manual-layout.marko",
    );

    // One import, so the module compiles: a second binding of the same name
    // would be a duplicate declaration.
    expect(code.match(/from "@tanstack\/marko-query"/g)).toHaveLength(1);
    expect(code).toContain("setQueryClientFactory(createProbeClient)");
  });

  it("takes a free name when the layout binds setQueryClientFactory itself", async () => {
    const { code } = await compile(
      `import { createProbeClient } from "./probe-factory.ts";

static const setQueryClientFactory = () => {};

<query-client-factory factory=createProbeClient/>
<main><\${input.content}/></main>
`,
      "./fixtures/factory-shadowed-layout.marko",
    );

    expect(code).toContain(
      'import { setQueryClientFactory as _setQueryClientFactory } from "@tanstack/marko-query"',
    );
    expect(code).toContain("_setQueryClientFactory(createProbeClient)");
  });

  it("takes a free name when another module binds setQueryClientFactory", async () => {
    const { code } = await compile(
      `import { createProbeClient } from "./probe-factory.ts";
import { setQueryClientFactory } from "./other.ts";

<query-client-factory factory=createProbeClient/>
<main><\${input.content}/></main>
`,
      "./fixtures/factory-other-layout.marko",
    );

    expect(code).toContain(
      'import { setQueryClientFactory as _setQueryClientFactory } from "@tanstack/marko-query"',
    );
    expect(code).toContain("_setQueryClientFactory(createProbeClient)");
  });

  it("reuses an aliased import of setQueryClientFactory", async () => {
    const { code } = await compile(
      `import { createProbeClient } from "./probe-factory.ts";
import { setQueryClientFactory as scf } from "@tanstack/marko-query";

static scf(createProbeClient);

<query-client-factory factory=createProbeClient/>
<main><\${input.content}/></main>
`,
      "./fixtures/factory-aliased-layout.marko",
    );

    expect(code.match(/from "@tanstack\/marko-query"/g)).toHaveLength(1);
    expect(code).toContain("scf(createProbeClient)");
  });
});
