const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Tides monorepo...\n');

function runCommand(command, cwd) {
  console.log(`📍 Running: ${command} in ${cwd}`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..', cwd)
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${command} in ${cwd}`);
    console.error(error.message);
    return false;
  }
}

// Install root dependencies
console.log('📦 Installing root dependencies...');
runCommand('npm install', '.');

// Install server dependencies (uses pnpm)
console.log('🖥️  Installing server dependencies...');
runCommand('pnpm install', 'apps/server');

// Install web dependencies
console.log('🌐 Installing web dependencies...');
runCommand('npm install', 'apps/web');

// Install mobile dependencies (IMPORTANT: separate from workspaces)
console.log('📱 Installing mobile dependencies...');
runCommand('npm install', 'apps/mobile');

// iOS setup (only on macOS)
if (process.platform === 'darwin') {
  console.log('🍎 Setting up iOS dependencies...');
  const success = runCommand('npm run mobile:setup', '.');
  if (!success) {
    console.warn('⚠️  iOS setup failed. You may need to run manually:');
    console.warn('   cd apps/mobile/ios && bundle install && bundle exec pod install');
  }
}

console.log('\n✅ Setup complete!');
console.log('\n📋 Next steps:');
console.log('   npm run dev          # Start all applications');
console.log('   npm run dev:server   # Start server only');
console.log('   npm run dev:mobile   # Start mobile only'); 
console.log('   npm run dev:web      # Start web only');
console.log('\n📱 For mobile development:');
console.log('   cd apps/mobile && npm run android');
console.log('   cd apps/mobile && npm run ios');