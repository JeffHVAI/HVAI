/**
 * Generates a 75-second synthetic WAV audio track dynamically.
 * Features an ambient background clinic drone and clear sound chimes at timeline events.
 * Returns an Object URL representing the generated WAV file.
 */
export function generateSimulatorAudioUrl(): string {
  const sampleRate = 8000;
  const duration = 75; // 75 seconds
  const numSamples = sampleRate * duration;
  const bufferSize = 44 + numSamples; // 44 bytes header + 1 byte per sample (8-bit)
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus RIFF header
  view.setUint32(4, 36 + numSamples, true);
  // WAVE identifier
  writeString(view, 8, 'WAVE');
  // fmt chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM)
  view.setUint16(20, 1, true);
  // channel count (mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 1, true);
  // bits per sample (8-bit)
  view.setUint16(34, 8, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, numSamples, true);

  // Time triggers in seconds for chime effects
  const chimeTimes = [0, 9.5, 23.0, 39.0, 53.0, 72.0];

  // Write PCM audio data (8-bit, values 0-255, 128 is midpoint/silence)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // 1. Ambient clinic background hum (combination of 60Hz hum and 120Hz drone)
    let ambient = Math.sin(2 * Math.PI * 60 * t) * 0.05 + Math.sin(2 * Math.PI * 120 * t) * 0.03;

    // 2. Chime sound generators at specific trigger times
    let chime = 0;
    for (const chimeT of chimeTimes) {
      const timeDiff = t - chimeT;
      if (timeDiff >= 0 && timeDiff < 1.5) {
        // High frequency chime that decays exponentially
        const decay = Math.exp(-4 * timeDiff); // decays over 1 second
        // A nice minor chord arpeggio chime (e.g. 523Hz (C5), 659Hz (E5), 784Hz (G5))
        const freq = 523.25 + (chimeT % 2 === 0 ? 131.0 : 261.0);
        chime += Math.sin(2 * Math.PI * freq * t) * decay * 0.25;
        // Add a secondary harmonic
        chime += Math.sin(2 * Math.PI * freq * 1.5 * t) * decay * 0.12;
      }
    }

    // Combine and clamp
    const mixed = ambient + chime;
    const sample = Math.max(-1, Math.min(1, mixed));
    // Convert float sample (-1 to 1) to uint8 (0 to 255)
    view.setUint8(44 + i, Math.floor((sample + 1) * 127.5));
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
