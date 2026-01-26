# Mobile Features Documentation

## Overview

TradeLink Marketplace includes comprehensive mobile responsiveness and Progressive Web App (PWA) features to provide a native-like experience on mobile devices.

## Mobile Responsiveness Features

### 1. Responsive Layout
- **Mobile-first design** with Tailwind CSS breakpoints
- **Flexible grid layouts** that adapt from 1 column (mobile) to 4 columns (desktop)
- **Touch-optimized spacing** with appropriate padding and margins
- **Readable typography** with responsive font sizes

### 2. Mobile Navigation
- **Hamburger menu** for mobile devices (< 768px)
- **Bottom navigation bar** for authenticated users on mobile
- **Touch-friendly targets** (minimum 44x44px)
- **Active state indicators** for current page
- **Smooth transitions** and animations

### 3. Touch Interactions
- **Touch manipulation** CSS property for better touch response
- **Active states** for all interactive elements
- **No tap highlight** to prevent blue flash on touch
- **Swipe-friendly** scrolling with momentum

## PWA Features

### 1. Service Worker
- **Offline functionality** with intelligent caching
- **Network-first strategy** for API calls with cache fallback
- **Cache-first strategy** for static assets
- **Automatic updates** with version management

### 2. App Manifest
- **Installable** on home screen
- **Standalone mode** for app-like experience
- **Custom icons** (192x192 and 512x512)
- **Theme color** matching brand
- **App shortcuts** for quick access to key features

### 3. Offline Support
- **Offline indicator** shows connection status
- **Cached responses** when offline
- **Automatic sync** when connection restored
- **Graceful degradation** for offline features

## Mobile-Specific Components

### CameraCapture Component
```typescript
import CameraCapture from '../components/CameraCapture';

<CameraCapture
  onCapture={(file) => handleImageUpload(file)}
  onError={(error) => console.error(error)}
  maxSizeMB={5}
/>
```

Features:
- Direct camera access on mobile devices
- Automatic image compression
- File size validation
- Error handling

### MobileOptimizedInput Component
```typescript
import MobileOptimizedInput from '../components/MobileOptimizedInput';

<MobileOptimizedInput
  fieldType="email"
  fieldName="email"
  label="Email"
  scrollOnFocus={true}
/>
```

Features:
- Appropriate keyboard types (email, tel, number, etc.)
- Auto-scroll on focus to prevent keyboard overlap
- Autocomplete attributes for better UX
- Input mode optimization

### OfflineIndicator Component
Automatically shows connection status:
- Green notification when back online
- Yellow notification when offline
- Auto-dismisses after 3 seconds (online) or stays visible (offline)

## Mobile Keyboard Optimizations

### Input Types
The app uses appropriate input types for mobile keyboards:
- `email` - Shows @ and .com shortcuts
- `tel` - Shows numeric keypad
- `number` - Shows numeric keyboard
- `url` - Shows / and .com shortcuts
- `search` - Shows search button

### Autocomplete
Proper autocomplete attributes help mobile browsers:
- Email, phone, name fields
- Address components
- Payment information
- Credentials (username/password)

### Utilities
```typescript
import {
  getInputType,
  getInputMode,
  getAutocomplete,
  scrollIntoViewOnFocus,
  isMobileDevice,
  hasTouchSupport
} from '../utils/mobileKeyboard';
```

## Safe Area Insets

Support for notched devices (iPhone X and later):
```css
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left { padding-left: env(safe-area-inset-left); }
.safe-right { padding-right: env(safe-area-inset-right); }
```

## Testing Mobile Features

### On Real Devices
1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device or custom dimensions
4. Test touch interactions and responsive layouts

### PWA Testing
1. Build the app: `npm run build`
2. Serve locally: `npm run preview`
3. Open in Chrome
4. Check Application tab in DevTools
5. Verify Service Worker and Manifest

### Lighthouse Audit
Run Lighthouse audit for PWA score:
```bash
npm run build
npm run preview
# Open Chrome DevTools > Lighthouse > Generate report
```

## Browser Support

### Mobile Browsers
- ✅ Chrome for Android (latest)
- ✅ Safari for iOS (latest)
- ✅ Samsung Internet (latest)
- ✅ Firefox for Android (latest)

### PWA Support
- ✅ Android (Chrome, Samsung Internet)
- ✅ iOS 16.4+ (Safari)
- ✅ Desktop (Chrome, Edge)

## Performance Optimizations

### Image Handling
- Automatic compression in CameraCapture
- Max width of 1920px
- JPEG quality at 85%
- Lazy loading for product images

### Code Splitting
- Route-based code splitting
- Lazy loading of components
- Optimized bundle sizes

### Caching Strategy
- Static assets cached indefinitely
- API responses cached with TTL
- Stale-while-revalidate for better UX

## Future Enhancements

### Planned Features
- [ ] Push notifications
- [ ] Background sync for offline actions
- [ ] Biometric authentication
- [ ] Share API integration
- [ ] Geolocation API for auto-location
- [ ] Web Share Target API
- [ ] Payment Request API

### Accessibility
- [ ] Screen reader optimization
- [ ] High contrast mode
- [ ] Reduced motion support
- [ ] Keyboard navigation improvements

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure HTTPS (required for SW)
- Clear browser cache and reload
- Check sw.js is accessible at /sw.js

### PWA Not Installable
- Verify manifest.json is valid
- Check all required icons exist
- Ensure HTTPS connection
- Verify start_url is accessible

### Offline Mode Not Working
- Check Service Worker is active
- Verify cache names match
- Check network tab for cache hits
- Clear cache and re-register SW

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
