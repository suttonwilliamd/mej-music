# 🥁 Techno Rhythms

Now we apply pattern fundamentals to create authentic techno beats. This section covers kick patterns, hi-hat techniques, and percussion elements that form the foundation of techno production.

## 🎯 The Four-on-the-Floor Foundation

Techno is built on the iconic four-to-the-floor kick drum:

```javascript
// Basic 4x4 kick
setcpm(130/4)
sound("bd*4").bank("RolandTR909")
```

**Why four-on-the-floor?**
- Creates driving, danceable rhythm
- Solid foundation for layering
- Psychological effect on dancers

## 🥁 Essential Kick Drum Techniques

### Straight Four-on-the-Floor
```javascript
// Classic techno kick
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### Syncopated Kicks
```javascript
// Add syncopation with Euclidean rhythms
$: sound("bd(5,16)").bank("RolandTR909")  // 5 kicks in 16 slots
$: sound("hh*16").bank("RolandTR909")
```

### Off-Beat Kick Accents
```javascript
// Kick pattern with off-beat emphasis
$: sound("bd bd bd@0.5 ~").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### Double Kick Variations
```javascript
// Add double kicks for drive
$: sound("bd*4 [bd bd]").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

## 🎩 Hi-Hat Mastery

Hi-hats provide the rhythmic energy and texture in techno.

### Basic 16th Notes
```javascript
// Continuous 16th notes
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### Off-Beat Hi-Hats
```javascript
// Hi-hats on off-beats only
$: sound("bd*4").bank("RolandTR909")
$: sound("~ hh ~ hh ~ hh ~ hh").bank("RolandTR909")
```

### Shuffle Patterns
```javascript
// Using elongation for shuffle
$: sound("bd*4").bank("RolandTR909")
$: sound("hh@3 hh@1*4").bank("RolandTR909")
```

### Dynamic Hi-Hats
```javascript
// Volume variation for groove
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").gain("[0.8 0.4 0.6 0.4]*4").bank("RolandTR909")
```

### Open/Closed Combinations
```javascript
// Mix open and closed hats
$: sound("bd*4").bank("RolandTR909")
$: sound("[hh oh]*4").bank("RolandTR909")
```

## 🎯 Snare and Clap Techniques

### Classic 2 and 4
```javascript
// Snare on beats 2 and 4
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("~ sd ~ sd").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### Clap Backbeat
```javascript
// Claps instead of snares
$: sound("bd*4").bank("RolandTR909")
$: sound("~ cp ~ cp").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

### Snare Roll Fills
```javascript
// Add snare rolls periodically
$: sound("bd*4").bank("RolandTR909")
$: sound("~ sd ~ sd").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("[sd*8]").every(8).bank("RolandTR909")  // Fill every 8 cycles
```

