# Typography System - MCQ Exam Platform

## 🎯 Design Philosophy

**"User যেন UI ভুলে যায়, content-এ focus করে"**

This platform uses a professional, distraction-free typography system designed for:

- Zero distraction during exams
- High readability on mobile & desktop
- Professional SaaS aesthetic (Notion / Stripe / Linear)
- Instant teacher trust

---

## 📦 Font Stack

### Primary Font: **Satoshi**

- **Usage**: All UI, dashboard, exam questions, options, forms, buttons, tables, analytics
- **Weights Used**:
  - `400` (Regular) → Body text, descriptions, normal content
  - `500` (Medium) → Labels, buttons, emphasized text
  - `600` (Semibold) → Warnings, timer, critical alerts

### Display Font: **Clash Display**

- **Usage**: Marketing pages ONLY (landing page, pricing, hero sections)
- **Weights Used**:
  - `600` (Semibold) → Section headings
  - `700` (Bold) → Hero headings

---

## 🚫 Critical Rules

### ❌ NEVER Do This:

- Use Clash Display inside exam-taking UI
- Use font weights 300, 800, or 900
- Mix 3-4 different fonts
- Use display/decorative fonts in exams
- Add custom fonts without approval

### ✅ Always Do This:

- Default to Satoshi everywhere
- Use `font-display` class ONLY on landing page headings
- Keep font weights minimal (400, 500, 600 only)
- Prioritize readability over design

---

## 📐 Typography Usage by Context

### 1️⃣ Exam Pages (Highest Priority)

**Goal**: Zero distraction, maximum focus

```tsx
// Question Text
<CardTitle className="text-lg md:text-xl font-medium leading-relaxed">
  {question.text}
</CardTitle>

// Options (A/B/C/D)
<Label className="text-base font-normal">
  {option.text}
</Label>

// Timer / Warnings
<div className="text-xl font-semibold text-red-600">
  {timeRemaining}
</div>
```

**Font**: Satoshi only  
**Weights**: 400 (options), 500 (questions), 600 (timer/warnings)  
**Sizes**: 16-18px questions, 15-16px options

---

### 2️⃣ Dashboard (Teacher Side)

**Goal**: Serious, professional software

```tsx
// Sidebar / Menu Items
<span className="text-sm font-medium">
  Dashboard
</span>

// Data Tables
<td className="text-sm font-normal">
  {data}
</td>

// Headings
<h2 className="text-2xl font-semibold">
  Exam Analytics
</h2>
```

**Font**: Satoshi only  
**Weights**: 400-500 for data, 600 for headings

---

### 3️⃣ Landing Page (Marketing)

**Goal**: Modern + Trustworthy SaaS vibe

```tsx
// Hero Heading (Use Clash Display)
<h1 className="font-display text-5xl md:text-7xl font-bold">
  Create & Manage Exams
</h1>

// Section Headings (Use Clash Display)
<h2 className="font-display text-4xl md:text-5xl font-bold">
  Everything You Need
</h2>

// Body Text (Use Satoshi)
<p className="text-lg font-normal">
  The most powerful exam platform...
</p>

// Buttons (Use Satoshi)
<Button className="text-lg font-semibold">
  Get Started
</Button>
```

**Hero/Section Headings**: Clash Display (600-700 weight)  
**Everything Else**: Satoshi (400-500 weight)

---

## 🎨 Tailwind Classes Reference

### Font Family

```css
font-sans       → Satoshi (default everywhere)
font-display    → Clash Display (marketing headings only)
```

### Font Weights (Use Sparingly)

```css
font-normal     → 400 (body text, options, descriptions)
font-medium     → 500 (labels, buttons, emphasized text)
font-semibold   → 600 (warnings, timer, headings)
font-bold       → 700 (marketing hero headings with font-display only)
```

### Recommended Sizes

```css
/* Exam UI */
text-base       → 16px (options)
text-lg         → 18px (questions)
text-xl         → 20px (timer)

/* Dashboard */
text-sm         → 14px (labels, menu)
text-base       → 16px (data, content)
text-2xl        → 24px (page headings)

/* Landing Page */
text-5xl        → 48px (section headings)
text-7xl        → 72px (hero heading)
```

---

## 🛠️ Implementation Checklist

- [x] Installed Satoshi (Regular 400, Medium 500, Bold 600)
- [x] Installed Clash Display (Semibold 600, Bold 700)
- [x] Configured Tailwind with `font-sans` and `font-display`
- [x] Set global body font to Satoshi
- [x] Applied `font-display` to landing page headings only
- [x] Verified exam UI uses only Satoshi
- [x] Removed `font-mono` from timer
- [x] Updated question text to `font-medium` (500)
- [x] Ensured options use `font-normal` (400)

---

## 📝 Examples: Good vs Bad

### ✅ GOOD - Exam Question

```tsx
<CardTitle className="text-lg font-medium leading-relaxed">
  What is the capital of France?
</CardTitle>
```

- Uses Satoshi (inherits from body)
- Medium weight (500) for readability
- Comfortable line height
- Appropriate size (text-lg)

### ❌ BAD - Exam Question

```tsx
<h2 className="font-display text-3xl font-bold tracking-tight">
  What is the capital of France?
</h2>
```

- Uses display font (distracting!)
- Too bold for exam content
- Too large and attention-grabbing

---

### ✅ GOOD - Landing Page Hero

```tsx
<h1 className="font-display text-7xl font-bold">
  Create Exams Like Never Before
</h1>
```

- Uses Clash Display (appropriate context)
- Bold weight for impact
- Large size for hero section

### ❌ BAD - Landing Page Hero

```tsx
<h1 className="text-7xl font-normal">Create Exams Like Never Before</h1>
```

- No display font (looks generic)
- Too thin for hero heading
- Lacks visual impact

---

## 🔧 Troubleshooting

### Fonts not loading?

1. Download fonts from [Fontshare](https://www.fontshare.com/)
2. Place `.woff2` files in `public/fonts/`
3. Check file names match exactly in `layout.tsx`

### Fonts looking inconsistent?

- Check if `antialiased` class is applied to body
- Verify CSS variables are set correctly
- Clear browser cache

### Want to add a new font?

**DON'T!** This system is intentionally minimal. Adding more fonts will:

- Increase bundle size
- Create visual inconsistency
- Make the UI look less professional

---

## 📚 Resources

- [Satoshi Font](https://www.fontshare.com/fonts/satoshi) - Free from Fontshare
- [Clash Display Font](https://www.fontshare.com/fonts/clash-display) - Free from Fontshare
- [Font Download Guide](../public/fonts/README.md)

---

## 🎓 Senior Product Advice

> **"কম মানে বেশি professional"**

Professional products don't need fancy fonts. They need:

1. **Consistency** - Same font everywhere
2. **Hierarchy** - Clear size and weight differences
3. **Readability** - Comfortable line heights and spacing
4. **Trust** - Users focus on content, not typography

Satoshi achieves all of this perfectly. Keep it simple.
