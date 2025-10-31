# Cin7 Polaris Theme Configuration Guide

## Overview

This project uses Shopify Polaris as the primary UI component library, configured with Cin7's brand identity.

## Installation

Polaris has been installed with the following packages:

```bash
npm install @shopify/polaris @shopify/polaris-icons --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is used because this project uses React 19, while Polaris officially supports React 18. Testing has shown this works without issues.

## Cin7 Brand Colors

### Primary Brand Colors

#### Hept Blue
The primary brand color representing sophistication and trust.

- **Main:** `#0033A0` - Primary brand blue
- **Dark:** `#002266` - Darker variant for hover states
- **Light:** `#1A4DB8` - Lighter variant for accents
- **Lighter:** `#E6EBF5` - Very light blue for backgrounds

**Usage:**
- Primary buttons
- Links and interactive elements
- Focus states
- Brand headers

#### Transit Yellow
The secondary brand color representing energy and optimism.

- **Main:** `#FFC845` - Primary brand yellow
- **Dark:** `#FFBB00` - Darker variant for hover states
- **Light:** `#FFD670` - Lighter variant for accents
- **Lighter:** `#FFF9E6` - Very light yellow for backgrounds

**Usage:**
- Call-to-action buttons
- Highlights and accents
- Success indicators (alternate)
- Energy-focused messaging

### Semantic Colors

#### Success
- **Main:** `#00A854` - Success green
- **Light:** `#E6F7EF` - Light background for success messages

#### Warning
- **Main:** `#FF9800` - Warning orange
- **Light:** `#FFF3E0` - Light background for warning messages

#### Error
- **Main:** `#D32F2F` - Error red
- **Light:** `#FFEBEE` - Light background for error messages

#### Info
- **Main:** `#0288D1` - Info blue
- **Light:** `#E1F5FE` - Light background for info messages

### Neutral Colors (Grays)

A comprehensive gray scale for text, backgrounds, and borders:

- **900:** `#1A1A1A` - Darkest gray for primary text
- **800:** `#2E2E2E` - Dark gray
- **700:** `#424242` - Medium-dark gray for secondary text
- **600:** `#757575` - Medium gray
- **500:** `#9E9E9E` - Mid-gray
- **400:** `#BDBDBD` - Light-medium gray for disabled text
- **300:** `#D9D9D9` - Light gray for borders
- **200:** `#EEEEEE` - Very light gray
- **100:** `#F5F5F5` - Ultra light gray for backgrounds
- **50:** `#FAFAFA` - Lightest gray for subtle backgrounds

## Using Cin7 Colors

### In TypeScript/React Components

```typescript
import { cin7Colors, cin7BrandColors } from '@/config/cin7-polaris-theme';

// Using the full color object
const primaryColor = cin7Colors.heptBlue.main; // #0033A0

// Using brand colors shorthand
const secondaryColor = cin7BrandColors.secondary; // #FFC845
```

### In CSS/SCSS

```css
/* Using CSS custom properties */
.my-button {
  background-color: var(--cin7-hept-blue);
  color: white;
}

.my-button:hover {
  background-color: var(--cin7-hept-blue-dark);
}

.accent-badge {
  background-color: var(--cin7-transit-yellow-lighter);
  color: var(--cin7-text-primary);
}
```

### In Tailwind (using CSS variables)

```jsx
<div className="bg-[var(--cin7-hept-blue)] text-white">
  Cin7 branded element
</div>
```

## Shopify Polaris Components

### Available Components

Polaris provides a comprehensive set of pre-built components. Here are the most commonly used:

#### Layout Components
- `Page` - Main page container with header
- `Layout` - Grid-based layout system
- `Card` - Content container with padding and shadows
- `Stack` - Flexbox-based stacking
- `Divider` - Visual separator

#### Form Components
- `TextField` - Text input field
- `Select` - Dropdown selector
- `Checkbox` - Checkbox input
- `RadioButton` - Radio button input
- `Button` - Action button
- `ButtonGroup` - Grouped buttons
- `Form` - Form wrapper
- `FormLayout` - Form layout helper

#### Data Display
- `DataTable` - Tabular data display
- `List` - Bulleted/numbered lists
- `DescriptionList` - Key-value pairs
- `Badge` - Status indicator
- `Tag` - Removable label
- `Avatar` - User avatar
- `Thumbnail` - Image thumbnail

#### Navigation
- `Tabs` - Tab navigation
- `Pagination` - Page navigation
- `Link` - Styled link
- `Breadcrumbs` - Navigation trail

#### Feedback
- `Banner` - Inline notification
- `Toast` - Temporary notification
- `Modal` - Dialog overlay
- `Spinner` - Loading indicator
- `ProgressBar` - Progress indicator
- `SkeletonPage` - Loading placeholder

#### Actions
- `ActionList` - List of actions
- `Popover` - Overlay with content
- `DropZone` - File upload area

### Basic Usage Examples

#### Page with Card

```tsx
import { Page, Card, Button } from '@shopify/polaris';

function MyPage() {
  return (
    <Page
      title="Dashboard"
      primaryAction={<Button primary>Create New</Button>}
    >
      <Card>
        <Card.Section>
          <p>Card content goes here</p>
        </Card.Section>
      </Card>
    </Page>
  );
}
```

