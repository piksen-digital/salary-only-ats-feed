/**
 * Simple, powerful utility to extract and normalize salary blocks.
 * In a production scaling phase, this can be hooked into an LLM tool.
 */
export function parseSalary(text, defaultCurrency = 'USD') {
    // Look for patterns like $90,000 - $120,000, $150k, or £60/hr
    const salaryRegex = /(?:[\$\€\£]|USD|EUR|GBP)\s*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?k?)\s*(?:-|to)\s*(?:[\$\€\£]|USD|EUR|GBP)?\s*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?k?)\s*(?:\/\s*(hr|hour|year|yr|annum|month|mo))?/i;
    
    const match = text.match(salaryRegex);
    if (!match) return null;

    let [_, rawMin, rawMax, period] = match;
    
    // Clean strings and handle 'k' notation
    const cleanNum = (str) => {
        str = str.toLowerCase().replace(/,/g, '');
        if (str.includes('k')) {
            return parseFloat(str.replace('k', '')) * 1000;
        }
        return parseFloat(str);
    };

    let min = cleanNum(rawMin);
    let max = cleanNum(rawMax);
    period = period ? period.toLowerCase() : 'year';

    let compType = 'Base';
    let currency = defaultCurrency;
    if (text.includes('£') || text.includes('GBP')) currency = 'GBP';
    if (text.includes('€') || text.includes('EUR')) currency = 'EUR';

    // Normalize everything strictly to Annual
    if (period.startsWith('hr') || period.startsWith('hour')) {
        min = min * 40 * 52; // Standard 2080 hour year
        max = max * 40 * 52;
        compType = 'Hourly';
    } else if (period.startsWith('m') || period.startsWith('mo')) {
        min = min * 12;
        max = max * 12;
    }

    // Sanity check to avoid false positives on random metrics
    if (min < 15000 || max > 1000000) return null;

    return {
        hasSalary: true,
        compensationType: compType,
        currency,
        annualizedMin: Math.round(min),
        annualizedMax: Math.round(max),
        rawSalaryString: match[0].trim()
    };
}
