# 🎹 Getting Started with Strudel

Welcome to the world of live-coded techno production! This guide will take you from zero experience to creating your first techno patterns using Strudel.

## 🎯 What is Strudel?

Strudel is a JavaScript-based live coding environment for music. Think of it as a programmable sequencer where you write code to create patterns instead of clicking notes on a piano roll.

**Why Strudel for Techno?**
- ✅ **Instant Feedback**: Changes happen immediately
- ✅ **Pattern-Based**: Perfect for repetitive, groove-based music
- ✅ **Minimal Setup**: Just your browser needed
- ✅ **Performance Ready**: Designed for live coding

## 🚀 Your First Step: The REPL

Open [strudel.cc](https://strudel.cc/) in your browser. You'll see:

```
// Type your code here
sound("casio")
```

**Basic Controls:**
- `Ctrl + Enter` - Play your pattern
- `Ctrl + .` - Stop all patterns
- `Ctrl + /` - Comment/uncomment line

## 👆 Your First Pattern

Let's create your first techno beat:

```javascript
// Classic 4x4 kick drum
sound("bd*4")
```

**Try it:**
1. Click in the text area
2. Type `sound("bd*4")`
3. Press `Ctrl + Enter`
4. Listen to that kick!

**What's happening?**
- `bd` = bass drum
- `*4` = play 4 times per cycle (the basic time unit)

## 🎚️ Understanding Sound Banks

Strudel comes with classic drum machine sounds. Let's use a TR-909:

```javascript
// TR-909 classic house pattern
sound("bd*4, [~ sd]*2, [~ hh]*4").bank("RolandTR909")
```

**Essential Drum Sounds:**
- `bd` = Bass Drum
- `sd` = Snare Drum  
- `hh` = Hi-Hat
- `cp` = Clap
- `rim` = Rimshot
- `oh` = Open Hi-Hat

## ⏱️ Controlling Tempo

Techno needs the right tempo. Use `setcpm()`:

```javascript
// 120 BPM in 4/4 time
setcpm(120/4)

sound("bd*4, [~ sd]*2, [~ hh]*4").bank("RolandTR909")
```

**Common Techno Tempos:**
- Minimal: 120-125 BPM
- Techno: 125-135 BPM  
- Hard Techno: 135-150 BPM

## 🎵 Your First Complete Beat

Let's build a proper techno beat:

```javascript
// Set tempo for minimal techno
setcpm(125/4)

// Kick, snare, hats pattern
sound("bd*4, [~ sd]*2, [~ hh]*4").bank("RolandTR909")
```

**Breaking it down:**
- `bd*4` = Four kicks per bar (4x4 pattern)
- `[~ sd]*2` = Two snares with rests
- `[~ hh]*4` = Four hi-hats with rests

## 🎯 Mini-Notation Basics

Strudel uses "mini-notation" for patterns:

### Sequences (spaces)
```javascript
sound("bd sd sd hh")  // Plays each sound equally
```

### Rests (~ or -)
```javascript
sound("bd ~ sd ~ hh")  // ~ creates silence
```

### Sub-sequences (brackets)
```javascript
sound("bd [hh sd] sd")  // [hh sd] plays in time of one beat
```

### Parallel (commas)
```javascript
sound("bd sd, hh*8")  // Kick/snare and hats play together
```

### Speed control (*)
```javascript
sound("bd hh*2 sd")  // hh plays twice as fast
```

## 🔄 Practice Exercises

### Exercise 1: Basic Rhythm
```javascript
// Create a pattern with kick on beats 1,3
sound("bd ~ bd ~")
```

### Exercise 2: Add Percussion
```javascript
// Add hi-hats to the previous pattern
sound("bd ~ bd ~, hh*4")
```

### Exercise 3: Make It Techno
```javascript
// Use TR-909 sounds with proper tempo
setcpm(130/4)
sound("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")
```

## 🎚️ Volume and Dynamics

Techno needs dynamics. Use `.gain()`:

```javascript
sound("bd*4, [~ sd]*2, hh*8")
.gain("0.8 0.7 0.5")  // Different volumes for each sound
.bank("RolandTR909")
```

## 🎵 Multiple Patterns with $:

Use `$:` to play multiple patterns at once:

```javascript
setcpm(125/4)

$: sound("bd*4").bank("RolandTR909")
$: sound("[~ sd]*2").bank("RolandTR909")  
$: sound("hh*8").bank("RolandTR909")
```

**Why use $?:**
- Independent control of each pattern
- Easy to mute/unmute (add `//` to mute)
- Cleaner organization

## 🎛️ Your First Live Performance Trick

Try modifying patterns while they play:

```javascript
// Start with this
setcpm(125/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*8").bank("RolandTR909")

// Now try changing hi-hats while it plays!
// hh*8 -> hh*16 -> hh*4 -> [hh hh] hh*4
```

## 🎯 Essential First Patterns

### Minimal Techno Foundation
```javascript
setcpm(120/4)
$: sound("bd*4").bank("RolandTR909")
$: sound("hh*8").bank("RolandTR909")
```

### Classic House Beat
```javascript
setcpm(128/4)
sound("bd*4, [~ sd]*2, [~ hh]*4").bank("RolandTR909")
```

### Basic 4x4 Techno
```javascript
setcpm(135/4)
sound("bd*4, [~ sd]*2, hh*16").bank("RolandTR909")
```

## 🎚️ Troubleshooting Common Issues

### "Nothing is playing!"
- Check you pressed `Ctrl + Enter`
- Make sure sound is not muted
- Try a simple pattern: `sound("bd")`

### "Sounds are loading slowly"
- First time loading samples takes a moment
- Let patterns play for a few seconds

### "Pattern sounds weird"
- Check your mini-notation syntax
- Make sure brackets are balanced
- Try with fewer elements first

## 🎯 Next Steps

Congratulations! You've created your first techno patterns in Strudel. Next up:

**[→ Pattern Fundamentals](./02-pattern-fundamentals.md)** - Master mini-notation and pattern creation

**You're now ready to:**
- ✅ Create basic techno beats
- ✅ Control tempo and volume
- ✅ Use classic drum machine sounds
- ✅ Understand basic mini-notation
- ✅ Modify patterns in real-time

## 🎧 Quick Reference

| Code | What it does | Example |
|------|---------------|---------|
| `s("sound")` | Play a sound | `s("bd")` |
| `bank("name")` | Choose drum machine | `.bank("RolandTR909")` |
| `setcpm(bpm/4)` | Set tempo | `setcpm(130/4)` |
| `$:` | Play multiple patterns | `$: s("bd")` |
| `.gain(num)` | Set volume | `.gain(0.8)` |
| `~` | Rest/silence | `s("bd ~ bd")` |
| `*4` | Repeat 4 times | `s("bd*4")` |

---

*Ready to master the pattern language? Continue to [Pattern Fundamentals](./02-pattern-fundamentals.md)!* 🎶