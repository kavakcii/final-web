try {
  const { spawn } = require('child_process');
  const path = require('path');

  const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
  console.log(`Starting Next.js from: ${nextBin}`);

  const child = spawn(process.execPath, [nextBin, 'dev', '-p', '3002'], {
    stdio: 'inherit',
    shell: false
  });

  child.on('error', (err) => {
    console.error('Failed to start subprocess:', err);
  });

  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
} catch (e) {
  console.error('CRITICAL ERROR:', e);
}
