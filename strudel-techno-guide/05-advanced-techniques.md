# 🚀 Advanced Techniques

This section covers sophisticated pattern manipulation, advanced audio effects, and professional techniques that will elevate your techno productions to the next level.

## 🎯 Pattern Effects Mastery

### rev() - Pattern Reversal
```javascript
// Reverse entire pattern
setcpm(130/4)
$: n("0 2 4 2 5 4 2 0").scale("C:minor").sound("sawtooth").rev()
$.gain(0.7)
```

### jux() - Stereo Splitting
```javascript
// Split pattern left/right, reverse right side
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.jux(rev()).gain(0.5)
```

### ply() - Speed Repetition
```javascript
// Speed up each event
$: sound("bd sd ~ sd").ply(2)  // Same as "bd*2 sd*2 ~ ~ sd*2 sd*2"
$: sound("hh*8").ply("<1 2 1 3>")  // Variable speed
```

### off() - Time Offset and Modification
```javascript
// Copy pattern, shift time, and modify
$: sound("bd*4").bank("RolandTR909")
.off(1/16, x=>x.speed(1.5).gain(0.3))

$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.off(1/8, x=>x.transpose(-12)).lpf(200)
```

### add() - Pattern Addition
```javascript
// Add notes to existing pattern
$: n("0 2 4").add("<0 1 2>")
.scale("C:minor").sound("sawtooth").gain(0.7)

// Complex addition patterns
$: n("0 2 4").add("0,7").scale("C:minor")
.sound("sawtooth").gain(0.7)
```

## 🎛️ Advanced Audio Effects

### Filter Modulation
```javascript
// Complex filter automation
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(saw.range(100,2000).slow(8))
.lpfq(sine.range(1,10).slow(4))
.gain(0.7)
```

### Multi-Band Filtering
```javascript
// Split frequency bands
$: sound("bd*4").bank("RolandTR909")
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(800).gain(0.4)

$: n("0 2 4 2").scale("C:minor").sound("square")
.hpf(2000).gain(0.2)
```

### Distortion and Saturation
```javascript
// Add grit and warmth
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.drive(2).gain(0.7)
```

### Stereo Imaging
```javascript
// Wide stereo spread
$: sound("bd*4").bank("RolandTR909").pan(0)
$: sound("hh*16").bank("RolandTR909").pan("0 0.5 1 0.5")
```

## 🎚️ Sample Manipulation

### chop() - Granular Synthesis
```javascript
// Chop samples into grains
samples('github:tidalcycles/dirt-samples')
$: s("breaks165").fit().chop(32)
.sometimesBy(0.3, ply(2))
.sometimesBy(0.2, rev())
.gain(0.7)
```

### slice() - Precise Slicing
```javascript
// Slice with specific pattern
$: s("breaks165").fit()
.slice(16, "<0 1 <2 2*2> 3 [4 0] 5 6 7>")
.cut(1).gain(0.8)
```

### splice() - Speed-Adjusted Slicing
```javascript
// Slices with automatic tempo adjustment
$: s("breaks165")
.splice(8, "<0 1 2 3 4*2 5 6 7>")
.cut(1).gain(0.8)
```

### scrub() - Tape Loop Style
```javascript
// Scrub through samples
$: s("breaks165/4").fit().scrub("{0@3 0@2 4@3}%8")
.slow(2).gain(0.7)
```

## 🎯 Signal Modulation

### Oscillator Modulation
```javascript
// Modulate parameters with waves
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(sine.range(200,2000).slow(8))
.pan(sine.range(0,1).slow(4))
.gain(sine.range(0.3,0.8).slow(2))
```

### Random Modulation
```javascript
// Random variation
$: sound("hh*16").bank("RolandTR909")
.gain(rand.range(0.3,0.8))
.pan(rand.range(0.2,0.8))
```

### Perlin Noise for Natural Movement
```javascript
// Smooth random movement
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(perlin.range(200,800).slow(8))
.gain(perlin.range(0.5,0.9).slow(4))
```

## 🎚️ Advanced Pattern Techniques

### Conditional Pattern Changes
```javascript
// Sometimes, often, rarely patterns
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
.sometimes(ply(2))
.often(delay(0.125))
.rarely(rev())
```

### every() - Periodic Changes
```javascript
// Apply changes every n cycles
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.every(4, rev())
.every(8, x=>x.transpose(7))
.every(16, x=>x.off(1/4, rev()))
```

### Mask() - Pattern Masking
```javascript
// Selectively silence parts
$: sound("bd*4, hh*16").bank("RolandTR909")
.mask("<1 1 0 1>/16")  // Silence 3rd 16th note
```

### struct() - Apply Structure
```javascript
// Apply rhythm to melodic pattern
$: n("<c eb g bb>").struct("[~ x]*4").sound("piano")
.gain(0.7)
```

## 🎛️ Advanced Layering

### Complex Stacks
```javascript
// Multiple layered patterns
setcpm(130/4)

// Rhythm foundation
$: sound("bd*4").bank("RolandTR909").gain(1.2)
$: sound("hh*16").bank("RolandTR909").gain(0.6)
$: sound("~ sd ~ sd").bank("RolandTR909").gain(0.8)

// Bass layers
$: n("0 0 2 2").scale("C:minor").sound("sawtooth")
.lpf(200).gain(0.5)

$: n("0 2 4 2").scale("C:minor").sound("square")
.lpf(600).gain(0.3)

// Melodic elements
$: n("<0 2 4> <[5,7] 4>").scale("C:minor")
.sound("triangle").lpf(1200).gain(0.4)
```

