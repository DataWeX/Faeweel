/**
 * Orant Lang Lexer (TypeScript)
 * Tokenizes lang source code into tokens for parsing
 */

export enum TokenType {
  // Keywords
  INVOKE = 'INVOKE',
  AS = 'AS',
  SEQUENCE = 'SEQUENCE',
  FRAME = 'FRAME',
  RENDER = 'RENDER',
  SCENE = 'SCENE',
  EMIT = 'EMIT',

  // Movement keywords
  MOVES = 'MOVES',
  FROM = 'FROM',
  TO = 'TO',
  FLOATS = 'FLOATS',
  SPINS = 'SPINS',
  APPEARS = 'APPEARS',
  FADES = 'FADES',
  GLOWS = 'GLOWS',
  MERGES = 'MERGES',
  WITH = 'WITH',

  // Adverbs
  GENTLY = 'GENTLY',
  GRADUALLY = 'GRADUALLY',
  CLOCKWISE = 'CLOCKWISE',
  BRIGHT = 'BRIGHT',

  // Literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  COLOR = 'COLOR',

  // Symbols
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COLON = 'COLON',
  COMMA = 'COMMA',

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  COMMENT = 'COMMENT'
}

const KEYWORDS: Record<string, TokenType> = {
  'invoke': TokenType.INVOKE,
  'as': TokenType.AS,
  'sequence': TokenType.SEQUENCE,
  'frame': TokenType.FRAME,
  'render': TokenType.RENDER,
  'scene': TokenType.SCENE,
  'emit': TokenType.EMIT,
  'moves': TokenType.MOVES,
  'from': TokenType.FROM,
  'to': TokenType.TO,
  'floats': TokenType.FLOATS,
  'spins': TokenType.SPINS,
  'appears': TokenType.APPEARS,
  'fades': TokenType.FADES,
  'glows': TokenType.GLOWS,
  'merges': TokenType.MERGES,
  'with': TokenType.WITH,
  'gently': TokenType.GENTLY,
  'gradually': TokenType.GRADUALLY,
  'clockwise': TokenType.CLOCKWISE,
  'bright': TokenType.BRIGHT
};

export type TokenValue = string | number | null;

export class Token {
  constructor(
    public type: TokenType,
    public value: TokenValue,
    public line: number,
    public column: number
  ) {}
}

export class Lexer {
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(private source: string) {}

  private getCurrentChar(): string | null {
    return this.pos < this.source.length ? this.source[this.pos] : null;
  }

  private peekChar(offset: number = 1): string | null {
    const peekPos = this.pos + offset;
    return peekPos < this.source.length ? this.source[peekPos] : null;
  }

  private advance(): void {
    if (this.getCurrentChar() === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
  }

  private skipWhitespace(): void {
    while (this.getCurrentChar() && /\s/.test(this.getCurrentChar()!) && this.getCurrentChar() !== '\n') {
      this.advance();
    }
  }

  private skipComment(): void {
    if (this.getCurrentChar() === '#') {
      while (this.getCurrentChar() && this.getCurrentChar() !== '\n') {
        this.advance();
      }
    }
  }

  private readString(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    const quote = this.getCurrentChar()!;
    this.advance(); // Skip opening quote

    let value = '';
    while (this.getCurrentChar() && this.getCurrentChar() !== quote) {
      if (this.getCurrentChar() === '\\') {
        this.advance();
        const escapeChar = this.getCurrentChar();
        switch (escapeChar) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case '\\': value += '\\'; break;
          case quote: value += quote; break;
          default: value += escapeChar;
        }
        this.advance();
      } else {
        value += this.getCurrentChar();
        this.advance();
      }
    }

    if (this.getCurrentChar() === quote) {
      this.advance(); // Skip closing quote
    }

    return new Token(TokenType.STRING, value, startLine, startColumn);
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.getCurrentChar() && /[0-9.]/.test(this.getCurrentChar()!)) {
      value += this.getCurrentChar();
      this.advance();
    }

    // Check for units (s, px, etc.)
    let unit = '';
    if (this.getCurrentChar() && /[a-z]/.test(this.getCurrentChar()!)) {
      while (this.getCurrentChar() && /[a-z]/.test(this.getCurrentChar()!)) {
        unit += this.getCurrentChar();
        this.advance();
      }
    }

    const tokenValue: string | number = unit ? value + unit : parseFloat(value);
    return new Token(TokenType.NUMBER, tokenValue, startLine, startColumn);
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.getCurrentChar() && /[a-zA-Z0-9_]/.test(this.getCurrentChar()!)) {
      value += this.getCurrentChar();
      this.advance();
    }

    const lowerValue = value.toLowerCase();
    const type = KEYWORDS[lowerValue] || TokenType.IDENTIFIER;

    return new Token(type, value, startLine, startColumn);
  }

  private readColor(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '#';
    this.advance(); // Skip #

    while (this.getCurrentChar() && /[0-9A-Fa-f]/.test(this.getCurrentChar()!)) {
      value += this.getCurrentChar();
      this.advance();
    }

    return new Token(TokenType.COLOR, value, startLine, startColumn);
  }

  public tokenize(): Token[] {
    while (this.getCurrentChar() !== null) {
      const char = this.getCurrentChar()!;

      // Skip whitespace (except newlines)
      if (/[ \t\r]/.test(char)) {
        this.skipWhitespace();
        continue;
      }

      // Newline
      if (char === '\n') {
        const token = new Token(TokenType.NEWLINE, '\\n', this.line, this.column);
        this.tokens.push(token);
        this.advance();
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        this.tokens.push(this.readString());
        continue;
      }

      // Colors (check before comments!)
      if (char === '#' && this.peekChar() && /[0-9A-Fa-f]/.test(this.peekChar()!)) {
        this.tokens.push(this.readColor());
        continue;
      }

      // Comments (after color check)
      if (char === '#') {
        this.skipComment();
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // Symbols
      const line = this.line;
      const column = this.column;

      switch (char) {
        case '{':
          this.tokens.push(new Token(TokenType.LBRACE, '{', line, column));
          this.advance();
          break;
        case '}':
          this.tokens.push(new Token(TokenType.RBRACE, '}', line, column));
          this.advance();
          break;
        case '(':
          this.tokens.push(new Token(TokenType.LPAREN, '(', line, column));
          this.advance();
          break;
        case ')':
          this.tokens.push(new Token(TokenType.RPAREN, ')', line, column));
          this.advance();
          break;
        case ':':
          this.tokens.push(new Token(TokenType.COLON, ':', line, column));
          this.advance();
          break;
        case ',':
          this.tokens.push(new Token(TokenType.COMMA, ',', line, column));
          this.advance();
          break;
        default:
          throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
      }
    }

    this.tokens.push(new Token(TokenType.EOF, null, this.line, this.column));
    return this.tokens;
  }
}

/**
 * Helper function to tokenize source code
 */
export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
