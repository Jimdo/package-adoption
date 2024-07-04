import childProcess, { execSync } from 'child_process';

const branchName = execSync('git rev-parse --abbrev-ref HEAD')
  .toString('utf-8')
  .trim();

childProcess.execSync(`git push -u origin ${branchName} --tags `);
