// Project Hado: Secure Neural TTS Proxy
// Purpose: Routes high-fidelity voice requests to Gemini while shielding the API key.
// Profiles: "Leda" (Female/Narrative) | "Charon" (Male/Grounding)

exports.handler = async (event) => {
  // Only allow POST requests for voice synthesis
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, voiceProfile } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuration Error: GEMINI_API_KEY is not set in Netlify.' }),
      };
    }

    // Explicit Voice Enforcement
    // "Leda" = Professional Female Narrative
    // "Charon" = Calming Male Rhythmic Session
    const targetVoice = voiceProfile === 'Charon' ? 'Charon' : 'Leda';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: targetVoice },
            },
          },
        },
        model: 'gemini-2.5-flash-preview-tts',
      }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Gemini Engine Error', details: errorMsg }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Proxy Error', message: error.message }),
    };
  }
};
