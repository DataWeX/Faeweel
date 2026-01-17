/**
 * Orant Lang Parser
 * Builds an Abstract Syntax Tree from tokens
 */

import { TokenType } from './lexer.js';

// AST Node Types
export class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

export class Program extends ASTNode {
  constructor(statements) {
    super('Program');
    this.statements = statements;
  }
}

export class InvokeStatement extends ASTNode {
  constructor(entityName, entityType, properties) {
    super('InvokeStatement');
    this.entityName = entityName;
    this.entityType = entityType;
    this.properties = properties;
  }
}

export class SequenceStatement extends ASTNode {
  constructor(name, frames, properties) {
    super('SequenceStatement');
    this.name = name;
    this.frames = frames;
    this.properties = properties;
  }
}

export class FrameBlock extends ASTNode {
  constructor(frameNumber, actions) {
    super('FrameBlock');
    this.frameNumber = frameNumber;
    this.actions = actions;
  }
}

export class RenderStatement extends ASTNode {
  constructor(sceneName, properties) {
    super('RenderStatement');
    this.sceneName = sceneName;
    this.properties = properties;
  }
}

export class ActionStatement extends ASTNode {
  constructor(actionType, entity, params) {
    super('ActionStatement');
    this.actionType = actionType;
    this.entity = entity;
    this.params = params;
  }
}

export class Property extends ASTNode {
  constructor(key, value) {
    super('Property');
    this.key = key;
    this.value = value;
  }
}

