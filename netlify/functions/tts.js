// Hado TTS Proxy v2 - Warm meditation voices
exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') { return { statusCode: 200, headers, body: '' }; }
  if (event.httpMethod !== 'POST') { return { statusCode: 405, body: 'Not Allowed' }; }
  try {
    const { text, voiceProfile } = JSON.parse(event.body);
    if (!text) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'text required' }) }; }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { return { statusCode: 500, headers, body: JSON.stringify({ error: 'GEMINI_API_KEY not set' }) }; }
    const voice = voiceProfile === 'Charon' ? 'Kore' : 'Aoede';
    const prompt = voiceProfile === 'Charon' ? 'You are a gentle, grounding meditation guide. Speak very slowly with long pauses between phrases. Your tone is warm, calm, deep, and reassuring. Pause naturally between counting numbers. Never rush.' : 'You are a warm, nurturing meditation narrator. Speak softly and soothingly with a gentle cadence. Use long natural pauses between sentences. Your voice should feel like a calming presence guiding someone to stillness.';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } }, model: 'gemini-2.5-flash-preview-tts' }) });
    if (!r.ok) { const e = await r.text(); return { statusCode: r.status, headers, body: JSON.stringify({ error: 'Gemini Error', details: e }) }; }
    return { statusCode: 200, headers, body: JSON.stringify(await r.json()) };
  } catch (e) { return { statusCode: 500, headers, body: JSON.stringify({ error: 'Proxy Error', message: e.message }) }; }
};
