import wave
import struct
import math
import sys
import os

def create_sound(filename, frequency=440, duration=0.2, volume=0.5, sample_rate=44100):
    """Generate a simple sine wave WAV file."""
    # Ensure directory exists
    os.makedirs('assets/sounds', exist_ok=True)
    
    filepath = os.path.join('assets/sounds', filename)
    
    num_samples = int(duration * sample_rate)
    # Generate samples
    samples = []
    for i in range(num_samples):
        # Sine wave
        value = math.sin(2 * math.pi * frequency * i / sample_rate)
        # Apply envelope (attack, decay)
        envelope = 1.0
        if i < num_samples * 0.1:
            envelope = i / (num_samples * 0.1)  # attack
        elif i > num_samples * 0.8:
            envelope = (num_samples - i) / (num_samples * 0.2)  # decay
        samples.append(volume * envelope * value)
    
    # Convert to 16-bit integers
    samples_int = [int(s * 32767) for s in samples]
    
    # Write WAV file
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)  # mono
        wav_file.setsampwidth(2)  # 2 bytes per sample
        wav_file.setframerate(sample_rate)
        # Pack samples
        for sample in samples_int:
            data = struct.pack('<h', sample)
            wav_file.writeframes(data)
    
    print(f"Generated {filepath}")

# Generate four sounds
try:
    # Bounce sound: short medium pitch
    create_sound('bounce.wav', frequency=660, duration=0.15, volume=0.3)
    # Break sound: two tones
    create_sound('break.wav', frequency=880, duration=0.25, volume=0.4)
    # Game over sound: descending tone
    # For simplicity, we'll create a simple low frequency
    create_sound('gameover.wav', frequency=220, duration=0.5, volume=0.5)
    # Level up sound: rising tone
    create_sound('levelup.wav', frequency=880, duration=0.4, volume=0.5)
    
    # Also create MP3 placeholder files (just copy WAV with .mp3 extension for compatibility)
    # Since HTML audio may prefer .mp3, we'll create empty files with same name .mp3
    for name in ['bounce', 'break', 'gameover', 'levelup']:
        mp3_path = os.path.join('assets/sounds', f'{name}.mp3')
        with open(mp3_path, 'wb') as f:
            f.write(b'MP3 placeholder')
        print(f"Created placeholder {mp3_path}")
        
except Exception as e:
    print(f"Error generating sounds: {e}")
    sys.exit(1)