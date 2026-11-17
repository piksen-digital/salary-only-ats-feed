import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';
import { parseSalary } from './helpers.js';

await Actor.init();

const input = (await Actor.getInput()) || {};
const {
    startUrls = [],
    proxyConfiguration,
    maxResults = 10,
    defaultCurrency = 'USD',
} = input;

const proxyConfig = proxyConfiguration
    ? await Actor.createProxyConfiguration(proxyConfiguration)
    : undefined;

let savedCount = 0;

// Pages that are job boards / listing pages rather than single postings.
const BOARD_URL_PATTERN = /boards\.greenhouse\.io|job-boards\.greenhouse\.io|jobs\.lever\.co|jobs\.workable\.com|jobs\.ashbyhq\.com|jobs\.smartrecruiters\.com/i;

// Selectors that capture "view job" links on the major ATS board layouts.
const JOB_LINK_SELECTOR = [
    'a[href*="/jobs/"]',       // Greenhouse, Workable, SmartRecruiters
    'a[href*="/positions/"]',  // Greenhouse legacy boards
    'a.posting-title',         // Lever boards
    'a[href*="/postings/"]',   // Ashby
].join(', ');

const crawler = new CheerioCrawler({
    proxyConfiguration: proxyConfig,
    requestHandler: async ({ request, $, log, enqueueLinks }) => {
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
            // Board / listing pages carry no salary themselves. Discover and
            // enqueue the individual job posting links they contain.
            if (BOARD_URL_PATTERN.test(request.url)) {
                const { processedRequests } = await enqueueLinks({
                    $,
                    selector: JOB_LINK_SELECTOR,
                    strategy: 'same-domain',
                });
                log.info(`Board page detected: enqueued ${processedRequests?.length || 0} job posting links from ${request.url}`);
            } else {
                log.info(`Skipping: No transparent salary range found for ${request.url}`);
            }
            return;
        }

        savedCount++;

        // --- ADVANCED COMPANY NAME CLEANING MATRIX ---
        let company = $('meta[property="og:site_name"]').attr('content')
            || $('meta[property="og:title"]').attr('content')
            || title;

        if (company.includes(' - ')) {
            company = company.split(' - ')[0];
        } else if (company.includes(' | ')) {
            company = company.split(' | ')[0];
        } else if (company.includes(' : ')) {
            company = company.split(' : ')[0];
        }

        company = company.trim();
        // ---------------------------------------------

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

const cleanRequests = startUrls
    .map((item) => {
        if (typeof item === 'string') return { url: item };
        if (item && item.url) return { url: item.url };
        return item;
    })
    .filter((r) => r && r.url);

if (cleanRequests.length === 0) {
    throw new Error('No valid startUrls provided in the actor input.');
}

await crawler.run(cleanRequests);
await Actor.exit();
