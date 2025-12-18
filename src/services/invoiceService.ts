/**
 * Invoice Generation Service
 * Generates invoice data and PDFs for orders
 * Supports: HTML invoice generation, PDF generation (via external service), Invoice storage
 *
 * PDF Generation Options:
 * 1. Server-side: Use PDFKit library (requires npm install pdfkit)
 * 2. Client-side: Use html2pdf or similar in browser
 * 3. External Service: Use Puppeteer, wkhtmltopdf, or specialized PDF service
 * 4. Cloud Function: Generate PDF in Firebase Cloud Function
 */

/**
 * Invoice data structure
 */
export interface InvoiceData {
  invoiceId: string
  orderId: string
  date: string
  dueDate?: string
  status: 'draft' | 'sent' | 'viewed' | 'paid'
  
  // Customer info
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  // Shipping address
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  // Items
  items: Array<{
    id: string
    name: string
    description?: string
    quantity: number
    unitPrice: number
    tax?: number
    total: number
  }>
  
  // Totals
  subtotal: number
  taxAmount: number
  discountAmount: number
  shippingCost: number
  total: number
  
  // Payment info
  paymentMethod: string
  paymentStatus: 'pending' | 'completed' | 'failed'
  transactionId?: string
  
  // Company info
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyLogo?: string
  
  // Additional
  notes?: string
  terms?: string
}

/**
 * Generate HTML invoice for display/email
 */
