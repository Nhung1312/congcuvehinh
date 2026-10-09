<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0c24a840-c52c-428d-8c1d-7d12486f5b1e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Gemini 3.8 Flash API key

- **Google AI Studio Build:** Open your project and go to **Settings → Secrets**. AI Studio usually injects `GEMINI_API_KEY` automatically; if it does not exist, add it as a server-side secret.
- **Local development:** Create a `.env.local` file in the project root with `GEMINI_API_KEY=your_private_key`, then run `npm run dev`. The server loads `.env.local` and `.env`; existing environment variables keep precedence.
- **Do not commit or paste your key into GitHub/source code.**
- The preferred Gemini model is `gemini-3.8-flash`. If no key is configured or the API fails, the existing Vietnamese rule-based parser remains a fallback. A diagram drawn in fallback mode does not confirm a successful Gemini API call.
- Gemini 3.8 Flash helps understand prompts but complex construction problems still require supported geometric relationships in the specification and renderer.
