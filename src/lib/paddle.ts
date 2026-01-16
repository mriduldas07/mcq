import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const PADDLE_API_KEY = process.env.PADDLE_API_KEY || '';
const PADDLE_ENV = (process.env.PADDLE_ENVIRONMENT || 'sandbox') as Environment;

// Only throw errors in production or when actually using Paddle
export const paddle = PADDLE_API_KEY 
    ? new Paddle(PADDLE_API_KEY, { environment: PADDLE_ENV })
    : null as any; // Will throw at runtime if used without key

// Price IDs (set these in your Paddle dashboard)
export const PADDLE_PRICE_IDS = {
    ONE_TIME_EXAM: process.env.PADDLE_PRICE_ID_ONE_TIME || 'pri_01_one_time_exam',
    PRO_MONTHLY: process.env.PADDLE_PRICE_ID_PRO_MONTHLY || 'pri_01_pro_monthly',
    PRO_YEARLY: process.env.PADDLE_PRICE_ID_PRO_YEARLY || 'pri_01_pro_yearly',
} as const;

// Webhook secret for signature verification
export const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || '';

if (!PADDLE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ PADDLE_WEBHOOK_SECRET not set - webhook verification will fail');
}
