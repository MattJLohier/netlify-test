const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event) => {
  const { url, action } = JSON.parse(event.body);

  // Check if the URL is from a video platform
  const isVideoPlatform = (url) => {
    const videoPlatforms = ['youtube', 'youtu.be', 'vimeo', 'dailymotion'];
    return videoPlatforms.some(platform => url.includes(platform));
  };

  if (isVideoPlatform(url)) {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: 'Video content is not supported' }),
    };
  }

  try {
    // Try to access the URL
    const response = await axios.get(url);
    const html = response.data;

    // Load the HTML into cheerio for parsing
    const $ = cheerio.load(html);

    // Extract the raw text content from the page
    const rawText = $('body').text().trim();

    if (!rawText) {
      console.error('No text content extracted from the URL:', url);
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: false, reason: 'Could not extract text content from the URL' }),
      };
    }

    if (action === 'check') {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: true }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' }),
    };

  } catch (error) {
    console.error('Failed to access or process the URL:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({ valid: false, reason: 'Failed to access the URL' }),
    };
  }
};
