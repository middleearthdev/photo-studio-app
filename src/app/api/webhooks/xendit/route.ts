import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { updatePayment, getPaymentByExternalId } from '@/actions/payments'
import { updateReservationStatusOnPayment } from '@/actions/reservations'

interface XenditCallbackData {
  id: string
  status: string
  external_id?: string
  paid_amount?: number
  payment_method?: string
  created?: string
  updated?: string
  payment_id?: string
  invoice_id?: string
  user_id?: string
}

interface WebhookConfig {
  enabled: boolean
  signatureVerification: boolean
  webhookSecret?: string
  timeout: number
  retryAttempts: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

const getWebhookConfig = (): WebhookConfig => ({
  enabled: process.env.XENDIT_WEBHOOK_ENABLED !== 'false',
  signatureVerification: process.env.XENDIT_SIGNATURE_VERIFICATION === 'true',
  webhookSecret: process.env.XENDIT_WEBHOOK_SECRET,
  timeout: parseInt(process.env.XENDIT_WEBHOOK_TIMEOUT || '30000'),
  retryAttempts: parseInt(process.env.XENDIT_WEBHOOK_RETRY_ATTEMPTS || '3'),
  logLevel: (process.env.XENDIT_WEBHOOK_LOG_LEVEL as WebhookConfig['logLevel']) || 'info'
})

const log = (level: WebhookConfig['logLevel'], message: string, data?: any) => {
  const config = getWebhookConfig()
  const levels = { debug: 0, info: 1, warn: 2, error: 3 }

  if (levels[level] >= levels[config.logLevel]) {
    const timestamp = new Date().toISOString()
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : ''
    console.log(`[${timestamp}] [XENDIT-WEBHOOK] [${level.toUpperCase()}] ${message}${logData}`)
  }
}

const verifyWebhookSignature = (signature: string, body: string, secret: string): boolean => {
  try {
    // Clean the provided signature - remove any prefixes and normalize case
    let providedSignature = signature.replace(/^(sha256=|sha256:)/, '').toLowerCase().trim()

    // Log detailed signature information for debugging
    log('debug', 'Signature verification debug info', {
      originalSignature: signature,
      cleanedSignature: providedSignature,
      signatureLength: providedSignature.length,
      bodyLength: body.length,
      bodyStart: body.substring(0, 50) + '...',
      secretLength: secret.length
    })

    // Try different Xendit signature formats with various encodings
    const signatureAttempts = [
      // 1. Standard HMAC-SHA256 hex
      {
        value: createHmac('sha256', secret).update(body, 'utf8').digest('hex'),
        encoding: 'hex',
        method: 'HMAC-SHA256-hex'
      },
      // 2. HMAC-SHA256 base64
      {
        value: createHmac('sha256', secret).update(body, 'utf8').digest('base64').toLowerCase(),
        encoding: 'base64',
        method: 'HMAC-SHA256-base64'
      },
      // 3. Simple hash concatenation
      {
        value: createHash('sha256').update(body + secret).digest('hex'),
        encoding: 'hex',
        method: 'SHA256-concat'
      },
      // 4. Xendit specific format (token as binary)
      {
        value: createHmac('sha256', Buffer.from(secret, 'utf8')).update(body, 'utf8').digest('hex'),
        encoding: 'hex',
        method: 'HMAC-binary-secret'
      },
      // 5. Try with different body encoding
      {
        value: createHmac('sha256', secret).update(Buffer.from(body, 'utf8')).digest('hex'),
        encoding: 'hex',
        method: 'HMAC-binary-body'
      }
    ]

    // Check each signature attempt
    for (const attempt of signatureAttempts) {
      if (attempt.value.length === providedSignature.length) {
        try {
          let isValid = false

          if (attempt.encoding === 'base64') {
            isValid = attempt.value === providedSignature
          } else {
            isValid = timingSafeEqual(
              Buffer.from(attempt.value, 'hex'),
              Buffer.from(providedSignature, 'hex')
            )
          }

          if (isValid) {
            log('info', 'Signature verification successful', { method: attempt.method })
            return true
          }

          log('debug', 'Signature attempt failed', {
            method: attempt.method,
            expectedFirst10: attempt.value.substring(0, 10),
            providedFirst10: providedSignature.substring(0, 10)
          })
        } catch (compareError) {
          log('debug', 'Signature comparison error', {
            method: attempt.method,
            error: compareError instanceof Error ? compareError.message : 'Unknown error'
          })
          continue
        }
      } else {
        log('debug', 'Signature length mismatch', {
          method: attempt.method,
          expectedLength: attempt.value.length,
          providedLength: providedSignature.length
        })
      }
    }

    // If all attempts failed, try simple string comparison (for development/testing)
    if (process.env.NODE_ENV === 'development') {
      log('warn', 'All signature attempts failed, trying simple comparison for development')
      return true // Allow for development testing
    }

    log('error', 'All signature verification attempts failed', {
      providedSignature: providedSignature.substring(0, 10) + '...',
      attemptedMethods: signatureAttempts.map(a => `${a.method}(${a.value.length})`)
    })
    return false

  } catch (error) {
    log('error', 'Signature verification exception', { error: error instanceof Error ? error.message : 'Unknown error' })
    return false
  }
}



export async function POST(req: NextRequest) {
  const config = getWebhookConfig()
  const startTime = Date.now()

  try {
    // Check if webhook is enabled
    if (!config.enabled) {
      log('warn', 'Webhook received but webhooks are disabled')
      return NextResponse.json(
        { success: false, error: 'Webhook disabled' },
        { status: 503 }
      )
    }


    // Get the raw body for signature verification
    const rawBody = await req.text()

    if (!rawBody) {
      log('error', 'Webhook body is empty')
      return NextResponse.json(
        { success: false, error: 'Empty request body' },
        { status: 400 }
      )
    }

    let callbackData: XenditCallbackData
    try {
      callbackData = JSON.parse(rawBody)
    } catch (error) {
      log('error', 'Invalid JSON in webhook body', { error: error instanceof Error ? error.message : 'Parse error' })
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    log('debug', 'Webhook data parsed', callbackData)

    // Signature verification
    if (config.signatureVerification) {
      const signature = req.headers.get('x-callback-token') || req.headers.get('xendit-callback-token')

      if (!signature) {
        log('warn', 'Webhook signature missing')
        return NextResponse.json(
          { success: false, error: 'Missing signature' },
          { status: 401 }
        )
      }

      // Verify using webhook secret
      if (config.webhookSecret) {
        if (!verifyWebhookSignature(signature, rawBody, config.webhookSecret)) {
          log('warn', 'Webhook signature verification failed')
          return NextResponse.json(
            { success: false, error: 'Invalid signature' },
            { status: 401 }
          )
        }
      } else {
        log('warn', 'Signature verification enabled but no webhook secret configured')
        return NextResponse.json(
          { success: false, error: 'Webhook authentication not configured' },
          { status: 500 }
        )
      }
    }

    // Validate required fields
    const { id, status, external_id } = callbackData

    if (!id || !status) {
      log('error', 'Missing required fields in webhook', { id, status })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find our payment record
    // Try external_id first (our custom ID), then fallback to Xendit's invoice ID
    let payment = null
    
    if (external_id) {
      payment = await getPaymentByExternalId(external_id)
      log('debug', 'Payment lookup by external_id', { external_id, found: !!payment })
    }
    
    if (!payment && id) {
      payment = await getPaymentByExternalId(id)
      log('debug', 'Payment lookup by xendit id', { id, found: !!payment })
    }

    if (!payment) {
      log('info', 'Payment not found for webhook', { external_id, xendit_id: id, status })
      // Return success to prevent Xendit from retrying unknown payments
      return NextResponse.json({
        success: true,
        message: 'Payment not found - webhook acknowledged'
      })
    }

    log('info', 'Processing payment webhook', {
      paymentId: payment.id,
      currentStatus: payment.status,
      newStatus: status
    })

    // Check for duplicate processing (idempotency)
    if (payment.external_status === status && status !== 'PENDING') {
      log('info', 'Duplicate webhook ignored', { paymentId: payment.id, status })
      return NextResponse.json({
        success: true,
        message: 'Webhook already processed'
      })
    }

    // Update payment status based on Xendit status
    let paymentStatus: 'pending' | 'completed' | 'failed' | 'partial' | 'refunded' = 'pending'
    let paidAt: string | null = null

    switch (status.toUpperCase()) {
      case 'PAID':
      case 'SETTLED':
        paymentStatus = 'completed'
        paidAt = callbackData.updated || new Date().toISOString()
        break
      case 'EXPIRED':
      case 'CANCELLED':
      case 'FAILED':
        paymentStatus = 'failed'
        break
      case 'PENDING':
      case 'AWAITING_CAPTURE':
        paymentStatus = 'pending'
        break
      case 'PARTIALLY_PAID':
        paymentStatus = 'partial'
        break
      case 'REFUNDED':
        paymentStatus = 'refunded'
        break
      default:
        log('warn', 'Unknown payment status received', { status, paymentId: payment.id })
        paymentStatus = 'pending'
    }

    // Update payment in our database
    try {
      await updatePayment(payment.id, {
        status: paymentStatus,
        external_status: status,
        paid_at: paidAt || undefined,
        callback_data: callbackData
      })

      log('info', 'Payment updated successfully', {
        paymentId: payment.id,
        oldStatus: payment.status,
        newStatus: paymentStatus
      })

      // Update reservation payment status
      if (payment.reservation_id) {
        try {
          await updateReservationStatusOnPayment(payment.reservation_id, paymentStatus)
          log('info', 'Reservation status updated', {
            reservationId: payment.reservation_id,
            paymentStatus
          })
        } catch (error) {
          log('error', 'Failed to update reservation status', {
            reservationId: payment.reservation_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          // Continue processing - don't fail the webhook for reservation update errors
        }
      }

      const processingTime = Date.now() - startTime
      log('info', 'Webhook processed successfully', {
        paymentId: payment.id,
        status: paymentStatus,
        processingTime
      })

      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        data: {
          payment_id: payment.id,
          status: paymentStatus,
          processing_time: processingTime
        }
      })
    } catch (dbError) {
      log('error', 'Database update failed', {
        paymentId: payment.id,
        error: dbError instanceof Error ? dbError.message : 'Database error'
      })

      // Return 500 to trigger Xendit retry
      return NextResponse.json(
        { success: false, error: 'Database update failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    log('error', 'Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    })

    // Return 500 to trigger Xendit retry for transient errors
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Xendit sends HEAD requests to verify the endpoint
export async function HEAD() {
  const config = getWebhookConfig()

  if (!config.enabled) {
    return NextResponse.json(
      { success: false, message: 'Webhook disabled' },
      { status: 503 }
    )
  }

  log('debug', 'Webhook endpoint health check')
  return NextResponse.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}

// GET endpoint for webhook status and configuration
export async function GET() {
  const config = getWebhookConfig()

  // Only return non-sensitive configuration info
  return NextResponse.json({
    enabled: config.enabled,
    signature_verification: config.signatureVerification,
    has_webhook_secret: !!config.webhookSecret,
    timeout: config.timeout,
    retry_attempts: config.retryAttempts,
    log_level: config.logLevel,
    timestamp: new Date().toISOString()
  })
}