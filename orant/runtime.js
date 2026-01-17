#!/usr/bin/env node

/**
 * Orant Lang Runtime
 * Executes compiled lang programs
 */

import fs from 'fs';
import path from 'path';

class OrantCLIRuntime {
  constructor() {
    this.verbose = false;
  }

  async run(langFile) {
    try {
      // Check if .lang file needs compilation
      const compiledFile = this.getCompiledPath(langFile);
      const needsCompilation = !fs.existsSync(compiledFile) ||
        fs.statSync(langFile).mtime > fs.statSync(compiledFile).mtime;

      if (needsCompilation) {
        console.log(`📝 Compiling ${langFile}...`);
        const { OrantCompiler } = await import('./compiler.js');
        const compiler = new OrantCompiler();
        compiler.verbose = this.verbose;
        const result = compiler.compile(langFile, compiledFile);

        if (!result.success) {
          throw new Error('Compilation failed');
        }
      }

      // Import and execute the compiled code
      console.log(`▶️  Running ${compiledFile}...`);

      // For CLI, we can't actually render to canvas, but we can simulate
      console.log('⚠️  Note: CLI runtime shows simulation. Use viewer.html for actual rendering.');

      const module = await import(path.resolve(compiledFile));

      console.log('✅ Program executed successfully');
      console.log('💡 To see visual output, open orant/viewer.html in a browser');

    } catch (error) {
      console.error(`❌ Runtime error: ${error.message}`);
      if (this.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  getCompiledPath(langFile) {
    const parsed = path.parse(langFile);
    return path.join('orant', 'output', 'generated', `${parsed.name}.js`);
  }

  static printUsage() {
    console.log(`
Orant Lang Runtime

Usage:
  node runtime.js <input.lang> [options]

Arguments:
  input.lang    Path to .lang source file to run

Options:
  -v, --verbose Show detailed runtime information
  -h, --help    Show this help message

Examples:
  node runtime.js examples/kael-kick.lang
  node runtime.js angel-birth.lang --verbose

Note:
  The CLI runtime will automatically compile .lang files if needed.
  For visual output, open orant/viewer.html in a web browser.
`);
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    OrantCLIRuntime.printUsage();
    process.exit(0);
  }

  const runtime = new OrantCLIRuntime();

  let langFile = null;

  for (const arg of args) {
    if (arg === '-v' || arg === '--verbose') {
      runtime.verbose = true;
    } else if (!langFile) {
      langFile = arg;
    }
  }

  if (!langFile) {
    console.error('Error: No input file specified');
    OrantCLIRuntime.printUsage();
    process.exit(1);
  }

  await runtime.run(langFile);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { OrantCLIRuntime };
