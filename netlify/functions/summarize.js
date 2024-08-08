const axios = require('axios');

exports.handler = async (event, context) => {
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
    console.log('Request body:', requestBody); // Log the request body to check its content
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const getSourceLink = (body) => body.url || body.sourceLink || body.source_link || 'NA';
  const getAction = (body) => body.action || 'check';

  const url = getSourceLink(requestBody);
  const action = getAction(requestBody);

  if (url === 'NA' || !action) {
    console.error('Missing url or action');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url or action' }),
    };
  }

  // Check for invalid URLs
  if (url.includes('youtube') || url.includes('youtu.be') || url.endsWith('.pdf')) {
    console.error('URL is not summarizable');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL is not summarizable' }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key is missing');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key is missing' }),
    };
  }

  if (action === 'check') {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true }),
    };
  }

  if (action === 'summarize') {
    try {
      console.log('Sending request to OpenAI');
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

      console.log('OpenAI response:', response.data); // Log the response from OpenAI
      return {
        statusCode: 200,
        body: JSON.stringify({ summary: response.data.choices[0].text }),
      };
    } catch (error) {
      console.error('Error summarizing content:', error.response ? error.response.data : error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.response ? error.response.data : error.message }),
      };
    }
  }

  console.error('Invalid action');
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid action' }),
  };
};
