import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const manifestJson = JSON.parse(readFileSync("public/manifest.json", "utf8"));

if (packageJson.version !== manifestJson.version) {
  throw new Error(
    `Version mismatch: package.json is ${packageJson.version}, public/manifest.json is ${manifestJson.version}`
  );
}

const version = packageJson.version;
const shortSha = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
  encoding: "utf8"
}).trim();
const tagName = `v${version}`;
const releaseName = `Warmwire v${version}`;
const assetName = `warmwire-extension-v${version}.zip`;

let previousTag = "";
try {
  previousTag = execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
} catch {
  previousTag = "";
}

const logRange = previousTag ? `${previousTag}..HEAD` : "HEAD";
let commits = execFileSync(
  "git",
  ["log", logRange, "--pretty=format:- %s (%h)"],
  { encoding: "utf8" }
).trim();

if (!commits) {
  commits = "- Maintenance release";
}

const changelog = [
  `## ${releaseName}`,
  "",
  `Built from commit ${shortSha}.`,
  "",
  "### Changes",
  "",
  commits,
  ""
].join("\n");

mkdirSync("release", { recursive: true });
const notesPath = "release/RELEASE_NOTES.md";
writeFileSync(notesPath, changelog);

const outputPath = process.env.GITHUB_OUTPUT;
if (outputPath) {
  await import("node:fs").then(({ appendFileSync }) => {
    appendFileSync(outputPath, `version=${version}\n`);
    appendFileSync(outputPath, `short_sha=${shortSha}\n`);
    appendFileSync(outputPath, `tag_name=${tagName}\n`);
    appendFileSync(outputPath, `release_name=${releaseName}\n`);
    appendFileSync(outputPath, `asset_name=${assetName}\n`);
    appendFileSync(outputPath, `notes_path=${notesPath}\n`);
  });
} else {
  console.log(changelog);
}
