const express = require("express");
const cors = require("cors");
const parser = new (require("rss-parser"))();
const getMetaData = require("metadata-scraper");
require("express-async-errors");
require("dotenv").config();

// Config
const CONFIG = {
  PORT: process.env.PORT || 3000,
  CACHE_REFRESH_INTERVAL_MS: 4 * 60 * 1000, // 4 minutes
  MAX_POSTS: 20,
  DEFAULT_IMAGE: process.env.NOTFOUND_IMAGE || 'https://via.placeholder.com/150'
};

// App setup
const app = express();
const sites = require("./sites.json");
let postsCache = [];

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

// Helpers
const processFeedItem = async (item, siteName) => {
  try {
    const metadata = await getMetaData(item.link, {
      headers: {
        "User-Agent": "AllNewsMR/3.0"
      }
    });
    
    return {
      title: item.title,
      link: item.link,
      isoDate: item.isoDate,
      name: siteName,
      image: metadata?.image || CONFIG.DEFAULT_IMAGE
    };
  } catch (error) {
    console.error(`Failed to process ${item.link}:`, error.message);
    return {
      ...item,
      name: siteName,
      image: CONFIG.DEFAULT_IMAGE
    };
  }
};

const fetchAllFeeds = async () => {
  try {
    const processingPromises = sites.map(async (site) => {
      try {
        const feed = await parser.parseURL(site.url);
        const items = await Promise.all(
          feed.items.map(item => processFeedItem(item, site.name))
        );
        return items;
      } catch (error) {
        console.error(`Failed to fetch ${site.name}:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(processingPromises);
    postsCache = results.flat()
      .sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate))
      .slice(0, CONFIG.MAX_POSTS);
  } catch (error) {
    console.error('Feed processing error:', error);
  }
};

// Routes
app.get("/", (req, res) => {
  res.json(postsCache);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', lastUpdated: new Date() });
});

// Initialize
const startServer = async () => {
  await fetchAllFeeds();
  setInterval(fetchAllFeeds, CONFIG.CACHE_REFRESH_INTERVAL_MS);
  
  app.listen(CONFIG.PORT, () => {
    console.log(`Server running on port ${CONFIG.PORT}`);
    console.log(`Next refresh in ${CONFIG.CACHE_REFRESH_INTERVAL_MS/60000} minutes`);
  });
};

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

startServer();