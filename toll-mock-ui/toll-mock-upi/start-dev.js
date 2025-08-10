import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the NHAI backend server
const backendProcess = spawn('node', ['server_nhai.js'], {
  cwd: __dirname,
  env: { ...process.env, GOOGLE_MAPS_KEY: 'YOUR_GOOGLE_KEY' },
  stdio: 'inherit'
});

// Start the frontend development server
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});

// Log any errors
backendProcess.on('error', (error) => {
  console.error('Backend server error:', error);
});

frontendProcess.on('error', (error) => {
  console.error('Frontend server error:', error);
});

console.log('Development servers started. Press Ctrl+C to stop.');