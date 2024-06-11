import OpenAI from 'openai';

const openai = new OpenAI();

export async function runConversation(userInput, messages) {
  messages.push({ role: 'user', content: userInput });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-05-13',
    messages: messages,
  });

  const responseMessage = completion.choices[0].message.content;
  return { responseMessage, messages };
}

