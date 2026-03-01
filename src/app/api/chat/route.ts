// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, mode } = body;

    // Yahan aap Gemini ya OpenAI ki API call kar sakte hain
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Mode: ${mode}. User: ${message}. Wrap draft in [START_DRAFT]...[END_DRAFT]` }] }]
      })
    });

    const data = await response.json();
    const aiReply = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ 
      reply: aiReply,
      sessionId: Date.now().toString() // Local session ID
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}