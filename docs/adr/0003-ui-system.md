# ADR 0003: UI System and Component Library

**Status**: Accepted

**Date**: 2024-11-18

**Context**: Selection of UI component library and styling approach

## Decision

We have adopted **Radix UI + Tailwind CSS** as our UI system foundation, creating a custom component library with accessible, unstyled primitives that are styled with Tailwind utility classes.

## Context and Problem Statement

Modern web applications require:
1. **Accessible components**: WCAG 2.1 AA compliance
2. **Consistent design**: Unified look and feel
3. **Reusable components**: Reduce duplication
4. **Type safety**: TypeScript support
5. **Customizable styling**: Brand-specific theming
6. **Performance**: Small bundle size
7. **Developer experience**: Easy to use and maintain

The challenge is choosing a UI component library that balances these concerns while providing flexibility for custom designs.

## Considered Options

### Option 1: Radix UI + Tailwind CSS (Selected)

**Overview**: Unstyled, accessible component primitives + utility-first CSS

**Pros:**
- ✅ **Accessibility**: ARIA-compliant out of the box
- ✅ **Unstyled**: Complete styling control
- ✅ **Composable**: Mix and match components
- ✅ **TypeScript**: Full type support
- ✅ **Bundle size**: Pay for what you use (~5-10KB per component)
- ✅ **Headless**: Separation of logic and presentation
- ✅ **Well-maintained**: Active development
- ✅ **Tailwind integration**: Perfect match

**Cons:**
- ❌ Requires custom styling for every component
- ❌ More setup work initially
- ❌ Need to maintain component library

**Best For:**
- Custom branded applications
- Accessibility-critical apps
- Teams wanting full design control

### Option 2: shadcn/ui (Influenced Our Approach)

**Overview**: Copy-paste Radix UI components pre-styled with Tailwind

**Note**: While we don't use shadcn/ui directly, our component structure is heavily influenced by its approach.

**Pros:**
- ✅ Beautiful defaults
- ✅ Radix UI + Tailwind
- ✅ Copy-paste, not npm package
- ✅ Full control over code
- ✅ Excellent TypeScript support

**Cons:**
- ❌ Manual updates needed
- ❌ Not a package (can be pro or con)

### Option 3: Material-UI (MUI)

**Overview**: Complete, styled component library

**Pros:**
- ✅ Comprehensive component set
- ✅ Material Design aesthetic
- ✅ Good documentation
- ✅ Large community

**Cons:**
- ❌ Large bundle size (>100KB)
- ❌ Difficult to customize
- ❌ Material Design may not fit brand
- ❌ Heavy runtime styling
- ❌ Harder to override styles

**Decision**: Not selected due to bundle size and customization limitations

### Option 4: Chakra UI

**Overview**: Styled component library with theme system

**Pros:**
- ✅ Good accessibility
- ✅ Nice default design
- ✅ Theme customization
- ✅ Good documentation

**Cons:**
- ❌ Styled components approach (CSS-in-JS)
- ❌ Medium bundle size (~40KB)
- ❌ Less flexible than Radix UI
- ❌ Different styling paradigm than Tailwind

**Decision**: Not selected to maintain consistency with Tailwind

### Option 5: Ant Design

**Overview**: Enterprise-focused component library

**Pros:**
- ✅ Comprehensive components
- ✅ Good for dashboards
- ✅ Mature ecosystem

**Cons:**
- ❌ Large bundle size (>100KB)
- ❌ Opinionated design
- ❌ Harder to customize
- ❌ Chinese design aesthetic

**Decision**: Not selected due to customization limitations

### Option 6: Headless UI

**Overview**: Unstyled components by Tailwind Labs

**Pros:**
- ✅ Tailwind-first approach
- ✅ Unstyled
- ✅ Good accessibility

**Cons:**
- ❌ Smaller component library than Radix UI
- ❌ Less comprehensive documentation
- ❌ Fewer components available

**Decision**: Radix UI chosen for more complete component set

## Selected Approach: Radix UI + Tailwind CSS

### Architecture

```
┌─────────────────────────────────────────┐
│         Application Components          │
│  (Feature-specific, business logic)     │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│        UI Components Library            │
│   (Styled Radix primitives in ui/)      │
│  • Button, Input, Dialog, etc.          │
│  • Tailwind styling applied             │
│  • Variants via CVA                     │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│         Radix UI Primitives             │
│  (Unstyled, accessible components)      │
│  • Logic, state, accessibility          │
│  • No styling decisions                 │
└─────────────────────────────────────────┘
```

### Component Structure

Each UI component follows this pattern:

```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 1. Define variants with CVA
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 2. Define props interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// 3. Create component with forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Usage Examples

#### Basic Button
```typescript
import { Button } from "@/components/ui/button"

<Button>Click me</Button>
```

#### Button Variants
```typescript
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Learn more</Button>
```

#### Button Sizes
```typescript
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

#### Polymorphic Button (asChild)
```typescript
import Link from "next/link"

<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

## Styling System

### Tailwind CSS Configuration

**Key Features:**
- Design tokens via CSS variables
- Dark mode support
- Custom animations
- Typography plugin
- Container queries

### Design Tokens

**Location**: `app/globals.css`

```css
:root {
  /* Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode tokens */
}
```

### Class Variance Authority (CVA)

**Purpose**: Type-safe variant management

**Benefits:**
- ✅ TypeScript inference
- ✅ Compound variants
- ✅ Default variants
- ✅ Clean API

**Example:**
```typescript
const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-2",
        elevated: "shadow-lg",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    compoundVariants: [
      {
        variant: "elevated",
        padding: "lg",
        class: "shadow-xl",
      },
    ],
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)
```

### Utility Function (cn)

**Location**: `lib/utils.ts`

**Purpose**: Merge Tailwind classes safely

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Why Needed:**
- Handles conditional classes
- Resolves Tailwind class conflicts
- Maintains specificity correctly

**Example:**
```typescript
// Without cn
<div className={`base-class ${condition ? 'conditional-class' : ''}`} />

