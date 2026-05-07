/** @type {AudioContext | null} */
let zzfxX = null;

// The Cache: Stores decoded AudioBuffers for instant reuse
const audioCache = new Map();

function initAudioContext() {
  if (!zzfxX) {
    try {
      zzfxX = new (window.AudioContext || window.webkitAudioContext)();
      console.log("AudioContext initialized:", zzfxX.state);
    } catch (e) {
      console.error("Failed to create AudioContext:", e);
    }
  }
  return zzfxX;
}

initAudioContext();

/**
 * Preloads and decodes a WAV file into the cache
 */
const getAudioBuffer = async (wavDataUri) => {
  // If we already have it, return it immediately
  if (audioCache.has(wavDataUri)) {
    return audioCache.get(wavDataUri);
  }

  // Otherwise, fetch and decode once
  try {
    const response = await fetch(wavDataUri);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await zzfxX.decodeAudioData(arrayBuffer);
    
    audioCache.set(wavDataUri, audioBuffer);
    console.log(`Cached: ${wavDataUri}`);
    return audioBuffer;
  } catch (e) {
    console.error("Error loading/decoding WAV:", e);
    return null;
  }
};

/**
 * Plays a buffered sound
 */
const playWavFile = async (wavDataUri, gainValue = 0.2) => {
  if (!zzfxX) return;
  
  if (zzfxX.state === 'suspended') {
    await zzfxX.resume();
  }
  
  // Get the buffer from cache (or fetch if it's the first time)
  const audioBuffer = await getAudioBuffer(wavDataUri);
  if (!audioBuffer) return;

  // Play the buffer (this part is super fast)
  const source = zzfxX.createBufferSource();
  source.buffer = audioBuffer;
  
  const gain = zzfxX.createGain();
  gain.gain.value = gainValue;
  source.connect(gain);
  gain.connect(zzfxX.destination);
  
  source.start(0);
};

export const playSFX = (type, gainOverride) => {
  switch (type) {
    case "swing":
      playWavFile("/assets/sfx/sfump.wav", gainOverride ?? 0.2);
      break;
    case "hit":
      playWavFile("/assets/sfx/hit.wav", gainOverride ?? 0.12);
      break;
    case "jump":
      playWavFile("/assets/sfx/jump.wav", gainOverride ?? 0.2);
      break;
    case "explode":
      playWavFile("/assets/sfx/explode.wav", gainOverride ?? 0.2);
      break;
    case "laser":
      playWavFile("/assets/sfx/shoot638.wav", gainOverride ?? 0.16);
      break;
    case "machine_break":
      playWavFile("/assets/sfx/machine_break.wav", gainOverride ?? 0.25);
      break;
    case "computer_mumble":
      playWavFile("/assets/sfx/computer_mumble_pickup655.wav", gainOverride ?? 0.2);
      break;
    case "hurt":
      playWavFile("/assets/sfx/hurt_blip668.wav", gainOverride ?? 0.16);
      break;
    case "hurtPlayer":
      playWavFile("/assets/sfx/player_hurt.wav", gainOverride ?? 0.2);
      break;
    case "hurtComputer":
      playWavFile("/assets/sfx/computer_hurt_hit_685.wav", gainOverride ?? 0.2);
      break;
    case "death":
      playWavFile("/assets/sfx/note_music_690.wav", gainOverride ?? 0.2);
      break;
  }
};

/**
 * Optional: Call this during your game's loading screen 
 * to prevent the tiny lag on the very first hit.
 */
export const preloadSFX = async () => {
  const sounds = [
    "/assets/sfx/sfump.wav",
    "/assets/sfx/hit.wav",
    "/assets/sfx/jump.wav",
    "/assets/sfx/explosion.wav",
    "/assets/sfx/shoot638.wav",
    "/assets/sfx/machine_break.wav",
    "/assets/sfx/computer_mumble_pickup655.wav",
    "/assets/sfx/hurt_blip668.wav",
    "/assets/sfx/player_hurt.wav",
    "/assets/sfx/computer_hurt_hit_685.wav",
    "/assets/sfx/note_music_690.wav",
  ];
  await Promise.all(sounds.map(getAudioBuffer));
  console.log("All SFX preloaded and cached.");
};