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
    const voice = voiceProfile === 'Charon' ? 'Charon' : 'Aoede';
    const systemPrompt = voiceProfile === 'Charon'
      ? 'You are a meditation guide leading a breathing practice. Speak in a slow, natural, human rhythm with meaningful pauses between each count. Your voice is warm, calm, and deeply reassuring — never robotic. Let each number breathe with silence around it. Speak as if you are breathing alongside the listener.'
      : 'You are a warm, nurturing meditation narrator. Speak softly and soothingly, as if gently guiding someone toward stillness. Use a natural flowing cadence with generous pauses between thoughts. Your presence is calming and deeply human.';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        model: 'gemini-2.5-flash-preview-tts'
      })
    });
    if (!r.ok) { const e = await r.text(); return { statusCode: r.status, headers, body: JSON.stringify({ error: 'Gemini Error', details: e }) }; }
    return { statusCode: 200, headers, body: JSON.stringify(await r.json()) };
  } catch (e) { return { statusCode: 500, headers, body: JSON.stringify({ error: 'Proxy Error', message: e.message }) }; }
};
