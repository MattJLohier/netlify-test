const fetch = require('node-fetch');
const cheerio = require('cheerio');
const OpenAI = require('openai');

const client = new OpenAI({
  api_key: process.env.OPENAI_API_KEY,
});

const isVideoPlatform = (url) => {
  const videoPlatforms = ['youtube', 'youtu.be', 'vimeo', 'dailymotion'];
  return videoPlatforms.some(platform => url.includes(platform));
};

exports.handler = async (event) => {
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

  const { url, action } = requestBody;

  // Verify the URL is valid
  if (!url || !/^https?:\/\/[^ "]+$/.test(url)) {
    console.error('Invalid URL:', url);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid URL' }),
    };
  }

  // Check if the URL is from a video platform
  if (isVideoPlatform(url)) {
    console.error('Video content is not supported:', url);
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: 'Video content is not supported' }),
    };
  }

  try {
    // Fetch the HTML content of the page
    console.log('Fetching content from URL:', url);
    const response = await fetch(url);
    const html = await response.text();

    // Load the HTML into cheerio for parsing
    console.log('Parsing HTML content');
    const $ = cheerio.load(html);

    // Extract the raw text content from the page
    const rawText = $('body').text().trim();
    console.log('Extracted raw text length:', rawText.length);

    if (!rawText) {
      console.error('Could not extract text content from the URL');
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
    } else if (action === 'summarize') {
      const input_message = `Please summarize the following news article: ${rawText}`;

      const messages = [
        { role: "system", content: "Your role is to distill industry news articles related to the print and copier market into concise, to-the-point summaries for a professional audience, including product managers, competitive intelligence managers, portfolio managers, and executives. Remove marketing jargon, simplify complex language, and maintain an analyst's tone: professional, factual, and in the present tense. Each summary includes the date of the event in the first sentence and focuses on key details and their significance for the stakeholders involved. If there are any UK spellings, change them to US spellings. Your goal is to provide clear, actionable insights without superfluous details. Try to keep the summaries to 1 paragraph." },
        { role: "user", content: input_message }
      ];

      try {
        console.log('Sending request to OpenAI API');
        const gptResponse = await client.chat.completions.create({
          model: "gpt-4",
          messages: messages,
          max_tokens: 1000
        });

        const result_content = gptResponse.choices[0].message.content;
        console.log('Received response from OpenAI API:', result_content);

        return {
          statusCode: 200,
          body: JSON.stringify({ summary: result_content }),
        };
      } catch (apiError) {
        console.error('Error during OpenAI API call:', apiError.response ? apiError.response.data : apiError.message);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to summarize the article', details: apiError.response ? apiError.response.data : apiError.message }),
        };
      }
    } else {
      console.error('Invalid action:', action);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }
  } catch (fetchError) {
    console.error('Failed to process the article:', fetchError.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process the article', details: fetchError.message }),
    };
  }
};
