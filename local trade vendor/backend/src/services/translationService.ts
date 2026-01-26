import Anthropic from '@anthropic-ai/sdk';
import { redisClient } from '../config/redis';

export interface TranslationContext {
  type: 'product' | 'negotiation' | 'general';
  productName?: string;
  negotiationId?: string;
}

export interface BulkTranslationResult {
  translations: Array<{
    original: string;
    translations: Record<string, string>;
  }>;
}

export interface TranslationService {
  translateText(
    text: string,
    fromLanguage: string,
    toLanguage: string,
    context?: TranslationContext
  ): Promise<string>;
  
  detectLanguage(text: string): Promise<string>;
  
  bulkTranslate(
    texts: string[],
    fromLanguage: string,
    toLanguages: string[]
  ): Promise<BulkTranslationResult>;
}

class ClaudeTranslationService implements TranslationService {
  private anthropic: Anthropic;
  private cacheEnabled: boolean;
  
  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.cacheEnabled = !!redisClient.isReady;
  }
  
  async translateText(
    text: string,
    fromLanguage: string,
    toLanguage: string,
    context?: TranslationContext
  ): Promise<string> {
    // Return original text if same language
    if (fromLanguage === toLanguage) {
      return text;
    }
    
    // Check cache first
    const cacheKey = this.getCacheKey(text, fromLanguage, toLanguage, context);
    if (this.cacheEnabled) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        console.warn('Redis cache read error:', error);
      }
    }
    
    const contextInfo = this.buildContextPrompt(context);
    
    const prompt = `Translate the following message from ${fromLanguage} to ${toLanguage}.

${contextInfo}
Maintain a professional yet friendly marketplace tone. Preserve any prices, numbers, or measurements exactly.

Message: "${text}"

Provide ONLY the translation, no explanation or preamble.`;

    try {
      const response = await this.anthropic.completions.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens_to_sample: 500,
        prompt: `Human: ${prompt}\n\nAssistant:`,
      });
      
      const translation = response.completion.trim();
      
      // Cache the result
      if (this.cacheEnabled) {
        try {
          await redisClient.setEx(cacheKey, 3600, translation); // Cache for 1 hour
        } catch (error) {
          console.warn('Redis cache write error:', error);
        }
      }
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation service unavailable');
    }
  }
  
  async detectLanguage(text: string): Promise<string> {
    // Check cache first
    const cacheKey = `lang_detect:${Buffer.from(text).toString('base64').slice(0, 50)}`;
    if (this.cacheEnabled) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        console.warn('Redis cache read error:', error);
      }
    }
    
    const prompt = `Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., "en", "hi", "es", "fr", "ar").

Text: "${text}"

Language code:`;

    try {
      const response = await this.anthropic.completions.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens_to_sample: 10,
        prompt: `Human: ${prompt}\n\nAssistant:`,
      });
      
      const languageCode = response.completion.trim().toLowerCase();
      
      // Validate language code format
      if (!/^[a-z]{2}$/.test(languageCode)) {
        console.warn('Invalid language code detected:', languageCode);
        return 'en'; // Default to English
      }
      
      // Cache the result
      if (this.cacheEnabled) {
        try {
          await redisClient.setEx(cacheKey, 7200, languageCode); // Cache for 2 hours
        } catch (error) {
          console.warn('Redis cache write error:', error);
        }
      }
      
      return languageCode;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English on error
    }
  }
  
  async bulkTranslate(
    texts: string[],
    fromLanguage: string,
    toLanguages: string[]
  ): Promise<BulkTranslationResult> {
    const results: BulkTranslationResult = {
      translations: []
    };
    
    for (const text of texts) {
      const translations: Record<string, string> = {};
      
      for (const toLanguage of toLanguages) {
        try {
          translations[toLanguage] = await this.translateText(text, fromLanguage, toLanguage);
        } catch (error) {
          console.error(`Bulk translation error for ${fromLanguage} -> ${toLanguage}:`, error);
          translations[toLanguage] = text; // Fallback to original text
        }
      }
      
      results.translations.push({
        original: text,
        translations
      });
    }
    
    return results;
  }
  
  private buildContextPrompt(context?: TranslationContext): string {
    if (!context) return 'This is a marketplace conversation between a buyer and vendor.';
    
    switch (context.type) {
      case 'product':
        return `This message is about "${context.productName}" in a product inquiry.`;
      case 'negotiation':
        return `This message is part of a price negotiation.`;
      default:
        return 'This is a marketplace conversation between a buyer and vendor.';
    }
  }
  
  private getCacheKey(
    text: string,
    fromLanguage: string,
    toLanguage: string,
    context?: TranslationContext
  ): string {
    const contextStr = context ? `${context.type}:${context.productName || context.negotiationId || ''}` : 'general';
    const textHash = Buffer.from(text).toString('base64').slice(0, 50);
    return `translation:${fromLanguage}:${toLanguage}:${contextStr}:${textHash}`;
  }
}

// Singleton instance
let translationService: TranslationService | null = null;

export const getTranslationService = (): TranslationService => {
  if (!translationService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    translationService = new ClaudeTranslationService(apiKey);
  }
  return translationService;
};

export { ClaudeTranslationService };