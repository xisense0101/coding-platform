# UI Component Library

A comprehensive, accessible, and responsive component library built with React, TypeScript, Tailwind CSS, and Radix UI.

## Quick Start

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { PageHeader } from '@/components/ui/page-header'

function MyPage() {
  return (
    <Container>
      <PageHeader
        heading="My Page"
        description="Welcome to my page"
        actions={<Button>Action</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          Your content here
        </CardContent>
      </Card>
    </Container>
  )
}
```

## Component Categories

### Layout Components
- **Container** - Responsive container with max-width constraints
- **PageHeader** - Standardized page header with title, description, and actions
- **Card** - Flexible content container

### Form Components
- **Button** - Interactive button with multiple variants
- **Input** - Text input field
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection
- **Checkbox** - Binary option selector
- **Radio** - Single selection from options
- **Switch** - Toggle switch
- **Label** - Form field labels

### Feedback Components
- **Toast** - Temporary notifications
- **Spinner** - Loading indicator
- **Skeleton** - Loading placeholder
- **EmptyState** - No data display
- **Alert** - Important messages
- **Progress** - Progress indicator

### Navigation Components
- **Tabs** - Tab navigation
- **Breadcrumbs** - Hierarchical navigation
- **DropdownMenu** - Contextual actions menu

### Overlay Components
- **Dialog** - Modal dialogs
- **Popover** - Contextual overlay
- **Tooltip** - Helpful hints

### Data Display
- **Table** - Data tables
- **Badge** - Status indicators
- **Avatar** - Profile pictures

## Usage Examples

### Buttons

```tsx
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

// Primary button
<Button>Submit</Button>

// Variants
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Edit</Button>
<Button variant="ghost">More</Button>
<Button variant="link">Learn more</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

// Loading state
<Button disabled>
  <Spinner size="sm" className="mr-2" />
  Loading...
</Button>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    Main content area
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Toast Notifications

```tsx
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const showSuccess = () => {
    toast({
      title: "Success!",
      description: "Your changes have been saved.",
      variant: "success",
    })
  }

  const showError = () => {
    toast({
      title: "Error",
      description: "Something went wrong.",
      variant: "destructive",
    })
  }

  return (
    <>
      <Button onClick={showSuccess}>Show Success</Button>
      <Button onClick={showError}>Show Error</Button>
    </>
  )
}
```

### Loading States

```tsx
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'

// Skeleton placeholders
{isLoading ? (
  <div className="space-y-4">
    <SkeletonCard />
    <SkeletonCard />
  </div>
) : (
  <DataList data={data} />
)}

// Spinner overlay
{isLoading && (
  <div className="flex items-center justify-center p-8">
    <Spinner />
  </div>
)}
```

### Empty States

```tsx
import { EmptyState } from '@/components/ui/empty-state'

<EmptyState
  title="No courses found"
  description="Get started by creating your first course."
  action={{
    label: "Create Course",
    onClick: () => router.push('/courses/create')
  }}
/>
```

### Forms

```tsx
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        placeholder="Enter your email"
        required
      />
    </div>
    <Button type="submit">Submit</Button>
  </div>
</form>
```

### Responsive Layouts

```tsx
import { Container } from '@/components/ui/container'
import { PageHeader } from '@/components/ui/page-header'

<Container size="xl">
  <PageHeader
    heading="Dashboard"
    description="Welcome to your dashboard"
    actions={
      <>
        <Button variant="outline">Settings</Button>
        <Button>Create New</Button>
      </>
    }
  />
  
  {/* Responsive grid */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {items.map(item => (
      <Card key={item.id}>
        {/* Card content */}
      </Card>
    ))}
  </div>
</Container>
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Breadcrumbs

```tsx
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/breadcrumbs'

<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/courses">Courses</BreadcrumbItem>
  <BreadcrumbItem href="/courses/123" isCurrentPage>
    Course Name
  </BreadcrumbItem>
</Breadcrumbs>
```

### Tooltip

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Additional information here</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Accessibility Features

All components include:
- ✅ Keyboard navigation support
- ✅ ARIA attributes for screen readers
- ✅ Focus visible indicators
- ✅ Proper semantic HTML
- ✅ Color contrast compliance (WCAG AA)
- ✅ Disabled state handling
- ✅ Error state handling

### Keyboard Shortcuts

- **Tab** - Navigate between interactive elements
- **Enter/Space** - Activate buttons and links
- **Escape** - Close modals, dropdowns, and popovers
- **Arrow Keys** - Navigate within menus and selects

## Responsive Design

All components are mobile-first and responsive:

```tsx
// Mobile: stacked, Desktop: side-by-side
<div className="flex flex-col sm:flex-row gap-4">
  <Button>Primary</Button>
  <Button variant="secondary">Secondary</Button>
</div>

// Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Responsive text sizing
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

## Dark Mode

All components support dark mode through Tailwind's `dark:` variant:

```tsx
// Automatic dark mode support
<div className="bg-background text-foreground">
  Content automatically adjusts to light/dark mode
</div>

// Custom dark mode styling
<div className="bg-white dark:bg-gray-900">
  Explicitly styled for dark mode
</div>
```

## Best Practices

1. **Use semantic HTML**: Prefer native elements (button, input, etc.)
2. **Provide labels**: All form inputs must have associated labels
3. **Handle loading states**: Show feedback during async operations
4. **Handle empty states**: Show helpful messages when there's no data
5. **Handle error states**: Provide clear error messages
6. **Test keyboard navigation**: Ensure all features work without a mouse
7. **Test with screen readers**: Verify ARIA attributes work correctly
8. **Test on mobile**: Ensure responsive layouts work on small screens

## Customization

Components use Tailwind's utility classes and can be customized:

```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Add custom classes
<Button className="w-full">Full Width Button</Button>

// Conditional styling
<Button className={cn(
  "my-custom-class",
  isActive && "bg-green-500",
  isDisabled && "opacity-50"
)}>
  Conditional Button
</Button>
```

## TypeScript Support

All components are fully typed:

```tsx
import { Button, ButtonProps } from '@/components/ui/button'

interface MyButtonProps extends ButtonProps {
  customProp?: string
}

const MyButton: React.FC<MyButtonProps> = ({ customProp, ...props }) => {
  return <Button {...props} />
}
```

## Performance

- Components use React.forwardRef for proper ref handling
- Lazy loading with React.lazy() for heavy components
- Memoization with React.memo() where appropriate
- Optimized re-renders through proper dependency arrays

## Related Documentation

- [UI Architecture Guide](../../docs/ui-architecture.md)
- [Accessibility Guidelines](../../docs/ui-architecture.md#accessibility-guidelines)
- [Responsive Design Patterns](../../docs/ui-architecture.md#responsive-design)

## Getting Help

For issues or questions about components:
1. Check the [UI Architecture documentation](../../docs/ui-architecture.md)
2. Review component source code in `src/components/ui/`
3. Check existing usage in pages for examples

## Contributing

When adding new components:
1. Follow existing component patterns
2. Include accessibility features
3. Make it responsive (mobile-first)
4. Add TypeScript types
5. Document props and usage
6. Test keyboard navigation
7. Test with screen readers
