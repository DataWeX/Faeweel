/**
 * Orant Lang Parser (TypeScript)
 * Builds an Abstract Syntax Tree from tokens
 */

import { TokenType, Token, TokenValue } from './lexer.js';

// AST Node Types
export type ASTNodeType =
  | 'Program'
  | 'InvokeStatement'
  | 'SequenceStatement'
  | 'FrameBlock'
  | 'RenderStatement'
  | 'ActionStatement'
  | 'Property';

export interface ASTNode {
  type: ASTNodeType;
}

export interface Program extends ASTNode {
  type: 'Program';
  statements: Statement[];
}

export interface InvokeStatement extends ASTNode {
  type: 'InvokeStatement';
  entityName: string;
  entityType: string;
  properties: Properties;
}

export interface SequenceStatement extends ASTNode {
  type: 'SequenceStatement';
  name: string;
  frames: FrameBlock[];
  properties: Properties;
}

export interface FrameBlock extends ASTNode {
  type: 'FrameBlock';
  frameNumber: number;
  actions: ActionStatement[];
}

export interface RenderStatement extends ASTNode {
  type: 'RenderStatement';
  sceneName: string | null;
  properties: Properties;
}

export interface ActionStatement extends ASTNode {
  type: 'ActionStatement';
  actionType: string;
  entity: string;
  params: Record<string, any>;
}

export interface Property extends ASTNode {
  type: 'Property';
  key: string;
  value: PropertyValue;
}

export type PropertyValue = string | number | Coordinate | boolean;
export type Properties = Record<string, PropertyValue>;

export interface Coordinate {
  x?: number;
  y?: number;
  name?: string;
}

export type Statement = InvokeStatement | SequenceStatement | RenderStatement;

