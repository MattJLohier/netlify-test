const axios = require('axios');
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
  const { url, action } = JSON.parse(event.body);

  // Check if the URL is from a video platform
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
      console.error('No text content extracted from the URL');
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
      const input_message = `Your role is to distill industry news articles related to the print and copier market into concise, to-the-point summaries for a professional audience, including product managers, competitive intelligence managers, portfolio managers, and executives.: ${rawText}`;

      const messages = [
        { role: "system", content: "Your role is to distill industry news articles related to the print and copier market into concise, to-the-point summaries for a professional audience, including product managers, competitive intelligence managers, portfolio managers, and executives. Remove marketing jargon, simplify complex language, and maintain an analyst's tone: professional, factual, and in the present tense. Each summary includes the date of the event in the first sentence and focuses on key details and their significance for the stakeholders involved. If there are any UK spellings, change them to US spellings. Your goal is to provide clear, actionable insights without superfluous details. Try to keep the summaries to 1 paragraph." },
        { role: "user", content: input_message }
      ];

      const gptResponse = await client.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 1000
      });

      const result_content = gptResponse.choices[0].message.content;

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
    console.error('Failed to access or process the URL:', error);
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: 'Failed to access the URL' }),
    };
  }
};
