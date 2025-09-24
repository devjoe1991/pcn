import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    // Simple AI response logic - you can replace this with actual AI API calls
    const userInput = lastMessage.content.toLowerCase();
    let reply = "";

    if (userInput.includes('hello') || userInput.includes('hi')) {
      reply = "Hello! 👋 How can I help you today?";
    } else if (userInput.includes('help')) {
      reply = "I'm here to help! You can ask me about:\n- **Coding questions**\n- **General knowledge**\n- **Creative writing**\n- **Problem solving**\n\nWhat would you like to know?";
    } else if (userInput.includes('weather')) {
      reply = "I don't have access to real-time weather data, but I'd recommend checking a weather service like Weather.com or your local weather app! 🌤️";
    } else if (userInput.includes('code') || userInput.includes('programming')) {
      reply = "I'd be happy to help with coding! What programming language or specific problem are you working on? I can assist with:\n- **JavaScript/TypeScript**\n- **Python**\n- **React/Next.js**\n- **Node.js**\n- And much more!";
    } else if (userInput.includes('time')) {
      reply = `The current time is ${new Date().toLocaleString()}. ⏰`;
    } else if (userInput.includes('joke')) {
      reply = "Why don't scientists trust atoms? Because they make up everything! 😄";
    } else {
      reply = `I understand you're asking about "${lastMessage.content}". That's an interesting question! Could you provide more details so I can give you a better answer?`;
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
