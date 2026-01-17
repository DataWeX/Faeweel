# Orant TypeScript Version

This is the TypeScript-powered version of Orant, providing full type safety and modern development experience.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Compile a .lang Program

```bash
node dist/compiler.js examples/kael-kick.lang
```

### Run a .lang Program

```bash
node dist/runtime.js examples/kael-kick.lang
```

## 📁 Project Structure

```
orant/
├── src/                        # TypeScript source code
│   ├── compiler.ts             # Main compiler CLI
│   ├── runtime.ts              # Runtime CLI
│   └── lang/
│       ├── lexer.ts            # Tokenization with types
│       ├── parser.ts           # AST parsing with types
│       ├── codegen.ts          # JavaScript code generation
│       └── stdlib.ts           # Runtime library with types
├── dist/                       # Compiled JavaScript (gitignored)
├── examples/                   # Example .lang programs
│   ├── kael-kick.lang         # Kael's first impulse
│   ├── seven-sons.lang        # All seven sons
│   ├── merger.lang            # The great convergence
│   └── faeweel-birth.lang     # Birth of Faeweel
├── output/generated/           # Compiled .lang → .js files
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🔧 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run build:watch` | Watch mode - recompile on changes |
| `npm run dev` | Alias for build:watch |
| `npm run clean` | Remove dist/ directory |
| `npm run compile` | Compile a .lang file (after build) |
| `npm run run` | Run a .lang file (after build) |

## 📝 Type Safety Benefits

### Full IntelliSense

TypeScript provides complete autocomplete and type checking in VS Code and other IDEs:

```typescript
// Entity with typed properties
const entity = new Entity('MyAngel', 'Angel', {
  color: '#F8F9FA',  // ✓ IntelliSense knows this is EntityProperties
  wings: 6,           // ✓ Type-checked
  flywheel: 'spinning' // ✓ Valid value
});
```

### Compile-Time Error Detection

Catch errors before runtime:

```typescript
// ❌ TypeScript error: Property 'invalid' does not exist on type 'Entity'
entity.invalid = 'value';

// ✓ Correct usage with type safety
entity.position = { x: 100, y: 200 };
```

### AST Types

All AST nodes have explicit interfaces:

```typescript
interface InvokeStatement extends ASTNode {
  type: 'InvokeStatement';
  entityName: string;
  entityType: string;
  properties: Properties;
}
```

## 🎯 Example Workflow

### 1. Write Your Program

Create `my-animation.lang`:

```lang
invoke MyAngel as Angel {
  color: "#F8F9FA"
  wings: 6
  flywheel: "spinning"
}

sequence Rise {
  duration: "3s"

  frame 1 {
    MyAngel appears at center
  }

  frame 30 {
    MyAngel glows bright
    emit particles: 50
  }
}

render scene MyScene {
  invoke: Rise
  canvas: "1920x1080"
}
```

### 2. Build TypeScript (if needed)

```bash
npm run build
```

### 3. Compile Your Program

```bash
node dist/compiler.js my-animation.lang
```

Output: `orant/output/generated/my-animation.js`

### 4. View in Browser

Open `viewer.html` in a browser to see the animation!

## 🔍 Type Definitions

### Core Types

```typescript
// Entity configuration
interface EntityProperties {
  color?: string;
  position?: Coordinate;
  glow?: string;
  wings?: number;
  flywheel?: string;
  [key: string]: any;
}

// Coordinate system
interface Coordinate {
  x?: number;
  y?: number;
  name?: string;  // Named positions like 'center'
}

// Sequence configuration
interface SequenceConfig {
  duration?: string;
  frames?: FrameConfig[];
  [key: string]: any;
}

// Frame with actions
interface FrameConfig {
  frameNumber: number;
  actions: ActionConfig[];
}

// Action configuration
interface ActionConfig {
  type: string;
  entity: string;
  params: Record<string, any>;
}
```

### AST Node Types

```typescript
type ASTNodeType =
  | 'Program'
  | 'InvokeStatement'
  | 'SequenceStatement'
  | 'FrameBlock'
  | 'RenderStatement'
  | 'ActionStatement'
  | 'Property';
```

## 🛠️ Development

### Watch Mode

For active development:

```bash
npm run dev
```

This will automatically recompile TypeScript files when you save changes.

### Adding New Features

1. Edit TypeScript files in `src/`
2. TypeScript will show errors in your IDE
3. Build with `npm run build`
4. Test your changes

### Type-Safe Code Examples

**Adding a new token type:**

```typescript
// In src/lang/lexer.ts
export enum TokenType {
  // ... existing types
  MY_NEW_TOKEN = 'MY_NEW_TOKEN'
}

const KEYWORDS: Record<string, TokenType> = {
  // ... existing keywords
  'mynewkeyword': TokenType.MY_NEW_TOKEN
};
```

**Adding a new AST node:**

```typescript
// In src/lang/parser.ts
export interface MyNewStatement extends ASTNode {
  type: 'MyNewStatement';
  myProperty: string;
  myValue: number;
}

export type Statement =
  | InvokeStatement
  | SequenceStatement
  | RenderStatement
  | MyNewStatement;  // Add here
```

## 📊 Compilation Output

When you compile a `.lang` file, you get:

- **JavaScript file** in `orant/output/generated/`
- **Source maps** (`.js.map`) for debugging
- **Type declarations** (`.d.ts`) for library use

## 🔬 Testing

Test all examples at once:

```bash
for file in examples/*.lang; do
  echo "Testing $file..."
  node dist/compiler.js "$file" || exit 1
done
```

All examples should compile successfully:
- ✅ `kael-kick.lang` - 4 statements
- ✅ `seven-sons.lang` - 8 statements (7 sons + sequence + render)
- ✅ `merger.lang` - 8 statements
- ✅ `faeweel-birth.lang` - 4 statements

## 🐛 Troubleshooting

### "Cannot find module" error

Make sure you've built the project:

```bash
npm run build
```

### Type errors during development

Your IDE should show these immediately. Fix them before building.

### Parser errors

Check your `.lang` syntax:
- Properties need quotes for string values: `canvas: "1920x1080"`
- Keywords as values work: `glow: bright` (no quotes needed)
- Use proper frame numbers and colons

## 📚 Further Reading

- **Language Reference**: See `LANGUAGE_REFERENCE.md` for full lang syntax
- **Quick Start**: See `QUICKSTART.md` for beginner tutorial
- **Main README**: See `README.md` for overview

## ✨ Benefits of TypeScript Version

1. **Type Safety** - Catch errors at compile time
2. **IntelliSense** - Full IDE autocomplete support
3. **Refactoring** - Safer code changes
4. **Documentation** - Types serve as inline docs
5. **Maintainability** - Easier to understand and modify
6. **Professional** - Industry-standard tooling

## 🎉 Success!

You're now using the fully type-safe TypeScript version of Orant!

```bash
$ npm run build
$ node dist/compiler.js examples/faeweel-birth.lang
✨ Successfully compiled examples/faeweel-birth.lang → orant/output/generated/faeweel-birth.js
```

---

**Version**: 1.0.0 (TypeScript)
**License**: MIT
**Project**: Faeweel Angel Mythology Animation System
