# AEVIC Esports Homepage - Updated Design

## Overview

The homepage has been completely redesigned with a premium PUBG Mobile esports aesthetic, featuring the AEVIC brand identity with gold (#F3C450) and purple (#6A1B9A) colors throughout.

## Key Features Implemented

### 1. **Hero Section**
- Large animated phoenix SVG with breathing animation
- Gradient text effect on "ESPORTS" (gold → purple)
- Kicker text with accent marker
- Compelling value proposition description
- Two CTA buttons (Register & Leaderboard)
- Animated particle effects in background
- Upcoming Tournament card with countdown timer (positioned right)

### 2. **Stats Bar**
- 4 key metrics with icons:
  - 128+ Teams
  - 512+ Players  
  - 24+ Tournaments
  - 50K₼ Total Prize Pool
- Responsive grid layout with hover effects

### 3. **Featured Tournaments Section**
- 3 tournament cards with:
  - Status badges (REGISTRATION OPEN / SOON)
  - Tournament name and map info
  - Date, team count, prize pool
  - Hover animations with glow effects

### 4. **Why AEVIC? Section**
- 4 value proposition cards:
  - Fair Competition (Ədalətli Rəqabət)
  - Transparent Registration (Şəffaf Qeydiyyat)
  - Active Support (Aktiv Dəstək)
  - Real Rewards (Real Mükafatlar)
- Each with icon, title, and description

### 5. **How It Works Section**
- 4-step process:
  1. Register (Qeydiyyat)
  2. Verify (Təsdiq)
  3. Room Code (Room Kodu)
  4. Play (Oyna)
- Arrow connectors between steps
- Hover animations on cards

### 6. **Three Column Section**
- **Upcoming Matches**: Team schedule with times
- **Leaderboard Preview**: Top 5 teams with points
- **Join Us CTA**: Rocket emoji and call-to-action button

### 7. **Follow Us Section**
- Social media links with icons:
  - 📱 Instagram
  - 🎵 TikTok
  - 💬 Discord
- Hover animations on link cards

### 8. **Design System**
- **Colors**: 
  - Primary Gold: #F3C450
  - Secondary Purple: #6A1B9A
  - Dark Background: #0D0D0D
- **Fonts**:
  - Headings: Orbitron (bold, gaming aesthetic)
  - Body: Raleway (readable, modern)
  - Mono: JetBrains Mono (data/stats)
- **Animations**: Subtle fade-in, slide-up, and scale effects using Framer Motion

## File Structure

```
src/pages/
├── HomePage.tsx       # Main component with all sections
└── HomePage.css       # Styling for all homepage elements
```

## Component Architecture

Each section is well-organized and uses:
- **Motion components** from Framer Motion for smooth animations
- **Semantic HTML** for accessibility
- **CSS Grid and Flexbox** for responsive layouts
- **CSS variables** for consistent theming

## Responsive Design

All sections adapt beautifully to mobile screens:
- Hero section shrinks phoenix animation
- Tournament cards and stats stack vertically
- Three-column section becomes single column
- Touch-friendly button sizes maintained

## Customization Guide

### Replace Placeholder Data

The following need to be connected to real data:
- **Countdown Timer** - Currently uses `<CountdownTimer />` component
- **Tournament Cards** - Replace with actual tournament data
- **Leaderboard** - Connect to real team standings
- **Upcoming Matches** - Link to live schedule

### Add Real Links

Update these placeholder links:
- `/qeydiyyat` - Registration page
- `/liderlik` - Leaderboard page
- Social media links in "Follow Us" section

### Styling Customization

All styling uses CSS variables from `globals.css`:
```css
--color-gold: #F3C450
--color-purple: #6A1B9A
--color-bg: #0D0D0D
--color-surface-elevated: #1A1A1A
--font-heading: 'Orbitron'
--font-body: 'Raleway'
```

## Performance Notes

- Phoenix SVG is optimized with filters
- Animations use GPU acceleration (transforms/opacity)
- Particle effects are minimal (6 particles) for performance
- All sections use viewport-triggered animations (no scroll-jacking)

## Browser Compatibility

Tested and working on:
- Modern Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Next Steps

1. **Connect Real Data**:
   - Replace tournament data with API calls
   - Update leaderboard with live standings
   - Connect countdown to actual tournament start times

2. **Add Analytics**:
   - Track button clicks (Register, Leaderboard)
   - Monitor section engagement with scroll tracking

3. **Performance Optimization**:
   - Lazy load images for tournament cards
   - Consider code splitting for large page

4. **SEO Optimization**:
   - Update meta descriptions in layout.tsx
   - Add structured data for tournaments
   - Optimize image alt text

## Design Inspiration

The design follows esports best practices:
- Dark theme (reduces eye strain in competitive gaming)
- Gold accents (premium, reward feeling)
- Purple secondary (energy, action)
- Clean typography hierarchy
- Minimal animations (no distraction from content)

---

Created with v0.dev for AEVIC Esports PUBG Mobile Tournament Platform
