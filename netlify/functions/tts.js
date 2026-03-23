// Updated TTS Proxy with CORS
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') { return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' }; }
  if (event.httpMethod !== 'POST') { return { statusCode: 405, body: 'Not Allowed' }; }
  try {
    const { text, voiceProfile } = JSON.parse(event.body);
    if (!text) { return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'text required' }) }; }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { return { statusCode: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'GEMINI_API_KEY not set' }) }; }
    const voice = voiceProfile === 'Charon' ? 'Orus' : 'Despina';
    const prompt = voiceProfile === 'Charon' ? 'Speak slowly and calmly for meditation.' : 'Speak warmly and soothingly for relaxation.';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } }, model: 'gemini-2.5-flash-preview-tts' }) });
    if (!r.ok) { const e = await r.text(); return { statusCode: r.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Gemini Error', details: e }) }; }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(await r.json()) };
  } catch (e) { return { statusCode: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Proxy Error', message: e.message }) }; }
};
