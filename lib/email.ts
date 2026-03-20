import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface OrderItem {
  product_name: string
  quantity: number
  price_per_unit: number
  is_bulk: boolean
}

interface OrderEmailData {
  orderId: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  userEmail: string
  userName?: string
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

function buildItemsTable(items: OrderItem[]): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">
        ${item.product_name}
        ${item.is_bulk ? '<span style="background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 6px;">Bulk</span>' : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: center;">${item.quantity.toLocaleString('en-IN')} leaves</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: right;">${formatCurrency(item.price_per_unit)}/100</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${formatCurrency((item.price_per_unit * item.quantity) / 100)}</td>
    </tr>
  `).join('')

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Product</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Leaves</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Rate/100</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildEmailTemplate(title: string, greeting: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a5c2a, #2d8a4e); border-radius: 12px 12px 0 0; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">🍃 The Betel Store</h1>
          <p style="margin: 6px 0 0; color: #d1fae5; font-size: 13px;">Premium Betel Leaves Wholesale</p>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 28px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px;">${title}</h2>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">${greeting}</p>
          ${body}
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">The Betel Store — thebetelstore.com</p>
          <p style="margin: 4px 0 0;">If you have questions, reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ─── User: Order Confirmation ───

export async function sendOrderConfirmationToUser(data: OrderEmailData): Promise<void> {
  const { orderNumber, items, subtotal, discount, total, userEmail, userName } = data

  const body = `
    ${buildItemsTable(items)}
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #6b7280; font-size: 14px;">Subtotal</span>
        <span style="color: #374151; font-size: 14px; float: right;">${formatCurrency(subtotal)}</span>
      </div>
      ${discount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="color: #059669; font-size: 14px;">Bulk Discount</span>
        <span style="color: #059669; font-size: 14px; float: right;">-${formatCurrency(discount)}</span>
      </div>` : ''}
      <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
        <span style="color: #111827; font-size: 16px; font-weight: 700;">Total</span>
        <span style="color: #111827; font-size: 16px; font-weight: 700; float: right;">${formatCurrency(total)}</span>
      </div>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://thebetelstore.com/orders" style="display: inline-block; background: #1a5c2a; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">View Your Orders</a>
    </div>
  `

  const html = buildEmailTemplate(
    `Order Confirmed! #${orderNumber}`,
    `Hi ${userName || 'there'}, thank you for your order. Here's your order summary:`,
    body
  )

  await transporter.sendMail({
    from: `"The Betel Store" <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: `Order Confirmed — #${orderNumber} | The Betel Store`,
    html,
  })
}

// ─── User: Payment Success ───

export async function sendPaymentSuccessToUser(data: OrderEmailData): Promise<void> {
  const { orderNumber, total, userEmail, userName } = data

  const body = `
    <div style="background: #d1fae5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <div style="font-size: 36px; margin-bottom: 8px;">✅</div>
      <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">Payment of ${formatCurrency(total)} received successfully!</p>
      <p style="margin: 6px 0 0; color: #047857; font-size: 13px;">Order #${orderNumber}</p>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Your payment has been verified and your order is now being processed. You'll receive updates as your order ships.
    </p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://thebetelstore.com/orders" style="display: inline-block; background: #1a5c2a; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Track Order</a>
    </div>
  `

  const html = buildEmailTemplate(
    'Payment Successful! 🎉',
    `Hi ${userName || 'there'}, great news!`,
    body
  )

  await transporter.sendMail({
    from: `"The Betel Store" <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: `Payment Received — #${orderNumber} | The Betel Store`,
    html,
  })
}

// ─── User: Order Status Update ───

export async function sendOrderStatusUpdateToUser(
  userEmail: string,
  userName: string | undefined,
  orderNumber: string,
  status: string
): Promise<void> {
  const statusConfig: Record<string, { emoji: string; color: string; bg: string; message: string }> = {
    processing: { emoji: '📦', color: '#92400e', bg: '#fef3c7', message: 'Your order is being prepared and packed.' },
    shipped: { emoji: '🚚', color: '#1e40af', bg: '#dbeafe', message: 'Your order is on its way! It will arrive soon.' },
    delivered: { emoji: '✅', color: '#065f46', bg: '#d1fae5', message: 'Your order has been delivered. Enjoy your fresh betel leaves!' },
    cancelled: { emoji: '❌', color: '#991b1b', bg: '#fee2e2', message: 'Your order has been cancelled. If you have questions, please contact us.' },
  }

  const config = statusConfig[status] || { emoji: '📋', color: '#374151', bg: '#f3f4f6', message: `Your order status has been updated to: ${status}` }

  const body = `
    <div style="background: ${config.bg}; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <div style="font-size: 36px; margin-bottom: 8px;">${config.emoji}</div>
      <p style="margin: 0; color: ${config.color}; font-size: 16px; font-weight: 600;">Order #${orderNumber} — ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">${config.message}</p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://thebetelstore.com/orders" style="display: inline-block; background: #1a5c2a; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">View Order</a>
    </div>
  `

  const html = buildEmailTemplate(
    `Order Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    `Hi ${userName || 'there'},`,
    body
  )

  await transporter.sendMail({
    from: `"The Betel Store" <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: `Order ${status.charAt(0).toUpperCase() + status.slice(1)} — #${orderNumber} | The Betel Store`,
    html,
  })
}

// ─── Admin: New Order Alert ───

export async function sendNewOrderAlertToAdmin(data: OrderEmailData): Promise<void> {
  const { orderId, orderNumber, items, subtotal, discount, total, userEmail, userName } = data
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) return

  const body = `
    <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">🔔 New order received!</p>
      <p style="margin: 4px 0 0; color: #92400e; font-size: 13px;">Customer: ${userName || 'N/A'} (${userEmail})</p>
    </div>
    ${buildItemsTable(items)}
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 8px;">
      <div style="margin-bottom: 6px;">
        <span style="color: #6b7280; font-size: 14px;">Subtotal</span>
        <span style="color: #374151; font-size: 14px; float: right;">${formatCurrency(subtotal)}</span>
      </div>
      ${discount > 0 ? `
      <div style="margin-bottom: 6px;">
        <span style="color: #059669; font-size: 14px;">Discount</span>
        <span style="color: #059669; font-size: 14px; float: right;">-${formatCurrency(discount)}</span>
      </div>` : ''}
      <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
        <span style="color: #111827; font-size: 16px; font-weight: 700;">Total</span>
        <span style="color: #111827; font-size: 16px; font-weight: 700; float: right;">${formatCurrency(total)}</span>
      </div>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://thebetelstore.com/admin/orders" style="display: inline-block; background: #1a5c2a; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">View in Admin Panel</a>
    </div>
  `

  const html = buildEmailTemplate(
    `New Order #${orderNumber}`,
    `A new order has been placed:`,
    body
  )

  await transporter.sendMail({
    from: `"The Betel Store" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `🔔 New Order #${orderNumber} — ${formatCurrency(total)} | The Betel Store`,
    html,
  })
}
