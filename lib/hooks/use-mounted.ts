'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False during server rendering and hydration, true afterwards. Use it to
 * render content that depends on randomness (shuffled options) only on the
 * client, so the server HTML never mismatches.
 */
export function useMounted() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    )
}
