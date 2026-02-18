const { spawn } = require('child_process');
const path = require('path');
const next = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
console.log('S starting...');
const child = spawn(process.execPath, [next, 'dev', '-p', '3000'], { stdio: 'inherit', shell: false });
child.on('close', (c) => console.log('S closed', c));
