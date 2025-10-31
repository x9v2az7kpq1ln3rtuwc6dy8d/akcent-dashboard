# Akcent Dashboard - Design Guidelines

## Design Approach
**System Selected**: Custom Dark Gaming/Tech Aesthetic
The Akcent Dashboard uses a cyberpunk-inspired dark theme with neon accents, drawing from gaming dashboard aesthetics (Discord, Steam) combined with modern SaaS admin panels (Vercel, Linear).

## Core Design Elements

### A. Color Palette (User-Specified)
- **Background**: Radial gradient from `#0b0c10` (darkest) to `#1f2833` (dark blue-gray)
- **Surface/Cards**: `#1f2833` with subtle inner glow effect
- **Primary Text**: `#c5c6c7` (light gray)
- **Primary Accent**: `#66fcf1` (neon blue/cyan)
- **Hover State**: `#45a29e` (teal)
- **Secondary Accent**: Purple tones for highlights and active states

### B. Typography
- **Font Families**: Inter (body) + Poppins (headings)
- **Hierarchy**:
  - Page Titles: Poppins Bold, 2xl-3xl
  - Section Headers: Poppins SemiBold, xl-2xl
  - Body Text: Inter Regular, base-lg
  - Labels/Metadata: Inter Medium, sm-base
  - Monospace for codes: `font-mono` for invite codes and IDs

### C. Layout System
**Spacing Scale**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Consistent card padding: `p-6` to `p-8`
- Section spacing: `space-y-6` to `space-y-8`
- Form field gaps: `space-y-4`
- Button groups: `gap-4`

### D. Component Library

**Glass Cards**
- Background: `bg-[#1f2833]/80` with `backdrop-blur-sm`
- Border: `border border-cyan-500/20` with subtle glow
- Rounded corners: `rounded-lg` to `rounded-xl`
- Shadow: Multi-layer with cyan glow effect

**Buttons**
- Primary: Solid neon blue `bg-[#66fcf1]` with dark text, hover to `bg-[#45a29e]`
- Secondary: Outline with `border-cyan-500` and transparent background
- Ghost: No border, hover shows cyan background at 10% opacity
- All buttons: `rounded-lg`, `px-6 py-3`, `font-medium`, scale on hover (98%)

**Form Inputs**
- Background: `bg-[#0b0c10]` (darker than cards)
- Border: `border-gray-700` default, `border-purple-500` on focus
- Glow effect on focus with purple shadow
- Placeholder text: `text-gray-500`
- Height: `h-12` for consistency

**Navigation Bar**
- Fixed top position with `backdrop-blur-md`
- Background: `bg-[#1f2833]/90`
- Border bottom with subtle cyan glow
- Active link: Glowing cyan underline animation
- Logo area with pulsing animation effect

**Admin Panel Tabs**
- Horizontal tab bar with underline indicator
- Active tab: Cyan underline with glow, text `text-cyan-400`
- Inactive tabs: `text-gray-400`, hover to `text-gray-200`
- Smooth underline slide animation between tabs

**Data Tables**
- Dark row backgrounds alternating slightly
- Hover: Row highlights with cyan tint at 5% opacity
- Headers: Sticky, uppercase text, `text-xs`, `text-gray-400`
- Cell padding: `px-6 py-4`
- Action buttons in rows: Icon buttons with hover glow

**Toast Notifications**
- Position: Top-right, stacked
- Success: Green accent with checkmark icon
- Error: Red accent with X icon
- Background: Dark card with matching colored border and icon
- Auto-dismiss after 5 seconds with slide-out animation

### E. Animations (Framer Motion)

**Page Transitions**
- Fade in from opacity 0 to 1, duration 0.3s
- Slight upward slide (y: 20 to 0) on mount

**Interactive Elements**
- Button hover: Scale 0.98, shadow glow increase
- Card hover: Subtle lift (translateY: -2px), border glow intensifies
- Invalid input shake: Horizontal shake animation (x: [-10, 10, -10, 10, 0])
- Loading states: Spinner with cyan color, pulse animation

**Logo Animation**
- Continuous pulse effect on "Akcent" text
- Glow intensity oscillates between 100% and 60%
- Duration: 2s, infinite loop

**Download Button**
- Click shows loading spinner replacing text
- Success shows checkmark with green flash
- Progress bar with cyan gradient fill

## Page-Specific Layouts

### Login Page
- Centered glass card (max-w-md) floating on radial gradient background
- Logo at top with pulse animation
- Form fields stacked with consistent spacing
- "Don't have an account?" link below, purple accent on hover
- Smooth transitions on input focus

### Register Page
- Similar to login but with invite code field
- Purple accent highlights for active fields (focus state)
- Shake animation triggers on invalid invite code
- Real-time validation feedback with icons

### User Dashboard
- Welcome banner: Full-width card with gradient background, large greeting
- Account info card: Grid layout showing registration date, status, last login
- "Download Akcent Loader" button: Prominent, centered, with download icon
- Animated loader icon appears during file fetch
- Stats displayed in smaller cards below

### Admin Panel
- Three-tab interface: Invite Codes | Users | Audit Log
- Each tab content in dark card container
- **Invite Codes Tab**: 
  - Form to generate codes (uses, expiry) at top
  - Table of all codes below with revoke buttons
  - Copy-to-clipboard icon on each code
- **Users Tab**:
  - Table with username, role, status, created date
  - Toggle switch for active/inactive status
  - Action menu (3 dots) for additional options
- **Audit Log Tab**:
  - Scrollable table with timestamp, user, action, IP
  - Color-coded action types (login=blue, register=green, admin=purple)

## Visual Enhancements

**Glowing Effects**
- Cards: Subtle cyan glow on borders using `shadow-[0_0_15px_rgba(102,252,241,0.15)]`
- Buttons: Intensified glow on hover
- Active elements: Purple glow for secondary focus states

**Backgrounds**
- Main: Radial gradient from center-top
- Cards: Solid with transparency and blur
- Overlays: Dark backdrop with 50% opacity for modals

**Responsive Breakpoints**
- Mobile: Single column, full-width cards, stacked navigation
- Tablet (md): Two-column grids where appropriate
- Desktop (lg+): Full multi-column layouts, side-by-side forms

## Additional Details
- Copy-to-clipboard buttons show tooltip on click: "Copied!"
- "Admin Console" watermark: Bottom-right corner, `text-xs`, `text-gray-600`, fixed position
- Session timeout shows modal warning 2 minutes before expiry
- All interactive elements have cursor-pointer and focus states for accessibility
- No color variations beyond specified palette—maintain consistency