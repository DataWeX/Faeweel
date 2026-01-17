# Orant - Prayer-Driven Animation Language

**Orant** is a spiritual animation framework for creating the Faeweel angel mythology flipbook movie. It features **lang**, a simple domain-specific language that compiles to JavaScript for rendering ethereal animations.

> **✨ Now with TypeScript!** Orant is fully rewritten in TypeScript for type safety, better IDE support, and professional development experience. See [TYPESCRIPT.md](TYPESCRIPT.md) for details.

## What is Orant?

*Orant* (Latin: "one who prays") is both:
1. An animation system for creating the Faeweel angel story
2. A simple language (**lang**) for describing spiritual/ethereal animations
3. A compiler that transforms lang code into JavaScript

## The lang Language

**lang** is designed to be simple, declarative, and spiritually themed. It focuses on:
- Invoking entities (angels, islands, particles)
- Defining movements and transformations
- Creating sequences and flows
- Rendering sacred animations

### Basic Syntax

```lang
# Invoke an entity
invoke Kael as Son {
  color: "#FF6B35"
  form: "translucent humanoid"
  glow: bright
  position: center
}

# Create a sequence
sequence FirstKick {
  duration: 2s

  frame 1 {
    Kael appears at (100, 100)
    DataSphere appears at (150, 150)
  }

  frame 10 {
    Kael kicks DataSphere
    emit particles: 20
  }

  frame 20 {
    DataSphere moves to (300, 150)
  }
}

# Render the scene
render scene TheKicking {
  background: cosmic void
  invoke: FirstKick
  canvas: 1920x1080
}
```

## Installation

```bash
cd orant
npm install
```

## Usage

### Write lang code

Create a `.lang` file:

```lang
# angel-birth.lang
invoke Faeweel as Angel {
  wings: 6
  flywheel: spinning
  color: "#F8F9FA"
}

sequence Birth {
  Faeweel emerges from light
  wings spread gradually
  emit: "gentle radiance"
}

render Birth
```

### Compile to JavaScript

```bash
node orant/compiler.js angel-birth.lang
```

This generates executable JavaScript that renders the animation.

### Run in Orant

```bash
node orant/runtime.js angel-birth.lang
# Or in browser: open orant/viewer.html
```

## Language Features

### 1. Entity Invocation
```lang
invoke EntityName as Type {
  property: value
  another: value
}
```

### 2. Sequences
```lang
sequence SequenceName {
  duration: 3s
  frame N {
    # actions
  }
}
```

### 3. Movements
```lang
Entity moves from (x1, y1) to (x2, y2)
Entity floats gently
Entity spins clockwise
```

### 4. Effects
```lang
emit particles: count
glow: intensity
fade in/out
merge with Entity
```

### 5. Rendering
```lang
render scene Name {
  background: description
  invoke: SequenceName
  canvas: WxH
}
```

## Directory Structure

```
orant/
├── README.md           # This file
├── package.json        # Node dependencies
├── compiler.js         # lang → JavaScript compiler
├── runtime.js          # Animation runtime
├── viewer.html         # Browser-based viewer
├── lang/
│   ├── lexer.js       # Tokenizer
│   ├── parser.js      # Parser
│   ├── codegen.js     # Code generator
│   └── stdlib.js      # Standard library
├── examples/
│   ├── seven-sons.lang
│   ├── kael-kick.lang
│   ├── merger.lang
│   └── faeweel-birth.lang
└── output/
    └── generated/     # Compiled JavaScript
```

## Philosophy

Orant treats animation as a form of digital prayer - each invocation brings entities into being, each sequence is a sacred choreography, each render is an offering of visual storytelling.

The lang language is intentionally simple and meditative, designed to express the spiritual nature of the Faeweel mythology.

## Examples

See `orant/examples/` for complete demonstrations of all Seven Sons and the full angel birth sequence.

## License

MIT - Created for the Faeweel project
