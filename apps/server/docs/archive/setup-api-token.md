# Cloudflare API Token Setup for R2 REST API

## Creating the API Token

Since wrangler CLI doesn't support creating API tokens programmatically, you need to create one manually:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Custom token" template
4. Configure the token:

   **Token name:** `Tides R2 API Token`

   **Permissions:**
   - `Zone:Zone:Read` (for account access)
   - `Account:Cloudflare R2:Edit` (for R2 operations)

   **Account resources:**
   - Include: `Mpazbot@gmail.com's Account`

   **Zone resources:**
   - Include: `All zones`

5. Click "Continue to summary" then "Create Token"
6. Copy the token (it starts with something like `aBcDeFgHiJkLmNoPqRsTuVwXyZ...`)

## Setting the Token in Wrangler

Once you have the token, set it as a secret:

```bash
cd /Users/mpaz/workspace/tides

# Set the API token as a secret (replace YOUR_TOKEN with the actual token)
npx wrangler secret put CLOUDFLARE_API_TOKEN

# When prompted, paste your token and press Enter
```

## Verifying the Setup

After setting the token, you can test the deployment:

```bash
# Test the configuration
npx wrangler deploy --dry-run

# Deploy when ready
npm run deploy
```

## Current Configuration

The application is configured to use:

- **Account ID:** `01bfa3fc31e4462e21428e9ca7d63e98`
- **R2 Bucket:** `tides-storage`
- **API Token:** Set via `CLOUDFLARE_API_TOKEN` secret

## Storage Priority

The storage system will try in this order:

1. **R2 REST API** (if `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `R2_BUCKET_NAME` are available)
2. **R2 Binding** (if `TIDES_R2` binding works - currently disabled)
3. **KV Storage** (if `TIDES_KV` binding works - currently disabled)
4. **Mock Storage** (fallback for development)
