import { getTranslationService } from '../translationService';
import { getMultilingualService } from '../multilingualService';

// Mock the Anthropic SDK since we don't have API keys in tests
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    completions: {
      create: jest.fn().mockResolvedValue({
        completion: 'Mocked translation'
      })
    }
  }));
});

// Mock Redis client
jest.mock('../../config/redis', () => ({
  redisClient: {
    isReady: false,
    get: jest.fn(),
    setEx: jest.fn()
  }
}));

describe('TranslationService', () => {
  let translationService: any;
  let multilingualService: any;

  beforeEach(() => {
    // Mock environment variable
    process.env.ANTHROPIC_API_KEY = 'test-key';
    translationService = getTranslationService();
    multilingualService = getMultilingualService();
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('translateText', () => {
    it('should return original text when translating to same language', async () => {
      const result = await translationService.translateText('Hello', 'en', 'en');
      expect(result).toBe('Hello');
    });

    it('should call Anthropic API for different languages', async () => {
      const result = await translationService.translateText('Hello', 'en', 'es');
      expect(result).toBe('Mocked translation');
    });
  });

  describe('detectLanguage', () => {
    it('should detect language using Anthropic API', async () => {
      // Mock valid language code response
      const mockAnthropicInstance = (translationService as any).anthropic;
      mockAnthropicInstance.completions.create.mockResolvedValueOnce({
        completion: 'es'
      });

      const result = await translationService.detectLanguage('Hello world');
      expect(result).toBe('es');
    });

    it('should return "en" for invalid language codes', async () => {
      // Mock invalid response
      const mockAnthropicInstance = (translationService as any).anthropic;
      mockAnthropicInstance.completions.create.mockResolvedValueOnce({
        completion: 'invalid-code-123'
      });

      const result = await translationService.detectLanguage('Hello world');
      expect(result).toBe('en');
    });
  });
});

describe('MultilingualService', () => {
  let multilingualService: any;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    multilingualService = getMultilingualService();
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('getContentInLanguage', () => {
    it('should return content in requested language', () => {
      const content = {
        en: 'Hello',
        es: 'Hola',
        fr: 'Bonjour'
      };

      expect(multilingualService.getContentInLanguage(content, 'es')).toBe('Hola');
    });

    it('should fallback to default language when requested language not available', () => {
      const content = {
        en: 'Hello',
        es: 'Hola'
      };

      expect(multilingualService.getContentInLanguage(content, 'fr')).toBe('Hello');
    });

    it('should return first available language when default not available', () => {
      const content = {
        es: 'Hola',
        fr: 'Bonjour'
      };

      expect(multilingualService.getContentInLanguage(content, 'de')).toBe('Hola');
    });

    it('should return empty string when no content available', () => {
      const content = {};

      expect(multilingualService.getContentInLanguage(content, 'en')).toBe('');
    });
  });

  describe('validateMultilingualContent', () => {
    it('should validate correct multilingual content', () => {
      const content = {
        en: 'Hello',
        es: 'Hola',
        fr: 'Bonjour'
      };

      expect(multilingualService.validateMultilingualContent(content)).toBe(true);
    });

    it('should reject invalid content', () => {
      expect(multilingualService.validateMultilingualContent(null)).toBe(false);
      expect(multilingualService.validateMultilingualContent('string')).toBe(false);
      expect(multilingualService.validateMultilingualContent({ en: 123 })).toBe(false);
    });
  });

  describe('cleanMultilingualContent', () => {
    it('should remove empty translations', () => {
      const content = {
        en: 'Hello',
        es: '',
        fr: '   ',
        de: 'Hallo'
      };

      const cleaned = multilingualService.cleanMultilingualContent(content);
      expect(cleaned).toEqual({
        en: 'Hello',
        de: 'Hallo'
      });
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return languages with non-empty content', () => {
      const content = {
        en: 'Hello',
        es: '',
        fr: 'Bonjour',
        de: '   '
      };

      const languages = multilingualService.getAvailableLanguages(content);
      expect(languages).toEqual(['en', 'fr']);
    });
  });

  describe('getMissingLanguages', () => {
    it('should return languages not present in content', () => {
      const content = {
        en: 'Hello',
        es: 'Hola'
      };

      const missing = multilingualService.getMissingLanguages(content);
      expect(missing).toContain('fr');
      expect(missing).toContain('ar');
      expect(missing).not.toContain('en');
      expect(missing).not.toContain('es');
    });
  });
});