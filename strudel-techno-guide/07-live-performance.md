# 🎭 Live Performance Guide

Master the art of live-coded techno performance. This section covers workflow, real-time manipulation techniques, and strategies for engaging performances using Strudel.

## 🎯 Performance Workflow

### Setup Phase
```javascript
// Have these ready to copy-paste

// 1. Basic setup (always start with this)
setcpm(130/4)

// 2. Emergency beat (when things go wrong)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")

// 3. Start template (choose one)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("~ sd ~ sd").bank("RolandTR909")
```

### Performance Structure
1. **Introduction**: Start simple, establish groove
2. **Development**: Add layers, increase complexity
3. **Climax**: Full energy, all elements active
4. **Breakdown**: Reduce elements, create tension
5. **Transition**: Change tempo/key/style
6. **Repeat**: New variation on theme

## 🎚️ Real-Time Control Techniques

### Muting/Unmuting Strategy
```javascript
// Start with all muted, build live
//: sound("bd*4").bank("RolandTR909")      // Uncomment to start kick
//: sound("hh*16").bank("RolandTR909")      // Uncomment for hats  
//: sound("~ sd ~ sd").bank("RolandTR909")    // Uncomment for snare
//: sound("cp(5,16)").bank("RolandTR909")   // Uncomment for clap
```

**Performance Technique**:
- Keep patterns commented (`//`) until needed
- Use Ctrl+/ to quickly comment/uncomment
- Start with kick, add elements gradually

### Progressive Building
```javascript
// Start with foundation
$: sound("bd*4").bank("RolandTR909")

// Add hats (copy-paste this line when ready)
$: sound("hh*16").bank("RolandTR909")

// Add bass (copy-paste when ready)  
$: n("0 2 4 2").scale("C:minor").sound("sawtooth").lpf(300)

// Add chords (copy-paste when ready)
$: chord("<Cm Fm>").voicing().sound("sawtooth").gain(0.4)
```

### Real-Time Parameter Control
```javascript
// Filter sweeps for energy
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(200)  // Change this number live: 200 -> 500 -> 200 -> 1500 -> 200

// Volume control for builds
$: sound("hh*16").bank("RolandTR909")
.gain(0.6)  // Modify this live: 0.6 -> 0.9 -> 0.3 -> 1.2
```

## 🎛️ Live Performance Patterns

### Beat-Juggling Technique
```javascript
// Switch between patterns smoothly
setcpm(130/4)

// Pattern A: Basic 4x4
$: sound("bd*4").bank("RolandTR909")

// Pattern B: Syncopated (replace Pattern A when ready)
// $: sound("bd(5,16)").bank("RolandTR909")

// Pattern C: Double-time (replace Pattern B when ready)
// $: sound("bd*8").bank("RolandTR909")

// Return to Pattern A (replace Pattern C when ready)
$: sound("bd*4").bank("RolandTR909")
```

### Breakbeat Integration
```javascript
// Switch to breaks for variety
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")

// Switch to breaks (replace above when ready)
samples('github:tidalcycles/dirt-samples')
$: s("breaks165").fit().chop(16).gain(0.8)

// Return to 4x4 (replace breaks when ready)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### Tempo Shifts
```javascript
// Gradual tempo changes
setcpm(130/4)  // Start tempo
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")

// Increase tempo (copy-paste to increase)
// setcpm(135/4)
// setcpm(140/4) 
// setcpm(145/4)

// Decrease tempo (copy-paste to decrease)
// setcpm(125/4)
// setcpm(120/4)
```

## 🎯 Advanced Performance Techniques

### Texture Modulation
```javascript
// Evolving texture layers
$: sound("bd*4").bank("RolandTR909")

$: sound("hh*16").bank("RolandTR909")
.gain(0.7)

// Add texture (uncomment when ready)
$: sound("hh*16").bank("RolandTR909")
.sometimes(ply(2)).gain(0.3)

