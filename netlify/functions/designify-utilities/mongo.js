const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase(uri) {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(new URL(uri).pathname.substr(1));

  cachedDb = db;
  return db;
}

export async function StoreImage(userId, strImageURL) {
  const uri = process.env.MONGODB_URI;
  const db = await connectToDatabase(uri);
  const collection = db.collection('images');

  // Save the image URL to the database
  await collection.insertOne({ userId, url: strImageURL, timestamp: new Date() });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Image URL stored successfully' }),
  };
};

export async function StoreConversation(userId, message) {
  try {
    const uri = process.env.MONGODB_URI;
    const db = await connectToDatabase(uri);
    const collection = db.collection('chatHistory');

    let chatHistory;

    // Check if the user already has a chat history
    const userChatHistory = await collection.findOne({ userId });

    if (userChatHistory) {
      userChatHistory.messages.push({ message, timestamp: new Date() });
      await collection.updateOne({ userId }, { $set: { messages: userChatHistory.messages } });
      chatHistory = userChatHistory.messages;
    } else {
      const newChatHistory = { userId, messages: [{ message, timestamp: new Date() }] };
      await collection.insertOne(newChatHistory);
      chatHistory = newChatHistory.messages;
    }

    return chatHistory;
  } catch (error) {
    console.error("Error storing conversation: ", error);
    throw error;
  }
}