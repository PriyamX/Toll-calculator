// Simple wrapper to keep the server running
import { spawn } from 'child_process';
import path from 'path';

// Start the server
const server = spawn('node', ['server_nhai.js'], {
  env: { ...process.env, GOOGLE_MAPS_KEY: 'demo' },
  stdio: 'inherit'
});

console.log('Started NHAI server with PID:', server.pid);

// Keep the process running
process.stdin.resume();

// Handle termination
process.on('SIGINT', () => {
  console.log('Stopping NHAI server...');
  server.kill();
  process.exit(0);
});

server.on('close', (code) => {
  console.log(`NHAI server exited with code ${code}`);
  if (code !== 0) {
    console.error('Server crashed, restarting...');
    // Restart the server if it crashes
    setTimeout(() => {
      process.exit(1); // Exit with error code to trigger restart
    }, 1000);
  }
});