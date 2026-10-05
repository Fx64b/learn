'use client'

/**
 * Short feedback tones made with the Web Audio API, so no audio files are
 * needed. Every call is a no-op on the server or when audio is unavailable.
 */
export type SoundName = 'correct' | 'incorrect' | 'complete' | 'combo'

const MELODIES: Record<SoundName, [frequency: number, ms: number][]> = {
    correct: [
        [660, 90],
        [880, 140],
    ],
    incorrect: [
        [220, 120],
        [185, 180],
    ],
    combo: [
        [784, 70],
        [988, 70],
        [1175, 120],
    ],
    complete: [
        [523, 110],
        [659, 110],
        [784, 110],
        [1047, 260],
    ],
}

let context: AudioContext | null = null

function getContext() {
    if (typeof window === 'undefined') return null
    const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
    if (!Ctor) return null
    context ??= new Ctor()
    return context
}

export function playSound(name: SoundName) {
    try {
        const ctx = getContext()
        if (!ctx) return
        if (ctx.state === 'suspended') void ctx.resume()
        let at = ctx.currentTime
        for (const [frequency, ms] of MELODIES[name]) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = name === 'incorrect' ? 'triangle' : 'sine'
            osc.frequency.value = frequency
            const duration = ms / 1000
            gain.gain.setValueAtTime(0.0001, at)
            gain.gain.exponentialRampToValueAtTime(0.12, at + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
            osc.connect(gain).connect(ctx.destination)
            osc.start(at)
            osc.stop(at + duration + 0.02)
            at += duration * 0.85
        }
    } catch {
        // Audio is a nice-to-have; ignore failures.
    }
}
