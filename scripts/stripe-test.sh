#!/bin/bash
# scripts/stripe-test.sh

# Install Stripe CLI if not installed
if ! command -v stripe &> /dev/null; then
    echo "Installing Stripe CLI..."
    brew install stripe-cli/stripe
fi

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
echo "Starting webhook forwarding..."
echo "Your webhook secret will be displayed below."
echo "Add it to your .env.local as STRIPE_WEBHOOK_SECRET"
echo ""

stripe listen --forward-to localhost:3000/api/stripe/webhook