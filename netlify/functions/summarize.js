const OpenAI = require('openai');

const client = new OpenAI({
  api_key: OPENAI_API_KEY,
});

exports.handler = async (event) => {
  const { url } = JSON.parse(event.body);

  // Simulate fetching HTML content and truncating it for the example
  const truncated_content = "Example HTML content"; // Replace with actual content fetching logic
  
  const input_message = `Summarize the content of the article from the provided URL: ${url}. HTML content: ${truncated_content}`;

  try {
    const messages = [
      { role: "system", content: "Output your response in plain text." },
      { role: "user", content: input_message }
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 500
    });

    const result_content = response.choices[0].message.content;

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
