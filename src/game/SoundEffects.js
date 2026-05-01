// src/SoundEffects.js

/** @type {AudioContext | null} */
let zzfxX = null;

/**
 * Initialize the Web Audio API AudioContext
 * @returns {AudioContext | null} The initialized AudioContext
 */
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
 * Fetch a WAV file and play it through the AudioContext
 * @param {string} wavDataUri - Path to the WAV file (e.g. "/assets/sfx/hit.wav")
 * @param {number} [gainValue=0.2] - Volume level (0.0 to 1.0, where 1.0 is max volume)
 * @returns {Promise<void>}
 */
const playWavFile = async (wavDataUri, gainValue = 0.2) => {
  if (!zzfxX) return;
  
  if (zzfxX.state === 'suspended') {
    await zzfxX.resume();
  }
  
  try {
    // Convert data URI to array buffer
    const response = await fetch(wavDataUri);
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode as audio
    const audioBuffer = await zzfxX.decodeAudioData(arrayBuffer);
    
    // Play it
    const source = zzfxX.createBufferSource();
    source.buffer = audioBuffer;
    
    const gain = zzfxX.createGain();
    gain.gain.value = gainValue;
    source.connect(gain);
    gain.connect(zzfxX.destination);
    
    source.start(0);
    console.log("WAV file playing with gain:", gainValue);
  } catch (e) {
    console.error("Error playing WAV:", e);
  }
};

/**
 * Play a sound effect by type
 * @param {string} type - The sound effect type: "swing", "hit", "jump", or "explode"
 * @param {number} [gainOverride] - Optional custom gain value to override defaults (0.0 to 1.0)
 * @example
 * playSFX("hit"); // Play hit sound with default gain
 * playSFX("hit", 0.15); // Play hit sound with custom gain
 */
export const playSFX = (type, gainOverride) => {
  switch (type) {
    case "swing":
      console.log("Playing swing sound");
      playWavFile("/assets/sfx/sfump.wav", gainOverride ?? 0.2);
      break;
    case "hit":
      console.log("Playing hit sound");
      playWavFile("/assets/sfx/hit.wav", gainOverride ?? 0.12);
      break;
    case "jump":
      console.log("Playing jump sound");
      playWavFile("/assets/sfx/jump.wav", gainOverride ?? 0.2);
      break;
    case "explode":
      console.log("Playing explode sound");
      playWavFile("/assets/sfx/explode.wav", gainOverride ?? 0.2);
      break;
  }
};