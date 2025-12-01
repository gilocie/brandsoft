const fs = require("fs");
const { execSync } = require("child_process");

const MAIN = "package.json";
const WEB = "package-web.json";

function mergeDeps(source, target) {
  target.dependencies = target.dependencies || {};
  target.devDependencies = target.devDependencies || {};

  if (source.dependencies) {
    for (const [pkg, version] of Object.entries(source.dependencies)) {
      target.dependencies[pkg] = version;
    }
  }

  if (source.devDependencies) {
    for (const [pkg, version] of Object.entries(source.devDependencies)) {
      target.devDependencies[pkg] = version;
    }
  }
}

function run() {
  if (!fs.existsSync(MAIN)) {
    console.error("ERROR: package.json not found.");
    process.exit(1);
  }

  const mainJson = JSON.parse(fs.readFileSync(MAIN, "utf8"));
  let webJson = {};

  if (fs.existsSync(WEB)) {
    webJson = JSON.parse(fs.readFileSync(WEB, "utf8"));
  }

  mergeDeps(mainJson, webJson);

  fs.writeFileSync(WEB, JSON.stringify(webJson, null, 2));

  console.log("✔ package-web.json updated successfully");

  // Auto Git push
  try {
    execSync(`git add ${WEB}`);
    execSync(`git commit -m "Auto-update package-web.json"`);
    execSync("git push origin main");
    console.log("✔ Auto-pushed to GitHub");
  } catch (err) {
    console.log("⚠ Git push skipped (no changes or no repo)");
  }
}

run();
