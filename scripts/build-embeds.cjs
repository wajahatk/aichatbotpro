const path = require("node:path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");

async function buildJs() {
  const cfg = require(path.join(root, "packages/embeds/js/esbuild.config.cjs"));
  await esbuild.build({
    absWorkingDir: root,
    entryPoints: [
      "packages/embeds/js/src/index.ts",
      "packages/embeds/js/src/web.ts",
    ],
    outdir: "packages/embeds/js/dist",
    bundle: true,
    format: "esm",
    platform: "browser",
    splitting: false,
    minify: true,
    ...cfg,
  });
  console.log("built @typebot.io/js");
}

async function buildReact() {
  await esbuild.build({
    absWorkingDir: root,
    entryPoints: [
      "packages/embeds/react/src/index.ts",
      "packages/embeds/react/src/web.ts",
    ],
    outdir: "packages/embeds/react/dist",
    bundle: true,
    format: "esm",
    platform: "browser",
    splitting: true,
    minify: true,
    external: ["react", "react/jsx-runtime", "react-dom"],
  });
  console.log("built @typebot.io/react");
}

(async () => {
  await buildJs();
  await buildReact();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
