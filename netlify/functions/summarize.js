const axios = require('axios');
const cheerio = require('cheerio');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const client = new OpenAIApi(configuration);

const isVideoPlatform = (url) => {
  const videoPlatforms = ['youtube', 'youtu.be', 'vimeo', 'dailymotion'];
  return videoPlatforms.some(platform => url.includes(platform));
};

exports.handler = async (event) => {
  const { url, action } = JSON.parse(event.body);

  // Verify the URL is valid
  if (!url || !/^https?:\/\/[^ "]+$/.test(url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid URL' }),
    };
  }

  // Check if the URL is from a video platform
  if (isVideoPlatform(url)) {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: 'Video content is not supported' }),
    };
  }

  try {
    // Fetch the HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load the HTML into cheerio for parsing
    const $ = cheerio.load(html);

    // Extract the raw text content from the page, excluding certain tags
    const excludeTags = 'script, style, nav, footer, header, aside, form';
    const rawText = $('body').children().not(excludeTags).text().trim();
    
    // Log the raw text for debugging
    console.log('Raw Text:', rawText);

    if (!rawText) {
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
      const input_message = `Summarize the following content: ${rawText}`;

      const messages = [
        { role: "system", content: "Your role is to distill industry news articles related to the print and copier market into concise, to-the-point summaries for a professional audience, including product managers, competitive intelligence managers, portfolio managers, and executives. Remove marketing jargon, simplify complex language, and maintain an analyst's tone: professional, factual, and in the present tense. Each summary includes the date of the event in the first sentence and focuses on key details and their significance for the stakeholders involved. If there are any UK spellings, change them to US spellings. Your goal is to provide clear, actionable insights without superfluous details. Try to keep the summaries to 1 paragraph." },
        { role: "user", content: input_message }
      ];

      // Log the messages sent to OpenAI for debugging
      console.log('Messages sent to OpenAI:', messages);

      const gptResponse = await client.createChatCompletion({
        model: "gpt-4",
        messages: messages,
        max_tokens: 500
      });

      // Log the response from OpenAI for debugging
      console.log('GPT Response:', gptResponse);

      const result_content = gptResponse.data.choices[0].message.content;

      return {
        statusCode: 200,
        body: JSON.stringify({ summary: result_content }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }
  } catch (error) {
    console.error('Failed to process the article:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process the article' }),
    };
  }
};