const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');

const client = new OpenAI({
  api_key: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  const { url } = JSON.parse(event.body);

  // Verify the URL is valid
  if (!url || !/^https?:\/\/[^ "]+$/.test(url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid URL' }),
    };
  }

  try {
    // Fetch the HTML content of the page
    const response = await axios.get(url);
    const html = response.data;

    // Load the HTML into cheerio for parsing
    const $ = cheerio.load(html);

    // Extract the raw text content from the page
    const rawText = $('body').text().trim();

    if (!rawText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Could not extract text content from the URL' }),
      };
    }

    const input_message = `Summarize the following content: ${rawText}`;

    const messages = [
      { role: "system", content: "Output your response in plain text." },
      { role: "user", content: input_message }
    ];

    const gptResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 500
    });

    const result_content = gptResponse.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ summary: result_content }),
    };
  } catch (error) {
    console.error('Failed to summarize the article:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to summarize the article' }),
    };
  }
};
