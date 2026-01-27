# Add Anthropic API Key

Run this command and paste your full Anthropic API key when prompted:

```bash
vercel env add ANTHROPIC_API_KEY production
```

When prompted, paste your key that starts with: `sk-ant-api03-`

After adding the key, run:
```bash
vercel --prod
```

This will redeploy with all environment variables including the backend API!
