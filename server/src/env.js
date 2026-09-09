// Configuration, read once and validated loudly.
//
// Nothing here has a working default that touches the outside world. A missing
// MONGODB_URI or JWT_SECRET stops the process at boot rather than at the first
// request, because a server that starts and then fails every login looks healthy
// to a platform's health check.

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy server/.env.example to server/.env for local work, ` +
        'or set it in the host\'s environment variables in production.'
    );
  }
  return value;
};

const optional = (name, fallback) => process.env[name] || fallback;

export const config = {
  port: Number(optional('PORT', 4000)),
  nodeEnv: optional('NODE_ENV', 'development'),
  get isProduction() {
    return this.nodeEnv === 'production';
  },

  mongoUri: () => required('MONGODB_URI'),

  // Signing key for session tokens. Rotating it logs everyone out, which is the
  // intended emergency behaviour.
  jwtSecret: () => required('JWT_SECRET'),
  jwtTtl: optional('JWT_TTL', '7d'),

  // Where the browser app is served from. Used for CORS and for the URLs Stripe
  // sends the shopper back to.
  siteOrigin: optional('SITE_ORIGIN', 'http://localhost:5173'),

  // Comma-separated list; the site origin is always allowed.
  extraOrigins: optional('EXTRA_ORIGINS', '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  stripeSecretKey: () => required('STRIPE_SECRET_KEY'),
  // Set once the webhook endpoint exists in the Stripe dashboard. Without it the
  // webhook route refuses every request rather than trusting unsigned input.
  stripeWebhookSecret: () => required('STRIPE_WEBHOOK_SECRET'),

  // Stripe is optional for the rest of the API to work, so its absence is a
  // feature flag rather than a boot failure.
  get stripeConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }
};
