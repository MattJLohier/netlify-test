const axios = require('axios');

exports.handler = async (event, context) => {
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
    console.log('Request body:', requestBody); // Log the request body to check its content
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const { url, action } = requestBody;

  if (!url || !action) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url or action' }),
    };
  }

  // Check for invalid URLs
  if (url.includes('youtube') || url.includes('youtu.be') || url.endsWith('.pdf')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL is not summarizable' }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key is missing' }),
    };
  }

  if (action === 'check') {
    // Implement URL checking logic here (e.g., check if the URL returns valid content)
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true }),
    };
  }

  if (action === 'summarize') {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/engines/davinci-codex/completions',
        {
          prompt: `Summarize the content from the URL: ${url}`,
          max_tokens: 150,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ summary: response.data.choices[0].text }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid action' }),
  };
};
