# Voice Input Component

## Overview

The Voice Input component provides speech-to-text functionality using the Web Speech API, with automatic price detection and extraction from voice input.

## Features

- **Voice-to-Text Conversion**: Converts speech to text in the user's preferred language
- **Price Detection**: Automatically detects and extracts price information from voice input
- **Real-time Feedback**: Shows interim transcription while speaking
- **Error Handling**: Provides clear error messages for common issues (microphone access, network errors, etc.)
- **Browser Compatibility**: Works in Chrome, Edge, and Safari (browsers that support Web Speech API)

## Usage

### Basic Usage

```tsx
import { VoiceInput } from './components/VoiceInput';

function MyComponent() {
  const handleTranscript = (text: string) => {
    console.log('Transcribed text:', text);
  };

  return (
    <VoiceInput
      language="en-US"
      onTranscript={handleTranscript}
    />
  );
}
```

### With Price Detection

```tsx
import { VoiceInput } from './components/VoiceInput';

function ChatComponent() {
  const handleTranscript = (text: string) => {
    setMessage(text);
  };

  const handlePriceDetected = (amount: number, currency?: string) => {
    console.log(`Price detected: ${amount} ${currency}`);
    setPriceOffer(amount.toString());
  };

  return (
    <VoiceInput
      language="en-US"
      onTranscript={handleTranscript}
      onPriceDetected={handlePriceDetected}
      buttonClassName="px-3 py-2 rounded"
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `language` | `string` | No | Language code for speech recognition (e.g., 'en-US', 'es-ES', 'hi-IN'). Default: 'en-US' |
| `onTranscript` | `(text: string) => void` | Yes | Callback function called when transcription is complete |
| `onPriceDetected` | `(amount: number, currency?: string) => void` | No | Callback function called when a price is detected in the transcript |
| `className` | `string` | No | Additional CSS classes for the container |
| `buttonClassName` | `string` | No | Additional CSS classes for the button |

## Price Extraction

The component automatically extracts prices from voice input using various patterns:

### Supported Price Formats

- **Currency symbols**: "$50", "€25.50", "£100", "₹500"
- **Currency names**: "50 dollars", "25 euros", "100 pounds", "500 rupees"
- **Context words**: "offer 100", "price is 50", "cost 75", "pay 60"
- **Decimal values**: "45.50 dollars", "$25.99"

### Examples

Voice input: "I can offer fifty dollars"
- Extracted: 50 USD (if numeric "50" is spoken)

Voice input: "My price is 25 euros"
- Extracted: 25 EUR

Voice input: "I'll pay $45.50 for this"
- Extracted: 45.50 USD

## Browser Support

The Voice Input component requires the Web Speech API, which is supported in:

- ✅ Chrome (desktop and mobile)
- ✅ Edge (desktop)
- ✅ Safari (desktop and iOS)
- ❌ Firefox (limited support)

If the browser doesn't support the Web Speech API, the component will not render.

## Error Handling

The component handles various error scenarios:

- **No speech detected**: "No speech detected. Please try again."
- **Microphone not available**: "Microphone not available. Please check your device settings."
- **Permission denied**: "Microphone access denied. Please allow microphone access."
- **Network error**: "Network error. Please check your connection."

## Language Support

The component supports multiple languages through the Web Speech API:

- English (en-US)
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- Hindi (hi-IN)
- Arabic (ar-SA)
- Chinese (zh-CN)
- Japanese (ja-JP)
- Portuguese (pt-BR)
- Russian (ru-RU)

## Integration Examples

### Chat Window

```tsx
<VoiceInput
  language={getLanguageCode(user?.preferredLanguage || 'en')}
  onTranscript={handleVoiceTranscript}
  onPriceDetected={handlePriceDetected}
  buttonClassName="px-3 py-2 rounded"
/>
```

### Product Search

```tsx
<VoiceInput
  language={getLanguageCode(user?.preferredLanguage || 'en')}
  onTranscript={handleVoiceSearch}
  buttonClassName="px-3 py-2 rounded-md border border-gray-300"
/>
```

## Accessibility

- The button includes proper ARIA labels for screen readers
- Visual feedback is provided during recording (pulsing animation)
- Error messages are displayed clearly
- Keyboard accessible

## Testing

Unit tests are available in `frontend/src/utils/__tests__/priceExtraction.test.ts` covering:

- Price extraction from various formats
- Currency detection
- Price highlighting
- Voice input patterns
- Error handling

Run tests with:
```bash
npm test -- priceExtraction.test.ts
```
