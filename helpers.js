/**
 * Advanced utility to extract and normalize salary blocks from raw text.
 */
export function parseSalary(text, defaultCurrency = 'USD') {
    if (!text) return null;

    // Production-ready regex matrix matching standard ATS formats
    const salaryRegex = /(?:[\$\€\£]|USD|EUR|GBP)\s*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?k?)\s*(?:-|to|–)\s*(?:[\$\€\£]|USD|EUR|GBP)?\s*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?k?)\s*(?:(?:\/|per|a)\s*(hr|hour|year|yr|annum|month|mo|weekly|week))?/i;
    
    const match = text.match(salaryRegex);
    if (!match) return null;

    let [rawMatchString, rawMin, rawMax, period] = match;
    
    const cleanNum = (str) => {
        if (!str) return 0;
        str = str.toLowerCase().replace(/,/g, '');
        
        // Smart 'k' protection: Only multiply by 1000 if the raw number is small (e.g. 120k vs 120000k)
        if (str.includes('k')) {
            const basicNum = parseFloat(str.replace('k', ''));
            return basicNum < 1000 ? basicNum * 1000 : basicNum;
        }
        return parseFloat(str);
    };

    let min = cleanNum(rawMin);
    let max = cleanNum(rawMax);
    period = period ? period.toLowerCase() : 'year';

    let compType = 'Base';
    let currency = defaultCurrency;
    if (rawMatchString.includes('£') || rawMatchString.includes('GBP')) currency = 'GBP';
    if (rawMatchString.includes('€') || rawMatchString.includes('EUR')) currency = 'EUR';

    // Annualization Normalization Engine Logic
    if (period.startsWith('hr') || period.startsWith('hour')) {
        min = min * 40 * 52;
        max = max * 40 * 52;
        compType = 'Hourly';
    } else if (period.startsWith('m') || period.startsWith('mo')) {
        min = min * 12;
        max = max * 12;
    } else if (period.startsWith('w')) {
        min = min * 52;
        max = max * 52;
    }

        // Drop obvious outlier parsing artifacts (Elevated ceiling to $1,000,000 for US tech bands)
    if (min < 10000 || max > 1000000) return null;

    return {
        hasSalary: true,
        compensationType: compType,
        currency,
        annualizedMin: Math.round(min),
        annualizedMax: Math.round(max),
        rawSalaryString: rawMatchString.trim()
    };
}
