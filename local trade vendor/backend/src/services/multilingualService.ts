import { getTranslationService, TranslationContext } from './translationService';

export interface MultilingualContent {
  [languageCode: string]: string;
}

export interface MultilingualField {
  content: MultilingualContent;
  primaryLanguage: string;
}

export interface MultilingualServiceOptions {
  supportedLanguages: string[];
  defaultLanguage: string;
  autoTranslate: boolean;
}

export class MultilingualService {
  private translationService = getTranslationService();
  private supportedLanguages: string[];
  private defaultLanguage: string;
  private autoTranslate: boolean;

  constructor(options: MultilingualServiceOptions) {
    this.supportedLanguages = options.supportedLanguages;
    this.defaultLanguage = options.defaultLanguage;
    this.autoTranslate = options.autoTranslate;
  }

  /**
   * Create multilingual content from a single language input
   */
  async createMultilingualContent(
    text: string,
    sourceLanguage: string,
    context?: TranslationContext
  ): Promise<MultilingualContent> {
    const content: MultilingualContent = {
      [sourceLanguage]: text
    };

    if (this.autoTranslate) {
      // Generate translations for all supported languages
      for (const targetLanguage of this.supportedLanguages) {
        if (targetLanguage !== sourceLanguage) {
          try {
            content[targetLanguage] = await this.translationService.translateText(
              text,
              sourceLanguage,
              targetLanguage,
              context
            );
          } catch (error) {
            console.warn(`Failed to translate to ${targetLanguage}:`, error);
            // Don't add translation if it fails
          }
        }
      }
    }

    return content;
  }

  /**
   * Update multilingual content with new text in a specific language
   */
  async updateMultilingualContent(
    existingContent: MultilingualContent,
    newText: string,
    language: string,
    context?: TranslationContext
  ): Promise<MultilingualContent> {
    const updatedContent = { ...existingContent };
    updatedContent[language] = newText;

    if (this.autoTranslate) {
      // Re-generate translations for other languages
      for (const targetLanguage of this.supportedLanguages) {
        if (targetLanguage !== language) {
          try {
            updatedContent[targetLanguage] = await this.translationService.translateText(
              newText,
              language,
              targetLanguage,
              context
            );
          } catch (error) {
            console.warn(`Failed to update translation for ${targetLanguage}:`, error);
            // Keep existing translation if update fails
          }
        }
      }
    }

    return updatedContent;
  }

  /**
   * Get content in a specific language with fallback logic
   */
  getContentInLanguage(
    content: MultilingualContent,
    requestedLanguage: string
  ): string {
    // First, try the requested language
    if (content[requestedLanguage]) {
      return content[requestedLanguage];
    }

    // Fallback to default language
    if (content[this.defaultLanguage]) {
      return content[this.defaultLanguage];
    }

    // Fallback to any available language
    const availableLanguages = Object.keys(content);
    if (availableLanguages.length > 0) {
      return content[availableLanguages[0]];
    }

    // Last resort - return empty string
    return '';
  }

  /**
   * Ensure content has translation for a specific language
   */
  async ensureLanguageExists(
    content: MultilingualContent,
    targetLanguage: string,
    context?: TranslationContext
  ): Promise<MultilingualContent> {
    if (content[targetLanguage]) {
      return content; // Already exists
    }

    // Find a source language to translate from
    const sourceLanguage = this.findBestSourceLanguage(content);
    if (!sourceLanguage) {
      return content; // No source available
    }

    try {
      const translation = await this.translationService.translateText(
        content[sourceLanguage],
        sourceLanguage,
        targetLanguage,
        context
      );

      return {
        ...content,
        [targetLanguage]: translation
      };
    } catch (error) {
      console.warn(`Failed to ensure ${targetLanguage} translation:`, error);
      return content;
    }
  }

  /**
   * Bulk translate content to multiple languages
   */
  async bulkTranslateContent(
    text: string,
    sourceLanguage: string,
    targetLanguages: string[],
    context?: TranslationContext
  ): Promise<MultilingualContent> {
    const content: MultilingualContent = {
      [sourceLanguage]: text
    };

    try {
      const bulkResult = await this.translationService.bulkTranslate(
        [text],
        sourceLanguage,
        targetLanguages
      );

      if (bulkResult.translations.length > 0) {
        const translations = bulkResult.translations[0].translations;
        Object.assign(content, translations);
      }
    } catch (error) {
      console.warn('Bulk translation failed, falling back to individual translations:', error);
      
      // Fallback to individual translations
      for (const targetLanguage of targetLanguages) {
        try {
          content[targetLanguage] = await this.translationService.translateText(
            text,
            sourceLanguage,
            targetLanguage,
            context
          );
        } catch (individualError) {
          console.warn(`Individual translation to ${targetLanguage} failed:`, individualError);
        }
      }
    }

    return content;
  }

  /**
   * Validate multilingual content structure
   */
  validateMultilingualContent(content: any): content is MultilingualContent {
    if (!content || typeof content !== 'object') {
      return false;
    }

    // Check if all values are strings
    return Object.values(content).every(value => typeof value === 'string');
  }

  /**
   * Clean up multilingual content by removing empty translations
   */
  cleanMultilingualContent(content: MultilingualContent): MultilingualContent {
    const cleaned: MultilingualContent = {};
    
    for (const [language, text] of Object.entries(content)) {
      if (text && text.trim().length > 0) {
        cleaned[language] = text.trim();
      }
    }

    return cleaned;
  }

  /**
   * Get available languages in content
   */
  getAvailableLanguages(content: MultilingualContent): string[] {
    return Object.keys(content).filter(lang => content[lang] && content[lang].trim().length > 0);
  }

  /**
   * Check if content is missing translations
   */
  getMissingLanguages(content: MultilingualContent): string[] {
    const available = this.getAvailableLanguages(content);
    return this.supportedLanguages.filter(lang => !available.includes(lang));
  }

  private findBestSourceLanguage(content: MultilingualContent): string | null {
    // Prefer default language
    if (content[this.defaultLanguage]) {
      return this.defaultLanguage;
    }

    // Prefer supported languages
    for (const lang of this.supportedLanguages) {
      if (content[lang]) {
        return lang;
      }
    }

    // Use any available language
    const available = Object.keys(content);
    return available.length > 0 ? available[0] : null;
  }
}

// Default configuration for TradeLink
const DEFAULT_CONFIG: MultilingualServiceOptions = {
  supportedLanguages: ['en', 'hi', 'es', 'fr', 'ar', 'zh', 'pt', 'ru', 'ja', 'de'],
  defaultLanguage: 'en',
  autoTranslate: true
};

// Singleton instance
let multilingualService: MultilingualService | null = null;

export const getMultilingualService = (config?: Partial<MultilingualServiceOptions>): MultilingualService => {
  if (!multilingualService) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    multilingualService = new MultilingualService(finalConfig);
  }
  return multilingualService;
};