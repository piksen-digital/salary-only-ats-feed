# Salary-Range-Only ATS Job Feed

A high-signal data pipeline built for Apify that extracts and normalizes structured job postings from major ATS platforms (Greenhouse, Lever, Workday). 

**This Actor filters out the noise: it returns only job listings that explicitly publish a transparent salary range.**

## 🎯 Value Proposition
* **Zero Noise:** Drops any listing missing explicit compensation details.
* **Unified Normalization:** Standardizes hourly, monthly, or fragmented salary quotes into uniform Annualized Min/Max figures.
* **Regulatory Compliance:** Ideal for building pay-transparency aggregators, recruiter feeds, and compensation analytics tools.

## 📁 Repository Structure
```text
├── .dockerignore
├── .gitignore
├── README.md
├── actor.json        # Apify manifest & input UI layout
├── Dockerfile        # Production runtime container configuration
├── main.js           # Core scraping orchestration
└── helpers.js        # Salary extraction & normalization logic
```

## 🛠️ Local Development & Testing

### Prerequisites
Ensure you have the Apify CLI installed globally:
```bash
npm install -g apify-cli
```

### Running Locally inside GitHub Codespaces
1. Clone the repository and navigate to the root directory.
2. Authenticate with your platform account:
   ```bash
   apify login
   ```
3. Run the actor locally to verify data streams:
   ```bash
   apify run
   ```

## 📈 Input Schema Configuration
Configure execution settings inside `storage/key_value_stores/default/INPUT.json`:
```json
{
    "startUrls": [
        { "url": "https://lever.co" }
    ],
    "defaultCurrency": "USD"
}
```
