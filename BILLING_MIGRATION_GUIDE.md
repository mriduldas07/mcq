# Paddle Billing System - Migration & Deployment Guide

## Overview
This guide covers the complete implementation of the Paddle billing system with proper transaction history, subscription management, and frontend guards.

---

## ✅ Changes Implemented

### 1. Database Schema Changes
- Added `paddleSubscriptionId` to User model (for quick subscription lookup)
- Added `subscriptionStatus` enum field (`NONE`, `ACTIVE`, `CANCELED`, `PAST_DUE`)
- Added `currentPeriodEnd` timestamp field
- Created new `SubscriptionStatusType` enum

### 2. Webhook Handler Enhanced
- ✅ `subscription.created` - Records subscription payment in transaction history
- ✅ `transaction.completed/paid` - Handles BOTH one-time exam purchases AND subscription renewals
- ✅ `subscription.updated` - Handles monthly ↔ yearly switches without creating new subscription
- ✅ `subscription.canceled` - Keeps Pro access until period end (grace period)
- ✅ `subscription.past_due` - Updates status but keeps access for retry
- ✅ All handlers sync User-level fields for single source of truth

### 3. Payment Service Updated
- Uses User-level `subscriptionStatus` for faster access
- Supports grace period logic
- Clear priority: PRO subscription > One-time credits > Free quota

### 4. Frontend Billing Guards
- ✅ Prevents subscription checkout if already active
- ✅ Shows grace period status for canceled subscriptions
- ✅ Shows past due warning with payment prompt
- ✅ Dynamic buttons based on subscription status
- ✅ Transaction history displays properly

---

## 📋 Migration Steps

### Step 1: Run Database Migration

**Option A: Using Prisma CLI (Recommended)**
```bash
npx prisma migrate dev --name add_user_subscription_fields
```

**Option B: Manual SQL Migration (if Prisma fails)**

Create file: `prisma/migrations/[timestamp]_add_user_subscription_fields/migration.sql`

```sql
-- AlterEnum
-- Create new enum type
CREATE TYPE "SubscriptionStatusType" AS ENUM ('NONE', 'ACTIVE', 'CANCELED', 'PAST_DUE');

-- AlterTable
-- Add new fields to User table
ALTER TABLE "User" ADD COLUMN "paddleSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" "SubscriptionStatusType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
-- Add indexes for performance
CREATE UNIQUE INDEX "User_paddleSubscriptionId_key" ON "User"("paddleSubscriptionId");
CREATE INDEX "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

-- Migrate existing data (if you have existing Pro users)
-- This syncs User-level fields from the Subscription table
UPDATE "User" u
SET 
  "paddleSubscriptionId" = s."paddleSubscriptionId",
  "subscriptionStatus" = 
    CASE 
      WHEN s."status" = 'ACTIVE' AND s."currentPeriodEnd" > NOW() THEN 'ACTIVE'::"SubscriptionStatusType"
      WHEN s."status" = 'CANCELLED' THEN 'CANCELED'::"SubscriptionStatusType"
      WHEN s."status" = 'PAST_DUE' THEN 'PAST_DUE'::"SubscriptionStatusType"
      ELSE 'NONE'::"SubscriptionStatusType"
    END,
  "currentPeriodEnd" = s."currentPeriodEnd"
FROM "Subscription" s
WHERE s."userId" = u."id"
  AND s."status" IN ('ACTIVE', 'CANCELLED', 'PAST_DUE')
  AND s."currentPeriodEnd" = (
    SELECT MAX("currentPeriodEnd")
    FROM "Subscription"
    WHERE "userId" = u."id"
  );
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Verify Migration
```bash
npx prisma studio
```
Check that the new fields appear on the User table.

---

## 🧪 Testing Checklist

### Test Subscription Flow
- [ ] Free user can subscribe to Pro (monthly)
- [ ] Free user can subscribe to Pro (yearly)
- [ ] Active Pro user CANNOT create duplicate subscription (frontend guard blocks)
- [ ] Transaction appears in payment history after subscription created
- [ ] User can cancel subscription
- [ ] Canceled subscription shows grace period until `currentPeriodEnd`
- [ ] User can switch from monthly to yearly (uses `subscription.updated` webhook)
- [ ] Subscription renewal records payment in transaction history

### Test Pay-Per-Exam Flow
- [ ] Free user (no subscription) can buy 1 exam for $1.99
- [ ] Pro user can still buy 1 exam credit (independent systems)
- [ ] Exam credit increments `oneTimeExamsRemaining`
- [ ] Exam credit does NOT create a subscription
- [ ] Publishing exam with credit decrements `oneTimeExamsRemaining`
- [ ] Transaction appears in payment history

### Test Edge Cases
- [ ] Past due subscription shows warning banner
- [ ] Past due user keeps Pro access temporarily
- [ ] Expired subscription downgrades to Free
- [ ] Grace period (canceled sub) allows exam publishing until period end
- [ ] After grace period ends, user downgrades to Free
- [ ] Paused subscription removes Pro access
- [ ] Resumed subscription restores Pro access

### Test Transaction History
- [ ] Subscription creation payment recorded
- [ ] Subscription renewal payments recorded
- [ ] One-time exam purchases recorded
- [ ] All transactions show in billing page (up to 20 items)
- [ ] Payment amounts and dates are correct

---

## 🚀 Deployment Steps

### 1. Environment Variables
Ensure these are set in production:
```bash
DATABASE_URL="postgresql://..."
PADDLE_API_KEY="your-paddle-api-key"
PADDLE_WEBHOOK_SECRET="your-webhook-secret"
PADDLE_CLIENT_TOKEN="your-paddle-client-token"
PADDLE_PRICE_ID_PRO_MONTHLY="pri_..."
PADDLE_PRICE_ID_PRO_YEARLY="pri_..."
PADDLE_PRICE_ID_ONE_TIME_EXAM="pri_..."
PADDLE_ENVIRONMENT="production" # or "sandbox" for testing
```

### 2. Deploy Database Migration
```bash
npx prisma migrate deploy
```

### 3. Deploy Application
```bash
npm run build
# Deploy to Vercel/your hosting
```

### 4. Configure Paddle Webhook
In Paddle Dashboard:
- Go to Developer Tools > Notifications
- Add webhook URL: `https://yourdomain.com/api/webhooks/paddle`
- Subscribe to events:
  - `subscription.created`
  - `subscription.activated`
  - `subscription.updated`
  - `subscription.canceled`
  - `subscription.paused`
  - `subscription.resumed`
  - `subscription.past_due`
  - `transaction.completed`
  - `transaction.paid`

