/**
 * HTML for the sign-in emails. Email clients ignore most CSS, so the layout
 * uses tables and inline styles, in the chunky emerald look of the app.
 */

export interface AuthEmailParams {
    url: string
    siteName: string
    siteUrl: string
    logoUrl: string
    lang: string
    title: string
    heading: string
    message: string
    buttonText: string
    /** Text before the plain link, for clients that block the button. */
    linkHint: string
    footerText: string
    contactEmail: string
    /** Short bullet points under the button (welcome email). */
    highlights?: string[]
}

const COLORS = {
    page: '#f3f6f4',
    card: '#ffffff',
    border: '#e4e7e5',
    text: '#171717',
    muted: '#5f6661',
    emerald: '#10b981',
    emeraldDark: '#047857',
    tint: '#ecfdf5',
}

const FONT =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function generateAuthEmail(params: AuthEmailParams): string {
    const e = escapeHtml
    const url = e(params.url)
    const highlights = (params.highlights ?? [])
        .map(
            (item) => `
                <tr>
                    <td width="28" valign="top" style="padding: 4px 0; font-family: ${FONT}; font-size: 16px; color: ${COLORS.emerald}; font-weight: 700;">&#10003;</td>
                    <td style="padding: 4px 0; font-family: ${FONT}; font-size: 15px; line-height: 22px; color: ${COLORS.text};">${e(item)}</td>
                </tr>`
        )
        .join('')

    return `<!DOCTYPE html>
<html lang="${e(params.lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${e(params.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.page};">
    <tr>
        <td align="center" style="padding: 32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px;">
                <tr>
                    <td align="center" style="padding: 0 0 20px 0;">
                        <a href="${e(params.siteUrl)}" style="text-decoration: none;">
                            <img src="${e(params.logoUrl)}" width="44" height="44" alt="" style="display: inline-block; vertical-align: middle; border: 0;" />
                            <span style="display: inline-block; vertical-align: middle; padding-left: 8px; font-family: ${FONT}; font-size: 24px; font-weight: 800; color: ${COLORS.text};">${e(params.siteName)}</span>
                        </a>
                    </td>
                </tr>
                <tr>
                    <td style="background-color: ${COLORS.card}; border: 2px solid ${COLORS.border}; border-bottom-width: 5px; border-radius: 20px; padding: 36px 32px;">
                        <h1 style="margin: 0 0 12px 0; font-family: ${FONT}; font-size: 26px; line-height: 32px; font-weight: 800; color: ${COLORS.text};">${e(params.heading)}</h1>
                        <p style="margin: 0 0 28px 0; font-family: ${FONT}; font-size: 16px; line-height: 25px; color: ${COLORS.muted};">${e(params.message)}</p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center">
                                    <a href="${url}" style="display: inline-block; background-color: ${COLORS.emerald}; border: 2px solid ${COLORS.emeraldDark}; border-bottom-width: 5px; border-radius: 16px; padding: 14px 32px; font-family: ${FONT}; font-size: 15px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; text-decoration: none;">${e(params.buttonText)}</a>
                                </td>
                            </tr>
                        </table>
                        ${
                            highlights
                                ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px; background-color: ${COLORS.tint}; border-radius: 14px;">
                            <tr><td style="padding: 16px 20px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0">${highlights}</table></td></tr>
                        </table>`
                                : ''
                        }
                        <p style="margin: 28px 0 6px 0; font-family: ${FONT}; font-size: 13px; line-height: 20px; color: ${COLORS.muted};">${e(params.linkHint)}</p>
                        <p style="margin: 0; font-family: ${FONT}; font-size: 13px; line-height: 20px; word-break: break-all;"><a href="${url}" style="color: ${COLORS.emeraldDark};">${url}</a></p>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding: 24px 16px 0 16px; font-family: ${FONT}; font-size: 13px; line-height: 20px; color: ${COLORS.muted};">
                        <p style="margin: 0 0 8px 0;">${e(params.footerText)}</p>
                        <p style="margin: 0;"><a href="mailto:${e(params.contactEmail)}" style="color: ${COLORS.muted};">${e(params.contactEmail)}</a> &middot; <a href="${e(params.siteUrl)}" style="color: ${COLORS.muted};">${e(params.siteUrl.replace(/^https?:\/\//, ''))}</a></p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>`
}
