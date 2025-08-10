// start-dev.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the NHAI backend server
const backendProcess = spawn('node', 
  [resolve(__dirname, '../../server_nhai.js')], 
  { 
    stdio: 'inherit',
    env: { ...process.env, GOOGLE_MAPS_KEY: 'YOUR_GOOGLE_KEY' }
  }
);

// Start the frontend development server
const frontendProcess = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  cwd: __dirname
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});

backendProcess.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  frontendProcess.kill();
  process.exit(code);
});

frontendProcess.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  backendProcess.kill();
  process.exit(code);
});