### 5. Test in Production
- Create test subscription with Paddle test card
- Verify webhook events are received
- Check transaction history
- Test cancellation and grace period

---

## 🔒 Security Checklist

- [x] Never unlock Pro on frontend success redirect
- [x] Never trust Paddle checkout success URL
- [x] Frontend guards prevent duplicate subscriptions
- [x] Webhook signature verification enabled
- [x] Paddle webhook is single source of truth
- [x] One-time exam purchase never creates subscription
- [x] No card data stored in database

---

## 📊 Monitoring

### Key Metrics to Track
1. **Subscription Conversions** - Free → Pro upgrades
2. **Churn Rate** - Cancellations per month
3. **Grace Period Usage** - Users who cancel but keep using until end
4. **One-time Purchases** - Pay-per-exam sales
5. **Failed Payments** - Past due subscriptions
6. **Webhook Reliability** - Monitor webhook errors in logs

### Logging
All webhook events are logged with:
- ✅ Event type
- ✅ User ID
- ✅ Action taken
- ✅ Timestamp

Check logs: `console.log` statements in webhook handler

---

## 🐛 Troubleshooting

### "User already has active subscription" error
- Frontend guard working correctly
- User should use "Manage Subscription" instead

### Transaction not appearing in history
- Check webhook was received: Review Paddle webhook logs
- Verify `Payment` record created in database
- Check `transaction.completed` or `transaction.paid` handler

### Subscription not activating
- Verify webhook received `subscription.created` event
- Check User fields updated: `subscriptionStatus`, `currentPeriodEnd`
- Ensure `currentPeriodEnd` is in the future

### Grace period not working
- Check `subscriptionStatus` is `CANCELED` not `NONE`
- Verify `currentPeriodEnd` is in the future
- User should retain Pro access until period ends

---

## 📚 Core Business Rules Reference

1. **One active subscription per user**
   - Enforced by frontend guards and backend checks
   - User-level `subscriptionStatus` field prevents duplicates

2. **Subscription and pay-per-exam are independent**
   - Pro users can still buy exam credits
   - Exam credits never convert to subscription

3. **Monthly and yearly are same plan, different intervals**
   - Both use "Pro" plan
   - Handled by `subscription.updated` webhook (no new subscription)

4. **Pay-per-exam never creates subscription**
   - Only increments `oneTimeExamsRemaining`
   - Uses `transaction.completed` with `type: "exam_credit"`

5. **Paddle webhooks are single source of truth**
   - Never trust frontend success redirects
   - All billing state updated only via webhooks

---

## ✅ Implementation Complete

All requirements have been implemented:
- ✅ Pro subscription (monthly & yearly billing)
- ✅ Pay-per-exam (one-time payment)
- ✅ Independent billing systems
- ✅ Transaction history working
- ✅ Frontend billing guards
- ✅ Grace period support
- ✅ Past due handling
- ✅ Webhook event coverage
- ✅ Single source of truth architecture

---

## 📞 Support

If you encounter any issues:
1. Check Paddle webhook logs in dashboard
2. Review application logs for webhook processing
3. Verify environment variables are set correctly
4. Test with Paddle sandbox environment first

---

**Last Updated:** 2026-01-17
**Migration Status:** Ready to deploy
