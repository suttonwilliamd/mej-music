# 🎛️ Complete Templates & Examples

This section provides complete, production-ready templates for various techno subgenres. Each template is fully functional and can be used as-is or modified for your own productions.

## 🎯 Minimal Techno Template

**Characteristics**: Simple, hypnotic, focused on groove

```javascript
// Minimal Techno - 125 BPM
setcpm(125/4)

// Core rhythm
$: sound("bd*4").bank("RolandTR909").gain(1.2)

// Hi-hats with subtle variation
$: sound("hh*16").bank("RolandTR909")
.gain("[0.7 0.5 0.8 0.5]*4")

// Simple sub-bass
$: n("0 0 0 0").sound("sawtooth")
.lpf(180).gain(0.8)

// Occasional clap
$: sound("cp(5,16)").bank("RolandTR909")
.rarely().gain(0.6)

// Slow evolution
.every(16, x=>x.sometimes(ply(2)))
```

**Performance Tips**:
- Add/remove clap by commenting/uncommenting
- Modify bassline with scale changes
- Add occasional percussion fills with `.every(8)`

---

## 🎸 Acid Techno Template

**Characteristics**: TB-303 style, squelchy, driving

```javascript
// Acid Techno - 140 BPM
setcpm(140/4)

// Driving kick pattern
$: sound("bd*4 [bd bd]").bank("RolandTR909")

// Energetic hi-hats
$: sound("hh*16").bank("RolandTR909")
.sometimes(ply(2)).gain(0.7)

// Classic acid bassline
$: n("0 2 1 0 3 1 2 0").sound("sawtooth")
.lpf(sine.range(100,1000).slow(4))
.lpenv(-4).lpq(12)
.gain(0.8)

// Acid chord stabs
$: chord("<Cm Fm>").voicing().sound("sawtooth")
.clip(0.15).lpf(1500)
.every(2, x=>x.transpose(irand([0,5])))

// Rimshot accents
$: sound("rim*4").bank("RolandTR909")
.rarely(ply(2)).gain(0.6)
```

**Performance Tips**:
- Adjust `lpenv` for faster/slower filter
- Modify `lpq` for more/less squelch
- Change bassline notes for different melodies
- Add `.every(8, rev())` for variation

---

## 🏠 Deep House Template

**Characteristics**: Soulful, chordal, groovy, 120 BPM

```javascript
// Deep House - 120 BPM
setcpm(120/4)

// Solid kick
$: sound("bd*4").bank("RolandTR909").gain(1.0)

// Swing hi-hats
$: sound("[hh@3 hh@1]*4").bank("RolandTR909")
.gain(0.6)

// Groovy bassline
$: n("0 2 4 2 <[5,7] 4>").scale("C:minor")
.sound("square").lpf(300).gain(0.7)

// Soulful chords
$: chord("<Cm7 Fm7 Abmaj7 Eb7>*2")
.voicing().sound("piano")
.gain(0.4).room(0.5)

// Percussion
$: sound("cb(3,8)").bank("RolandTR909")
.gain(0.3)
$: sound("sh(5,16)").bank("RolandTR909")
.gain(0.2)
```

**Performance Tips**:
- Change chord progression for different moods
- Add `.room()` for more reverb on chords
- Modify swing feel with elongation values
- Layer different drum machines

---

## 🏭 Industrial Techno Template

**Characteristics**: Harsh, mechanical, distorted

```javascript
// Industrial Techno - 150 BPM
setcpm(150/4)

// Heavy kick
$: sound("bd*4").bank("AkaiLinn")
.gain(1.5).lpf(60)

// Aggressive percussion
$: sound("hh*16").bank("AkaiLinn")
.sometimes(ply(4)).gain(0.8)

// Distorted bass
$: n("0 0 2 0").scale("C:minor").sound("sawtooth")
.lpf(200).drive(3).gain(0.9)

// Mechanical sounds
$: sound("sd rim sd rim").bank("AkaiLinn")
.gain(0.7)

// Noise elements
$: sound("perc*8").bank("AkaiLinn")
.rarely(ply(2)).gain(0.5)
```

**Performance Tips**:
- Increase `drive` for more distortion
- Use TR-808 kicks for sub-bass reinforcement
- Add `.every(4, rev())` for variation
- Layer with noise textures

