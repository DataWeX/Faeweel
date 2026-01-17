#!/usr/bin/env node

/**
 * Orant Lang Compiler
 * Compiles .lang files to executable JavaScript
 */

import fs from 'fs';
import path from 'path';
import { tokenize } from './lang/lexer.js';
import { parse } from './lang/parser.js';
import { generate } from './lang/codegen.js';

class OrantCompiler {
  constructor() {
    this.inputFile = null;
    this.outputFile = null;
    this.verbose = false;
  }

  compile(inputFile, outputFile = null) {
    this.inputFile = inputFile;
    this.outputFile = outputFile || this.getDefaultOutputFile(inputFile);

    try {
      // Read source code
      if (this.verbose) console.log(`Reading ${inputFile}...`);
      const source = fs.readFileSync(inputFile, 'utf-8');

      // Tokenize
      if (this.verbose) console.log('Tokenizing...');
      const tokens = tokenize(source);

      if (this.verbose) {
        console.log(`Generated ${tokens.length} tokens`);
        console.log('Sample tokens:', tokens.slice(0, 10).map(t => `${t.type}:${t.value}`));
      }

      // Parse
      if (this.verbose) console.log('Parsing...');
      const ast = parse(tokens);

      if (this.verbose) {
        console.log(`Generated AST with ${ast.statements.length} statements`);
      }

      // Generate code
      if (this.verbose) console.log('Generating code...');
      const code = generate(ast);

      // Write output
      if (this.verbose) console.log(`Writing to ${this.outputFile}...`);
      fs.writeFileSync(this.outputFile, code, 'utf-8');

      console.log(`✨ Successfully compiled ${inputFile} → ${this.outputFile}`);

      return {
        success: true,
        outputFile: this.outputFile,
        tokens: tokens.length,
        statements: ast.statements.length
      };

    } catch (error) {
      console.error(`❌ Compilation error: ${error.message}`);
      if (this.verbose) {
        console.error(error.stack);
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  getDefaultOutputFile(inputFile) {
    const parsed = path.parse(inputFile);
    return path.join('orant', 'output', 'generated', `${parsed.name}.js`);
  }

  static printUsage() {
    console.log(`
Orant Lang Compiler

Usage:
  node compiler.js <input.lang> [output.js] [options]

Arguments:
  input.lang    Path to .lang source file
  output.js     Optional output path (default: orant/output/generated/<name>.js)

Options:
  -v, --verbose Show detailed compilation process
  -h, --help    Show this help message

Examples:
  node compiler.js examples/kael-kick.lang
  node compiler.js examples/seven-sons.lang output/seven-sons.js -v
  node compiler.js angel-birth.lang --verbose

Learn more about the lang language:
  https://github.com/DataWeX/Faeweel/tree/main/orant
`);
  }
}

// CLI entry point
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    OrantCompiler.printUsage();
    process.exit(0);
  }

  const compiler = new OrantCompiler();

  // Parse arguments
  let inputFile = null;
  let outputFile = null;

  for (const arg of args) {
    if (arg === '-v' || arg === '--verbose') {
      compiler.verbose = true;
    } else if (!inputFile) {
      inputFile = arg;
    } else if (!outputFile) {
      outputFile = arg;
    }
  }

  if (!inputFile) {
    console.error('Error: No input file specified');
    OrantCompiler.printUsage();
    process.exit(1);
  }

  // Ensure output directory exists
  const outputDir = outputFile ? path.dirname(outputFile) : 'orant/output/generated';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Compile
  const result = compiler.compile(inputFile, outputFile);

  process.exit(result.success ? 0 : 1);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { OrantCompiler };
