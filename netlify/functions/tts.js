// Project Hado: Secure Neural TTS Proxy
// Purpose: Routes high-fidelity voice requests to Gemini while shielding the API key.
// Profiles: Enhanced voice quality with prompts for natural, grounding speech

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

    // Enhanced Voice Selection with proven, natural-sounding voices
    // Orus: Deep, mature male voice - calm and grounding (better than Charon for meditation)
    // Despina: Warm, clear female voice - soothing and trustworthy (better than Leda for guidance)
    const targetVoice = voiceProfile === 'Charon' ? 'Orus' : 'Despina';
    
    // Speech prompt to control delivery style - crucial for natural sound
    const speechPrompt = voiceProfile === 'Charon' 
      ? 'Speak in a slow, calm, and deeply grounding tone with gentle authority. Use a smooth, steady pace suitable for meditation and breathing guidance.'
      : 'Speak in a warm, soothing, and clear tone with gentle reassurance. Use a calm, steady pace suitable for relaxation and mindful breathing.';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: speechPrompt },  // Add prompt first for style control
            { text: text }
          ]
        }],
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
