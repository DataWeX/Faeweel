# Orant Quick Start Guide

Get started with Orant and the lang language in 5 minutes!

## 🚀 Installation

```bash
cd Faeweel/orant
npm install
```

## ✨ Your First Program

Create a file called `my-first-angel.lang`:

```lang
# My First Angel Animation

invoke MyAngel as Angel {
  color: "#F8F9FA"
  wings: 6
  flywheel: "spinning"
}

sequence AngelAppears {
  duration: 3s

  frame 1 {
    MyAngel appears at center
  }

  frame 20 {
    MyAngel glows bright
  }

  frame 40 {
    MyAngel floats gently
  }
}

render scene MyFirstScene {
  invoke: AngelAppears
  canvas: 1920x1080
}
```

## 🔧 Compile It

```bash
node compiler.js my-first-angel.lang
```

You'll see:
```
✨ Successfully compiled my-first-angel.lang → orant/output/generated/my-first-angel.js
```

## ▶️ Run It

### Option 1: Browser (Recommended)

1. Open `viewer.html` in your web browser
2. The viewer will show a demo animation
3. (To load your custom program, you'll need to add it to the dropdown)

### Option 2: Command Line

```bash
node runtime.js my-first-angel.lang
```

Note: CLI shows simulation only. For visual output, use the browser viewer.

## 📚 Try the Examples

We've included 4 example programs:

### 1. Kael's Kick
```bash
node compiler.js examples/kael-kick.lang --verbose
```

Shows Kael (the First Impulse) kicking a data sphere into motion.

### 2. Seven Sons
```bash
node compiler.js examples/seven-sons.lang --verbose
```

Introduction of all seven mystical beings in a circle formation.

### 3. The Merger
```bash
node compiler.js examples/merger.lang --verbose
```

The seven sons converging and merging into one.

### 4. Faeweel's Birth
```bash
node compiler.js examples/faeweel-birth.lang --verbose
```

The emergence of Faeweel, the unified angel guardian.

## 🎨 Customize Your Animation

### Change Colors

Use hex codes from the Faeweel palette:

```lang
invoke Kael as Son {
  color: "#FF6B35"  # Red-orange
}

invoke Jaren as Son {
  color: "#FFD23F"  # Golden
}
```

### Add Movement

```lang
sequence MoveAround {
  frame 1 {
    Entity appears at (100, 100)
  }

  frame 30 {
    Entity moves from (100, 100) to (500, 300)
  }

  frame 60 {
    Entity moves to (900, 500)
  }
}
```

### Add Effects

```lang
frame 10 {
  Entity glows bright
  emit particles: 50
}

frame 20 {
  Entity spins clockwise
}

frame 30 {
  Entity fades out
}
```

## 🎯 Common Patterns

### The Gentle Float

```lang
sequence GentleFloat {
  frame 1 {
    Angel appears at center
  }

  frame 10 {
    Angel floats gently
  }
}
```

### The Glowing Emergence

```lang
sequence Emerge {
  frame 1 {
    Entity fades in
  }

  frame 10 {
    Entity glows bright
    emit particles: 30
  }
}
```

### The Sacred Merger

```lang
invoke Entity1 as Son { color: "#FF6B35" }
invoke Entity2 as Son { color: "#FFD23F" }

sequence Merge {
  frame 1 {
    Entity1 appears at (400, 500)
    Entity2 appears at (600, 500)
  }

  frame 20 {
    Entity1 moves to (500, 500)
    Entity2 moves to (500, 500)
  }

  frame 40 {
    Entity1 merges with Entity2
    emit particles: 100
  }
}
```

## 📖 Learn More

- **Full Language Reference**: See `LANGUAGE_REFERENCE.md`
- **Example Programs**: Check out `examples/` folder
- **Runtime Documentation**: See `README.md`

## 🐛 Troubleshooting

### "Unexpected token" error

Check your syntax:
- All property lines should end without semicolons
- Use colons for properties: `color: "#FF6B35"`
- Close all braces `{}`

### "Entity not found" error

Make sure you `invoke` an entity before using it in a sequence:

```lang
# First invoke
invoke MyEntity as Son {
  color: "#FF6B35"
}

# Then use in sequence
sequence MySeq {
  frame 1 {
    MyEntity appears at center  # Now it exists!
  }
}
```

### Compiler can't find files

Use relative paths from the orant directory:

```bash
# Good
node compiler.js examples/kael-kick.lang

# Also good
node compiler.js ../my-program.lang
```

## 🎓 Next Steps

1. **Modify an example** - Start with `kael-kick.lang` and change the colors
2. **Create a two-entity dance** - Make two sons interact
3. **Build a full sequence** - Create frames 1-60 of a story
4. **Experiment with effects** - Try different combinations of glow, emit, fade

## 💡 Pro Tips

### 1. Use Named Positions

Instead of:
```lang
Entity appears at (960, 540)
```

Use:
```lang
Entity appears at center
```

Available: `center`, `left`, `right`

### 2. Plan Your Frames

Keyframe at multiples of 10:
```lang
frame 1 { }   # Start
frame 10 { }  # Keyframe
frame 20 { }  # Keyframe
frame 30 { }  # End
```

### 3. Comment Your Intentions

```lang
# This represents Kael's sacred duty to initiate transfers
invoke Kael as Son {
  color: "#FF6B35"  # Red-orange for dynamic energy
}
```

### 4. Build Incrementally

Start simple:
```lang
# Step 1: Just invoke and appear
invoke Angel as Angel { color: "#F8F9FA" }
sequence Test {
  frame 1 { Angel appears at center }
}
render Test
```

Then add complexity:
```lang
# Step 2: Add movement and effects
sequence Test {
  frame 1 { Angel appears at center }
  frame 10 { Angel glows bright }
  frame 20 { Angel floats gently }
}
```

## 🌟 Example: Create a Complete Scene

Here's a complete mini-movie:

```lang
# The Meeting of Two Sons

invoke Kael as Son {
  color: "#FF6B35"
  aspect: "First Impulse"
}

invoke Jaren as Son {
  color: "#FFD23F"
  aspect: "Pathway Maker"
}

sequence TheMeeting {
  duration: 5s

  # They appear from opposite sides
  frame 1 {
    Kael appears at (300, 500)
    Jaren appears at (1600, 500)
  }

  # They glow as they notice each other
  frame 10 {
    Kael glows bright
    Jaren glows bright
  }

  # They move toward each other
  frame 30 {
    Kael moves to (800, 500)
    Jaren moves to (1100, 500)
  }

  # They reach out
  frame 50 {
    emit particles: 50
  }

  # They float together
  frame 60 {
    Kael floats gently
    Jaren floats gently
  }
}

render scene TheMeeting {
  background: "cosmic void"
  invoke: TheMeeting
  canvas: 1920x1080
}
```

Compile and run:
```bash
node compiler.js the-meeting.lang --verbose
```

## 🎉 You're Ready!

You now know enough to create beautiful angel animations with Orant!

Start experimenting, and remember:

*"May your invocations bring light,*
*May your sequences flow smoothly,*
*May your renders be beautiful."*

---

**Need Help?**
- Read `LANGUAGE_REFERENCE.md` for complete documentation
- Check `examples/` for more complex programs
- Review `README.md` for technical details

**Happy Animating!** ✨
