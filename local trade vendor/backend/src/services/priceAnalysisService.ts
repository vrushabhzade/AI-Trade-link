import Anthropic from '@anthropic-ai/sdk';
import { redisClient } from '../config/redis';
import { prisma } from '../config/database';
import { Product } from '@prisma/client';

export interface MarketData {
  competitorPrices: Array<{
    vendorId: string;
    price: number;
    currency: string;
    distance?: number;
  }>;
  historicalSales: Array<{
    price: number;
    quantity: number;
    date: Date;
  }>;
  localAverage: number;
  seasonality: 'high' | 'medium' | 'low';
  demandScore: number;
}

export interface PriceAnalysis {
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidenceScore: number;
  reasoning: string;
  negotiationRange: {
    min: number;
    max: number;
  };
  marketInsights: {
    competitorCount: number;
    averageCompetitorPrice: number;
    pricePosition: 'below' | 'at' | 'above';
    demandLevel: 'low' | 'medium' | 'high';
  };
}

export interface PriceRecommendationRequest {
  productId: string;
  category: string;
  basePrice: number;
  currency: string;
  location?: [number, number]; // [longitude, latitude]
  radiusKm?: number;
}

export interface CounterOfferSuggestion {
  suggestedPrice: number;
  messageTemplate: string;
  acceptanceProbability: number;
  rationale: string;
  alternativeSuggestions: string[];
}

export interface NegotiationContext {
  productId: string;
  currentOffer: number;
  initialPrice: number;
  negotiationHistory: Array<{
    price: number;
    timestamp: Date;
    fromBuyer: boolean;
  }>;
  buyerLanguage: string;
  vendorLanguage: string;
}

