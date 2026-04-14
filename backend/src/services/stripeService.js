import Stripe from 'stripe';
import { env } from '../config/env.js';

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: '2024-06-20' })
  : null;

function requireStripeClient() {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in backend environment.');
  }
  return stripe;
}

export const stripeService = {
  createCheckoutSession: async (payload) => {
    const client = requireStripeClient();
    return client.checkout.sessions.create(payload);
  },

  retrieveCheckoutSession: async (sessionId) => {
    const client = requireStripeClient();
    return client.checkout.sessions.retrieve(sessionId);
  },
};