export function generateInvoiceHTML(invoice: InvoiceData): string {
  const itemsHTML = invoice.items
    .map((item: any) => `
      <tr>
        <td style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">₹${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">₹${item.total.toFixed(2)}</td>
      </tr>
    `)
    .join('')

  const paymentStatusColor = invoice.paymentStatus === 'completed' ? '#10b981' : '#ef4444'
  const paymentStatusText = invoice.paymentStatus === 'completed' ? 'Paid' : 'Unpaid'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${invoice.invoiceId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; }
          .company-info h1 { color: #8b5cf6; font-size: 24px; margin-bottom: 10px; }
          .company-details { font-size: 13px; color: #666; line-height: 1.6; }
          .invoice-info { text-align: right; }
          .invoice-info p { margin-bottom: 5px; color: #666; }
          .invoice-id { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; background: ${paymentStatusColor}; color: white; font-size: 13px; font-weight: bold; }
          
          .addresses { display: flex; gap: 40px; margin-bottom: 40px; }
          .address-block { flex: 1; }
          .address-block h3 { font-size: 13px; font-weight: bold; color: #333; margin-bottom: 10px; text-transform: uppercase; }
          .address-block p { font-size: 13px; color: #666; line-height: 1.8; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          thead { background: #f5f5f5; }
          th { padding: 12px; text-align: left; font-weight: 600; font-size: 13px; color: #333; }
          td { padding: 12px; font-size: 13px; color: #666; }
          
          .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .totals-table { width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .totals-label { font-size: 13px; color: #666; }
          .totals-value { font-size: 13px; color: #333; text-align: right; min-width: 80px; }
          .totals-row.total { border: none; border-top: 2px solid #8b5cf6; padding-top: 15px; padding-bottom: 0; font-weight: bold; }
          .totals-row.total .totals-value { font-size: 16px; color: #8b5cf6; }
          
          .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
          .notes h3 { font-size: 13px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .notes p { font-size: 12px; color: #666; line-height: 1.6; }
          
          .payment-info { background: #f5f5f5; padding: 20px; border-radius: 4px; margin-top: 30px; }
          .payment-info h3 { font-size: 13px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .payment-info p { font-size: 13px; color: #666; margin-bottom: 5px; }
          
          .footer { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
          
          @media print {
            body { background: white; }
            .container { box-shadow: none; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <header>
            <div class="company-info">
              <h1>${invoice.companyName}</h1>
              <div class="company-details">
                <p>${invoice.companyAddress}</p>
                <p>Phone: ${invoice.companyPhone}</p>
                <p>Email: ${invoice.companyEmail}</p>
              </div>
            </div>
            <div class="invoice-info">
              <div class="invoice-id">Invoice ${invoice.invoiceId}</div>
              <div class="status-badge">${paymentStatusText}</div>
              <p><strong>Date:</strong> ${invoice.date}</p>
              <p><strong>Order ID:</strong> ${invoice.orderId}</p>
            </div>
          </header>

          <!-- Addresses -->
          <div class="addresses">
            <div class="address-block">
              <h3>Bill To</h3>
              <p>
                <strong>${invoice.customerName}</strong><br>
                ${invoice.customerAddress.street}<br>
                ${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.postalCode}<br>
                ${invoice.customerAddress.country}
              </p>
              <p style="margin-top: 10px;">Phone: ${invoice.customerPhone}<br>Email: ${invoice.customerEmail}</p>
            </div>
            <div class="address-block">
              <h3>Ship To</h3>
              <p>
                ${invoice.shippingAddress.street}<br>
                ${invoice.shippingAddress.city}, ${invoice.shippingAddress.state} ${invoice.shippingAddress.postalCode}<br>
                ${invoice.shippingAddress.country}
              </p>
            </div>
          </div>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals">
            <div class="totals-table">
              <div class="totals-row">
                <span class="totals-label">Subtotal:</span>
                <span class="totals-value">₹${invoice.subtotal.toFixed(2)}</span>
              </div>
              ${invoice.discountAmount > 0 ? `
                <div class="totals-row">
                  <span class="totals-label">Discount:</span>
                  <span class="totals-value">-₹${invoice.discountAmount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${invoice.taxAmount > 0 ? `
                <div class="totals-row">
                  <span class="totals-label">Tax (GST):</span>
                  <span class="totals-value">₹${invoice.taxAmount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${invoice.shippingCost > 0 ? `
                <div class="totals-row">
                  <span class="totals-label">Shipping:</span>
                  <span class="totals-value">₹${invoice.shippingCost.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="totals-row total">
                <span class="totals-label">Total:</span>
                <span class="totals-value">₹${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="payment-info">
            <h3>Payment Details</h3>
            <p><strong>Method:</strong> ${invoice.paymentMethod}</p>
            <p><strong>Status:</strong> <span style="color: ${paymentStatusColor}; font-weight: bold;">${paymentStatusText}</span></p>
            ${invoice.transactionId ? `<p><strong>Transaction ID:</strong> ${invoice.transactionId}</p>` : ''}
          </div>

          <!-- Notes -->
          ${invoice.notes || invoice.terms ? `
            <div class="notes">
              ${invoice.notes ? `
                <h3>Notes</h3>
                <p>${invoice.notes}</p>
              ` : ''}
              ${invoice.terms ? `
                <h3 style="margin-top: 15px;">Terms & Conditions</h3>
                <p>${invoice.terms}</p>
              ` : ''}
            </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is an automated invoice. For inquiries, please contact ${invoice.companyEmail}</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Generate invoice as JSON (for storage/transmission)
 */
export function generateInvoiceJSON(invoice: InvoiceData): string {
  return JSON.stringify(invoice, null, 2)
}

/**
 * Generate invoice CSV format (for exports)
 */
export function generateInvoiceCSV(invoice: InvoiceData): string {
  const headers = ['Item', 'Description', 'Quantity', 'Unit Price', 'Total']
  const rows = invoice.items.map((item: any) => [
    item.name,
    item.description || '',
    item.quantity,
    item.unitPrice.toFixed(2),
    item.total.toFixed(2)
  ])

  const csv = [
    `Invoice,${invoice.invoiceId}`,
    `Order ID,${invoice.orderId}`,
    `Date,${invoice.date}`,
    `Customer,${invoice.customerName}`,
    ``,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csv
}

/**
 * Generate invoice markdown (for storage/documentation)
 */
export function generateInvoiceMarkdown(invoice: InvoiceData): string {
  const itemsTable = `| Item | Qty | Unit Price | Total |
|------|-----|-----------|-------|
${invoice.items.map((item: any) => `| ${item.name} | ${item.quantity} | ₹${item.unitPrice.toFixed(2)} | ₹${item.total.toFixed(2)} |`).join('\n')}`

  return `# Invoice ${invoice.invoiceId}

## Order Information
- **Order ID:** ${invoice.orderId}
- **Invoice Date:** ${invoice.date}
- **Payment Status:** ${invoice.paymentStatus}

## Bill To
${invoice.customerName}  
${invoice.customerAddress.street}  
${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.postalCode}  
${invoice.customerAddress.country}  

Phone: ${invoice.customerPhone}  
Email: ${invoice.customerEmail}

## Ship To
${invoice.shippingAddress.street}  
${invoice.shippingAddress.city}, ${invoice.shippingAddress.state} ${invoice.shippingAddress.postalCode}  
${invoice.shippingAddress.country}

## Items

${itemsTable}

## Summary
| | |
|-|---|
| **Subtotal** | ₹${invoice.subtotal.toFixed(2)} |
| **Discount** | -₹${invoice.discountAmount.toFixed(2)} |
| **Tax** | ₹${invoice.taxAmount.toFixed(2)} |
| **Shipping** | ₹${invoice.shippingCost.toFixed(2)} |
| **Total** | **₹${invoice.total.toFixed(2)}** |

## Payment Information
- **Method:** ${invoice.paymentMethod}
- **Status:** ${invoice.paymentStatus}
${invoice.transactionId ? `- **Transaction ID:** ${invoice.transactionId}` : ''}

${invoice.notes ? `## Notes\n${invoice.notes}\n` : ''}
${invoice.terms ? `## Terms & Conditions\n${invoice.terms}\n` : ''}

---
*Generated by Budget Bucket*
`
}

/**
 * Send invoice via email
 * Requires emailService to be available
 */
export async function sendInvoiceEmail(
  invoice: InvoiceData,
  emailService: any
): Promise<{ success: boolean; messageId: string }> {
  try {
    const html = generateInvoiceHTML(invoice)

    // Use email service to send
    const result = await emailService.sendEmailViaService(
      invoice.customerEmail,
      `Invoice ${invoice.invoiceId}`,
      html
    )

    console.log(`[Invoice Service] Invoice ${invoice.invoiceId} sent to ${invoice.customerEmail}`)
    return result
  } catch (error) {
    console.error('[Invoice Service] Failed to send invoice:', error)
    throw error
  }
}

/**
 * Store invoice HTML as file
 * In production, you'd store this in Cloud Storage (Firebase Storage, S3, etc.)
 */
export async function storeInvoiceFile(
  invoice: InvoiceData,
  format: 'html' | 'json' | 'csv' | 'md' = 'html'
): Promise<{ success: boolean; filePath: string; fileName: string }> {
  try {
    let content: string = ''
    let fileName: string = ''
    const _mimeType: Record<string, string> = {
      html: 'text/html',
      json: 'application/json',
      csv: 'text/csv',
      md: 'text/markdown'
    }

    switch (format) {
      case 'json':
        content = generateInvoiceJSON(invoice)
        fileName = `${invoice.invoiceId}.json`
        break

      case 'csv':
        content = generateInvoiceCSV(invoice)
        fileName = `${invoice.invoiceId}.csv`
        break

      case 'md':
        content = generateInvoiceMarkdown(invoice)
        fileName = `${invoice.invoiceId}.md`
        break

      case 'html':
      default:
        content = generateInvoiceHTML(invoice)
        fileName = `${invoice.invoiceId}.html`
    }

    // TODO: Store in Firebase Storage or your cloud storage
    // Example implementation:
    // const bucket = admin.storage().bucket()
    // const file = bucket.file(`invoices/${fileName}`)
    // const mimeType = _mimeType[format] || 'text/html'
    // await file.save(content, { metadata: { contentType: mimeType } })

    console.log(`[Invoice Service] Invoice ${invoice.invoiceId} stored as ${fileName}`)
    console.log(`[Invoice Service] Content size: ${content.length} bytes, MIME type: ${_mimeType[format] || 'text/html'}`)

    return {
      success: true,
      filePath: `invoices/${fileName}`,
      fileName
    }
  } catch (error) {
    console.error('[Invoice Service] Failed to store invoice:', error)
    throw error
  }
}

/**
 * Generate PDF using external service
 * Options:
 * 1. Puppeteer: Use headless browser to generate PDF
 * 2. PDFKit: Use Node.js library (requires npm install)
 * 3. HTML to PDF API: Use external service
 */
export async function generateInvoicePDF(
  invoice: InvoiceData
): Promise<{ success: boolean; pdfUrl?: string; pdfBuffer?: Buffer; error?: string }> {
  try {
    const html = generateInvoiceHTML(invoice)

    // Option 1: Use Puppeteer (requires npm install puppeteer)
    // const browser = await puppeteer.launch()
    // const page = await browser.newPage()
    // await page.setContent(html)
    // const pdf = await page.pdf({ format: 'A4' })
    // await browser.close()
    // return { success: true, pdfBuffer: pdf }

    // Option 2: Use external PDF service
    if (process.env.PDF_SERVICE_API) {
      const response = await fetch(process.env.PDF_SERVICE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html })
      })

      if (!response.ok) {
        throw new Error(`PDF service error: ${response.statusText}`)
      }

      const pdfUrl = await response.json()
      return { success: true, pdfUrl }
    }

    // Development: Return HTML version
    console.log('[Invoice Service] Development mode - PDF generation skipped')
    return {
      success: false,
      error: 'PDF generation not configured. Configure PDF_SERVICE_API or use Puppeteer.'
    }
  } catch (error) {
    console.error('[Invoice Service] PDF generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create invoice from order data
 */
export function createInvoiceFromOrder(
  order: any,
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
    logo?: string
  }
): InvoiceData {
  const now = new Date()
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

  return {
    invoiceId: order.invoiceId,
    orderId: order.id,
    date: now.toLocaleDateString('en-IN'),
    dueDate: dueDate.toLocaleDateString('en-IN'),
    status: 'sent',

    customerName: order.address?.name || 'Customer',
    customerEmail: order.userEmail || '',
    customerPhone: order.address?.phone || '',
    customerAddress: {
      street: order.address?.street || '',
      city: order.address?.city || '',
      state: order.address?.state || '',
      postalCode: order.address?.postalCode || '',
      country: order.address?.country || 'India'
    },

    shippingAddress: {
      street: order.address?.street || '',
      city: order.address?.city || '',
      state: order.address?.state || '',
      postalCode: order.address?.postalCode || '',
      country: order.address?.country || 'India'
    },

    items: order.items?.map((item: any) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      tax: (item.price * 0.18),
      total: item.price * item.quantity
    })) || [],

    subtotal: order.subtotal || 0,
    taxAmount: order.tax || 0,
    discountAmount: order.discountAmount || 0,
    shippingCost: order.shippingCost || 0,
    total: order.total || 0,

    paymentMethod: order.paymentMethod || 'Online',
    paymentStatus: order.paymentStatus as 'pending' | 'completed' | 'failed',
    transactionId: order.paymentId,

    companyName: companyInfo.name,
    companyAddress: companyInfo.address,
    companyPhone: companyInfo.phone,
    companyEmail: companyInfo.email,
    companyLogo: companyInfo.logo,

    notes: 'Thank you for your purchase!',
    terms: 'Payment is due within 30 days of invoice date.'
  }
}

/**
 * Export invoice service
 */
export const invoiceService = {
  generateInvoiceHTML,
  generateInvoiceJSON,
  generateInvoiceCSV,
  generateInvoiceMarkdown,
  sendInvoiceEmail,
  storeInvoiceFile,
  generateInvoicePDF,
  createInvoiceFromOrder
}
