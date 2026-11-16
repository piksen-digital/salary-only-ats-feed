import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { parseSalary } from './helpers.js';

await Actor.init();

const input = await Actor.getInput() || {};
const { 
    startUrls = [], 
    proxyConfiguration,
    maxResults = 10,
    defaultCurrency = 'USD'
} = input;

const proxyConfig = proxyConfiguration ? await Actor.createProxyConfiguration(proxyConfiguration) : undefined;

let savedCount = 0;

const crawler = new CheerioCrawler({
    proxyConfiguration: proxyConfig,
    requestHandler: async ({ request, $, log }) => {
        if (savedCount >= maxResults) {
            log.info(`Reached maximum requested limit of ${maxResults} items. Halting engine stream.`);
            await crawler.autoscaledPool.abort();
            return;
        }

        if (!$) {
            log.warning(`Skipping raw payload: ${request.url} did not return valid HTML.`);
            return;
        }

        const title = $('title').text().trim();
        const pageText = $('body').text().replace(/\s+/g, ' ');
        
        log.info(`Processing: "${title}" (${request.url})`);

        const salaryData = parseSalary(pageText, defaultCurrency);

        if (!salaryData) {
            log.info(`Skipping: No transparent salary range found for ${request.url}`);
            return;
        }

        savedCount++;
        
        // --- 🧼 ADVANCED COMPANY NAME CLEANING MATRIX ---
        let company = $('meta[property="og:site_name"]').attr('content') || 
                      $('meta[property="og:title"]').attr('content') || 
                      title;

        // If the company string fell back to the title, split and isolate the pure name
        if (company.includes(' - ')) {
            company = company.split(' - ')[0]; // Grabs "Waabi" out of "Waabi - Senior Software Engineer..."
        } else if (company.includes(' | ')) {
            company = company.split(' | ')[0];
        } else if (company.includes(' : ')) {
            company = company.split(' : ')[0];
        }
        
        company = company.trim();
        // ------------------------------------------------

        await Actor.pushData({
            url: request.url,
            title,
            company,
            ...salaryData,
            scrapedAt: new Date().toISOString(),
        });

        log.info(`Successfully captured item #${savedCount}: ${title} at ${company}`);
    },
    failedRequestHandler: ({ request, log }) => {
        log.error(`Request ${request.url} failed completely.`);
    },
});

const cleanRequests = startUrls.map(item => {
    if (typeof item === 'string') return { url: item };
    if (item && item.url) return { url: item.url };
    return item;
});

await crawler.run(cleanRequests);
await Actor.exit();
