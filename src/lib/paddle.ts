import { Paddle, Environment } from '@paddle/paddle-node-sdk';

// ============================================================================
// PADDLE CONFIGURATION - Sandbox & Production Ready
// ============================================================================

const PADDLE_API_KEY = process.env.PADDLE_API_KEY || '';
const PADDLE_ENV = (process.env.PADDLE_ENVIRONMENT || 'sandbox') as Environment;

// Validate configuration at startup
if (!PADDLE_API_KEY) {
    console.warn('⚠️ PADDLE_API_KEY not set - payment features will be disabled');
}

// Initialize Paddle SDK (lazy initialization)
let paddleInstance: Paddle | null = null;

export function getPaddleClient(): Paddle | null {
    if (!PADDLE_API_KEY) {
        return null;
    }
    
    if (!paddleInstance) {
        paddleInstance = new Paddle(PADDLE_API_KEY, { 
            environment: PADDLE_ENV,
        });
        console.log(`✅ Paddle initialized in ${PADDLE_ENV} mode`);
    }
    
    return paddleInstance;
}

// Legacy export for backward compatibility
export const paddle = PADDLE_API_KEY 
    ? new Paddle(PADDLE_API_KEY, { environment: PADDLE_ENV })
    : null as any;

// ============================================================================
// PRICE IDS - Configure these in your Paddle Dashboard
// ============================================================================

export const PADDLE_PRICE_IDS = {
    // One-time exam purchase ($1.99)
    ONE_TIME_EXAM: process.env.PADDLE_PRICE_ID_ONE_TIME || '',
    // Pro Monthly subscription ($11.99/month)
    PRO_MONTHLY: process.env.PADDLE_PRICE_ID_PRO_MONTHLY || '',
    // Pro Yearly subscription ($99/year)
    PRO_YEARLY: process.env.PADDLE_PRICE_ID_PRO_YEARLY || '',
} as const;

// Validate price IDs
export function validatePriceIds(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!PADDLE_PRICE_IDS.ONE_TIME_EXAM) missing.push('PADDLE_PRICE_ID_ONE_TIME');
    if (!PADDLE_PRICE_IDS.PRO_MONTHLY) missing.push('PADDLE_PRICE_ID_PRO_MONTHLY');
    if (!PADDLE_PRICE_IDS.PRO_YEARLY) missing.push('PADDLE_PRICE_ID_PRO_YEARLY');
    
    return { valid: missing.length === 0, missing };
}

// ============================================================================
// WEBHOOK SECRET - For signature verification
// ============================================================================

export const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || '';

if (!PADDLE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ PADDLE_WEBHOOK_SECRET not set - webhook verification will fail in production');
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export function getPaddleApiUrl(): string {
    return PADDLE_ENV === 'production' 
        ? 'https://api.paddle.com' 
        : 'https://sandbox-api.paddle.com';
}

export function getPaddleCheckoutUrl(): string {
    return PADDLE_ENV === 'production'
        ? 'https://buy.paddle.com'
        : 'https://sandbox-buy.paddle.com';
}

// ============================================================================
// API HELPER WITH RETRY LOGIC
// ============================================================================

interface PaddleApiOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    endpoint: string;
    body?: Record<string, any>;
    retries?: number;
}

export interface PaddleApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        type: string;
        code: string;
        detail: string;
        documentation_url?: string;
    };
}

/**
 * Make a request to Paddle API with automatic retry logic
 */
