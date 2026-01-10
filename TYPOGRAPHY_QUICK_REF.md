# 🎨 Typography Quick Reference Card

## Font Classes

```jsx
// DEFAULT (inherits Satoshi automatically)
<p>Normal text</p>

// MARKETING HEADINGS ONLY
<h1 className="font-display">Hero Heading</h1>
```

## Font Weights

```jsx
font - normal; // 400 → Body text, options
font - medium; // 500 → Labels, buttons, questions
font - semibold; // 600 → Warnings, timer, emphasis
font - bold; // 700 → Marketing hero (with font-display)
```

## Common Patterns

### Exam Question

```jsx
<CardTitle className="text-lg md:text-xl font-medium leading-relaxed">
  {question.text}
</CardTitle>
```

### Exam Option

```jsx
<Label className="text-base font-normal">{option.text}</Label>
```

### Timer

```jsx
<div className="text-xl font-semibold text-red-600">{time}</div>
```

### Landing Page Hero

```jsx
<h1 className="font-display text-5xl md:text-7xl font-bold">Create Exams</h1>
```

### Button

```jsx
<Button className="text-base font-semibold">Get Started</Button>
```

## ⚠️ Remember

- ❌ NO `font-display` in exam UI
- ❌ NO font-mono anywhere
- ❌ NO font weights 300, 800, 900
- ✅ Use Satoshi by default
- ✅ Use font-display only on marketing pages
- ✅ Keep it minimal and consistent

## File Locations

- Fonts: `public/fonts/*.woff2`
- Config: `src/app/layout.tsx`
- Styles: `src/app/globals.css`
- Guide: `TYPOGRAPHY_GUIDE.md`
