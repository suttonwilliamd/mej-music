# 🎼 Pattern Fundamentals

Mastering Strudel's pattern language is the key to creating compelling techno. This section covers everything from basic sequences to complex rhythmic structures.

## 🎯 Mini-Notation Deep Dive

Mini-notation is Strudel's language for writing patterns concisely. Let's master it systematically.

### Basic Sequences

The foundation is space-separated elements:

```javascript
// Four equal beats
sound("bd sd hh rim")

// Add more beats = faster tempo
sound("bd sd hh rim bd sd hh rim bd sd hh rim")
```

**Key Concept**: All events in a sequence get squished into one cycle (by default, 2 seconds).

### Controlling Sequence Length

Use angle brackets `<>` for consistent timing:

```javascript
// One sound per cycle - tempo stays same
sound("<bd sd hh rim>")
```

This is equivalent to:
```javascript
// Same thing, longer to write
sound("[bd sd hh rim]/4")
```

**Techno Application**:
```javascript
// Reliable 4/4 kick pattern
sound("<bd bd bd bd>")
```

### Speed Control with Multiplication

```javascript
// Speed up entire sequence
sound("<bd sd hh rim>*2")

// Speed up specific elements
sound("bd sd*2 hh rim*4")

// Decimal speed for swing feel
sound("bd sd*1.5 hh rim")
```

### Division for Slower Patterns

```javascript
// Play sequence over multiple cycles
sound("[bd sd hh rim]/2")  // Takes 2 cycles

// Slow techno build-up
sound("<bd ~ sd ~>/8")  // Very slow, one beat per 2 cycles
```

## 🎛️ Advanced Pattern Techniques

### Sub-Sequences (Brackets)

Brackets create nested timing structures:

```javascript
// Basic sub-sequence
sound("bd [hh sd] sd")  // [hh sd] plays in time of one beat

// Deeper nesting
sound("bd [hh [sd rim]] sd")

// Sub-sequences with speed
sound("bd [hh*2 sd] rim")
```

**Techno Example - Classic Snare Fill**:
```javascript
sound("bd [hh sd*2] bd [hh sd*4]")
```

### Parallel Patterns (Commas)

Commas create polyphony - multiple sounds at once:

```javascript
// Kick and hat together
sound("bd*4, hh*8")

// Multiple parallel patterns
sound("bd sd, [hh oh], cp rim")
```

### Elongation (@)

Control how long events last:

```javascript
// Kick lasts 3 beats, hat lasts 1
sound("bd@3 hh bd@3 hh")

// With sub-sequences
sound("[bd@3 hh] sd [hh@2 rim]")
```

**Techno Application - Kick Emphasis**:
```javascript
sound("bd@1.5 ~ sd ~")
```

### Replication (!)

Repeat without speeding up:

```javascript
// Play kick twice, same duration
sound("bd!2 sd")

// Useful for stutter effects
sound("bd!4 sd!2 hh!8")
```

## 🎯 Euclidean Rhythms

Euclidean rhythms are essential for techno - they distribute beats evenly across a pattern.

### Basic Euclidean Syntax

```javascript
// 3 beats in 8 slots (standard kick pattern)
sound("bd(3,8)")

// 5 beats in 16 slots
sound("hh(5,16)")

// With offset
sound("bd(3,8,2)")  // Shift pattern by 2 slots
```

### Classic Techno Euclidean Patterns

**Four-on-the-Floor**:
```javascript
sound("bd(4,4)")  // Same as bd*4
```

**Classic House Kick**:
```javascript
sound("bd(5,16)")  // Syncopated kick
```

**Clave Patterns**:
```javascript
sound("cp(3,8)")  // Pop clave
```

**Complex Polyrhythms**:
```javascript
sound("bd(3,8), hh(5,8)")  // 3 vs 5 polyrhythm
```

## 🎼 Rests and Silence

### Rest Characters

```javascript
// Using tilde
sound("bd ~ sd ~ hh ~ hh ~")

// Using dash
sound("bd - sd - hh - hh -")

// In sub-sequences
sound("bd [~ sd] rim")
```

### Structured Silence

```javascript
// Using rests to create space
sound("[bd ~ ~ ~] [sd ~ sd ~]")

// Ghost notes with low volume
sound("bd sd hh hh").gain("1 0.2 0.8 0.3")
```

## 🎚️ Pattern Modifiers

### Randomness

```javascript
// 50% chance to play
sound("bd sd hh? rim?")

// Custom probability
sound("bd sd hh?0.25 rim?0.75")

// Random choice
sound("bd|sd|hh|rim")  // Choose one randomly
```

### Conditional Modifiers

Sometimes apply effects:

