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
    // TTS models are text-in/audio-out only — systemInstruction is not supported and
    // rejects the request. Style is set by a short leading directive in the prompt
    // itself, which the model interprets rather than reads aloud ("Say cheerfully: ...").
    const styledText = voiceProfile === 'Charon'
      ? `Say very slowly and calmly, in a warm deep reassuring meditation-guide voice, with a long unhurried pause between every word and number: ${text}`
      : `Say softly and soothingly, like a warm nurturing meditation narrator, with a gentle unhurried cadence and natural pauses between sentences: ${text}`;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: styledText }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
        model: 'gemini-2.5-flash-preview-tts'
      })
    });
    if (!r.ok) { const e = await r.text(); return { statusCode: r.status, headers, body: JSON.stringify({ error: 'Gemini Error', details: e }) }; }
    return { statusCode: 200, headers, body: JSON.stringify(await r.json()) };
  } catch (e) { return { statusCode: 500, headers, body: JSON.stringify({ error: 'Proxy Error', message: e.message }) }; }
};
