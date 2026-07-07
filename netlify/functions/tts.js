// Hado TTS Proxy v3 - Warm meditation voices with model fallback
// The May-2025 preview TTS model was retired; try current models in order.
const MODEL_CHAIN = [
  'gemini-2.5-flash-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
];

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') { return { statusCode: 200, headers, body: '' }; }
  if (event.httpMethod !== 'POST') { return { statusCode: 405, body: 'Not Allowed' }; }
  try {
    const { text, voiceProfile } = JSON.parse(event.body);
    if (!text) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'text required' }) }; }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { return { statusCode: 500, headers, body: JSON.stringify({ error: 'GEMINI_API_KEY not set' }) }; }
    const voice = voiceProfile === 'Charon' ? 'Charon' : 'Aoede';
    // TTS models are text-in/audio-out only - style is set by a short leading
    // directive in the prompt, which the model interprets rather than reads aloud.
    const styledText = voiceProfile === 'Charon'
      ? `Say very slowly and calmly, in a warm deep reassuring meditation-guide voice: ${text}`
      : `Say softly and soothingly, like a warm nurturing meditation narrator, with a gentle unhurried cadence and natural pauses between sentences: ${text}`;
    let lastError = '';
    let lastStatus = 502;
    for (const model of MODEL_CHAIN) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: styledText }] }],
          generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        }),
      });
      if (r.ok) { return { statusCode: 200, headers, body: JSON.stringify(await r.json()) }; }
      lastStatus = r.status;
      lastError = await r.text();
      // Only fall through to the next model when this one is missing/unsupported
      if (r.status !== 404 && r.status !== 400) break;
    }
    return { statusCode: lastStatus, headers, body: JSON.stringify({ error: 'Gemini Error', details: lastError }) };
  } catch (e) { return { statusCode: 500, headers, body: JSON.stringify({ error: 'Proxy Error', message: e.message }) }; }
};