---

## 🌊 Ambient Techno Template

**Characteristics**: Atmospheric, evolving, textural

```javascript
// Ambient Techno - 110 BPM
setcpm(110/4)

// Subtle kick
$: sound("bd*4").bank("RolandTR808")
.gain(0.8).room(0.4)

// Atmospheric pads
$: chord("<Cm Fm Ab>").voicing().sound("sawtooth")
.lpf(800).room(0.8).gain(0.5)

// Evolving bass
$: n("0 2 4 2").scale("C:minor").sound("triangle")
.lpf(perlin.range(150,400).slow(8))
.gain(perlin.range(0.4,0.7).slow(16))

// Textural percussion
$: sound("hh*16").bank("RolandTR808")
.gain(perlin.range(0.1,0.4).slow(8))

// Melodic fragments
$: n("<0 2 4> <[5,7] 4>").scale("C:minor:pentatonic")
.sound("triangle").lpf(1200)
.gain(0.3).room(0.6)
.sometimes(rev())
```

**Performance Tips**:
- Slowly increase gain for builds
- Use `.room()` for atmospheric space
- Add field recordings with custom samples
- Modify perlin speed for evolution rate

---

## 🎯 Progressive Techno Template

**Characteristics**: Building tension, complex layers, evolving

```javascript
// Progressive Techno - 135 BPM
setcpm(135/4)

// Complex kick pattern
$: sound("bd(7,16)").bank("RolandTR909")

// Layered hi-hats
$: sound("hh*16").bank("RolandTR909")
.gain("[0.8 0.4 0.6 0.4]*4")

$: sound("hh*16").bank("RolandTR909")
.speed("<1 1.5 2 1>").gain(0.3)

// Evolving bassline
$: n("<0 2 4 2> <[5,7] 4>").scale("C:minor")
.sound("sawtooth")
.lpf(sine.range(200,1000).slow(16))
.gain(0.7)

// Building chords
$: chord("<Cm Fm Ab>").voicing().sound("sawtooth")
.clip("<0.5 0.3 0.4 0.6>")
.lpf("<600 800 400 1200>")
.gain(0.4)

// Percussion build
$: sound("cp*8").bank("RolandTR909")
.every(8, x=>x.ply(2))
.gain(0.5)

// Melodic elements
$: n(run(8).scale("C:minor")).sound("triangle")
.lpf(1500).gain(0.4)
.sometimesBy(0.3, rev())
```

**Performance Tips**:
- Use `.every()` for progressive changes
- Layer multiple chord patterns
- Add fills every 16-32 bars
- Automate filter ranges

---

## 🎲 Generative Techno System

**Characteristics**: Self-generating, unpredictable, evolving

```javascript
// Generative Techno - 130 BPM
setcpm(130/4)

// Generative rhythm
$: sound("bd(5,16)").bank("RolandTR909")

$: sound("hh*16").bank("RolandTR909")
.mask(perlin.range(0,1).slow(16))
.sometimes(ply(2))

$: sound("sd(3,8)").bank("RolandTR909")
.rarely(ply(2))

// Evolving bass
$: n("<0 2 4> <[5,7] 4>").scale("C:minor")
.sound("sawtooth")
.lpf(perlin.range(200,800).slow(8))
.every(4, x=>x.transpose(irand([0,-12])))

// Generative melody
$: n(irand([0,2,4,5,7]).scale("C:minor")).sound("triangle")
.lpf(perlin.range(800,2000).slow(4))
.gain(0.5)

// Random chord changes
$: chord("<Cm Fm Ab Eb>/4")
.voicing().sound("sawtooth")
.clip(0.2).gain(0.3)
.every(8, x=>x.sometimes(rev()))
```

---

## 🎚️ Template Modifications

### Changing Tempo
```javascript
// For any template, modify this line:
setcpm(YOUR_BPM/4)  // Replace YOUR_BPM with desired tempo
```

### Changing Key/Scales
```javascript
// For basslines and melodies:
.scale("C:minor")      // Minor
.scale("D:major")      // Major  
.scale("F:dorian")     // Dorian mode
.scale("G:mixolydian") // Mixolydian
.scale("A:minor:pentatonic") // Minor pentatonic
```

