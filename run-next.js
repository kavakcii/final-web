const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const logStream = fs.createWriteStream('./server_js.log', { flags: 'a' });

const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
console.log(`Starting Next.js from: ${nextBin}`);
logStream.write(`Starting Next.js from: ${nextBin}\n`);

const child = spawn(process.execPath, [nextBin, 'dev', '-p', '3001'], {
  stdio: ['ignore', logStream, logStream],
  shell: false
});

child.on('error', (err) => {
  console.error('Failed to start subprocess:', err);
  logStream.write(`Failed to start subprocess: ${err}\n`);
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
  logStream.write(`Child process exited with code ${code}\n`);
});