export async function paddleApiRequest<T = any>(
    options: PaddleApiOptions
): Promise<PaddleApiResponse<T>> {
    const { method, endpoint, body, retries = 3 } = options;
    const apiUrl = getPaddleApiUrl();
    const url = `${apiUrl}${endpoint}`;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${PADDLE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                // Check if it's a retryable error (5xx or rate limit)
                if (response.status >= 500 || response.status === 429) {
                    lastError = new Error(responseData.error?.detail || `HTTP ${response.status}`);
                    
                    if (attempt < retries) {
                        // Exponential backoff: 1s, 2s, 4s
                        const delay = Math.pow(2, attempt - 1) * 1000;
                        console.log(`⏳ Paddle API retry ${attempt}/${retries} in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }
                
                // Non-retryable error
                return {
                    success: false,
                    error: responseData.error || {
                        type: 'api_error',
                        code: `http_${response.status}`,
                        detail: responseData.error?.detail || 'Unknown error',
                    }
                };
            }
            
            return {
                success: true,
                data: responseData.data,
            };
            
        } catch (error: any) {
            lastError = error;
            
            if (attempt < retries) {
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`⏳ Paddle API retry ${attempt}/${retries} after network error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }
    
    return {
        success: false,
        error: {
            type: 'network_error',
            code: 'connection_failed',
            detail: lastError?.message || 'Failed to connect to Paddle API',
        }
    };
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export interface PaddleCustomer {
    id: string;
    email: string;
    name?: string;
    status: string;
}

/**
 * Get or create a Paddle customer by email
 * This is the CORRECT way to handle customer management
 */
export async function getOrCreatePaddleCustomer(
    email: string,
    name?: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
    
    // First, try to find existing customer by email
    const searchResult = await paddleApiRequest<PaddleCustomer[]>({
        method: 'GET',
        endpoint: `/customers?email=${encodeURIComponent(email)}`,
    });
    
    if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        // Customer exists
        const existingCustomer = searchResult.data[0];
        console.log(`✅ Found existing Paddle customer: ${existingCustomer.id}`);
        return { success: true, customerId: existingCustomer.id };
    }
    
    // Customer doesn't exist, create new one
    const createResult = await paddleApiRequest<PaddleCustomer>({
        method: 'POST',
        endpoint: '/customers',
        body: {
            email,
            name: name || undefined,
        },
    });
    
    if (createResult.success && createResult.data) {
        console.log(`✅ Created new Paddle customer: ${createResult.data.id}`);
        return { success: true, customerId: createResult.data.id };
    }
    
    // Handle "customer already exists" error - extract customer ID from error message
    const errorDetail = createResult.error?.detail || '';
    const errorCode = createResult.error?.code || '';
    
    // Check for conflict error - Paddle returns customer ID in the error message
    // Format: "customer email conflicts with customer of id ctm_xxxxx"
    if (errorDetail.includes('conflicts with customer of id') || 
        errorCode === 'customer_already_exists' ||
        errorDetail.includes('already exists')) {
        
        // Try to extract customer ID from error message
        const customerIdMatch = errorDetail.match(/ctm_[a-zA-Z0-9]+/);
        if (customerIdMatch) {
            const existingCustomerId = customerIdMatch[0];
            console.log(`✅ Extracted existing Paddle customer from error: ${existingCustomerId}`);
            return { success: true, customerId: existingCustomerId };
        }
        
        // If we couldn't extract ID, try search again
        const retrySearch = await paddleApiRequest<PaddleCustomer[]>({
            method: 'GET',
            endpoint: `/customers?email=${encodeURIComponent(email)}`,
        });
        
        if (retrySearch.success && retrySearch.data && retrySearch.data.length > 0) {
            console.log(`✅ Found existing Paddle customer on retry: ${retrySearch.data[0].id}`);
            return { success: true, customerId: retrySearch.data[0].id };
        }
    }
    
    console.error('Failed to create Paddle customer:', createResult.error);
    return {
        success: false,
        error: createResult.error?.detail || 'Failed to create customer',
    };
}

// ============================================================================
// TRANSACTION/CHECKOUT CREATION
// ============================================================================

export interface CreateCheckoutOptions {
    customerId: string;
    priceId: string;
    quantity?: number;
    customData?: Record<string, any>;
    successUrl?: string;
    // For subscriptions
    subscriptionOptions?: {
        billingCycleAnchor?: string;
    };
}

export interface CheckoutResult {
    success: boolean;
    checkoutUrl?: string;
    transactionId?: string;
    error?: string;
}

/**
 * Create a Paddle checkout session
 * Returns a hosted checkout URL or transaction ID for overlay checkout
 */
export async function createPaddleCheckout(
    options: CreateCheckoutOptions
): Promise<CheckoutResult> {
    const { customerId, priceId, quantity = 1, customData, successUrl } = options;
    
    // Validate price ID is configured
    if (!priceId) {
        return {
            success: false,
            error: 'Price ID not configured. Please set up Paddle price IDs in environment variables.',
        };
    }
    
    const checkoutPayload: Record<string, any> = {
        items: [{ price_id: priceId, quantity }],
        customer_id: customerId,
    };
    
    if (customData) {
        checkoutPayload.custom_data = customData;
    }
    
    // Add checkout settings for success URL redirect
    if (successUrl) {
        checkoutPayload.checkout = {
            url: successUrl,
        };
    }
    
    const result = await paddleApiRequest<{
        id: string;
        checkout: {
            url?: string;
        };
        status: string;
    }>({
        method: 'POST',
        endpoint: '/transactions',
        body: checkoutPayload,
    });
    
    if (!result.success || !result.data) {
        return {
            success: false,
            error: result.error?.detail || 'Failed to create checkout session',
        };
    }
    
    const transactionId = result.data.id;
    
    // For Paddle Billing API, use the pay link format
    // Format: https://[sandbox-]buy.paddle.com/checkout/custom/[transaction_id]?locale=en
    // Or try the transaction preview: https://[sandbox-]buy.paddle.com/checkout?txn=txn_xxx
    const checkoutDomain = PADDLE_ENV === 'production'
        ? 'https://buy.paddle.com'
        : 'https://sandbox-buy.paddle.com';
    
    // Try the direct transaction checkout URL
    const checkoutUrl = `${checkoutDomain}/checkout?txn=${transactionId}`;
    
    console.log(`✅ Created Paddle checkout: ${transactionId}`);
    console.log(`🔗 Checkout URL: ${checkoutUrl}`);
    
    return {
        success: true,
        checkoutUrl,
        transactionId,
    };
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export interface SubscriptionInfo {
    id: string;
    status: string;
    customerId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    nextBilledAt?: Date;
    canceledAt?: Date;
    priceId: string;
    quantity: number;
}

/**
 * Get subscription details from Paddle
 */
export async function getPaddleSubscription(
    subscriptionId: string
): Promise<{ success: boolean; subscription?: SubscriptionInfo; error?: string }> {
    const result = await paddleApiRequest<any>({
        method: 'GET',
        endpoint: `/subscriptions/${subscriptionId}`,
    });
    
    if (!result.success || !result.data) {
        return {
            success: false,
            error: result.error?.detail || 'Subscription not found',
        };
    }
    
    const sub = result.data;
    
    return {
        success: true,
        subscription: {
            id: sub.id,
            status: sub.status,
            customerId: sub.customer_id,
            currentPeriodStart: new Date(sub.current_billing_period?.starts_at),
            currentPeriodEnd: new Date(sub.current_billing_period?.ends_at),
            nextBilledAt: sub.next_billed_at ? new Date(sub.next_billed_at) : undefined,
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at) : undefined,
            priceId: sub.items?.[0]?.price?.id,
            quantity: sub.items?.[0]?.quantity || 1,
        },
    };
}

/**
 * Cancel a Paddle subscription
 */
export async function cancelPaddleSubscription(
    subscriptionId: string,
    effectiveFrom: 'immediately' | 'next_billing_period' = 'next_billing_period'
): Promise<{ success: boolean; error?: string }> {
    const result = await paddleApiRequest({
        method: 'POST',
        endpoint: `/subscriptions/${subscriptionId}/cancel`,
        body: {
            effective_from: effectiveFrom,
        },
    });
    
    if (!result.success) {
        return {
            success: false,
            error: result.error?.detail || 'Failed to cancel subscription',
        };
    }
    
    console.log(`✅ Cancelled Paddle subscription: ${subscriptionId}`);
    return { success: true };
}

/**
 * Pause a Paddle subscription
 */
export async function pausePaddleSubscription(
    subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
    const result = await paddleApiRequest({
        method: 'POST',
        endpoint: `/subscriptions/${subscriptionId}/pause`,
    });
    
    if (!result.success) {
        return {
            success: false,
            error: result.error?.detail || 'Failed to pause subscription',
        };
    }
    
    return { success: true };
}

/**
 * Resume a paused Paddle subscription
 */
export async function resumePaddleSubscription(
    subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
    const result = await paddleApiRequest({
        method: 'POST',
        endpoint: `/subscriptions/${subscriptionId}/resume`,
        body: {
            effective_from: 'immediately',
        },
    });
    
    if (!result.success) {
        return {
            success: false,
            error: result.error?.detail || 'Failed to resume subscription',
        };
    }
    
    return { success: true };
}

// ============================================================================
// TRANSACTION VERIFICATION
// ============================================================================

/**
 * Verify a transaction is completed (for webhook/callback verification)
 */
export async function verifyPaddleTransaction(
    transactionId: string
): Promise<{ success: boolean; completed: boolean; customData?: Record<string, any>; error?: string }> {
    const result = await paddleApiRequest<any>({
        method: 'GET',
        endpoint: `/transactions/${transactionId}`,
    });
    
    if (!result.success || !result.data) {
        return {
            success: false,
            completed: false,
            error: result.error?.detail || 'Transaction not found',
        };
    }
    
    const transaction = result.data;
    
    return {
        success: true,
        completed: transaction.status === 'completed',
        customData: transaction.custom_data,
    };
}

// ============================================================================
// HELPER TYPES FOR WEBHOOKS
// ============================================================================

export type PaddleWebhookEventType = 
    | 'transaction.completed'
    | 'transaction.created'
    | 'transaction.updated'
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.canceled'
    | 'subscription.paused'
    | 'subscription.resumed'
    | 'subscription.activated'
    | 'subscription.past_due'
    | 'customer.created'
    | 'customer.updated';

export interface PaddleWebhookEvent {
    event_type: PaddleWebhookEventType;
    event_id: string;
    occurred_at: string;
    data: Record<string, any>;
}
