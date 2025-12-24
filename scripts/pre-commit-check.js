#!/usr/bin/env node
/**
 * Pre-commit validation script
 * Runs linting, formatting, and type checking
 */

const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔍 ${description}...`, colors.cyan);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} passed!`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed!`, colors.red);
    return false;
  }
}

async function main() {
  log('\n🚀 Running pre-commit checks...\n', colors.yellow);

  const checks = [
    {
      command: 'npm run type-check',
      description: 'TypeScript type checking',
    },
    {
      command: 'npm run lint',
      description: 'ESLint validation',
    },
    {
      command: 'npm run format:check',
      description: 'Prettier format checking',
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    const passed = runCommand(check.command, check.description);
    if (!passed) {
      allPassed = false;
    }
  }

  if (allPassed) {
    log('\n✅ All checks passed! Ready to commit.\n', colors.green);
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Please fix the issues before committing.\n', colors.red);
    log('💡 Tip: Run "npm run lint:fix" to auto-fix some issues.\n', colors.yellow);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, colors.red);
  process.exit(1);
});
