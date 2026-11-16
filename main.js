import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { parseSalary } from './helpers.js';

await Actor.init();

// 1. Structure the input parameters
const input = await Actor.getInput() || {};
const { 
    startUrls = [], 
    proxyConfiguration,
    defaultCurrency = 'USD'
} = input;

const proxyConfig = await Actor.createProxyConfiguration(proxyConfiguration);

// 2. Initialize the Crawler
const crawler = new CheerioCrawler({
    proxyConfiguration: proxyConfig,
    requestHandler: async ({ request, $, log }) => {
        const title = $('title').text().trim();
        const pageText = $('body').text();
        
        log.info(`Processing: ${title} (${request.url})`);

        // 3. Extract and normalize salary data
        const salaryData = parseSalary(pageText, defaultCurrency);

        // 4. Drop the job if no salary data is explicitly published
        if (!salaryData) {
            log.info(`Skipping: No salary range found for ${request.url}`);
            return;
        }

        // 5. Push clean, normalized data to the Apify dataset
        await Actor.pushData({
            url: request.url,
            title,
            company: $('meta[property="og:site_name"]').attr('content') || 'Unknown',
            ...salaryData,
            scrapedAt: new Date().toISOString(),
        });
    },
    failedRequestHandler: ({ request, log }) => {
        log.error(`Request ${request.url} failed completely.`);
    },
});

await crawler.run(startUrls.map(url => ({ url })));
await Actor.exit();
