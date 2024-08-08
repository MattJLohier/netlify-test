const axios = require('axios');

exports.handler = async (event, context) => {
  const { url, action } = JSON.parse(event.body);

  if (!url || !action) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url or action' }),
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
