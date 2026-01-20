# 🎸 Basslines & Harmony

Now we add the low-end foundation and harmonic content that gives techno its depth and emotional impact. This section covers bassline creation, chord progressions, and melodic elements.

## 🎯 Sub-Bass Fundamentals

Techno needs solid low-end. Let's start with basic sub-bass:

```javascript
// Simple sub-bass using sawtooth
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: n("0 0 0 0").sound("sawtooth").lpf(200).gain(0.8)
```

**What's happening?**
- `n("0 0 0 0")` - Play the root note continuously
- `.sound("sawtooth")` - Use sawtooth oscillator
- `.lpf(200)` - Low-pass filter at 200Hz for sub-bass
- `.gain(0.8)` - Lower volume to avoid clipping

### Octave Variations
```javascript
// Octave jumps for interest
$: n("<0 -1 0 -2>").sound("sawtooth").lpf(150).gain(0.7)
```

### Sub-Bass with Different Oscillators
```javascript
// Square wave for sharper sub-bass
$: n("0 0 0 0").sound("square").lpf(180).gain(0.6)

// Triangle wave for softer sub-bass  
$: n("0 0 0 0").sound("triangle").lpf(250).gain(0.8)
```

## 🎹 Acid Basslines

The iconic TB-303 sound is essential for acid techno.

### Basic Acid Bass
```javascript
// Classic acid bassline
setcpm(135/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: n("0 2 1 0 3 1 2 0").sound("sawtooth")
.lpf(sine.range(100,1000).slow(2))
.lpenv(-2).resonance(4).gain(0.7)
```

**Acid Bass Components:**
- `.lpf(sine.range(100,1000).slow(2))` - Automated filter sweep
- `.lpenv(-2)` - Filter envelope (negative = decay)
- `.resonance(4)` - Filter resonance for squelch

### Resonance and Envelope Control
```javascript
// More aggressive acid sound
$: n("0 2 1 0 3 1 2 0").sound("sawtooth")
.lpf(sine.range(200,1500).slow(2))
.lpenv(-3).lpa(0.1).lpq(8)
.gain(0.8)
```

### Acid Bass with Distortion
```javascript
// Add distortion for aggression
$: n("0 2 1 0 3 1 2 0").sound("sawtooth")
.lpf(sine.range(100,800).slow(2))
.lpenv(-4).lpq(12)
.gain(1.2)
```

## 🎼 Scale-Based Basslines

Using scales ensures your basslines stay in key and work well together.

### Minor Scale Basslines
```javascript
// Minor scale for dark techno
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: n("0 2 4 2 <[5,7] 4>").scale("C:minor")
.sound("sawtooth").lpf(300).gain(0.8)
```

### Pentatonic Basslines
```javascript
// Pentatonic for melodic bass
$: n("<0 2 4> <[5,7] 4>").scale("C:minor:pentatonic")
.sound("sawtooth").lpf(400).gain(0.7)
```

### Blues Scale Basslines
```javascript
// Blues scale for soulful techno
$: n("0 3 5 <6 5> 3").scale("C:blues")
.sound("triangle").lpf(350).gain(0.8)
```

## 🎛️ Bassline Techniques

### Off-Beat Basslines
```javascript
// Syncopated bassline
$: n("~ 0 ~ 2 ~ 1 ~ 0").scale("C:minor")
.sound("sawtooth").lpf(250).gain(0.7)
```

### Using .off() for Variation
```javascript
// Create shadow bassline
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(300).gain(0.7)
.off(1/16, x=>x.transpose(-12))  // One octave lower, delayed
```

### Layered Basslines
```javascript
// Two basslines for depth
$: n("0 0 2 2").scale("C:minor").sound("sawtooth")
.lpf(200).gain(0.5)

$: n("0 2 4 2").scale("C:minor").sound("square")
.lpf(400).gain(0.3)
```

### Gliding Basslines
```javascript
// Portamento between notes
$: n("0@3 2@3 4@3 2@3").scale("C:minor")
.sound("sawtooth").lpf(300).glide(0.3).gain(0.7)
```

## 🎹 Chord Progressions

Chords add harmonic depth to techno tracks.

### Basic Triads
```javascript
// Simple chord progression
setcpm(125/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: n("<[0,4,7] [2,5,8] [5,9,12] [0,4,7]>")
.scale("C:minor").sound("piano")
.gain(0.5).room(0.3)
```

### Using .voicing() for Better Chords
```javascript
// More natural chord voicings
$: chord("<Cm Fm Ab Eb>*2")
.voicing().sound("sawtooth")
.lpf(800).gain(0.4).room(0.5)
```

### Stab Chords
```javascript
// Short chord stabs
$: chord("<Cm Fm Ab Eb>*2")
.voicing().sound("sawtooth")
.clip(0.1).lpf(1200).gain(0.6)
```

### Arpeggiated Chords
```javascript
// Break chords into arpeggios
$: n("0 [2,4] [5,7] [2,4]").scale("C:minor")
.sound("sawtooth").lpf(600).clip(2).gain(0.7)
```

## 🎚️ Advanced Harmonic Techniques

### Modal Interchange
```javascript
// Switch between scales for tension
$: n("0 2 4 2").scale("<C:minor Db:major>/4")
.sound("sawtooth").lpf(400).gain(0.7)
```

