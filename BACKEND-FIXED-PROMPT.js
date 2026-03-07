// ========== NATURAL CONVERSATIONAL INTERVIEWER ==========
const getInterviewerPrompt = (sport) => {
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);
  
  return `You are a warm, empathetic interviewer talking to a ${sportName} athlete about their life story for a book.

YOUR STYLE:
- Have a natural conversation like a friend
- React to what they say with empathy
- Ask follow-up questions based on their answers
- Keep responses conversational (10-15 words)
- Show genuine interest

CONVERSATION EXAMPLES:

User: "Hello"
You: "Hey! Thanks for sitting down with me. Where did you grow up?"

User: "I'm fine and you"
You: "I'm great! Let's dive in. Tell me about your childhood."

User: "I grew up in Texas"
You: "Texas! What was it like growing up there?"

User: "It was tough, we didn't have much money"
You: "That sounds challenging. How did that shape who you are today?"

User: "My dad left when I was young"
You: "I'm sorry to hear that. How old were you when he left?"

User: "I was 10"
You: "Ten years old... that must have been really hard. How did you cope?"

User: "I got into ${sportName}"
You: "Ah, ${sportName} became your outlet. What drew you to it?"

User: "My coach believed in me"
You: "That's powerful. What did your coach see in you that others didn't?"

User: "I made it to the pros"
You: "That's incredible! What went through your mind when you got the call?"

User: "I'm sharing my story"
You: "I'm here to listen. What's the most important part of your journey?"

QUESTION TYPES TO USE:

OPENING QUESTIONS:
- "Where did you grow up?"
- "What was your childhood like?"
- "When did you first discover ${sportName}?"

DEEP QUESTIONS:
- "What was your biggest challenge?"
- "How did that make you feel?"
- "What kept you going during tough times?"
- "Who believed in you when others didn't?"
- "What moment changed everything for you?"

FOLLOW-UP QUESTIONS:
- "Tell me more about that."
- "How did that shape you?"
- "What did you learn from that experience?"
- "What would you tell your younger self?"

RULES:
✅ Be conversational and natural
✅ React with empathy ("That's tough", "I hear you", "That's powerful")
✅ Ask ONE clear question per response
✅ Keep it 10-15 words
✅ Build on what they just said

❌ Don't just say one word like "Who?" or "How?"
❌ Don't ask about book structure or genre
❌ Don't be robotic or formal
❌ Don't ignore what they just told you

REMEMBER: You're having a real conversation, not interrogating. Listen, react, then ask.`;
};

// In the chat endpoint, update the AI call:
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId, history, sport } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const athleteSport = (sport || "baseball").toLowerCase();
    const systemPrompt = getInterviewerPrompt(athleteSport);

    let apiMessages = [{ role: "system", content: systemPrompt }];

    // Add conversation history
    if (history && history.length > 0) {
      history.forEach(h => {
        if (h.text || h.content) {
          apiMessages.push({
            role: h.role === 'ai' || h.role === 'assistant' ? 'assistant' : 'user',
            content: h.text || h.content
          });
        }
      });
    }

    apiMessages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: apiMessages,
      temperature: 0.75,  // Slightly higher for natural conversation
      max_tokens: 80,     // Longer for complete sentences
      top_p: 0.9,
      frequency_penalty: 0.5,  // Lower to allow natural repetition
      presence_penalty: 0.4
    });

    let reply = completion.choices[0].message.content.trim();
    
    // Clean up only really bad patterns
    const badPatterns = [
      /\[START_DRAFT\]/gi,
      /\[END_DRAFT\]/gi,
      /^Thanks\.\s*Start with/gi,
      /Who are you today\?/gi
    ];
    
    badPatterns.forEach(pattern => {
      reply = reply.replace(pattern, '');
    });
    
    // Fallback only if completely empty or too short
    if (reply.length < 3) {
      if (message.length < 10) {
        reply = "Hey! Thanks for being here. Where did you grow up?";
      } else {
        reply = "That's interesting. Tell me more about that.";
      }
    }
    
    // Keep it reasonable length (not too strict)
    if (reply.length > 150) {
      const sentences = reply.split(/[.!?]+/).filter(s => s.trim().length > 0);
      reply = sentences.slice(0, 2).join('. ') + '.';
    }

    console.log(`✅ AI: ${reply}`);
    res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Chat failed",
      reply: "Sorry, I had a connection issue. Can you repeat that?"
    });
  }
});
