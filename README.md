# Salary-Range-Only ATS Job Feed

A high-signal data pipeline built for Apify that extracts and normalizes structured job postings from major ATS platforms (Greenhouse, Lever, Workday).

**This Actor filters out the noise: it returns only job listings that explicitly publish a transparent salary range.**

## 🎯 Value Proposition

*   **Zero Noise:** Drops any listing missing explicit compensation details.
*   **Unified Normalization:** Standardizes hourly, monthly, or fragmented salary quotes into uniform Annualized Min/Max figures.
*   **Regulatory Compliance:** Ideal for building pay-transparency aggregators, recruiter feeds, and compensation analytics tools.

## 📁 Repository Structure

```
├── .actor/
│   ├── actor.json         # Apify manifest (points to the input schema)
│   └── input_schema.json  # Input form definition rendered by Apify Console
├── .dockerignore
├── .gitignore
├── README.md
├── Dockerfile             # Production runtime container configuration
├── main.js                # Core scraping orchestration
├── helpers.js             # Salary extraction & normalization logic
└── package.json
```

## 🛠️ Local Development & Testing

### Prerequisites

Ensure you have the Apify CLI installed globally:

```
npm install -g apify-cli
```

### Running Locally inside GitHub Codespaces

1.  Clone the repository and navigate to the root directory.
2.  Authenticate with your platform account:

    ```
    apify login
    ```

3.  Run the actor locally to verify data streams:

    ```
    apify run
    ```

## 📈 Input Schema Configuration

The Input form in Apify Console is generated from `.actor/input_schema.json`. It accepts:

*   **ATS Board or Job URLs** (`startUrls`): links to individual job postings **or** company job board pages (e.g. `https://boards.greenhouse.io/acme` or `https://jobs.lever.co/acme`). Board pages are automatically scanned and their job posting links are enqueued.
*   **Maximum Paid Items** (`maxResults`): stop after this many listings (default `10`).
*   **Default Currency Fallback** (`defaultCurrency`): used when no currency symbol is found on the page (default `USD`).

Example raw input:

```
{
    "startUrls": [
        { "url": "https://boards.greenhouse.io/acme" }
    ],
    "maxResults": 10,
    "defaultCurrency": "USD"
}
```

> **Note:** Workday-hosted boards render client-side and require a headless browser, while this actor uses Cheerio (static HTML). Prefer Greenhouse and Lever URLs for best results.
