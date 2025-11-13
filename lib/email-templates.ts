/**
 * Email templates for authentication emails
 * Matches the site design with proper branding and responsive layout
 */

interface EmailTemplateParams {
    url: string
    siteName: string
    logoUrl: string
}

interface WelcomeEmailParams extends EmailTemplateParams {
    title: string
    heading: string
    message: string
    buttonText: string
    footerText: string
}

interface LoginEmailParams extends EmailTemplateParams {
    title: string
    heading: string
    message: string
    buttonText: string
    footerText: string
}

/**
 * Base email styles matching the site design
 * Uses oklch colors from globals.css and responsive design
 */
const baseStyles = `
    body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
        background-color: #f5f5f5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
        width: 100%;
        background-color: #f5f5f5;
        padding: 40px 20px;
    }
    .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .email-header {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        padding: 40px 30px;
        text-align: center;
    }
    .email-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 10px;
    }
    .email-body {
        padding: 40px 30px;
    }
    .email-heading {
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 20px 0;
        line-height: 1.3;
    }
    .email-text {
        font-size: 16px;
        line-height: 1.6;
        color: #525252;
        margin: 0 0 30px 0;
    }
    .email-button {
        display: inline-block;
        padding: 14px 32px;
        background-color: #1a1a1a;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 500;
        font-size: 16px;
        transition: background-color 0.2s ease;
    }
    .email-button:hover {
        background-color: #2d2d2d;
    }
    .email-button-wrapper {
        text-align: center;
        margin: 30px 0;
    }
    .email-footer {
        padding: 30px;
        background-color: #f9f9f9;
        border-top: 1px solid #ebebeb;
    }
    .email-footer-text {
        font-size: 14px;
        line-height: 1.6;
        color: #737373;
        margin: 0 0 10px 0;
        text-align: center;
    }
    .email-link {
        color: #1a1a1a;
        text-decoration: underline;
        word-break: break-all;
    }
    .email-divider {
        height: 1px;
        background-color: #ebebeb;
        margin: 20px 0;
        border: none;
    }
    @media only screen and (max-width: 600px) {
        .email-wrapper {
            padding: 20px 10px;
        }
        .email-header {
            padding: 30px 20px;
        }
        .email-body {
            padding: 30px 20px;
        }
        .email-heading {
            font-size: 22px;
        }
        .email-text {
            font-size: 15px;
        }
        .email-button {
            padding: 12px 28px;
            font-size: 15px;
        }
    }
`

/**
 * Welcome email template for first-time signups
 */
export function generateWelcomeEmail(params: WelcomeEmailParams): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${params.title}</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="email-header">
                <img src="${params.logoUrl}" alt="${params.siteName}" class="email-logo" />
            </div>
            <div class="email-body">
                <h1 class="email-heading">${params.heading}</h1>
                <p class="email-text">${params.message}</p>
                <div class="email-button-wrapper">
                    <a href="${params.url}" class="email-button">${params.buttonText}</a>
                </div>
                <hr class="email-divider" />
                <p class="email-footer-text" style="text-align: left; color: #737373; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p class="email-footer-text" style="text-align: left;">
                    <a href="${params.url}" class="email-link">${params.url}</a>
                </p>
            </div>
            <div class="email-footer">
                <p class="email-footer-text">${params.footerText}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}

/**
 * Login email template for returning users
 */
export function generateLoginEmail(params: LoginEmailParams): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${params.title}</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="email-header">
                <img src="${params.logoUrl}" alt="${params.siteName}" class="email-logo" />
            </div>
            <div class="email-body">
                <h1 class="email-heading">${params.heading}</h1>
                <p class="email-text">${params.message}</p>
                <div class="email-button-wrapper">
                    <a href="${params.url}" class="email-button">${params.buttonText}</a>
                </div>
                <hr class="email-divider" />
                <p class="email-footer-text" style="text-align: left; color: #737373; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p class="email-footer-text" style="text-align: left;">
                    <a href="${params.url}" class="email-link">${params.url}</a>
                </p>
            </div>
            <div class="email-footer">
                <p class="email-footer-text">${params.footerText}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}
