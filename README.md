# Path of Exile News Bot

A Discord bot that monitors the Path of Exile RSS feed and posts new articles to your Discord channel.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Discord webhook:**
   - Create a webhook in your Discord channel (Server Settings > Integrations > Webhooks)
   - Copy the webhook URL
   - Edit `config.json` and replace `YOUR_DISCORD_WEBHOOK_URL_HERE` with your webhook URL

3. **Test configuration:**
   ```bash
   npm run check-config
   ```

4. **Run the bot:**
   ```bash
   npm start
   ```

## Configuration

Edit `config.json` to customize:

- `discord.webhookUrl`: Your Discord webhook URL
- `rss.pollIntervalMinutes`: How often to check for new posts (default: 10 minutes)
- `storage.filename`: File to store posted article history

## Features

- ✅ Monitors Path of Exile RSS feed every 10 minutes (configurable)
- ✅ Posts new articles to Discord with rich embeds
- ✅ Prevents duplicate posts by tracking posted articles
- ✅ Respectful polling with configurable intervals
- ✅ Error handling and logging
- ✅ Persists posted article history across restarts

## Docker Usage

### Using Docker Hub Image

```bash
# Create a data directory for persistent storage
mkdir poe-bot-data

# Run the container
docker run -d \
  --name poe-news-bot \
  -v $(pwd)/poe-bot-data:/app/data \
  -e DISCORD_WEBHOOK_URL="your_webhook_url_here" \
  callmebeachy/poe-news-bot

# For testing - posts latest article immediately without @everyone
docker run -d \
  --name poe-news-bot \
  -v $(pwd)/poe-bot-data:/app/data \
  -e DISCORD_WEBHOOK_URL="your_webhook_url_here" \
  -e POST_LATEST_ON_START="true" \
  -e PING_EVERYONE="false" \
  callmebeachy/poe-news-bot
```

### Building Locally

```bash
# Build the image
docker build -t poe-news-bot .

# Run the container
docker run -d \
  --name poe-news-bot \
  -v $(pwd)/data:/app/data \
  -e DISCORD_WEBHOOK_URL="your_webhook_url_here" \
  poe-news-bot
```

### Environment Variables

- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL (required)
- `POLL_INTERVAL_MINUTES`: How often to check for updates (default: 10)
- `POST_LATEST_ON_START`: Set to `true` to post the latest article on startup for testing (default: false)
- `PING_EVERYONE`: Set to `false` to disable @everyone mentions during testing (default: true)

## Running on Unraid

### Option 1: Docker (Recommended)
1. Go to Docker tab in Unraid
2. Add Container
3. Use image: `callmebeachy/poe-news-bot`
4. Add environment variable `DISCORD_WEBHOOK_URL` with your webhook
5. Map `/app/data` to `/mnt/user/appdata/poe-news-bot`

### Option 2: Manual Installation
1. Create a user script or use Community Applications
2. Install Node.js if not available
3. Clone/copy this bot to your preferred location
4. Configure the webhook URL
5. Set up as a scheduled task or daemon

The bot uses a 10-minute polling interval by default to be respectful to the RSS feed.

## Docker Hub

The bot is available on Docker Hub at: `callmebeachy/poe-news-bot`