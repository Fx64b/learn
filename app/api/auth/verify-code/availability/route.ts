import { isSignupCodesAvailable } from '@/lib/signup-code'

import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        usesCodes: isSignupCodesAvailable(),
    })
}