```javascript
// Sometimes add extra speed
sound("bd sd hh").sometimes(ply(2))

// Rarely reverse pattern
sound("bd sd hh").rarely(rev())

// Often add delay
sound("bd sd").often(delay(0.125))
```

## 🎛️ Time-Based Modifiers

### Fast and Slow

```javascript
// Outside mini-notation
sound("bd sd hh").fast(2)

// Multiple speeds
sound("bd sd hh").slow("0.5,1,1.5")

// Speed patterns
sound("bd sd hh").fast("<1 [2 4]>")
```

### Early and Late

Shift patterns in time:

```javascript
// Shift everything earlier
sound("bd sd hh").early(1/8)

// Shift individual patterns
sound("bd sd").late(1/16)
```

## 🎯 Combining Techniques

### Complex Techno Pattern Example

```javascript
// Advanced techno beat
setcpm(130/4)

$: sound("bd(5,16)").bank("RolandTR909")
$: sound("[~ sd](3,8)").bank("RolandTR909")
$: sound("hh*16").sometimes(ply(2)).bank("RolandTR909")
$: sound("cp(3,16)").rarely().bank("RolandTR909")
```

### Progressive Build Pattern

```javascript
// Build from simple to complex
// Layer 1: Basic kick
sound("bd*4")

// Layer 2: Add syncopation  
sound("[bd ~ bd ~] [bd bd ~ ~]")

// Layer 3: Add percussion
sound("[bd ~ bd ~] [bd bd ~ ~], [hh sd]*4")

// Layer 4: Add variation
sound("[bd ~ bd ~] [bd bd ~ ~], [hh sd]*4")
.every(4, x=>x.sometimes(rev()))
```

## 🎼 Pattern Functions Reference

| Function | Purpose | Example |
|----------|---------|---------|
| `rev()` | Reverse pattern | `s("bd sd hh").rev()` |
| `ply(n)` | Speed up n times | `s("bd sd").ply(2)` |
| `off(time, fn)` | Copy and modify | `s("bd").off(1/16, rev)` |
| `every(n, fn)` | Apply every n cycles | `s("bd").every(4, rev)` |
| `sometimes(fn)` | Sometimes apply | `s("bd").sometimes(rev()) |
| `often(fn)` | Often apply | `s("bd").often(delay(0.1)) |
| `rarely(fn)` | Rarely apply | `s("bd").rarely(ply(2))` |

## 🎯 Practice Exercises

### Exercise 1: Create a 16-bar pattern
```javascript
// Create a pattern that takes 16 cycles to complete
sound("<bd sd hh rim bd sd rim>*16")
```

### Exercise 2: Euclidean syncopation
```javascript
// Use Euclidean rhythms for syncopated kick
sound("bd(7,16), hh(5,16)")
```

### Exercise 3: Build complexity
```javascript
// Start simple, add layers
$: sound("bd*4")
$: sound("sd").every(2)
$: sound("hh*8").sometimes(ply(2))
```

## 🎛️ Troubleshooting

### "Pattern is too fast/slow"
- Check if you're using `<>` or not
- Verify multiplication/division
- Consider using `setcpm()` for overall tempo

### "Sub-sequences sound weird"
- Make sure brackets are balanced
- Check nested bracket depth
- Try simpler patterns first

### "Randomness isn't working"
- Verify syntax: `?` for probability, `|` for choice
- Check probability values (0-1)
- Ensure `sometimes()`, `often()`, `rarely()` are correctly placed

## 🎯 Next Steps

You've mastered pattern fundamentals! Now you're ready for:

**[→ Techno Rhythms](./03-techno-rhythms.md)** - Apply these patterns to create compelling techno beats

**You're now ready to:**
- ✅ Write complex rhythmic patterns
- ✅ Use Euclidean rhythms effectively
- ✅ Control timing and probability
- ✅ Combine multiple pattern techniques
- ✅ Build progressive complexity

## 🎚️ Quick Reference Card

| Symbol | Meaning | Example |
|--------|----------|---------|
| `space` | Sequence | `bd sd hh` |
| `[]` | Sub-sequence | `[hh sd]` |
| `<>` | Fixed timing | `<bd sd hh>` |
| `*` | Speed up | `bd*4` |
| `/` | Slow down | `[bd sd]/2` |
| `@` | Elongate | `bd@3` |
| `!` | Replicate | `bd!2` |
| `~` | Rest | `bd ~ sd` |
| `,` | Parallel | `bd, hh*8` |
| `(n,k)` | Euclidean | `bd(3,8)` |
| `?` | Random drop | `hh?` |
| `|` | Random choice | `bd|sd|hh` |

---

*Ready to build proper techno beats? Continue to [Techno Rhythms](./03-techno-rhythms.md)!* 🎹