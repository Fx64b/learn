import messages from '@/messages/en.json'
import { render } from '@testing-library/react'

import type * as React from 'react'

import { NextIntlClientProvider } from 'next-intl'

export function renderWithIntl(ui: React.ReactElement) {
    return render(
        <NextIntlClientProvider locale="en" messages={messages}>
            {ui}
        </NextIntlClientProvider>
    )
}