// Add more texture (uncomment when ready)
$: sound("hh*16").bank("RolandTR909")
.sometimesBy(0.3, rev()).gain(0.2)
```

### Melodic Variation
```javascript
// Evolving bassline live
$: n("0 2 4 2").scale("C:minor").sound("sawtooth").lpf(300)

// Modify these numbers live:
// n("0 2 4 5")  // Change 2 to 5
// n("0 2 1 0")  // Change pattern
// n("-1 1 3 1")  // Transpose down

// Change scale live:
// .scale("D:minor")    // Change key
// .scale("C:dorian")   // Change mode
```

### Automated Build-Ups
```javascript
// Pre-programmed builds
$: sound("bd*4").bank("RolandTR909")

$: sound("hh*16").bank("RolandTR909")
.gain(sine.range(0.3,0.9).slow(8))  // Auto-fade in/out every 8 cycles

$: sound("hh*16").bank("RolandTR909")
.lpf(sine.range(200,2000).slow(4))  // Auto filter sweep
```

## 🎭 Performance Strategies

### The "Save and Restore" Method
```javascript
// Keep these in separate text blocks

// BLOCK 1: Foundation (copy-paste when needed)
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")

// BLOCK 2: Add bass (copy-paste when ready)
$: n("0 2 4 2").scale("C:minor").sound("sawtooth").lpf(300)

// BLOCK 3: Add percussion (copy-paste when ready)
$: sound("cp(5,16)").bank("RolandTR909")

// EMERGENCY: Return to minimal (copy-paste anytime)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### The "Layer Stacking" Method
```javascript
// Start here (everything commented out)
//: sound("bd*4").bank("RolandTR909")
//: sound("hh*16").bank("RolandTR909")
//: n("0 2 4 2").scale("C:minor").sound("sawtooth").lpf(300)
//: chord("<Cm Fm>").voicing().sound("sawtooth").gain(0.4)

// Performance: Uncomment lines one by one to build
// Use Ctrl+/ on each line to mute/unmute
```

### The "Theme and Variation" Method
```javascript
// THEME: Basic pattern
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("~ sd ~ sd").bank("RolandTR909")

// VARIATION 1: Add syncopation (replace theme when ready)
$: sound("bd(5,16)").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("sd(3,8)").bank("RolandTR909")

// VARIATION 2: Add complexity (replace variation 1 when ready)
$: sound("bd*4 [bd bd]").bank("RolandTR909")
$: sound("hh*16").sometimes(ply(2)).bank("RolandTR909")
$: sound("sd*2").every(4, rev()).bank("RolandTR909")

// RETURN: Back to theme (replace variation 2 when ready)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")  
$: sound("~ sd ~ sd").bank("RolandTR909")
```

## 🎚️ Improvisation Techniques

### Safe Experimentation
```javascript
// Keep solid foundation, experiment with one element
$: sound("bd*4").bank("RolandTR909")        // DON'T TOUCH - Foundation
$: sound("hh*16").bank("RolandTR909")        // EXPERIMENT HERE

// Try these variations:
// hh*16 -> hh*8 -> hh*32
// Add .sometimes(ply(2))
// Add .sometimes(rev())
// Change bank: "RolandTR808"
```

### Scale Modulation
```javascript
// Start with scale
$: n("0 2 4 2").scale("C:minor").sound("sawtooth").lpf(300)

// Modulate during performance (copy-paste these):
// .scale("D:minor")      // Up one step
// .scale("Bb:minor")     // Down one step  
// .scale("C:major")      // Change mode
// .scale("C:dorian")     // Different mode
```

### Filter Performance
```javascript
// Manual filter control
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(300)  // Change this value live

// Filter performance sequence:
// 300 -> 500 -> 800 -> 2000 -> 800 -> 300
// Use copy-paste to change quickly
```

## 🎯 Problem-Solving During Performance

### Common Issues and Solutions

