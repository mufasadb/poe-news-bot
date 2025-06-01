import Parser from 'rss-parser';
import fetch from 'node-fetch';
import cron from 'node-cron';
import fs from 'fs/promises';
import { readFileSync } from 'fs';

class PoeNewsBot {
  constructor() {
    this.config = this.loadConfig();
    this.parser = new Parser();
    this.postedArticles = new Set();
    this.init();
  }

  loadConfig() {
    const config = JSON.parse(readFileSync('./config.json', 'utf8'));
    
    if (process.env.DISCORD_WEBHOOK_URL) {
      config.discord.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    }
    
    if (process.env.POLL_INTERVAL_MINUTES) {
      config.rss.pollIntervalMinutes = parseInt(process.env.POLL_INTERVAL_MINUTES);
    }
    
    config.postLatestOnStart = process.env.POST_LATEST_ON_START === 'true';
    
    return config;
  }

  async init() {
    await this.loadPostedArticles();
    console.log('Poe News Bot initialized');
    
    if (this.config.postLatestOnStart) {
      console.log('POST_LATEST_ON_START enabled - posting latest article for testing...');
      await this.postLatestArticle();
    } else {
      await this.checkForNewPosts();
    }
    
    const cronPattern = `*/${this.config.rss.pollIntervalMinutes} * * * *`;
    cron.schedule(cronPattern, () => {
      this.checkForNewPosts();
    });
    
    console.log(`Bot started. Checking for updates every ${this.config.rss.pollIntervalMinutes} minutes.`);
  }

  async loadPostedArticles() {
    try {
      const data = await fs.readFile(this.config.storage.filename, 'utf8');
      const articles = JSON.parse(data);
      this.postedArticles = new Set(articles);
      console.log(`Loaded ${this.postedArticles.size} previously posted articles`);
    } catch (error) {
      console.log('No previous articles found, starting fresh');
      this.postedArticles = new Set();
    }
  }

  async savePostedArticles() {
    try {
      const articles = Array.from(this.postedArticles);
      await fs.writeFile(this.config.storage.filename, JSON.stringify(articles, null, 2));
    } catch (error) {
      console.error('Error saving posted articles:', error);
    }
  }

  async fetchRssFeed() {
    try {
      console.log('Fetching RSS feed...');
      const feed = await this.parser.parseURL(this.config.rss.url);
      return feed.items;
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      return [];
    }
  }

  async postToDiscord(article) {
    const embed = {
      title: article.title,
      url: article.link,
      description: article.contentSnippet?.substring(0, 300) + '...',
      color: 0xAF6025,
      timestamp: article.isoDate,
      footer: {
        text: 'Path of Exile News'
      }
    };

    const payload = {
      embeds: [embed]
    };

    try {
      const response = await fetch(this.config.discord.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`Posted article: ${article.title}`);
        return true;
      } else {
        console.error('Discord webhook failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error posting to Discord:', error);
      return false;
    }
  }

  async postLatestArticle() {
    console.log('Fetching latest article for testing...');
    
    const articles = await this.fetchRssFeed();
    if (articles.length === 0) {
      console.log('No articles found in RSS feed');
      return;
    }

    const latestArticle = articles[0];
    console.log(`Posting latest article: ${latestArticle.title}`);
    
    const embed = {
      title: `🧪 TEST: ${latestArticle.title}`,
      url: latestArticle.link,
      description: (latestArticle.contentSnippet?.substring(0, 250) || 'No description available') + '...\n\n**This is a test post to verify the bot is working correctly.**',
      color: 0xFF6B35,
      timestamp: latestArticle.isoDate,
      footer: {
        text: 'Path of Exile News • Test Mode'
      }
    };

    const payload = {
      embeds: [embed]
    };

    try {
      const response = await fetch(this.config.discord.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Test post successful! Bot is working correctly.');
      } else {
        console.error('❌ Test post failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error posting test message:', error);
    }
  }

  async checkForNewPosts() {
    console.log('Checking for new posts...');
    
    const articles = await this.fetchRssFeed();
    const newArticles = articles.filter(article => !this.postedArticles.has(article.link));
    
    if (newArticles.length === 0) {
      console.log('No new articles found');
      return;
    }

    console.log(`Found ${newArticles.length} new articles`);
    
    for (const article of newArticles.reverse()) {
      const success = await this.postToDiscord(article);
      if (success) {
        this.postedArticles.add(article.link);
        await this.savePostedArticles();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

if (process.argv.includes('--check-config')) {
  try {
    const config = JSON.parse(readFileSync('./config.json', 'utf8'));
    if (!config.discord.webhookUrl || config.discord.webhookUrl === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
      console.error('❌ Discord webhook URL not configured in config.json');
      process.exit(1);
    }
    console.log('✅ Configuration looks good');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reading config:', error.message);
    process.exit(1);
  }
}

new PoeNewsBot();