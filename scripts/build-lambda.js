const esbuild = require("esbuild");
const path = require("path");

const outDir = path.join(__dirname, "..", "build");

esbuild
  .build({
    entryPoints: [path.join(__dirname, "..", "src", "api", "lambdaRouter.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: path.join(outDir, "index.js"),
    external: ["express"],
    sourcemap: true,
  })
  .then(() => console.log("Lambda build done: build/index.js"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
