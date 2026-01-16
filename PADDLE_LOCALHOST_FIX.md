# Fix Paddle "Failed to retrieve JWT" Error on Localhost

## Problem

When clicking the upgrade buttons, Paddle checkout fails with:

```
POST https://checkout-service.paddle.com/transaction-checkout 403 (Forbidden)
API Error: Failed to retrieve JWT
```

## Root Cause

**Paddle requires you to whitelist `localhost` in your Sandbox account settings.** By default, Paddle blocks requests from localhost for security reasons.

## Solution

### Step 1: Log into Paddle Sandbox

1. Go to https://sandbox-vendors.paddle.com/
2. Log in with your Paddle credentials

### Step 2: Whitelist Localhost Domain

1. Navigate to: **Developer Tools** → **Authentication**
2. Find your **Client-side token** (starts with `test_a0938...`)
3. Under **"Allowed domains"**, add these entries:
   ```
   localhost
   http://localhost:3000
   http://localhost:*
   ```
4. Click **Save** or **Update**

### Step 3: Wait 2-3 Minutes

Paddle takes a few minutes to propagate the changes. Wait 2-3 minutes after saving.

### Step 4: Test Again

1. Refresh your billing page: http://localhost:3000/dashboard/billing
2. Click "Upgrade to Pro Monthly" or "Buy 1 Exam"
3. The Paddle checkout should now open successfully! 🎉

## Alternative Solution: Use Production Domain

If you can't whitelist localhost (or for production), deploy your app and use the production domain:

1. Deploy to Vercel/Railway/etc
2. In Paddle Dashboard → Authentication → Allowed domains, add:
   ```
   yourdomain.com
   https://yourdomain.vercel.app
   ```
3. Update your `.env` file with production URLs

## Verification

After whitelisting, you should see:

- ✅ Paddle checkout overlay opens
- ✅ No 403 errors in console
- ✅ Can complete test transactions

## Additional Configuration Checks

Make sure these are set in `.env.local`:

```bash
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_a0938de9bac8b1077b84bfe6ac8"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
PADDLE_PRICE_ID_ONE_TIME="pri_01keyvbsm1m1yhjg7v2njd5tgt"
PADDLE_PRICE_ID_PRO_MONTHLY="pri_01keyv1qwcz0fg94m4jfgva9jh"
PADDLE_PRICE_ID_PRO_YEARLY="pri_01keyv2gsws0erprese5fr9hjs"
```

## Testing the Fix

Once configured, test the checkout flow:

1. Click upgrade button
2. Paddle checkout overlay should appear
3. Fill in test card details (Paddle provides test cards)
4. Complete checkout
5. Webhook should process payment
6. User should be upgraded to Pro

## Common Issues

### Issue: Still getting 403 after whitelisting

**Solution**:

- Clear browser cache
- Wait 5 minutes for Paddle to propagate changes
- Check if you whitelisted the correct environment (sandbox vs production)

### Issue: Checkout opens but payment fails

**Solution**:

- Use Paddle test card numbers: https://developer.paddle.com/concepts/payment-methods/credit-debit-card
- Check webhook URL is configured

### Issue: Payment succeeds but user not upgraded

**Solution**:

- Check webhook endpoint is receiving events
- Verify webhook secret matches `.env` file
- Check server logs for webhook processing errors