// With cn
<div className={cn("base-class", condition && "conditional-class")} />

// Conflict resolution
cn("px-2 py-1", "px-4") // Result: "py-1 px-4"
```

## Component Library

### Available Components

**Form Controls:**
- `button` - Button with variants
- `input` - Text input
- `textarea` - Multi-line input
- `checkbox` - Checkbox with label
- `radio-group` - Radio button group
- `select` - Dropdown select
- `switch` - Toggle switch
- `label` - Form label

**Overlays:**
- `dialog` - Modal dialog
- `popover` - Popover menu
- `tooltip` - Hover tooltip

**Display:**
- `card` - Content card
- `badge` - Status badge
- `avatar` - User avatar
- `table` - Data table
- `alert` - Alert messages
- `progress` - Progress bar

**Layout:**
- `tabs` - Tab navigation
- `separator` - Divider line
- `scroll-area` - Scrollable container

**Date/Time:**
- `calendar` - Date picker calendar
- `date-picker` - Date input with calendar

### Component Categories

#### 1. Form Components

Built with React Hook Form integration:

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  })
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit">Login</Button>
    </form>
  )
}
```

#### 2. Feedback Components

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>
```

#### 3. Overlay Components

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Implemented by Radix UI:**
- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Focus Management**: Proper focus handling
- ✅ **ARIA Attributes**: Correct ARIA labels
- ✅ **Screen Reader**: Screen reader friendly
- ✅ **Color Contrast**: Meets AA standards

### Accessibility Best Practices

#### 1. Semantic HTML
```typescript
// ✅ Good
<Button>Submit</Button>

// ❌ Bad
<div onClick={handleClick}>Submit</div>
```

#### 2. ARIA Labels
```typescript
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

#### 3. Focus Indicators
```css
.focus-visible:outline-none
.focus-visible:ring-2
.focus-visible:ring-ring
.focus-visible:ring-offset-2
```

#### 4. Color Contrast
```typescript
// All design tokens meet WCAG AA standards
// Tested with tools like axe DevTools
```

## Responsive Design

### Mobile-First Approach

**Breakpoints:**
```typescript
sm: '640px'   // Small devices
md: '768px'   // Medium devices (tablets)
lg: '1024px'  // Large devices (desktops)
xl: '1280px'  // Extra large devices
2xl: '1536px' // XXL devices
```

**Usage:**
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
  Responsive width
</div>

<Button className="text-sm md:text-base lg:text-lg">
  Responsive text
</Button>
```

### Container Queries

```typescript
<div className="@container">
  <div className="@lg:grid-cols-2">
    Container-based responsive
  </div>
</div>
```

## Dark Mode Support

### Implementation

**Approach**: Class-based dark mode

```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

**Usage:**
```typescript
<div className="bg-white dark:bg-gray-900">
  <p className="text-black dark:text-white">
    Adaptive content
  </p>
</div>
```

**Toggle:**
```typescript
'use client'

import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      Toggle Theme
    </Button>
  )
}
```

## Icon System

### Lucide React

**Why Lucide:**
- ✅ 400+ icons
- ✅ Consistent design
- ✅ Tree-shakeable
- ✅ TypeScript support
- ✅ Easy to customize

**Usage:**
```typescript
import { Plus, Check, X, AlertCircle } from 'lucide-react'

<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>
```

**Customization:**
```typescript
<Check 
  className="h-6 w-6"
  strokeWidth={3}
  color="green"
/>
```

## Performance Considerations

### Bundle Size

- **Radix UI**: ~5-10KB per component (tree-shakeable)
- **Tailwind CSS**: ~10KB after purge (production)
- **Total**: ~30-50KB for typical usage

### Optimization Techniques

1. **Tree Shaking**: Only import used components
2. **Purge CSS**: Remove unused Tailwind classes
3. **Code Splitting**: Dynamic imports for heavy components

```typescript
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('@/components/editors/monaco-editor'),
  { ssr: false }
)
```

## Testing Strategy

### Component Testing (Recommended)

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Accessibility Testing

```typescript
import { axe } from 'jest-axe'

describe('Button Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## Consequences

### Positive
- ✅ Full control over styling
- ✅ Excellent accessibility
- ✅ Small bundle size
- ✅ Type-safe components
- ✅ Consistent design system
- ✅ Easy to customize

### Negative
- ❌ Initial setup time
- ❌ Need to style each component
- ❌ Maintain component library

### Neutral
- Custom components require documentation
- Team training on Radix UI patterns
- Ongoing maintenance of UI library

## Future Enhancements

1. **Storybook**: Component documentation and testing
2. **Chromatic**: Visual regression testing
3. **More Components**: Add as needed
4. **Animation System**: Framer Motion integration
5. **Theme Variants**: Multiple brand themes

## Related ADRs

- [ADR 0001: State Management](./0001-state-management.md)
- [ADR 0002: Backend Hardening](./0002-backend-hardening.md)

## References

- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Class Variance Authority](https://cva.style)
