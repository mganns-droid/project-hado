// Text-to-Speech functionality using ElevenLabs API
const ELEVENLABS_API_KEY = 'sk_fe382e19b7d8d05e2ecdea33e6aef0bc43e9c0fe28c2e7aa';
const VOICE_ID = 'cgSgspJ2msm6clMCkdW9'; // Jessica voice

let audioQueue = [];
let isPlaying = false;
let currentAudio = null;

async function speak(text, isBreathingCue = false) {
    if (!text) return;
    
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.0,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Add to queue
        audioQueue.push({ audio, url: audioUrl, isBreathingCue });
        
        // Start playing if not already playing
        if (!isPlaying) {
            playNext();
        }
    } catch (error) {
        console.error('Speech synthesis error:', error);
    }
}

function playNext() {
    if (audioQueue.length === 0) {
        isPlaying = false;
        return;
    }
    
    isPlaying = true;
    const { audio, url, isBreathingCue } = audioQueue.shift();
    currentAudio = audio;
    
    audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        playNext();
    };
    
    audio.onerror = () => {
        console.error('Audio playback error');
        URL.revokeObjectURL(url);
        currentAudio = null;
        playNext();
    };
    
    audio.play().catch(error => {
        console.error('Play error:', error);
        URL.revokeObjectURL(url);
        currentAudio = null;
        playNext();
    });
}

function stopSpeaking() {
    // Stop current audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Clear queue and revoke all URLs
    audioQueue.forEach(item => URL.revokeObjectURL(item.url));
    audioQueue = [];
    isPlaying = false;
}

function clearQueue() {
    audioQueue.forEach(item => URL.revokeObjectURL(item.url));
    audioQueue = [];
}
