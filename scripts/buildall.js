const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const packages = fs.readdirSync('packages');

const logger = name => (error, stdout, stderr) => {
  if (error) {
      console.log(`${name} error: ${error.message}`);
      return;
  }
  if (stderr) {
      console.log(`${name} stderr: ${stderr}`);
      return;
  }
  console.log(`${name} stdout: ${stdout}`);
};

packages.forEach(name => {
  if (name === "eigenform-demo") {
    // build libs only
    return;
  }
  const cwd = path.join(process.cwd(), "packages", name);
  console.log(cwd);
  exec('yarn build', { cwd }, logger(name));
});