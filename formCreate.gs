function doGet() {
  const html = HtmlService.createHtmlOutput(createOrderForm());
  html.setTitle("Order Form");
  return html;
}

function createOrderForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("productInfo");
  const data = sheet.getDataRange().getValues();

  let html = "<html><head><title>Order Form</title><style>";
  html += "body { font-family: Arial, sans-serif; margin: 20px; }";
  html += "table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }";
  html += "th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }";
  html += "th { background-color: #f4f4f4; }";
  html += "input[type='number'] { width: 60px; }";
  html += "#processingMessage { font-size: 16px; color: blue; margin-top: 10px; display: none; }";
  html += "#totalPayment { font-size: 18px; font-weight: bold; margin-top: 20px; }";
  html += "</style></head><body><h1>Order Form</h1><form id='orderForm'>";

  let currentCategory = "";
  let headers = [];
  let isCategoryStarted = false;

  for (let index = 0; index < data.length; index++) {
    const row = data[index];

    if (row.every(cell => cell === "")) {
      if (isCategoryStarted) {
        html += "</tbody></table>";
        isCategoryStarted = false;
      }
      continue;
    } else if (!isCategoryStarted && row[0] && row[1]) {
      currentCategory = row[0];
      headers = row.slice(1);

      html += `<h2>${currentCategory}</h2><table><thead><tr>`;
      headers.forEach(header => html += `<th>${header}</th>`);
      html += `<th>Quantity</th><th>Total</th></tr></thead><tbody>`;
      isCategoryStarted = true;
    } else if (isCategoryStarted) {
      const productData = row.slice(1, headers.length + 1);
      const productId = row[0]; // UUID is the first column
      const price = row[1]; // Price is the second column

      html += `<tr>`;
      productData.forEach(cell => html += `<td>${cell}</td>`);
      html += `<td><input type='number' min='0' data-product-id='${productId}' data-price='${price}' oninput='updateTotal(this, ${price})'></td>`;
      html += `<td class='total'>0</td></tr>`;
    }

    if (isCategoryStarted && (index === data.length - 1 || row.every(cell => cell === ""))) {
      html += "</tbody></table>";
      isCategoryStarted = false;
    }
  }

  // Add customer inputs for name, email, phone, total payment, and processing message
  html += `
    <label for="customerName">Your Name:</label>
    <input type="text" id="customerName" required><br><br>
    <label for="customerEmail">Your Email:</label>
    <input type="email" id="customerEmail" required><br><br>
    <label for="customerPhone">Your Phone:</label>
    <input type="tel" id="customerPhone" required><br><br>
    <div id="totalPayment">Total Payment: $0.00</div>
    <button type="button" onclick="submitOrder()">Submit Order</button>
    <div id="processingMessage">Order is being processed, please wait...</div>
  </form>`;
  
  html += `<script>
    function updateTotal(input, price) {
      const quantity = input.value;
      const totalCell = input.parentElement.nextElementSibling;
      const total = quantity * price;
      totalCell.textContent = total.toFixed(2);

      // Update the overall total payment
      updateTotalPayment();
    }

    function updateTotalPayment() {
      const inputs = document.querySelectorAll('input[data-product-id]');
      let totalPayment = 0;

      inputs.forEach(input => {
        const price = parseFloat(input.getAttribute('data-price'));
        const quantity = parseInt(input.value) || 0;
        totalPayment += quantity * price;
      });

      // Update the total payment label
      const totalPaymentLabel = document.getElementById('totalPayment');
      totalPaymentLabel.textContent = 'Total Payment: $' + totalPayment.toFixed(2);
    }

    function submitOrder() {
      const name = document.getElementById('customerName').value.trim();
      const email = document.getElementById('customerEmail').value.trim();
      const phone = document.getElementById('customerPhone').value.trim();

      if (!name || !email || !phone) {
        alert('Please fill out all fields.');
        return;
      }

      const orderDetails = [];
      const inputs = document.querySelectorAll('input[data-product-id]');
      let totalPayment = 0;

      inputs.forEach(input => {
        const productId = input.getAttribute('data-product-id');
        const price = parseFloat(input.getAttribute('data-price'));
        const quantity = parseInt(input.value) || 0;
        const total = quantity * price;

        if (quantity > 0) {
          orderDetails.push({ productId, quantity, total });
          totalPayment += total;
        }
      });

      if (orderDetails.length === 0) {
        alert('No items selected.');
        return;
      }

      // Show the processing message
      const processingMessage = document.getElementById('processingMessage');
      processingMessage.style.display = 'block';

      google.script.run
        .withSuccessHandler(() => {
          processingMessage.style.display = 'none';
          alert('Order submitted successfully!');
        })
        .withFailureHandler(error => {
          processingMessage.style.display = 'none';
          alert('Error submitting order: ' + error.message);
        })
        .processOrder(name, email, phone, totalPayment, orderDetails);
    }
  </script>`;
  html += "</body></html>";

  return html;
}

function processOrder(name, email, phone, totalPayment, orderDetails) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const orderInfoSheet = ss.getSheetByName("orderInfo");
  const orderDetailsSheet = ss.getSheetByName("orderDetails");

  const timestamp = new Date();
  const orderId = generateUniqueId();

  // Add to orderInfo
  orderInfoSheet.appendRow([orderId, timestamp, name, email, phone, totalPayment]);

  // Add to orderDetails
  orderDetails.forEach(detail => {
    orderDetailsSheet.appendRow([
      orderId,
      detail.productId,
      detail.quantity,
      detail.total,
    ]);
  });
}

function generateUniqueId() {
  return Utilities.getUuid();
}