export class Parser {
  private pos: number = 0;
  private tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t =>
      t.type !== TokenType.NEWLINE &&
      t.type !== TokenType.COMMENT
    );
  }

  private getCurrentToken(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  private peekToken(offset: number = 1): Token | null {
    const peekPos = this.pos + offset;
    return peekPos < this.tokens.length ? this.tokens[peekPos] : null;
  }

  private advance(): void {
    this.pos++;
  }

  private expect(tokenType: TokenType): Token {
    const token = this.getCurrentToken();
    if (!token || token.type !== tokenType) {
      throw new Error(
        `Expected ${tokenType} but got ${token ? token.type : 'EOF'} at line ${token?.line}`
      );
    }
    this.advance();
    return token;
  }

  private match(...tokenTypes: TokenType[]): boolean {
    const token = this.getCurrentToken();
    return token !== null && tokenTypes.includes(token.type);
  }

  /**
   * Parse the entire program
   */
  public parse(): Program {
    const statements: Statement[] = [];

    while (this.getCurrentToken() && this.getCurrentToken()!.type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }

    return {
      type: 'Program',
      statements
    };
  }

  /**
   * Parse a single statement
   */
  private parseStatement(): Statement {
    const token = this.getCurrentToken();

    if (!token) {
      throw new Error('Unexpected end of input');
    }

    switch (token.type) {
      case TokenType.INVOKE:
        return this.parseInvokeStatement();
      case TokenType.SEQUENCE:
        return this.parseSequenceStatement();
      case TokenType.RENDER:
        return this.parseRenderStatement();
      default:
        throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
    }
  }

  /**
   * Parse: invoke EntityName as Type { properties }
   */
  private parseInvokeStatement(): InvokeStatement {
    this.expect(TokenType.INVOKE);

    const entityName = this.expect(TokenType.IDENTIFIER).value as string;
    this.expect(TokenType.AS);
    const entityType = this.expect(TokenType.IDENTIFIER).value as string;

    this.expect(TokenType.LBRACE);
    const properties = this.parseProperties();
    this.expect(TokenType.RBRACE);

    return {
      type: 'InvokeStatement',
      entityName,
      entityType,
      properties
    };
  }

  /**
   * Parse: sequence Name { frames and properties }
   */
  private parseSequenceStatement(): SequenceStatement {
    this.expect(TokenType.SEQUENCE);

    const name = this.expect(TokenType.IDENTIFIER).value as string;

    this.expect(TokenType.LBRACE);

    const frames: FrameBlock[] = [];
    const properties: Properties = {};

    while (!this.match(TokenType.RBRACE)) {
      if (this.match(TokenType.FRAME)) {
        frames.push(this.parseFrameBlock());
      } else if (this.match(TokenType.IDENTIFIER)) {
        // Parse property like "duration: 2s"
        const prop = this.parseProperty();
        properties[prop.key] = prop.value;
      } else {
        throw new Error(
          `Unexpected token in sequence at line ${this.getCurrentToken()?.line}`
        );
      }
    }

    this.expect(TokenType.RBRACE);

    return {
      type: 'SequenceStatement',
      name,
      frames,
      properties
    };
  }

  /**
   * Parse: frame N { actions }
   */
  private parseFrameBlock(): FrameBlock {
    this.expect(TokenType.FRAME);

    const frameNumber = this.expect(TokenType.NUMBER).value as number;

    this.expect(TokenType.LBRACE);

    const actions: ActionStatement[] = [];
    while (!this.match(TokenType.RBRACE)) {
      actions.push(this.parseAction());
    }

    this.expect(TokenType.RBRACE);

    return {
      type: 'FrameBlock',
      frameNumber,
      actions
    };
  }

  /**
   * Parse: render scene Name { properties } or render SequenceName
   */
  private parseRenderStatement(): RenderStatement {
    this.expect(TokenType.RENDER);

    let sceneName: string | null = null;
    let properties: Properties = {};

    if (this.match(TokenType.SCENE)) {
      this.advance();
      sceneName = this.expect(TokenType.IDENTIFIER).value as string;

      if (this.match(TokenType.LBRACE)) {
        this.advance();
        properties = this.parseProperties();
        this.expect(TokenType.RBRACE);
      }
    } else if (this.match(TokenType.IDENTIFIER)) {
      sceneName = this.getCurrentToken()!.value as string;
      this.advance();
    }

    return {
      type: 'RenderStatement',
      sceneName,
      properties
    };
  }

  /**
   * Parse actions like "Entity moves from (x, y) to (x, y)" or "emit particles: 20"
   */
  private parseAction(): ActionStatement {
    // Check if this is a standalone emit action
    if (this.match(TokenType.EMIT)) {
      return this.parseEmitAction(''); // Empty entity for standalone emit
    }

    const entity = this.expect(TokenType.IDENTIFIER).value as string;
    const actionToken = this.getCurrentToken();

    if (this.match(TokenType.MOVES)) {
      return this.parseMoveAction(entity);
    } else if (this.match(TokenType.APPEARS)) {
      return this.parseAppearAction(entity);
    } else if (this.match(TokenType.FLOATS)) {
      return this.parseFloatAction(entity);
    } else if (this.match(TokenType.SPINS)) {
      return this.parseSpinAction(entity);
    } else if (this.match(TokenType.FADES)) {
      return this.parseFadeAction(entity);
    } else if (this.match(TokenType.GLOWS)) {
      return this.parseGlowAction(entity);
    } else if (this.match(TokenType.MERGES)) {
      return this.parseMergeAction(entity);
    } else if (this.match(TokenType.EMIT)) {
      return this.parseEmitAction(entity);
    } else {
      throw new Error(
        `Unknown action for entity ${entity} at line ${actionToken?.line}`
      );
    }
  }

  private parseMoveAction(entity: string): ActionStatement {
    this.expect(TokenType.MOVES);

    let from: Coordinate | null = null;
    let to: Coordinate | null = null;

    // Check if we have "from ... to ..." or just "to ..."
    if (this.match(TokenType.FROM)) {
      this.advance();
      from = this.parseCoordinate();
      this.expect(TokenType.TO);
      to = this.parseCoordinate();
    } else if (this.match(TokenType.TO)) {
      this.advance();
      to = this.parseCoordinate();
    } else {
      throw new Error(`Expected FROM or TO after MOVES at line ${this.getCurrentToken()?.line}`);
    }

    return {
      type: 'ActionStatement',
      actionType: 'move',
      entity,
      params: { from, to }
    };
  }

  private parseAppearAction(entity: string): ActionStatement {
    this.expect(TokenType.APPEARS);

    let position: Coordinate | null = null;
    const currentToken = this.getCurrentToken();

    if (currentToken?.value && (currentToken.value as string).toLowerCase() === 'at') {
      this.advance();
      position = this.parseCoordinate();
    }

    return {
      type: 'ActionStatement',
      actionType: 'appear',
      entity,
      params: { position }
    };
  }

  private parseFloatAction(entity: string): ActionStatement {
    this.expect(TokenType.FLOATS);

    let manner = 'normal';
    if (this.match(TokenType.GENTLY)) {
      manner = 'gentle';
      this.advance();
    }

    return {
      type: 'ActionStatement',
      actionType: 'float',
      entity,
      params: { manner }
    };
  }

  private parseSpinAction(entity: string): ActionStatement {
    this.expect(TokenType.SPINS);

    let direction = 'clockwise';
    if (this.match(TokenType.CLOCKWISE)) {
      this.advance();
    }

    return {
      type: 'ActionStatement',
      actionType: 'spin',
      entity,
      params: { direction }
    };
  }

  private parseFadeAction(entity: string): ActionStatement {
    this.expect(TokenType.FADES);

    const currentValue = this.getCurrentToken()?.value;
    const direction = currentValue && typeof currentValue === 'string'
      ? currentValue.toLowerCase()
      : undefined;

    if (direction === 'in' || direction === 'out') {
      this.advance();
    }

    return {
      type: 'ActionStatement',
      actionType: 'fade',
      entity,
      params: { direction: direction || 'out' }
    };
  }

  private parseGlowAction(entity: string): ActionStatement {
    this.expect(TokenType.GLOWS);

    let intensity = 'normal';
    if (this.match(TokenType.BRIGHT)) {
      intensity = 'bright';
      this.advance();
    }

    return {
      type: 'ActionStatement',
      actionType: 'glow',
      entity,
      params: { intensity }
    };
  }

  private parseMergeAction(entity: string): ActionStatement {
    this.expect(TokenType.MERGES);
    this.expect(TokenType.WITH);

    const target = this.expect(TokenType.IDENTIFIER).value as string;

    return {
      type: 'ActionStatement',
      actionType: 'merge',
      entity,
      params: { target }
    };
  }

  private parseEmitAction(entity: string): ActionStatement {
    this.expect(TokenType.EMIT);

    let emitType = 'particles';
    let count = 10;

    const currentToken = this.getCurrentToken();
    if (currentToken?.type === TokenType.IDENTIFIER) {
      emitType = currentToken.value as string;
      this.advance();
    }

    if (this.match(TokenType.COLON)) {
      this.advance();
      count = this.expect(TokenType.NUMBER).value as number;
    }

    return {
      type: 'ActionStatement',
      actionType: 'emit',
      entity,
      params: { emitType, count }
    };
  }

  /**
   * Parse: (x, y) or position names
   */
  private parseCoordinate(): Coordinate {
    if (this.match(TokenType.LPAREN)) {
      this.advance();
      const x = this.expect(TokenType.NUMBER).value as number;
      this.expect(TokenType.COMMA);
      const y = this.expect(TokenType.NUMBER).value as number;
      this.expect(TokenType.RPAREN);
      return { x, y };
    } else if (this.match(TokenType.IDENTIFIER)) {
      // Named positions like "center", "left", "right"
      const name = this.getCurrentToken()!.value as string;
      this.advance();
      return { name };
    }

    throw new Error('Expected coordinate');
  }

  /**
   * Parse properties in { key: value, key: value }
   */
  private parseProperties(): Properties {
    const properties: Properties = {};

    while (!this.match(TokenType.RBRACE)) {
      const prop = this.parseProperty();
      properties[prop.key] = prop.value;

      // Optional comma
      if (this.match(TokenType.COMMA)) {
        this.advance();
      }
    }

    return properties;
  }

  /**
   * Parse: key: value
   */
  private parseProperty(): Property {
    // Allow certain keywords as property keys (e.g., "invoke:", "background:")
    let key: string;
    const token = this.getCurrentToken();

    if (this.match(TokenType.IDENTIFIER)) {
      key = token!.value as string;
      this.advance();
    } else if (this.match(TokenType.INVOKE, TokenType.SEQUENCE, TokenType.RENDER, TokenType.SCENE)) {
      // Allow these keywords as property keys
      key = token!.value as string;
      this.advance();
    } else {
      throw new Error(`Expected property key at line ${token?.line}`);
    }

    this.expect(TokenType.COLON);

    const value = this.parseValue();

    return {
      type: 'Property',
      key,
      value
    };
  }

  /**
   * Parse various value types
   */
  private parseValue(): PropertyValue {
    const token = this.getCurrentToken();

    if (!token) {
      throw new Error('Expected value');
    }

    if (this.match(TokenType.STRING)) {
      this.advance();
      return token.value as string;
    } else if (this.match(TokenType.NUMBER)) {
      this.advance();
      return token.value as number;
    } else if (this.match(TokenType.COLOR)) {
      this.advance();
      return token.value as string;
    } else if (this.match(TokenType.IDENTIFIER)) {
      this.advance();
      return token.value as string;
    } else if (
      // Allow keyword tokens as values (e.g., "glow: bright", "position: center")
      this.match(
        TokenType.BRIGHT,
        TokenType.GENTLY,
        TokenType.GRADUALLY,
        TokenType.CLOCKWISE
      )
    ) {
      this.advance();
      return token.value as string;
    } else {
      throw new Error(`Expected value at line ${token.line}`);
    }
  }
}

/**
 * Helper function to parse tokens
 */
export function parse(tokens: Token[]): Program {
  const parser = new Parser(tokens);
  return parser.parse();
}