class PriceAnalysisService {
  private anthropic: Anthropic;
  private cacheEnabled: boolean;
  
  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.cacheEnabled = !!redisClient.isReady;
  }

  /**
   * Collect market data for a product
   */
  async collectMarketData(request: PriceRecommendationRequest): Promise<MarketData> {
    const { category, location, radiusKm = 10 } = request;
    
    // Get competitor prices from similar products
    const competitorPrices = await this.getCompetitorPrices(category, location, radiusKm);
    
    // Get historical sales data (mock for now - would integrate with actual sales data)
    const historicalSales = await this.getHistoricalSales(category);
    
    // Calculate local average
    const localAverage = competitorPrices.length > 0 
      ? competitorPrices.reduce((sum, p) => sum + p.price, 0) / competitorPrices.length
      : 0;
    
    // Determine seasonality (simplified logic)
    const seasonality = this.determineSeasonality(category);
    
    // Calculate demand score based on various factors
    const demandScore = this.calculateDemandScore(competitorPrices, historicalSales, seasonality);
    
    return {
      competitorPrices,
      historicalSales,
      localAverage,
      seasonality,
      demandScore
    };
  }

  /**
   * Analyze pricing using AI and market data
   */
  async analyzePricing(
    productData: Product,
    marketData: MarketData
  ): Promise<PriceAnalysis> {
    // Check cache first
    const cacheKey = this.getPricingCacheKey(productData.id, marketData);
    if (this.cacheEnabled) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn('Redis cache read error:', error);
      }
    }

    const prompt = `You are a pricing analyst for a local marketplace platform. Analyze the following data and provide pricing recommendations.

PRODUCT INFORMATION:
- Name: ${this.getProductName(productData)}
- Category: ${productData.category}
- Current Listed Price: ${productData.basePrice} ${productData.currency}
- Unit: ${productData.unit}
- Quantity Available: ${productData.quantityAvailable}

MARKET DATA:
- Competitor Prices: ${JSON.stringify(marketData.competitorPrices)}
- Historical Sales: ${JSON.stringify(marketData.historicalSales)}
- Local Average: ${marketData.localAverage} ${productData.currency}
- Seasonal Demand: ${marketData.seasonality}
- Demand Score: ${marketData.demandScore}/100

Please provide a JSON response with:
1. recommended_price: Optimal price point
2. min_price: Minimum acceptable price (vendor's bottom line, should be at least 70% of recommended)
3. max_price: Maximum market price (should not exceed 150% of recommended)
4. confidence_score: How confident you are (0-100)
5. reasoning: Brief explanation of the recommendation
6. negotiation_range: {min: number, max: number} - suggested range for negotiations
7. market_insights: {
   competitor_count: number,
   average_competitor_price: number,
   price_position: "below" | "at" | "above" (compared to market average),
   demand_level: "low" | "medium" | "high"
}

Consider:
- Competitive positioning
- Local market conditions
- Seasonal factors
- Product availability
- Historical performance

Format as valid JSON only, no markdown or explanations outside the JSON.`;

    try {
      const response = await this.anthropic.completions.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens_to_sample: 1000,
        prompt: `Human: ${prompt}\n\nAssistant:`,
      });
      
      const jsonText = response.completion
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const analysisData = JSON.parse(jsonText);
      
      // Validate and structure the response
      const analysis: PriceAnalysis = {
        recommendedPrice: analysisData.recommended_price,
        minPrice: analysisData.min_price,
        maxPrice: analysisData.max_price,
        confidenceScore: analysisData.confidence_score,
        reasoning: analysisData.reasoning,
        negotiationRange: {
          min: analysisData.negotiation_range.min,
          max: analysisData.negotiation_range.max
        },
        marketInsights: {
          competitorCount: analysisData.market_insights.competitor_count,
          averageCompetitorPrice: analysisData.market_insights.average_competitor_price,
          pricePosition: analysisData.market_insights.price_position,
          demandLevel: analysisData.market_insights.demand_level
        }
      };
      
      // Cache the result for 30 minutes
      if (this.cacheEnabled) {
        try {
          await redisClient.setEx(cacheKey, 1800, JSON.stringify(analysis));
        } catch (error) {
          console.warn('Redis cache write error:', error);
        }
      }
      
      return analysis;
    } catch (error) {
      console.error('Price analysis error:', error);
      throw new Error('Price analysis service unavailable');
    }
  }

  /**
   * Suggest counter-offer during negotiation
   */
  async suggestCounterOffer(context: NegotiationContext): Promise<CounterOfferSuggestion> {
    const product = await prisma.product.findUnique({
      where: { id: context.productId },
      include: {
        vendor: {
          include: {
            user: true
          }
        }
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get market data for context
    const marketData = await this.collectMarketData({
      productId: context.productId,
      category: product.category,
      basePrice: parseFloat(product.basePrice.toString()),
      currency: product.currency
    });

    const prompt = `You are a negotiation assistant for a marketplace vendor. Analyze the negotiation context and suggest a counter-offer strategy.

PRODUCT CONTEXT:
- Product: ${this.getProductName(product)}
- Listed Price: ${product.basePrice} ${product.currency}
- Category: ${product.category}

NEGOTIATION CONTEXT:
- Initial Price: ${context.initialPrice} ${product.currency}
- Current Offer: ${context.currentOffer} ${product.currency}
- Negotiation History: ${JSON.stringify(context.negotiationHistory)}

MARKET CONTEXT:
- Local Average Price: ${marketData.localAverage} ${product.currency}
- Competitor Count: ${marketData.competitorPrices.length}
- Demand Level: ${marketData.seasonality}

Please provide a JSON response with:
1. suggested_price: Recommended counter-offer amount
2. message_template: Friendly message template for the vendor to use
3. acceptance_probability: Estimated probability (0-100) that buyer will accept
4. rationale: Brief explanation of the strategy
5. alternative_suggestions: Array of 2-3 alternative approaches

Consider:
- Market positioning
- Negotiation momentum
- Relationship building
- Fair pricing principles

The message should be professional, friendly, and in English (will be translated later).

Format as valid JSON only.`;

    try {
      const response = await this.anthropic.completions.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens_to_sample: 800,
        prompt: `Human: ${prompt}\n\nAssistant:`,
      });
      
      const jsonText = response.completion
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const suggestionData = JSON.parse(jsonText);
      
      return {
        suggestedPrice: suggestionData.suggested_price,
        messageTemplate: suggestionData.message_template,
        acceptanceProbability: suggestionData.acceptance_probability,
        rationale: suggestionData.rationale,
        alternativeSuggestions: suggestionData.alternative_suggestions
      };
    } catch (error) {
      console.error('Counter-offer suggestion error:', error);
      throw new Error('Negotiation assistance service unavailable');
    }
  }

  /**
   * Get pricing recommendations for a product
   */
  async getPricingRecommendations(request: PriceRecommendationRequest): Promise<PriceAnalysis> {
    const product = await prisma.product.findUnique({
      where: { id: request.productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const marketData = await this.collectMarketData(request);
    return this.analyzePricing(product, marketData);
  }

  /**
   * Get competitor prices for similar products
   */
  private async getCompetitorPrices(
    category: string, 
    location?: [number, number], 
    radiusKm: number = 10
  ): Promise<MarketData['competitorPrices']> {
    let query = `
      SELECT p.base_price as price, p.currency, p.vendor_id as "vendorId"
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      WHERE p.category = $1 AND p.is_active = true
    `;
    
    const params: any[] = [category];
    
    if (location) {
      query += ` AND ST_DWithin(v.location, ST_Point($2, $3), $4)`;
      params.push(location[0], location[1], radiusKm * 1000); // Convert km to meters
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT 20`;
    
    try {
      const results = await prisma.$queryRawUnsafe(query, ...params) as Array<{
        price: number;
        currency: string;
        vendorId: string;
      }>;
      
      return results.map(r => ({
        vendorId: r.vendorId,
        price: r.price,
        currency: r.currency
      }));
    } catch (error) {
      console.error('Error fetching competitor prices:', error);
      return [];
    }
  }

  /**
   * Get historical sales data (mock implementation)
   */
  private async getHistoricalSales(category: string): Promise<MarketData['historicalSales']> {
    // This would integrate with actual transaction/sales data
    // For now, return mock data based on category
    const mockData = [
      { price: 10, quantity: 5, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { price: 12, quantity: 3, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      { price: 11, quantity: 8, date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) }
    ];
    
    return mockData;
  }

  /**
   * Determine seasonality based on category
   */
  private determineSeasonality(category: string): MarketData['seasonality'] {
    const currentMonth = new Date().getMonth();
    
    // Simplified seasonality logic
    const seasonalCategories: Record<string, number[]> = {
      'food': [5, 6, 7, 8], // Summer months
      'clothing': [2, 3, 9, 10], // Spring and fall
      'electronics': [10, 11], // Holiday season
    };
    
    const highSeasonMonths = seasonalCategories[category.toLowerCase()] || [];
    
    if (highSeasonMonths.includes(currentMonth)) {
      return 'high';
    } else if (highSeasonMonths.some(month => Math.abs(month - currentMonth) <= 1)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate demand score based on market factors
   */
  private calculateDemandScore(
    competitorPrices: MarketData['competitorPrices'],
    historicalSales: MarketData['historicalSales'],
    seasonality: MarketData['seasonality']
  ): number {
    let score = 50; // Base score
    
    // Adjust based on competition
    if (competitorPrices.length > 10) {
      score -= 10; // High competition
    } else if (competitorPrices.length < 3) {
      score += 15; // Low competition
    }
    
    // Adjust based on historical sales
    const recentSales = historicalSales.filter(
      sale => sale.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    score += Math.min(recentSales.length * 5, 20);
    
    // Adjust based on seasonality
    switch (seasonality) {
      case 'high':
        score += 20;
        break;
      case 'medium':
        score += 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get product name from multilingual content
   */
  private getProductName(product: Product): string {
    const nameContent = product.name as Record<string, string>;
    return nameContent.en || nameContent[Object.keys(nameContent)[0]] || 'Unknown Product';
  }

  /**
   * Generate cache key for pricing analysis
   */
  private getPricingCacheKey(productId: string, marketData: MarketData): string {
    const marketHash = Buffer.from(JSON.stringify({
      competitorCount: marketData.competitorPrices.length,
      localAverage: marketData.localAverage,
      seasonality: marketData.seasonality,
      demandScore: marketData.demandScore
    })).toString('base64').slice(0, 20);
    
    return `price_analysis:${productId}:${marketHash}`;
  }
}

// Singleton instance
let priceAnalysisService: PriceAnalysisService | null = null;

export const getPriceAnalysisService = (): PriceAnalysisService => {
  if (!priceAnalysisService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    priceAnalysisService = new PriceAnalysisService(apiKey);
  }
  return priceAnalysisService;
};

export { PriceAnalysisService };