**"Pattern is too busy"**
```javascript
// Simplify immediately
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

**"Lost the groove"**
```javascript
// Return to basic 4x4
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*8").bank("RolandTR909")
```

**"Too much bass"**
```javascript
// Reduce bass gain
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(300).gain(0.3)  // Lower this number
```

**"Need energy"**
```javascript
// Add high-frequency elements
$: sound("hh*16").sometimes(ply(2)).bank("RolandTR909")
$: sound("cp*8").bank("RolandTR909")
```

## 🎭 Performance Preparation

### Pre-Show Checklist
1. **Test all patterns** in the venue/before performing
2. **Save working patterns** to separate text file
3. **Prepare emergency fallbacks** (simple beats)
4. **Check tempo ranges** appropriate for setting
5. **Have backup templates** ready to copy-paste

### During Show
1. **Listen constantly** to what's actually playing
2. **Don't overcomplicate** unless it's working
3. **Return to simple** when in doubt
4. **Watch audience response** - what makes people dance?
5. **Record your set** for later analysis

### Post-Performance
1. **Save successful patterns** for future use
2. **Analyze what worked** and what didn't
3. **Note audience reactions** to different sections
4. **Practice problematic sections** for next time

## 🎚️ Advanced Performance Techniques

### Multi-Part Arrangement
```javascript
// Part A (0-32 bars)
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")

// Part B (32-64 bars) - Copy-paste when ready
$: sound("bd(5,16)").bank("RolandTR909")
$: sound("hh*16").sometimes(ply(2)).bank("RolandTR909")
$: sound("cp(5,16)").bank("RolandTR909")

// Part C (64-96 bars) - Copy-paste when ready  
$: sound("bd*4 [bd bd]").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: n("0 2 4 2").scale("C:minor").sound("sawtooth").lpf(300)

// Return to Part A (96-128 bars) - Copy-paste when ready
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### Audience Interaction
```javascript
// Build based on energy
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909").gain(0.5)

// If crowd is responsive, add more:
$: sound("cp*8").bank("RolandTR909")  // Add when energy high

// If energy drops, simplify:
$: sound("bd*4").bank("RolandTR909")  // Return to basics
$: sound("hh*8").bank("RolandTR909")
```

## 🎯 Final Tips

### Mental Preparation
- **Practice transitions** between patterns
- **Memorize basic patterns** by heart
- **Develop muscle memory** for common edits
- **Stay calm** when things go wrong
- **Have fun** - it's about the music!

### Technical Skills to Master
- **Ctrl+Enter timing** for seamless changes
- **Quick commenting/uncommenting** with Ctrl+/
- **Multi-line copying** and pasting
- **Visual pattern recognition** (know what pattern looks like)
- **Auditory memory** (remember what changes do)

## 🎚️ Performance Quick Reference

| Situation | Solution | Pattern |
|-----------|-----------|----------|
| Emergency | Simple 4x4 | `sound("bd*4, hh*16")` |
| Need Energy | Add percussion | `sound("cp*8")` |
| Too Busy | Simplify | `sound("bd*4, hh*8")` |
| Lost Groove | Return to basics | `sound("bd*4, hh*16")` |
| Build Tension | Automate filters | `.lpf(sine.range())` |
| Need Bass | Add sub-bass | `n("0").sound().lpf()` |

---

## 🎭 Congratulations!

You've completed the complete Strudel techno production guide! You're now equipped to:

- ✅ Create any techno style from minimal to industrial
- ✅ Perform live-coded sets with confidence  
- ✅ Build tracks progressively and intelligently
- ✅ Solve problems in real-time during performances
- ✅ Develop your own unique style and techniques

**Keep practicing, keep experimenting, and most importantly - keep making techno!** 🎹

### Your Journey Continues

- **Join the community**: [Strudel Discord](https://discord.com/invite/HGEdXmRkzT)
- **Share your work**: Use `#strudel` on social media
- **Explore more**: Check [Strudel Showcase](https://strudel.cc/intro/showcase/)
- **Keep learning**: Music production is infinite exploration

*Happy coding and happy dancing!* 🎶✨