### Layered Snare/Clap
```javascript
// Combine snare and clap for power
$: sound("bd*4").bank("RolandTR909")
$: sound("~ [sd,cp] ~ [sd,cp]").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

## 🔨 Percussion Elements

### Rimshot Accents
```javascript
// Add rimshots for drive
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("~ sd ~ sd").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("rim*4").bank("RolandTR909")
```

### Cowbell Patterns
```javascript
// Cowbell for percussive texture
$: sound("bd*4").bank("RolandTR909")
$: sound("~ sd ~ sd").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("cb(3,8)").bank("RolandTR909")  // Euclidean cowbell
```

### Tom Fills
```javascript
// Add tom fills for variation
$: sound("bd*4").bank("RolandTR909")
$: sound("~ sd ~ sd").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("[lt mt ht]").every(4).bank("RolandTR909")
```

## 🎚️ Advanced Rhythm Techniques

### Polyrhythms
```javascript
// 3 against 4 polyrhythm
$: sound("bd(3,4)").bank("RolandTR909")  // 3 kicks
$: sound("hh*4").bank("RolandTR909")     // 4 hats
```

### Polymeter
```javascript
// Different bar lengths, same tempo
$: sound("<bd sd hh rim>*4")  // 4-bar pattern
$: sound("[bd sd]*8")          // 2-bar pattern
```

### Cross-Rhythms
```javascript
// Complex cross-rhythms
$: sound("bd(5,8)").bank("RolandTR909")
$: sound("hh(7,8)").bank("RolandTR909")
$: sound("cp(3,4)").bank("RolandTR909")
```

## 🎛️ Sound Bank Variations

### TR-909 (House/Techno)
```javascript
// Classic TR-909 sound
sound("bd*4, ~ sd*2, hh*16").bank("RolandTR909")
```

### TR-808 (Deep/Minimal)
```javascript
// Deep TR-808 sound
sound("bd*4, ~ sd*2, hh*16").bank("RolandTR808")
```

### AkaiLinn (Industrial)
```javascript
// Harsh industrial sound
sound("bd*4, ~ sd*2, hh*16").bank("AkaiLinn")
```

### Mixed Banks
```javascript
// Combine different machines
$: sound("bd*4").bank("RolandTR909")     // 909 kick
$: sound("~ sd*2").bank("RolandTR808")      // 808 snare  
$: sound("hh*16").bank("AkaiLinn")        // Akai hats
```

## 🎯 Complete Beat Examples

### Minimal Techno Beat
```javascript
setcpm(125/4)
$: sound("bd*4").bank("RolandTR909").gain(1.2)
$: sound("hh*16").bank("RolandTR909").gain(0.6)
$: sound("sd*2").bank("RolandTR909").gain(0.8)
```

### Driving Techno Beat
```javascript
setcpm(135/4)
$: sound("bd(7,16)").bank("RolandTR909")  // Syncopated kicks
$: sound("hh*16").bank("RolandTR909").gain("[0.8 0.4]*8")
$: sound("sd(3,8)").bank("RolandTR909")    // Euclidean snares
$: sound("cp(5,16)").bank("RolandTR909")   // Sparse claps
```

### Acid Techno Pattern
```javascript
setcpm(140/4)
$: sound("bd*4 [bd bd]").bank("RolandTR909")  // Double kicks
$: sound("hh*16").sometimes(ply(2)).bank("RolandTR909")
$: sound("sd*2").every(4, rev()).bank("RolandTR909")
$: sound("cp*4").rarely().bank("RolandTR909")
```

### Industrial Techno
```javascript
setcpm(150/4)
$: sound("bd*4").bank("AkaiLinn").gain(1.5)
$: sound("hh*16").sometimes(ply(4)).bank("AkaiLinn")
$: sound("sd rim sd rim").bank("AkaiLinn").gain(0.8)
$: sound("cp*8").bank("AkaiLinn")
```

## 🎚️ Performance Techniques

### Live Beat Building

Start simple and add layers:
```javascript
// Layer 1: Foundation
$: sound("bd*4").bank("RolandTR909")

// Layer 2: Add hats (uncomment to add)
// $: sound("hh*16").bank("RolandTR909")

// Layer 3: Add backbeat (uncomment to add)
// $: sound("~ sd ~ sd").bank("RolandTR909")

// Layer 4: Add percussion (uncomment to add)
// $: sound("cp(5,16)").bank("RolandTR909")
```

### Evolution Over Time
```javascript
// Patterns that evolve
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16")
.every(8, x=>x.sometimes(ply(2)))
.every(16, x=>x.sometimes(rev()))
.bank("RolandTR909")
$: sound("sd*2").bank("RolandTR909")
.every(4, x=>x.rarely(ply(4)))
```

### Fill Automation
```javascript
// Automatic fills every 4 bars
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
$: sound("sd*2").bank("RolandTR909")
$: sound("[sd*4] [sd*8]").every(4).bank("RolandTR909")
```

## 🎯 Troubleshooting Beats

### "Beat doesn't groove"
- Check velocity with `.gain()`
- Add shuffle with elongation
- Use Euclidean rhythms for syncopation

### "Kick sounds weak"
- Try different drum banks
- Layer multiple kicks
- Add slight pitch variation

### "Hats are too busy"
- Use rests to create space
- Reduce frequency with `*8` instead of `*16`
- Add volume variation

## 🎚️ Beat-Building Workflow

1. **Start with Kick** - Get the 4x4 foundation
2. **Add Hi-Hats** - Provide rhythmic energy
3. **Introduce Backbeat** - Snare or clap on 2 and 4
4. **Layer Percussion** - Rim, cowbell, toms for texture
5. **Add Variation** - Use probability and evolution
6. **Fine-tune Dynamics** - Balance volumes and accents

## 🎯 Next Steps

You've mastered techno rhythm construction! Now you're ready for:

**[→ Basslines & Harmony](./04-basslines-harmony.md)** - Add basslines and harmonic content to your beats

**You're now ready to:**
- ✅ Create authentic techno beats
- ✅ Master kick, hi-hat, and percussion techniques
- ✅ Use different drum machine characteristics
- ✅ Build beats progressively
- ✅ Create evolving, live-coded patterns

## 🎚️ Quick Reference

| Element | Basic Pattern | Advanced Variation |
|---------|----------------|-------------------|
| Kick | `bd*4` | `bd(5,16)` |
| Hi-Hats | `hh*16` | `[hh@3 hh@1]*4` |
| Snare | `~ sd ~ sd` | `sd(3,8)` |
| Clap | `~ cp ~ cp` | `cp(5,16)` |
| Rim | `rim*4` | `rim(3,8)` |

---

*Ready to add basslines? Continue to [Basslines & Harmony](./04-basslines-harmony.md)!* 🎹