#### Form with TextField

```tsx
import { Form, FormLayout, TextField, Button } from '@shopify/polaris';
import { useState } from 'react';

function MyForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <Form onSubmit={() => console.log('Submit')}>
      <FormLayout>
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Button primary submit>Submit</Button>
      </FormLayout>
    </Form>
  );
}
```

#### Data Table

```tsx
import { DataTable } from '@shopify/polaris';

function MyTable() {
  const rows = [
    ['Product A', '$100', '50'],
    ['Product B', '$200', '25'],
  ];

  return (
    <DataTable
      columnContentTypes={['text', 'numeric', 'numeric']}
      headings={['Product', 'Price', 'Quantity']}
      rows={rows}
    />
  );
}
```

#### Banner for Notifications

```tsx
import { Banner } from '@shopify/polaris';

function MyBanner() {
  return (
    <Banner status="success" title="Success">
      <p>Your changes have been saved.</p>
    </Banner>
  );
}
```

### Icons

Polaris provides a comprehensive icon library:

```tsx
import { Button } from '@shopify/polaris';
import { PlusIcon, DeleteIcon, EditIcon } from '@shopify/polaris-icons';

function MyButtons() {
  return (
    <>
      <Button icon={PlusIcon}>Add</Button>
      <Button icon={EditIcon}>Edit</Button>
      <Button icon={DeleteIcon} destructive>Delete</Button>
    </>
  );
}
```

## Theme Customization

The theme is configured in `/src/config/cin7-polaris-theme.ts` and applied in `/src/main.tsx`:

```tsx
import { AppProvider } from '@shopify/polaris';
import { cin7PolarisTheme } from './config/cin7-polaris-theme';

<AppProvider theme={cin7PolarisTheme}>
  <App />
</AppProvider>
```

### Customizing the Theme

To modify theme colors, edit `/src/config/cin7-polaris-theme.ts`:

```typescript
export const cin7PolarisTheme = {
  colors: {
    primary: cin7Colors.heptBlue.main, // Change this to customize primary color
    // ... other colors
  },
  // ... other theme properties
};
```

## Best Practices

### 1. Consistent Color Usage
- Use `cin7Colors.heptBlue.main` for primary actions and branding
- Use `cin7Colors.transitYellow.main` for secondary actions and accents
- Use semantic colors (`success`, `warning`, `error`) for feedback
- Use gray scale consistently for text hierarchy

### 2. Component Selection
- Use Polaris components whenever possible for consistency
- Only create custom components when Polaris doesn't provide the functionality
- Extend Polaris components rather than replacing them

### 3. Accessibility
- Polaris components come with built-in accessibility features
- Always provide `label` props for form inputs
- Use semantic HTML and ARIA attributes when building custom components
- Ensure color contrast meets WCAG standards

### 4. Typography
- Use Polaris text components (`Text`, `Heading`) for consistency
- The default font family is system fonts for optimal performance
- Font sizes are predefined in the theme configuration

### 5. Spacing
- Use Polaris spacing tokens from the theme
- Prefer `Stack` and `Layout` components over custom spacing
- Use `spacing.base` (16px) as the standard unit

## Migration from Existing UI

If migrating from another UI library:

1. **Identify equivalent components** - Map existing components to Polaris equivalents
2. **Replace gradually** - Migrate one section at a time
3. **Test thoroughly** - Ensure functionality remains intact
4. **Update styles** - Replace custom colors with Cin7 theme colors
5. **Check responsiveness** - Polaris is mobile-first by default

## Resources

- [Polaris Component Library](https://polaris.shopify.com/components)
- [Polaris Design Tokens](https://polaris.shopify.com/tokens/colors)
- [Polaris Icons](https://polaris.shopify.com/icons)
- [Cin7 Brand Guidelines](https://brand.cin7.com/)

## Troubleshooting

### React 19 Compatibility
The project uses React 19, while Polaris officially supports React 18. The installation uses `--legacy-peer-deps` to bypass this check. This works because:
- React 19 is backward compatible for most use cases
- No breaking changes affect Polaris functionality
- All components have been tested and work correctly

### Style Conflicts
If Tailwind styles conflict with Polaris:
1. Import Polaris styles BEFORE your custom CSS
2. Use Polaris components' built-in props instead of Tailwind classes
3. Use CSS specificity to override when necessary

### Theme Not Applying
Ensure:
1. `AppProvider` wraps your entire app
2. Theme is imported correctly
3. Polaris CSS is imported in `main.tsx`
4. No CSS is overriding Polaris variables

## Examples in This Project

Check these files for implementation examples:
- `/src/main.tsx` - AppProvider setup
- `/src/config/cin7-polaris-theme.ts` - Theme configuration
- `/src/index.css` - CSS variables setup

## Support

For questions or issues:
1. Check [Polaris documentation](https://polaris.shopify.com/)
2. Review the theme configuration in this project
3. Consult Cin7's brand guidelines for color usage
4. Reach out to the development team

---

Last Updated: October 31, 2025