### Switching Drum Machines
```javascript
// Replace bank names for different sounds:
.bank("RolandTR909")  // House/Techno classic
.bank("RolandTR808")  // Deep/Bass-heavy
.bank("AkaiLinn")     // Industrial/Harsh
.bank("RhythmAce")    // Vintage/Lo-fi
```

### Adding Custom Samples
```javascript
// Load custom sounds
samples('github:your-username/your-samples')
$: sound("custom_kick*4")  // Your sample names
$: sound("custom_hh*16")
```

---

## 🎯 Performance-Ready Patterns

### Build Progression
```javascript
// 32-bar build structure
// Bars 1-8: Simple
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")

// Bars 9-16: Add layer (uncomment)
// $: sound("sd*2").bank("RolandTR909")

// Bars 17-24: Add complexity (uncomment)
// $: sound("hh*16").bank("RolandTR909").sometimes(ply(2))

// Bars 25-32: Full pattern (uncomment)
// $: sound("cp(5,16)").bank("RolandTR909")
```

### Drop Section
```javascript
// Impactful drop pattern
$: sound("bd*4").bank("RolandTR909").gain(1.5)
$: sound("hh*16").bank("RolandTR909").gain(0.9)
$: sound("sd*2").bank("RolandTR909").gain(1.2)
$: sound("cp*8").bank("RolandTR909")
```

### Break Section
```javascript
// Breakdown for tension
$: sound("bd*2").bank("RolandTR909").gain(0.6)
$: sound("hh*8").bank("RolandTR909").gain(0.3)
$: chord("<Cm Fm Ab>").voicing().sound("sawtooth")
.gain(0.6).room(0.8)
```

---

## 🎛️ Live Performance Tips

### Mute/Unmute Strategy
```javascript
// Start with all patterns muted (//)
$: // sound("bd*4").bank("RolandTR909")
$: // sound("hh*16").bank("RolandTR909")  
$: // sound("sd*2").bank("RolandTR909")

// Unmute one by one during performance
```

### Gradual Introduction
```javascript
// Fade in elements
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
.gain(sine.range(0,0.8).slow(8))

$: n("0 2 4 2").scale("C:minor").sound("sawtooth")
.gain(sine.range(0,0.7).slow(8).phase(0.25))
```

### Emergency Fallback
```javascript
// Simple beat to return to
setcpm(130/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*16").bank("RolandTR909")
```

---

## 🎚️ Template Customization Guide

### Make It Yours
1. **Change Tempo**: Adjust `setcpm()` value
2. **Modify Key**: Change scale names in `.scale()`
3. **Swap Sounds**: Change `.bank()` names
4. **Add Effects**: Add `.room()`, `.delay()`, `.drive()`
5. **Create Variation**: Use `.sometimes()`, `.every()`

### Layer Addition Strategy
1. **Foundation**: Kick + basic hats
2. **Groove**: Add syncopation  
3. **Harmony**: Bassline + chords
4. **Texture**: Percussion + effects
5. **Evolution**: Automation + variation

### Performance Readiness
1. **Save working versions** of each template
2. **Practice muting/unmuting** sections
3. **Know your emergency patterns**
4. **Test effect ranges** before performing
5. **Prepare build/release structures**

---

## 🎯 Next Steps

You have complete templates! Now learn to perform:

**[→ Live Performance](./07-live-performance.md)** - Master the art of live-coded performance

**You're now ready to:**
- ✅ Use complete techno templates
- ✅ Customize for different subgenres
- ✅ Build tracks progressively
- ✅ Create performance-ready patterns
- ✅ Mix and match techniques

---

## 🎚️ Template Quick Reference

| Genre | BPM | Key Features | Drum Bank |
|--------|------|--------------|-------------|
| Minimal | 125 | Simple, hypnotic | TR-909 |
| Acid | 140 | TB-303 style | TR-909 |
| Deep House | 120 | Chordal, soulful | TR-909 |
| Industrial | 150 | Harsh, distorted | AkaiLinn |
| Ambient | 110 | Atmospheric | TR-808 |
| Progressive | 135 | Building, complex | TR-909 |

---

*Ready to perform live? Continue to [Live Performance](./07-live-performance.md)!* 🎹