### Dynamic Layer Control
```javascript
// Layers that fade in/out
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
.gain(sine.range(0.2,0.8).slow(16))

$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.gain(sine.range(0.3,0.7).slow(8).phase(0.25))
.lpf(sine.range(200,800).slow(8))
```

## 🎯 Advanced Rhythm Techniques

### Polyrhythmic Complexity
```javascript
// Multiple simultaneous tempos
$: sound("bd(3,8)").bank("RolandTR909")  // 3 against 8
$: sound("hh(5,8)").bank("RolandTR909")  // 5 against 8
$: sound("cp(7,16)").bank("RolandTR909")  // 7 against 16
```

### Metric Modulation
```javascript
// Shifting time signatures
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*8").slow("1 1.5 1 0.75").bank("RolandTR909")
```

### Generative Rhythms
```javascript
// Self-generating patterns
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
.mask(rand.range(0,1))
.sometimes(ply(2))
.rarely(rev())
```

## 🎚️ Audio Processing Chain

### Complex Effect Chains
```javascript
// Multi-stage processing
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
// Stage 1: Filter
.lpf(sine.range(200,1000).slow(8))
// Stage 2: Distortion
.drive(1.5)
// Stage 3: Stereo
.jux(x=>x.delay(0.125).rev())
// Stage 4: Space
.room(0.4).delay(0.25)
// Stage 5: Dynamics
.gain(0.7)
```

### Bus Processing
```javascript
// Group sounds for collective processing
$: sound("bd*4, ~ sd*2").bank("RolandTR909")
.every(2, x=>x.lpf(800).delay(0.125))

$: sound("hh*16").bank("RolandTR909")
.every(4, x=>x.lpf(2000))
```

## 🎯 Performance Techniques

### Live Parameter Control
```javascript
// Patterns that respond to performance
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(perlin.range(200,1000).slow(8))
.every(4, x=>x.transpose(irand([-12,0,12])))  // Random transpose
```

### Evolution Systems
```javascript
// Self-evolving patterns
$: sound("bd(5,16)").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
.mask(perlin.range(0,1).slow(16))

$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(perlin.range(200,800).slow(8))
.every(8, x=>x.sometimes(rev()))
```

### Build and Release Automation
```javascript
// Automated tension building
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(sine.range(200,2000).slow(32))
.gain(sine.range(0.3,1).slow(32))

// Build hit every 32 cycles
$: sound("cp*8").bank("RolandTR909").gain(1.5)
.every(32)
```

## 🎯 Complete Advanced Examples

### Generative Techno System
```javascript
setcpm(135/4)

// Evolving rhythm base
$: sound("bd(7,16)").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
.mask(perlin.range(0,1).slow(16))
.sometimes(ply(2))

// Evolving bass
$: n("<0 2 4> <[5,7] 4>").scale("C:minor")
.sound("sawtooth")
.lpf(perlin.range(200,1000).slow(8))
.every(4, x=>x.transpose(irand([0,-12])))

// Generative melody
$: n(run(8).scale("C:minor")).sound("triangle")
.lpf(perlin.range(800,2000).slow(4))
.rarely(rev()).gain(0.5)
```

### Complex Processing Chain
```javascript
setcpm(130/4)

// Rhythm with sidechain effect
$: sound("bd*4").bank("RolandTR909")

$: sound("hh*16").bank("RolandTR909")
.gain(sine.range(0.1,0.8).phase(0))
// Duck hats when kick plays
.mask(sound("bd*4").gain(0.5))

// Processed bassline
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(saw.range(100,800).slow(16))
.jux(x=>x.delay(0.0625).transpose(-12))
.room(0.3).drive(1.2)

// Chord stabs with processing
$: chord("<Cm7 Fm7>*2")
.voicing().sound("sawtooth")
.clip(0.1).lpf(2000)
.every(2, x=>x.jux(rev()))
```

## 🎚️ Troubleshooting Advanced Issues

### "Too much chaos"
- Reduce randomization frequency
- Use more conservative ranges
- Add grounding elements (steady kick/hats)

### "Processing is too heavy"
- Simplify effect chains
- Reduce polyphony
- Check gain staging

### "Pattern evolution is predictable"
- Use multiple modulation sources
- Combine different waveforms
- Add more randomness sources

## 🎯 Next Steps

You've mastered advanced techniques! Now you're ready for:

**[→ Templates & Examples](./06-templates-examples.md)** - Complete, ready-to-use techno templates

**You're now ready to:**
- ✅ Use advanced pattern effects
- ✅ Create complex processing chains
- ✅ Manipulate samples granularly
- ✅ Build generative systems
- ✅ Perform live with advanced control

## 🎚️ Quick Reference

| Technique | Function | Use Case |
|-----------|-----------|-----------|
| Stereo Split | `.jux(rev())` | Wide stereo effects |
| Time Offset | `.off(1/16, fn)` | Echo/shadow effects |
| Granular Synthesis | `.chop(n)` | Texture creation |
| Filter Automation | `.lpf(sine.range())` | Movement and evolution |
| Conditional | `.sometimes(fn)` | Controlled randomness |

---

*Ready for complete templates? Continue to [Templates & Examples](./06-templates-examples.md)!* 🎹