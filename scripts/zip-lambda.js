/**
 * Creates build.zip from the build/ directory for Lambda deployment.
 * Run from repo root. Amplify/CodeBuild use this before uploading to S3.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const buildDir = path.join(__dirname, "..", "build");
const outZip = path.join(__dirname, "..", "build.zip");

if (!fs.existsSync(buildDir)) {
  console.error("build/ not found. Run npm run build:lambda first.");
  process.exit(1);
}

// Use zip if available (Linux/macOS), else Node archiver would be needed
const isWindows = process.platform === "win32";
if (isWindows) {
  // PowerShell: Compress-Archive
  execSync(
    `powershell -Command "Compress-Archive -Path '${buildDir}\\*' -DestinationPath '${outZip}' -Force"`,
    { stdio: "inherit" }
  );
} else {
  execSync(`cd "${buildDir}" && zip -r "${outZip}" .`, { stdio: "inherit" });
}
console.log("Created build.zip");
