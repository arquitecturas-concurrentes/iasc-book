/* eslint-disable no-console */
const execa = require("execa");
const fs = require("fs");

(async () => {
  try {
    await execa("git", ["checkout", "--orphan", "master"]);
    // eslint-disable-next-line no-console
    console.log("Building started...");
    //await execa("npm", ["run", "build"]);
    await execa("yarn", ["build"]);
    // Understand if it's dist or build folder
    const folderName = fs.existsSync("dist") ? "dist" : "build";
    await execa("cp", ["./dist/index.html", "./dist/404.html"]);
    await execa("git", ["--work-tree", folderName, "add", "--all"]);
    await execa("git", ["--work-tree", folderName, "commit", "-m", "master"]);
    console.log("Pushing to master branch...");
    await execa("git", ["push", "origin", "HEAD:master", "--force"]);
    await execa("rm", ["-r", folderName]);
    await execa("git", ["checkout", "-f", "source"]);
    await execa("git", ["branch", "-D", "master"]);
    console.log("Successfully deployed, check your settings");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e.message);
    process.exit(1);
  }
})();
