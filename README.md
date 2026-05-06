# Vasak Community Theme

A modern, premium NodeBB theme for Vasak Community. Inspired by the clean aesthetics of VasakOS.

## Features

- **Design System First**: Built on a comprehensive design token system for consistency
- **Modern Aesthetics**: Clean, premium look with smooth interactions
- **Fully Customizable**: Organized LESS files make customization easy
- **Responsive**: Works beautifully on all devices
- **Performance Optimized**: Clean, efficient CSS with no bloat

## Design System

The Vasak design system includes:

- **Typography**: SF Pro-based system font stack
- **Color Palette**: Primary blue (#0051ff) with neutral grays
- **Spacing**: 8pt grid system (4px, 8px, 12px, 16px, 20px, 24px)
- **Border Radius**: Consistent radii (4px, 8px, 12px, 16px, pill)
- **Shadows**: Soft, subtle elevation system

## Installation & Development

### 1. Install Dependencies

```bash
cd /nodebb-theme-vasak
bun install
```

### 2. Build the Theme

```bash
bun run build
```

This compiles `less/theme.less` into `static/lib/theme.css`.

### 3. Development Mode (Watch for Changes)

```bash
bun run dev
```

This watches your LESS files and rebuilds automatically on changes.

## Deployment to NodeBB Cloud

### Option 1: Direct Upload via ACP (Recommended)

1. **Package the theme**:
   ```bash
   cd /nodebb-theme-vasak
   zip -r nodebb-theme-vasak.zip nodebb-theme-vasak/ -x "*/node_modules/*" "*/.git/*"
   ```

2. **Upload to NodeBB Cloud**:
   - Go to your NodeBB Admin Panel (ACP)
   - Navigate to: **Extend → Install Plugins**
   - Click "Upload Plugin"
   - Select `nodebb-theme-vasak.zip`
   - Wait for installation to complete
   - Rebuild NodeBB when prompted

3. **Activate the theme**:
   - Go to: **Appearance → Themes**
   - Select "Vasak Community Theme"
   - Click "Apply" and rebuild

### Option 2: Git Repository (For Version Control)

1. **Initialize git** (if not already):
   ```bash
   cd /nodebb-theme-vasak
   git init
   git add .
   git commit -m "Initial Vasak theme setup"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/nodebb-theme-vasak.git
   git push -u origin main
   ```

3. **Install from GitHub in NodeBB**:
   - NodeBB ACP → Extend → Install Plugins
   - Enter: `yourusername/nodebb-theme-vasak`
   - Click "Install"

## File Structure

```
nodebb-theme-vasak/
├── less/
│   ├── theme.less           # Main entry point
│   ├── _variables.less      # Design tokens
│   ├── _base.less          # Global styles & typography
│   ├── _buttons.less       # Button system
│   ├── _forms.less         # Input & form controls
│   ├── _cards.less         # Feed post cards
│   ├── _sidebar.less       # Sidebar widgets
│   └── _categories.less    # Category list styling
├── static/
│   └── lib/
│       ├── theme.css       # Compiled CSS (generated)
│       └── theme.js        # Client-side JS
├── templates/              # Custom template overrides (if needed)
├── theme.js               # Server-side theme logic
├── plugin.json            # NodeBB theme manifest
└── package.json           # NPM configuration
```

## Customization Guide

### Changing Colors

Edit `less/_variables.less`:

```less
@jv-primary: #0051ff;        // Your primary brand color
@jv-primary-hover: #0044dd;  // Hover state
```

### Adjusting Spacing

Modify the spacing scale in `less/_variables.less`:

```less
@jv-space-2: 4px;
@jv-space-4: 8px;
// ... etc
```

### Component Styling

Each component has its own file:
- **Buttons**: `less/_buttons.less`
- **Forms**: `less/_forms.less`
- **Cards**: `less/_cards.less`
- **Sidebar**: `less/_sidebar.less`
- **Categories**: `less/_categories.less`

### Adding Custom Components

1. Create a new LESS file: `less/_yourcomponent.less`
2. Import it in `less/theme.less`:
   ```less
   @import "_yourcomponent";
   ```
3. Rebuild: `npm run build`

## Maintenance

### After Making Changes

1. Edit LESS files in the `less/` directory
2. Run `npm run build` to compile
3. If deployed, re-upload the theme to NodeBB Cloud
4. Rebuild NodeBB in the ACP

### Updating NodeBB

Since this is a standalone theme, NodeBB updates won't affect your design. However:
- Test the theme after major NodeBB version updates
- Check for any DOM structure changes that might need CSS adjustments

## Troubleshooting

### Theme Not Applying

1. Check that the theme is activated in ACP → Appearance → Themes
2. Make sure you rebuilt NodeBB after installation
3. Clear browser cache (Cmd+Shift+R)

### Styles Not Updating

1. Make sure you ran `npm run build` after editing LESS files
2. Check that `static/lib/theme.css` was generated
3. Rebuild NodeBB in the ACP

### Missing Dependencies

```bash
bun install
```

## Support

For issues or questions:
- Check NodeBB documentation: https://docs.nodebb.org
- NodeBB Community: https://community.nodebb.org

## License

MIT License - feel free to customize for your needs!

---

**Built with ❤️ for Vasak Community**