export class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TokenType.NEWLINE && t.type !== TokenType.COMMENT);
    this.pos = 0;
  }

  getCurrentToken() {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  peekToken(offset = 1) {
    const peekPos = this.pos + offset;
    return peekPos < this.tokens.length ? this.tokens[peekPos] : null;
  }

  advance() {
    this.pos++;
  }

  expect(tokenType) {
    const token = this.getCurrentToken();
    if (!token || token.type !== tokenType) {
      throw new Error(`Expected ${tokenType} but got ${token ? token.type : 'EOF'} at line ${token?.line}`);
    }
    this.advance();
    return token;
  }

  match(...tokenTypes) {
    const token = this.getCurrentToken();
    return token && tokenTypes.includes(token.type);
  }

  // Parse the entire program
  parse() {
    const statements = [];

    while (this.getCurrentToken() && this.getCurrentToken().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }

    return new Program(statements);
  }

  // Parse a single statement
  parseStatement() {
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

  // Parse: invoke EntityName as Type { properties }
  parseInvokeStatement() {
    this.expect(TokenType.INVOKE);

    const entityName = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.AS);
    const entityType = this.expect(TokenType.IDENTIFIER).value;

    this.expect(TokenType.LBRACE);
    const properties = this.parseProperties();
    this.expect(TokenType.RBRACE);

    return new InvokeStatement(entityName, entityType, properties);
  }

  // Parse: sequence Name { frames and properties }
  parseSequenceStatement() {
    this.expect(TokenType.SEQUENCE);

    const name = this.expect(TokenType.IDENTIFIER).value;

    this.expect(TokenType.LBRACE);

    const frames = [];
    const properties = {};

    while (!this.match(TokenType.RBRACE)) {
      if (this.match(TokenType.FRAME)) {
        frames.push(this.parseFrameBlock());
      } else if (this.match(TokenType.IDENTIFIER)) {
        // Parse property like "duration: 2s"
        const prop = this.parseProperty();
        properties[prop.key] = prop.value;
      } else {
        throw new Error(`Unexpected token in sequence at line ${this.getCurrentToken().line}`);
      }
    }

    this.expect(TokenType.RBRACE);

    return new SequenceStatement(name, frames, properties);
  }

  // Parse: frame N { actions }
  parseFrameBlock() {
    this.expect(TokenType.FRAME);

    const frameNumber = this.expect(TokenType.NUMBER).value;

    this.expect(TokenType.LBRACE);

    const actions = [];
    while (!this.match(TokenType.RBRACE)) {
      actions.push(this.parseAction());
    }

    this.expect(TokenType.RBRACE);

    return new FrameBlock(frameNumber, actions);
  }

  // Parse: render scene Name { properties } or render SequenceName
  parseRenderStatement() {
    this.expect(TokenType.RENDER);

    let sceneName = null;
    let properties = {};

    if (this.match(TokenType.SCENE)) {
      this.advance();
      sceneName = this.expect(TokenType.IDENTIFIER).value;

      if (this.match(TokenType.LBRACE)) {
        this.advance();
        properties = this.parseProperties();
        this.expect(TokenType.RBRACE);
      }
    } else if (this.match(TokenType.IDENTIFIER)) {
      sceneName = this.getCurrentToken().value;
      this.advance();
    }

    return new RenderStatement(sceneName, properties);
  }

  // Parse actions like "Entity moves from (x, y) to (x, y)"
  parseAction() {
    const entity = this.expect(TokenType.IDENTIFIER).value;
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
      throw new Error(`Unknown action for entity ${entity} at line ${actionToken?.line}`);
    }
  }

  // Parse: Entity moves from (x1, y1) to (x2, y2)
  parseMoveAction(entity) {
    this.expect(TokenType.MOVES);
    this.expect(TokenType.FROM);

    const from = this.parseCoordinate();

    this.expect(TokenType.TO);
    const to = this.parseCoordinate();

    return new ActionStatement('move', entity, { from, to });
  }

  // Parse: Entity appears at (x, y)
  parseAppearAction(entity) {
    this.expect(TokenType.APPEARS);

    let position = null;
    if (this.getCurrentToken()?.value?.toLowerCase() === 'at') {
      this.advance();
      position = this.parseCoordinate();
    }

    return new ActionStatement('appear', entity, { position });
  }

  // Parse: Entity floats gently
  parseFloatAction(entity) {
    this.expect(TokenType.FLOATS);

    let manner = 'normal';
    if (this.match(TokenType.GENTLY)) {
      manner = 'gentle';
      this.advance();
    }

    return new ActionStatement('float', entity, { manner });
  }

  // Parse: Entity spins clockwise
  parseSpinAction(entity) {
    this.expect(TokenType.SPINS);

    let direction = 'clockwise';
    if (this.match(TokenType.CLOCKWISE)) {
      this.advance();
    }

    return new ActionStatement('spin', entity, { direction });
  }

  // Parse: Entity fades in/out
  parseFadeAction(entity) {
    this.expect(TokenType.FADES);

    const direction = this.getCurrentToken()?.value?.toLowerCase();
    if (direction === 'in' || direction === 'out') {
      this.advance();
    }

    return new ActionStatement('fade', entity, { direction: direction || 'out' });
  }

  // Parse: Entity glows bright
  parseGlowAction(entity) {
    this.expect(TokenType.GLOWS);

    let intensity = 'normal';
    if (this.match(TokenType.BRIGHT)) {
      intensity = 'bright';
      this.advance();
    }

    return new ActionStatement('glow', entity, { intensity });
  }

  // Parse: Entity merges with OtherEntity
  parseMergeAction(entity) {
    this.expect(TokenType.MERGES);
    this.expect(TokenType.WITH);

    const target = this.expect(TokenType.IDENTIFIER).value;

    return new ActionStatement('merge', entity, { target });
  }

  // Parse: emit particles: 20
  parseEmitAction(entity) {
    this.expect(TokenType.EMIT);

    let emitType = 'particles';
    let count = 10;

    if (this.getCurrentToken()?.type === TokenType.IDENTIFIER) {
      emitType = this.getCurrentToken().value;
      this.advance();
    }

    if (this.match(TokenType.COLON)) {
      this.advance();
      count = this.expect(TokenType.NUMBER).value;
    }

    return new ActionStatement('emit', entity, { emitType, count });
  }

  // Parse: (x, y) or position names
  parseCoordinate() {
    if (this.match(TokenType.LPAREN)) {
      this.advance();
      const x = this.expect(TokenType.NUMBER).value;
      this.expect(TokenType.COMMA);
      const y = this.expect(TokenType.NUMBER).value;
      this.expect(TokenType.RPAREN);
      return { x, y };
    } else if (this.match(TokenType.IDENTIFIER)) {
      // Named positions like "center", "left", "right"
      const name = this.getCurrentToken().value;
      this.advance();
      return { name };
    }
  }

  // Parse properties in { key: value, key: value }
  parseProperties() {
    const properties = {};

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

  // Parse: key: value
  parseProperty() {
    const key = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.COLON);

    const value = this.parseValue();

    return new Property(key, value);
  }

  // Parse various value types
  parseValue() {
    const token = this.getCurrentToken();

    if (this.match(TokenType.STRING)) {
      this.advance();
      return token.value;
    } else if (this.match(TokenType.NUMBER)) {
      this.advance();
      return token.value;
    } else if (this.match(TokenType.COLOR)) {
      this.advance();
      return token.value;
    } else if (this.match(TokenType.IDENTIFIER)) {
      this.advance();
      return token.value;
    } else {
      throw new Error(`Expected value at line ${token?.line}`);
    }
  }
}

// Helper function to parse tokens
export function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}
