/**
 * Utility functions for extracting and highlighting price information from text
 */

export interface ExtractedPrice {
  amount: number;
  currency?: string;
  position: { start: number; end: number };
  originalText: string;
}

/**
 * Extract price information from text
 * Supports various formats:
 * - "50 dollars", "50 USD", "$50"
 * - "twenty five dollars", "25.50 euros"
 * - "offer 100", "price is 50"
 */
export const extractPrices = (text: string): ExtractedPrice[] => {
  const prices: ExtractedPrice[] = [];

  // Currency symbols and names
  const currencyPatterns = [
    { symbol: '$', name: 'dollar', code: 'USD' },
    { symbol: '€', name: 'euro', code: 'EUR' },
    { symbol: '£', name: 'pound', code: 'GBP' },
    { symbol: '¥', name: 'yen', code: 'JPY' },
    { symbol: '₹', name: 'rupee', code: 'INR' },
  ];

  // Pattern 1: Currency symbol followed by number ($50, €25.50)
  const symbolPattern = /([€$£¥₹])\s*(\d+(?:\.\d{1,2})?)/gi;
  let match;
  
  while ((match = symbolPattern.exec(text)) !== null) {
    const symbol = match[1];
    const amount = parseFloat(match[2]);
    const currency = currencyPatterns.find(c => c.symbol === symbol);
    
    prices.push({
      amount,
      currency: currency?.code,
      position: { start: match.index, end: match.index + match[0].length },
      originalText: match[0]
    });
  }

  // Pattern 2: Number followed by currency name (50 dollars, 25.50 euros)
  const namePattern = /(\d+(?:\.\d{1,2})?)\s*(dollars?|euros?|pounds?|rupees?|yen|usd|eur|gbp|jpy|inr)/gi;
  
  while ((match = namePattern.exec(text)) !== null) {
    const amount = parseFloat(match[1]);
    const currencyText = match[2].toLowerCase();
    
    let currencyCode: string | undefined;
    for (const curr of currencyPatterns) {
      if (currencyText.includes(curr.name) || currencyText === curr.code.toLowerCase()) {
        currencyCode = curr.code;
        break;
      }
    }
    
    // Check if this position overlaps with already found prices
    const overlaps = prices.some(p => 
      match!.index >= p.position.start && match!.index < p.position.end
    );
    
    if (!overlaps) {
      prices.push({
        amount,
        currency: currencyCode,
        position: { start: match.index, end: match.index + match[0].length },
        originalText: match[0]
      });
    }
  }

  // Pattern 3: Price context words followed by number (offer 100, price is 50)
  const contextPattern = /(?:offer|price|cost|pay|worth|value)\s+(?:is|of)?\s*(\d+(?:\.\d{1,2})?)/gi;
  
  while ((match = contextPattern.exec(text)) !== null) {
    const amount = parseFloat(match[1]);
    
    // Check if this position overlaps with already found prices
    const overlaps = prices.some(p => 
      match!.index >= p.position.start && match!.index < p.position.end
    );
    
    if (!overlaps) {
      prices.push({
        amount,
        position: { start: match.index, end: match.index + match[0].length },
        originalText: match[0]
      });
    }
  }

  // Pattern 4: Standalone numbers that might be prices (in context)
  // Only if we haven't found any prices yet and the text contains price-related words
  if (prices.length === 0 && /\b(offer|price|cost|pay|buy|sell)\b/i.test(text)) {
    const numberPattern = /\b(\d+(?:\.\d{1,2})?)\b/g;
    
    while ((match = numberPattern.exec(text)) !== null) {
      const amount = parseFloat(match[1]);
      
      // Only consider reasonable price amounts (not years, quantities, etc.)
      if (amount >= 0.01 && amount <= 1000000) {
        prices.push({
          amount,
          position: { start: match.index, end: match.index + match[0].length },
          originalText: match[0]
        });
      }
    }
  }

  // Sort by position in text
  return prices.sort((a, b) => a.position.start - b.position.start);
};

/**
 * Highlight prices in text with HTML markup
 */
export const highlightPrices = (text: string, className: string = 'price-highlight'): string => {
  const prices = extractPrices(text);
  
  if (prices.length === 0) {
    return text;
  }

  let result = '';
  let lastIndex = 0;

  for (const price of prices) {
    // Add text before the price
    result += text.substring(lastIndex, price.position.start);
    
    // Add highlighted price
    result += `<span class="${className}" data-amount="${price.amount}" data-currency="${price.currency || ''}">${price.originalText}</span>`;
    
    lastIndex = price.position.end;
  }

  // Add remaining text
  result += text.substring(lastIndex);

  return result;
};

/**
 * Get the most likely price from extracted prices
 * Prioritizes prices with currency information and larger amounts
 */
export const getPrimaryPrice = (prices: ExtractedPrice[]): ExtractedPrice | null => {
  if (prices.length === 0) return null;
  if (prices.length === 1) return prices[0];

  // Prioritize prices with currency
  const withCurrency = prices.filter(p => p.currency);
  if (withCurrency.length > 0) {
    return withCurrency[0];
  }

  // Return the first price found
  return prices[0];
};

/**
 * Format price for display
 */
export const formatPrice = (price: ExtractedPrice, defaultCurrency: string = 'USD'): string => {
  const currency = price.currency || defaultCurrency;
  const amount = price.amount.toFixed(2);
  
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹'
  };

  const symbol = currencySymbols[currency] || currency;
  
  return `${symbol}${amount}`;
};
