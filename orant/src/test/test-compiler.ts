#!/usr/bin/env node

/**
 * Orant Compiler Test Suite
 * Tests the lexer, parser, and code generator
 */

import { tokenize, TokenType } from '../lang/lexer.js';
import { parse } from '../lang/parser.js';
import { generate } from '../lang/codegen.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class CompilerTester {
  private results: TestResult[] = [];

  private test(name: string, fn: () => void): void {
    try {
      fn();
      this.results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMessage });
      console.error(`❌ ${name}`);
      console.error(`   Error: ${errorMessage}`);
    }
  }

  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  private assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  public runTests(): void {
    console.log('🧪 Running Orant Compiler Tests...\n');

    // Lexer Tests
    console.log('📝 Lexer Tests:');
    this.testLexerBasicTokens();
    this.testLexerKeywords();
    this.testLexerStrings();
    this.testLexerNumbers();
    this.testLexerColors();
    this.testLexerComments();

    console.log('\n🌳 Parser Tests:');
    this.testParserInvokeStatement();
    this.testParserSequenceStatement();
    this.testParserRenderStatement();
    this.testParserFrameBlock();
    this.testParserActions();

    console.log('\n🔨 Code Generator Tests:');
    this.testCodeGenInvoke();
    this.testCodeGenSequence();
    this.testCodeGenRender();

    console.log('\n📊 Integration Tests:');
    this.testFullCompilation();

    // Summary
    console.log('\n' + '='.repeat(50));
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\nTest Results: ${passed}/${total} passed, ${failed} failed`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  }

  // Lexer Tests
  private testLexerBasicTokens(): void {
    this.test('Lexer: Basic symbols', () => {
      const tokens = tokenize('{ } ( ) : ,');
      this.assertEqual(tokens[0].type, TokenType.LBRACE, 'First token should be LBRACE');
      this.assertEqual(tokens[1].type, TokenType.RBRACE, 'Second token should be RBRACE');
      this.assertEqual(tokens[2].type, TokenType.LPAREN, 'Third token should be LPAREN');
      this.assertEqual(tokens[3].type, TokenType.RPAREN, 'Fourth token should be RPAREN');
      this.assertEqual(tokens[4].type, TokenType.COLON, 'Fifth token should be COLON');
      this.assertEqual(tokens[5].type, TokenType.COMMA, 'Sixth token should be COMMA');
    });
  }

  private testLexerKeywords(): void {
    this.test('Lexer: Keywords', () => {
      const tokens = tokenize('invoke as sequence frame render scene emit');
      this.assertEqual(tokens[0].type, TokenType.INVOKE, 'Should tokenize invoke');
      this.assertEqual(tokens[1].type, TokenType.AS, 'Should tokenize as');
      this.assertEqual(tokens[2].type, TokenType.SEQUENCE, 'Should tokenize sequence');
      this.assertEqual(tokens[3].type, TokenType.FRAME, 'Should tokenize frame');
      this.assertEqual(tokens[4].type, TokenType.RENDER, 'Should tokenize render');
      this.assertEqual(tokens[5].type, TokenType.SCENE, 'Should tokenize scene');
      this.assertEqual(tokens[6].type, TokenType.EMIT, 'Should tokenize emit');
    });
  }

  private testLexerStrings(): void {
    this.test('Lexer: String literals', () => {
      const tokens = tokenize('"hello world" \'single quotes\'');
      this.assertEqual(tokens[0].type, TokenType.STRING, 'Should tokenize double-quoted string');
      this.assertEqual(tokens[0].value, 'hello world', 'Should extract string value');
      this.assertEqual(tokens[1].type, TokenType.STRING, 'Should tokenize single-quoted string');
      this.assertEqual(tokens[1].value, 'single quotes', 'Should extract string value');
    });
  }

  private testLexerNumbers(): void {
    this.test('Lexer: Numbers', () => {
      const tokens = tokenize('42 3.14 100px 5s');
      this.assertEqual(tokens[0].type, TokenType.NUMBER, 'Should tokenize integer');
      this.assertEqual(tokens[0].value, 42, 'Should parse integer value');
      this.assertEqual(tokens[1].type, TokenType.NUMBER, 'Should tokenize float');
      this.assertEqual(tokens[1].value, 3.14, 'Should parse float value');
      this.assertEqual(tokens[2].type, TokenType.NUMBER, 'Should tokenize number with unit');
      this.assertEqual(tokens[2].value, '100px', 'Should preserve unit');
      this.assertEqual(tokens[3].type, TokenType.NUMBER, 'Should tokenize duration');
      this.assertEqual(tokens[3].value, '5s', 'Should preserve duration unit');
    });
  }

  private testLexerColors(): void {
    this.test('Lexer: Color codes', () => {
      const tokens = tokenize('#FF6B35 #FFFFFF');
      this.assertEqual(tokens[0].type, TokenType.COLOR, 'Should tokenize hex color');
      this.assertEqual(tokens[0].value, '#FF6B35', 'Should preserve color value');
      this.assertEqual(tokens[1].type, TokenType.COLOR, 'Should tokenize another color');
      this.assertEqual(tokens[1].value, '#FFFFFF', 'Should preserve color value');
    });
  }

  private testLexerComments(): void {
    this.test('Lexer: Comments are skipped', () => {
      const tokens = tokenize('invoke # this is a comment\nMyEntity');
      this.assertEqual(tokens[0].type, TokenType.INVOKE, 'Should tokenize before comment');
      this.assertEqual(tokens[1].type, TokenType.NEWLINE, 'Should tokenize newline');
      this.assertEqual(tokens[2].type, TokenType.IDENTIFIER, 'Should tokenize after comment');
    });
  }

  // Parser Tests
  private testParserInvokeStatement(): void {
    this.test('Parser: Invoke statement', () => {
      const source = 'invoke Kael as Son { color: "#FF6B35" }';
      const tokens = tokenize(source);
      const ast = parse(tokens);

      this.assertEqual(ast.statements.length, 1, 'Should have one statement');
      this.assertEqual(ast.statements[0].type, 'InvokeStatement', 'Should be InvokeStatement');

      const stmt = ast.statements[0] as any;
      this.assertEqual(stmt.entityName, 'Kael', 'Should have correct entity name');
      this.assertEqual(stmt.entityType, 'Son', 'Should have correct entity type');
      this.assertEqual(stmt.properties.color, '#FF6B35', 'Should have color property');
    });
  }

  private testParserSequenceStatement(): void {
    this.test('Parser: Sequence statement', () => {
      const source = `
        sequence Test {
          duration: "3s"
          frame 1 {
            Entity appears at center
          }
        }
      `;
      const tokens = tokenize(source);
      const ast = parse(tokens);

      this.assertEqual(ast.statements.length, 1, 'Should have one statement');
      this.assertEqual(ast.statements[0].type, 'SequenceStatement', 'Should be SequenceStatement');

      const stmt = ast.statements[0] as any;
      this.assertEqual(stmt.name, 'Test', 'Should have correct name');
      this.assertEqual(stmt.properties.duration, '3s', 'Should have duration property');
      this.assertEqual(stmt.frames.length, 1, 'Should have one frame');
    });
  }

  private testParserRenderStatement(): void {
    this.test('Parser: Render statement', () => {
      const source = 'render scene MyScene { canvas: "1920x1080" }';
      const tokens = tokenize(source);
      const ast = parse(tokens);

      this.assertEqual(ast.statements.length, 1, 'Should have one statement');
      this.assertEqual(ast.statements[0].type, 'RenderStatement', 'Should be RenderStatement');

      const stmt = ast.statements[0] as any;
      this.assertEqual(stmt.sceneName, 'MyScene', 'Should have correct scene name');
      this.assertEqual(stmt.properties.canvas, '1920x1080', 'Should have canvas property');
    });
  }

  private testParserFrameBlock(): void {
    this.test('Parser: Frame block', () => {
      const source = `
        sequence Test {
          frame 10 {
            Entity glows bright
            Entity moves to (100, 200)
          }
        }
      `;
      const tokens = tokenize(source);
      const ast = parse(tokens);

      const stmt = ast.statements[0] as any;
      const frame = stmt.frames[0];

      this.assertEqual(frame.frameNumber, 10, 'Should have correct frame number');
      this.assertEqual(frame.actions.length, 2, 'Should have two actions');
    });
  }

  private testParserActions(): void {
    this.test('Parser: Various actions', () => {
      const source = `
        sequence Test {
          frame 1 {
            Entity appears at center
            Entity moves to (100, 200)
            Entity glows bright
            Entity fades in
            Entity floats gently
            Entity merges with Other
            emit particles: 50
          }
        }
      `;
      const tokens = tokenize(source);
      const ast = parse(tokens);

      const stmt = ast.statements[0] as any;
      const actions = stmt.frames[0].actions;

      this.assertEqual(actions.length, 7, 'Should have seven actions');
      this.assertEqual(actions[0].actionType, 'appear', 'Should parse appear');
      this.assertEqual(actions[1].actionType, 'move', 'Should parse move');
      this.assertEqual(actions[2].actionType, 'glow', 'Should parse glow');
      this.assertEqual(actions[3].actionType, 'fade', 'Should parse fade');
      this.assertEqual(actions[4].actionType, 'float', 'Should parse float');
      this.assertEqual(actions[5].actionType, 'merge', 'Should parse merge');
      this.assertEqual(actions[6].actionType, 'emit', 'Should parse emit');
    });
  }

  // Code Generator Tests
  private testCodeGenInvoke(): void {
    this.test('CodeGen: Invoke statement', () => {
      const source = 'invoke Kael as Son { color: "#FF6B35" }';
      const tokens = tokenize(source);
      const ast = parse(tokens);
      const code = generate(ast);

      this.assert(code.includes('const Kael'), 'Should generate entity constant');
      this.assert(code.includes('new Entity'), 'Should instantiate Entity');
      this.assert(code.includes('#FF6B35'), 'Should include color value');
      this.assert(code.includes('runtime.addEntity'), 'Should add to runtime');
    });
  }

  private testCodeGenSequence(): void {
    this.test('CodeGen: Sequence statement', () => {
      const source = `
        sequence Test {
          frame 1 {
            Entity appears at center
          }
        }
      `;
      const tokens = tokenize(source);
      const ast = parse(tokens);
      const code = generate(ast);

      this.assert(code.includes('const Test'), 'Should generate sequence constant');
      this.assert(code.includes('new Sequence'), 'Should instantiate Sequence');
      this.assert(code.includes('frames:'), 'Should include frames array');
      this.assert(code.includes('runtime.addSequence'), 'Should add to runtime');
    });
  }

  private testCodeGenRender(): void {
    this.test('CodeGen: Render statement', () => {
      const source = 'render scene MyScene { canvas: "1920x1080" }';
      const tokens = tokenize(source);
      const ast = parse(tokens);
      const code = generate(ast);

      this.assert(code.includes('new Renderer'), 'Should instantiate Renderer');
      this.assert(code.includes('runtime.render'), 'Should call runtime.render');
    });
  }

  // Integration Tests
  private testFullCompilation(): void {
    this.test('Integration: Full program compilation', () => {
      const source = `
        invoke TestEntity as Angel {
          color: "#FFFFFF"
          wings: 6
        }

        sequence TestSeq {
          duration: "2s"

          frame 1 {
            TestEntity appears at center
          }

          frame 30 {
            TestEntity glows bright
            emit particles: 50
          }
        }

        render scene TestScene {
          invoke: TestSeq
          canvas: "1920x1080"
        }
      `;

      const tokens = tokenize(source);
      this.assert(tokens.length > 0, 'Should tokenize program');

      const ast = parse(tokens);
      this.assertEqual(ast.statements.length, 3, 'Should have 3 statements');

      const code = generate(ast);
      this.assert(code.includes('import'), 'Should have imports');
      this.assert(code.includes('TestEntity'), 'Should include entity');
      this.assert(code.includes('TestSeq'), 'Should include sequence');
      this.assert(code.includes('TestScene'), 'Should include scene');
      this.assert(code.includes('runtime.start'), 'Should start runtime');
    });
  }
}

// Run tests
const tester = new CompilerTester();
tester.runTests();
