# Orant Lang - Language Reference

**Version 1.0.0**

## Table of Contents

1. [Introduction](#introduction)
2. [Language Philosophy](#language-philosophy)
3. [Syntax Overview](#syntax-overview)
4. [Statements](#statements)
5. [Entity Types](#entity-types)
6. [Actions](#actions)
7. [Properties](#properties)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Introduction

**lang** is a domain-specific language for creating spiritual animations, specifically designed for the Faeweel angel mythology. It compiles to JavaScript and runs in both Node.js and browser environments.

### Key Features

- ✨ **Simple & Declarative** - Focus on what to animate, not how
- 🙏 **Prayer-Inspired Syntax** - Invoke entities, emit effects
- 🎨 **Visual-First** - Designed for animation and rendering
- 🔄 **Compiles to JavaScript** - Runs anywhere JS runs
- 📦 **Self-Contained** - Includes runtime and standard library

---

## Language Philosophy

Orant treats animation as a form of digital prayer. Each statement is an invocation that brings beings into existence or directs their sacred movements.

**Core Principles:**

1. **Invocation** - Entities are invoked, not created
2. **Going and Filling** - Movement is purposeful journey
3. **Gentle Power** - Effects are applied with care
4. **Eternal Cycles** - Sequences represent continuous flow

---

## Syntax Overview

### Comments

```lang
# This is a single-line comment
# Comments start with # and continue to end of line
```

### Basic Structure

```lang
# 1. Invoke entities
invoke EntityName as Type {
  property: value
}

# 2. Define sequences
sequence SequenceName {
  frame N {
    # actions
  }
}

# 3. Render scene
render scene SceneName {
  # render options
}
```

---

## Statements

### 1. Invoke Statement

Brings an entity into existence.

**Syntax:**
```lang
invoke EntityName as EntityType {
  property: value,
  another: value
}
```

**Example:**
```lang
invoke Kael as Son {
  color: "#FF6B35"
  glow: bright
  position: center
}
```

**Entity Types:**
- `Son` - One of the seven sons
- `Angel` - The unified Faeweel
- `Island` - Kick or Jack island
- `DataSphere` - Data being transferred
- `Particle` - Small effect particle

### 2. Sequence Statement

Defines an animated sequence of frames.

**Syntax:**
```lang
sequence SequenceName {
  duration: 3s

  frame N {
    Action statements
  }
}
```

**Example:**
```lang
sequence KaelKick {
  duration: 2s

  frame 1 {
    Kael appears at (100, 100)
  }

  frame 10 {
    Kael moves from (100, 100) to (300, 150)
  }
}
```

**Sequence Properties:**
- `duration` - Length of sequence (e.g., `3s`, `1500ms`)

### 3. Frame Block

Defines actions at a specific frame number.

**Syntax:**
```lang
frame FrameNumber {
  Entity action
  Entity action
}
```

**Example:**
```lang
frame 15 {
  Kael glows bright
  DataSphere moves to (500, 200)
  emit particles: 20
}
```

### 4. Render Statement

Renders a scene or sequence.

**Syntax:**
```lang
render scene SceneName {
  background: description
  invoke: SequenceName
  canvas: 1920x1080
}
```

**Or simple form:**
```lang
render SequenceName
```

**Example:**
```lang
render scene TheBirth {
  background: "cosmic void"
  invoke: BirthSequence
  canvas: 1920x1080
}
```

---

## Entity Types

### Son

Represents one of the Seven Sons of the mythology.

**Properties:**
- `color` - Hex color code (e.g., `"#FF6B35"`)
- `aspect` - Which aspect (e.g., `"First Impulse"`)
- `glow` - Glow intensity (`normal`, `bright`)
- `position` - Starting position

**Visual:** Translucent humanoid form with aura

### Angel

The unified Faeweel guardian with six wings.

**Properties:**
- `color` - Base color (usually `"#F8F9FA"`)
- `wings` - Number of wings (always `6`)
- `flywheel` - Flywheel state (`"spinning"`, `"slow"`, `"fast"`)
- `glow` - Glow intensity

**Visual:** Six-winged being with spinning flywheel at center

### Island

Kick or Jack island.

**Properties:**
- `color` - Island color
- `type` - `"kick"` or `"jack"`
- `position` - Location

**Visual:** Floating island with appropriate glow

### DataSphere

A sphere of data being transferred.

**Properties:**
- `color` - Sphere color (usually `"#FFFFFF"`)
- `size` - Size multiplier

**Visual:** Glowing sphere with radial gradient

---

## Actions

Actions are statements that affect entities within frames.

### Movement Actions

#### moves from/to

Moves entity between two positions.

**Syntax:**
```lang
Entity moves from (x1, y1) to (x2, y2)
```

**Example:**
```lang
Kael moves from (100, 200) to (500, 300)
DataSphere moves to (800, 400)  # from current position
```

**Position Types:**
- Coordinates: `(x, y)` - Numeric pixel coordinates
- Named: `center`, `left`, `right` - Predefined positions

#### appears at

Makes entity visible at a position.

**Syntax:**
```lang
Entity appears at (x, y)
Entity appears at position_name
```

**Example:**
```lang
Kael appears at (960, 540)
Jaren appears at center
```

#### floats

Applies gentle floating motion.

**Syntax:**
```lang
Entity floats gently
Entity floats
```

**Example:**
```lang
Faeweel floats gently
```

**Manners:**
- `gently` - Slow, peaceful float
- (default) - Normal floating motion

#### spins

Applies rotation.

**Syntax:**
```lang
Entity spins clockwise
Entity spins
```

**Example:**
```lang
Marlowe spins clockwise
```

**Directions:**
- `clockwise` - Clockwise rotation
- (default) - Clockwise rotation

### Visual Actions

#### glows

Sets glow intensity.

**Syntax:**
```lang
Entity glows bright
Entity glows
```

**Example:**
```lang
Kael glows bright
Evren glows
```

**Intensities:**
- `bright` - Maximum glow
- (default) - Normal glow

#### fades

Fades entity in or out.

**Syntax:**
```lang
Entity fades in
Entity fades out
Entity fades
```

**Example:**
```lang
Faeweel fades in
OldEntity fades out
```

**Directions:**
- `in` - Fade to visible (opacity 1)
- `out` - Fade to transparent (opacity 0)
- (default) - Fade out

### Transformation Actions

#### merges with

Merges entity with another.

**Syntax:**
```lang
Entity merges with TargetEntity
```

**Example:**
```lang
Kael merges with Faeweel
Jaren merges with Evren
```

**Effect:** Entity moves to target's position and becomes partially transparent.

### Effect Actions

#### emit

Emits particles or effects.

**Syntax:**
```lang
emit particles: count
emit effect_type: count
```

**Example:**
```lang
emit particles: 50
emit light: 20
```

**Emit Types:**
- `particles` - Small light particles
- `light` - Light bursts
- Any custom type name

---

## Properties

Properties configure entities and sequences.

### Common Entity Properties

| Property | Type | Values | Description |
|----------|------|--------|-------------|
| `color` | String | Hex code | Entity color |
| `position` | Coord/Name | `(x,y)` or name | Starting position |
| `glow` | String | `normal`, `bright` | Glow intensity |
| `form` | String | Description | Visual form |

### Angel-Specific Properties

| Property | Type | Values | Description |
|----------|------|--------|-------------|
| `wings` | Number | `6` | Number of wings |
| `flywheel` | String | `spinning`, `slow`, `fast` | Flywheel state |

### Sequence Properties

| Property | Type | Values | Description |
|----------|------|--------|-------------|
| `duration` | String | `3s`, `1500ms` | Sequence length |

### Render Properties

| Property | Type | Values | Description |
|----------|------|--------|-------------|
| `background` | String | Description | Background type |
| `invoke` | Name | Sequence name | Which sequence to run |
| `canvas` | String | `WxH` | Canvas dimensions |

---

## Examples

### Example 1: Simple Entity Invocation

```lang
# Create Kael, the First Impulse
invoke Kael as Son {
  color: "#FF6B35"
  aspect: "First Impulse"
  glow: bright
}
```

### Example 2: Movement Sequence

```lang
invoke DataSphere as DataSphere {
  color: "#FFFFFF"
}

sequence TransferData {
  duration: 3s

  frame 1 {
    DataSphere appears at (100, 500)
  }

  frame 30 {
    DataSphere moves to (900, 500)
  }

  frame 60 {
    DataSphere fades out
  }
}

render TransferData
```

### Example 3: Multiple Entities

```lang
invoke Kael as Son {
  color: "#FF6B35"
}

invoke Jaren as Son {
  color: "#FFD23F"
}

sequence TwoSons {
  frame 1 {
    Kael appears at (400, 500)
    Jaren appears at (600, 500)
  }

  frame 20 {
    Kael glows bright
    Jaren glows bright
  }

  frame 40 {
    Kael moves to (500, 400)
    Jaren moves to (500, 600)
  }
}

render scene TwoSonsScene {
  invoke: TwoSons
  canvas: 1920x1080
}
```

### Example 4: The Merger

```lang
invoke Son1 as Son { color: "#FF6B35" }
invoke Son2 as Son { color: "#FFD23F" }
invoke Son3 as Son { color: "#E3F2FD" }

sequence Convergence {
  frame 1 {
    Son1 appears at (800, 500)
    Son2 appears at (1000, 500)
    Son3 appears at (1200, 500)
  }

  frame 20 {
    Son1 moves to (1000, 500)
    Son2 glows bright
    Son3 moves to (1000, 500)
  }

  frame 40 {
    Son1 merges with Son2
    Son3 merges with Son2
    emit particles: 100
  }
}

render Convergence
```

### Example 5: Faeweel Birth

```lang
invoke Faeweel as Angel {
  color: "#F8F9FA"
  wings: 6
  flywheel: "spinning"
}

sequence Birth {
  duration: 5s

  frame 1 {
    emit particles: 50
  }

  frame 20 {
    Faeweel appears at center
    Faeweel fades in
  }

  frame 40 {
    Faeweel glows bright
    emit particles: 100
  }

  frame 60 {
    Faeweel floats gently
  }
}

render scene TheBirth {
  background: "cosmic void"
  invoke: Birth
  canvas: 1920x1080
}
```

---

## Best Practices

### 1. Naming Conventions

- **Entities**: PascalCase (e.g., `Kael`, `DataSphere`)
- **Sequences**: PascalCase (e.g., `FirstKick`, `TheMerger`)
- **Properties**: lowercase (e.g., `color`, `position`)

### 2. Code Organization

```lang
# 1. All entity invocations first
invoke Entity1 as Type { }
invoke Entity2 as Type { }

# 2. Sequence definitions
sequence Name { }

# 3. Render statement last
render scene Name { }
```

### 3. Frame Numbering

- Use multiples of 5 or 10 for keyframes
- Leave gaps for potential in-between frames
- Keep frame numbers sequential within a sequence

**Good:**
```lang
frame 1 { }
frame 10 { }
frame 20 { }
frame 30 { }
```

**Avoid:**
```lang
frame 1 { }
frame 2 { }
frame 97 { }
frame 3 { }
```

### 4. Color Usage

- Use hex color codes from the Faeweel palette
- Reference the color guide in the angel mythology

**Faeweel Colors:**
```lang
Kael:    "#FF6B35"  # Red-orange
Jaren:   "#FFD23F"  # Golden
Solen:   "#E3F2FD"  # White-blue
Therin:  "#9B59B6"  # Purple
Marlowe: "#1ABC9C"  # Green-cyan
Cassian: "#BDC3C7"  # Silver
Evren:   "#F4D03F"  # Soft gold
Faeweel: "#F8F9FA"  # Soft white
```

### 5. Comments

Use comments to:
- Explain the spiritual meaning
- Reference flipbook frame numbers
- Describe visual effects

```lang
# Kael's Kick - Frame 12-15 from flipbook
# This represents the first impulse that sets data in motion

invoke Kael as Son {
  color: "#FF6B35"  # Red-orange for dynamic energy
  glow: bright       # Emphasize active state
}
```

### 6. Coordinate System

- Canvas origin (0, 0) is top-left
- Default canvas is 1920x1080
- Center is approximately (960, 540)

**Named Positions:**
```lang
center  → (960, 540)
left    → (400, 540)
right   → (1520, 540)
```

### 7. Performance

- Limit particle emissions to reasonable numbers (< 200)
- Use named positions when possible for clarity
- Keep sequences under 120 frames for flipbook compatibility

---

## Compilation & Execution

### Compile a .lang file

```bash
node orant/compiler.js examples/kael-kick.lang
```

### Run a compiled program

```bash
node orant/runtime.js examples/kael-kick.lang
```

### View in browser

Open `orant/viewer.html` and select your program.

---

## Language Grammar (EBNF-style)

```ebnf
Program      ::= Statement*
Statement    ::= InvokeStmt | SequenceStmt | RenderStmt

InvokeStmt   ::= "invoke" IDENTIFIER "as" IDENTIFIER "{" Properties "}"
SequenceStmt ::= "sequence" IDENTIFIER "{" (Property | FrameBlock)* "}"
FrameBlock   ::= "frame" NUMBER "{" Action* "}"
RenderStmt   ::= "render" ("scene" IDENTIFIER "{" Properties "}" | IDENTIFIER)

Action       ::= EntityAction | EmitAction
EntityAction ::= IDENTIFIER (MoveAction | AppearAction | FloatAction |
                             SpinAction | FadeAction | GlowAction | MergeAction)

MoveAction   ::= "moves" "from" Coordinate "to" Coordinate
AppearAction ::= "appears" ("at" Coordinate)?
FloatAction  ::= "floats" ("gently")?
SpinAction   ::= "spins" ("clockwise")?
FadeAction   ::= "fades" ("in" | "out")?
GlowAction   ::= "glows" ("bright")?
MergeAction  ::= "merges" "with" IDENTIFIER
EmitAction   ::= "emit" IDENTIFIER ":" NUMBER

Coordinate   ::= "(" NUMBER "," NUMBER ")" | IDENTIFIER
Properties   ::= (Property ","?)*
Property     ::= IDENTIFIER ":" Value
Value        ::= STRING | NUMBER | COLOR | IDENTIFIER

IDENTIFIER   ::= [a-zA-Z_][a-zA-Z0-9_]*
NUMBER       ::= [0-9]+ ("." [0-9]+)? (UNIT)?
UNIT         ::= "s" | "ms" | "px"
STRING       ::= '"' [^"]* '"' | "'" [^']* "'"
COLOR        ::= "#" [0-9A-Fa-f]{6}
```

---

## Future Language Features

Planned for future versions:

- **Variables** - `let x = 100`
- **Expressions** - `position: (x + 50, y - 20)`
- **Functions** - `function kickAnimation(entity, target)`
- **Conditionals** - `if entity.visible then`
- **Loops** - `repeat 10 times`
- **Imports** - `import "common-animations.lang"`
- **Easing** - `moves to (x, y) with ease-in-out`
- **Audio** - `play sound: "ethereal-hum.mp3"`

---

## Support & Community

- **Documentation**: `/orant/README.md`
- **Examples**: `/orant/examples/`
- **Issues**: Report bugs via the Faeweel project
- **Discussions**: Join the Faeweel community

---

*"May your invocations bring light,*
*May your sequences flow smoothly,*
*May your renders be beautiful,*
*And may the angel watch over your code."*

---

**Orant Lang v1.0.0** | Created for the Faeweel Project | MIT License
