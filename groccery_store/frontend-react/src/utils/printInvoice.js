function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function toMoney(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toFixed(2)}`;
}

function normalizeItems(order = {}) {
  const source = order.items || [];
  return source.map((item) => ({
    name: item.product_name || item.name || item.product_id?.name || 'Product',
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0)
  }));
}

export function printInvoice(order = {}, overrides = {}) {
  if (typeof window === 'undefined') return;

  const items = normalizeItems(order);
  const orderNumber = order.order_number || order.orderNumber || order.id || '-';
  const invoiceNumber = order.invoice_number || order.invoiceNumber || `INV-${String(orderNumber).replace(/^ORD-/, '')}`;
  const customerName = order.customer || order.customerName || order.user_name || order.user?.name || 'Customer';
  const email = order.email || order.user?.email || '-';
  const phone = order.phone || order.user?.phone || '-';
  const address = order.address || order.delivery_address || order.deliveryAddress || '-';
  const status = order.status || '-';
  const paymentMethod = order.paymentMethod || order.payment_method || 'cash';
  const paymentStatus = order.paymentStatus || order.payment_status || '-';
  const date = order.date || order.created_at || order.createdAt || order.createdAt;
  const subtotal = Number(
    order.subtotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const delivery = Number(order.deliveryCharge ?? order.delivery_charge ?? 0);
  const tax = Number(order.tax ?? 0);
  const total = Number(order.total ?? order.total_amount ?? subtotal + delivery + tax);
  const title = overrides.title || 'Invoice';
  const subtitle = overrides.subtitle || 'Fresh Grocery';
  const companyName = overrides.companyName || 'Fresh Grocery';

  const rows = items.length
    ? items
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.name)}</td>
              <td>${item.quantity}</td>
              <td>${toMoney(item.price)}</td>
              <td>${toMoney(item.price * item.quantity)}</td>
            </tr>`
        )
        .join('')
    : `
      <tr>
        <td colspan="5" class="muted">No item details available</td>
      </tr>`;

  const popup = window.open('', '_blank', 'width=980,height=720');
  if (!popup) {
    window.alert('Please allow popups to print the invoice.');
    return;
  }

  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)} - ${escapeHtml(orderNumber)}</title>
        <style>
          :root {
            --green: #2f9e44;
            --green-dark: #1f7a32;
            --yellow: #ffd43b;
            --ink: #24361a;
            --soft: #f7fbe8;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 28px;
            font-family: Arial, Helvetica, sans-serif;
            color: var(--ink);
            background:
              radial-gradient(circle at top right, rgba(255, 212, 59, 0.18), transparent 30%),
              radial-gradient(circle at top left, rgba(47, 158, 68, 0.12), transparent 30%),
              var(--soft);
          }
          .invoice {
            max-width: 860px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #dbeebd;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 18px 48px rgba(47, 158, 68, 0.14);
          }
          .header {
            padding: 24px 28px;
            background: linear-gradient(135deg, var(--green) 0%, #66a80f 55%, var(--yellow) 100%);
            color: #fff;
          }
          .header h1 { margin: 0; font-size: 30px; }
          .header p { margin: 6px 0 0; opacity: 0.95; }
          .content { padding: 24px 28px 18px; }
          .meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 18px;
          }
          .meta-card {
            background: #f8fff0;
            border: 1px solid #dbeebd;
            border-radius: 14px;
            padding: 12px 14px;
          }
          .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .06em;
            color: #5a7647;
            margin-bottom: 4px;
          }
          .value { font-size: 14px; font-weight: 700; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            border-bottom: 1px solid #e5efcf;
            padding: 12px 10px;
            text-align: left;
            font-size: 14px;
          }
          th {
            background: #f6fce7;
            color: #29431a;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .06em;
          }
          .summary {
            margin-top: 18px;
            display: grid;
            gap: 8px;
            justify-content: end;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            gap: 28px;
            min-width: 280px;
            padding: 8px 0;
          }
          .summary-row.total {
            font-size: 18px;
            font-weight: 800;
            color: var(--green-dark);
            border-top: 2px solid #dbeebd;
            margin-top: 6px;
            padding-top: 12px;
          }
          .footer {
            padding: 0 28px 26px;
            color: #5a7647;
            font-size: 12px;
          }
          .muted { color: #64748b; text-align: center; }
          .print-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 18px;
          }
          .print-btn {
            border: none;
            border-radius: 999px;
            padding: 10px 16px;
            font-weight: 700;
            cursor: pointer;
          }
          .print-btn.primary {
            background: var(--green);
            color: white;
          }
          .print-btn.secondary {
            background: #f1f8df;
            color: #2f5f1e;
          }
          @media print {
            body { background: white; padding: 0; }
            .print-actions { display: none; }
            .invoice { box-shadow: none; border: none; border-radius: 0; }
          }
          @media (max-width: 640px) {
            body { padding: 12px; }
            .meta { grid-template-columns: 1fr; }
            .summary-row { min-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>${escapeHtml(companyName)}</h1>
            <p>${escapeHtml(subtitle)} - ${escapeHtml(title)}</p>
          </div>
          <div class="content">
            <div class="print-actions">
              <button class="print-btn secondary" onclick="window.close()">Close</button>
              <button class="print-btn primary" onclick="window.print()">Print</button>
            </div>
            <div class="meta">
              <div class="meta-card">
                <div class="label">Invoice No.</div>
                <div class="value">${escapeHtml(invoiceNumber)}</div>
              </div>
              <div class="meta-card">
                <div class="label">Order No.</div>
                <div class="value">${escapeHtml(orderNumber)}</div>
              </div>
              <div class="meta-card">
                <div class="label">Date</div>
                <div class="value">${escapeHtml(formatDateTime(date))}</div>
              </div>
              <div class="meta-card">
                <div class="label">Customer</div>
                <div class="value">${escapeHtml(customerName)}</div>
              </div>
              <div class="meta-card">
                <div class="label">Contact</div>
                <div class="value">${escapeHtml(email)} | ${escapeHtml(phone)}</div>
              </div>
              <div class="meta-card">
                <div class="label">Delivery Address</div>
                <div class="value">${escapeHtml(address)}</div>
              </div>
              <div class="meta-card">
                <div class="label">Status</div>
                <div class="value">${escapeHtml(status)}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${toMoney(subtotal)}</span>
              </div>
              <div class="summary-row">
                <span>Delivery</span>
                <span>${toMoney(delivery)}</span>
              </div>
              <div class="summary-row">
                <span>Tax</span>
                <span>${toMoney(tax)}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>${toMoney(total)}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            Payment Method: ${escapeHtml(paymentMethod)} | Payment Status: ${escapeHtml(paymentStatus)}
          </div>
        </div>
        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
          window.onafterprint = function () {
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  popup.document.close();
}
