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

  const { url, action } = requestBody;

  if (!url || !action) {
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
    console.log('Preparing to summarize content for URL:', url);
  
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
  }

  console.error('Invalid action');
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid action' }),
  };
};
