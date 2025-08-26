const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tides development environment...\n');

// Color codes for output
const colors = {
  server: '\x1b[32m', // Green
  mobile: '\x1b[33m', // Yellow  
  web: '\x1b[34m',    // Blue
  reset: '\x1b[0m'
};

function createProcess(name, command, args, cwd, color) {
  const process = spawn(command, args, {
    cwd: path.join(__dirname, '..', cwd),
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${name}]${colors.reset} ${line}`);
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${name}]${colors.reset} ⚠️  ${line}`);
    });
  });

  process.on('close', (code) => {
    console.log(`${color}[${name}]${colors.reset} Process exited with code ${code}`);
  });

  return process;
}

// Start all processes
const processes = [
  createProcess('server', 'pnpm', ['run', 'dev'], 'apps/server', colors.server),
  createProcess('mobile', 'npm', ['run', 'start'], 'apps/mobile', colors.mobile),
  createProcess('web', 'npm', ['run', 'dev'], 'apps/web', colors.web)
];

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all processes...');
  processes.forEach(proc => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('✅ All processes started. Press Ctrl+C to stop.\n');