### Chord Inversions
```javascript
// Different chord positions
$: chord("<Cm/C Cm/Eb Cm/G>*2")
.voicing().sound("sawtooth").lpf(600).gain(0.5)
```

### Extended Chords
```javascript
// 7th and 9th chords
$: chord("<Cm7 Fm7 Abmaj7 Eb7>*2")
.voicing().sound("sawtooth").lpf(800).gain(0.4)
```

### Drone and Moving Basslines
```javascript
// Static drone with moving bass
$: n("0 0 0 0").sound("sawtooth").lpf(150).gain(0.5)
$: n("0 2 4 2 <[5,7] 4>").scale("C:minor")
.sound("square").lpf(300).gain(0.3)
```

## 🎯 Complete Examples

### Minimal Techno with Bass
```javascript
setcpm(125/4)
$: sound("bd*4").bank("RolandTR909").gain(1.2)
$: sound("hh*16").bank("RolandTR909").gain(0.6)
$: n("0 0 2 2 4 4 2 2").scale("C:minor:pentatonic")
.sound("sawtooth").lpf(200).gain(0.8)
```

### Acid Techno Complete
```javascript
setcpm(140/4)
$: sound("bd*4 [bd bd]").bank("RolandTR909")
$: sound("hh*16").sometimes(ply(2)).bank("RolandTR909")
$: n("0 2 1 0 3 1 2 0").sound("sawtooth")
.lpf(sine.range(100,1000).slow(2))
.lpenv(-4).lpq(12).gain(0.8)
$: chord("<Cm Fm>").voicing().sound("sawtooth")
.clip(0.1).lpf(1200).gain(0.3)
```

### Deep House with Chords
```javascript
setcpm(120/4)
$: sound("bd*4").bank("RolandTR909").gain(0.8)
$: sound("hh*16").bank("RolandTR909").gain(0.4)
$: n("0 2 4 2").scale("C:minor")
.sound("sawtooth").lpf(250).gain(0.7)
$: chord("<Cm7 Fm7 Abmaj7 Eb7>*2")
.voicing().sound("piano").gain(0.5).room(0.6)
```

### Progressive Techno
```javascript
setcpm(132/4)
$: sound("bd(5,16)").bank("RolandTR909")
$: sound("hh*16").gain("[0.8 0.4]*8").bank("RolandTR909")
$: n("<0 2 4 2> <[5,7] 4>").scale("C:minor")
.sound("sawtooth").lpf(perlin.range(200,600).slow(4))
.gain(0.7)
$: chord("<Cm Fm Ab>").voicing().sound("sawtooth")
.clip(0.2).lpf(800).gain(0.3)
```

## 🎚️ Performance Techniques

### Live Bassline Manipulation
```javascript
// Bassline that evolves
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(300).gain(0.7)
.every(4, x=>x.transpose(7))  // Jump to 7th every 4 cycles
.every(8, x=>x.rev())         // Reverse every 8 cycles
```

### Filter Automation
```javascript
// Automated filter for movement
$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.lpf(sine.range(100,800).slow(8))
.gain(0.7)
```

### Dynamic Chord Changes
```javascript
// Chords that change based on patterns
$: chord("<Cm Fm Ab Eb>/4")
.voicing().sound("sawtooth")
.clip("<0.5 0.2 0.3 0.4>")
.lpf("<600 800 400 700>")
.gain(0.5)
```

## 🎯 Troubleshooting Basslines

### "Bass sounds muddy"
- Use higher filter cutoff: `.lpf(400)`
- Layer with cleaner sub-bass
- Check gain levels

### "Acid bass doesn't squelch"
- Increase resonance: `.lpq(8)`
- Make envelope faster: `.lpenv(-4)`
- Lower filter range

### "Chords sound artificial"
- Use `.voicing()` for natural spread
- Add room reverb: `.room(0.5)`
- Layer with pad sounds

## 🎚️ Bassline-Building Workflow

1. **Choose Scale** - Pick scale that fits your vision
2. **Start with Roots** - Simple sub-bass on root notes
3. **Add Movement** - Introduce scale degree variations
4. **Layer Elements** - Combine bass types for depth
5. **Apply Effects** - Filters, envelopes, automation
6. **Balance Levels** - Ensure bass doesn't overpower kick

## 🎯 Next Steps

You've mastered basslines and harmony! Now you're ready for:

**[→ Advanced Techniques](./05-advanced-techniques.md)** - Complex pattern manipulation and audio effects

**You're now ready to:**
- ✅ Create compelling sub-basslines
- ✅ Master acid bass synthesis
- ✅ Work with scales and chords
- ✅ Layer harmonic content effectively
- ✅ Automate parameters for evolution

## 🎚️ Quick Reference

| Technique | Function | Example |
|-----------|-----------|---------|
| Sub-Bass | `n().sound().lpf()` | `n("0").sound("sawtooth").lpf(200)` |
| Acid Bass | `.lpf().lpenv().lpq()` | `.lpf(sine.range(100,1000)).lpenv(-4).lpq(8)` |
| Scales | `.scale()` | `.scale("C:minor")` |
| Chords | `chord().voicing()` | `chord("Cm").voicing()` |
| Off-Beat | `.off()` | `.off(1/16, transpose(-12))` |

---

*Ready for advanced techniques? Continue to [Advanced Techniques](./05-advanced-techniques.md)!* 🎹