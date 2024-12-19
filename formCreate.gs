function doGet() {
  const html = HtmlService.createHtmlOutput(createOrderForm());
  html.setTitle("Order Form");
  return html;
}

function createOrderForm() {
  // Load the HTML content from the form.html file
  const htmlTemplate = HtmlService.createHtmlOutputFromFile('form.html').getContent();

  const productsHtml = createProductTable()

  // Inject the dynamic HTML content into the div with id="productInfo"
  const html = htmlTemplate.replace(
    '<div id="productInfo"></div>', // Match the placeholder div
    `<div id="productInfo">${productsHtml}</div>` // Replace with new content
  );

  return html;
}

function getProductData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("productInfo");
  const data = sheet.getDataRange().getValues();

  const result = [];
  let currentCategory = "";
  let headers = [];
  let products = [];

  for (let index = 0; index < data.length; index++) {
    const row = data[index];

    if (row.every(cell => cell === "")) {
      if (currentCategory) {
        result.push([currentCategory, [headers, ...products]]);
        currentCategory = "";
        headers = [];
        products = [];
      }
      continue;
    } else if (!currentCategory && row[0] && row[1]) {
      currentCategory = row[0];
      headers = row.slice(1);
    } else if (currentCategory) {
      const productData = row.slice(1);
      products.push([row[0], ...productData]); // Include UUID in the product row
    }

    if (currentCategory && (index === data.length - 1 || row.every(cell => cell === ""))) {
      result.push([currentCategory, [headers, ...products]]);
      currentCategory = "";
      headers = [];
      products = [];
    }
  }

  return result; // Array of [categoryName, productArrays]
}

function createProductTable() {
  const data = getProductData();
  let html = "";

  data.forEach(([categoryName, productArrays]) => {
    const [headers, ...products] = productArrays;

    html += `<h2>${categoryName}</h2><table><thead><tr>`;
    headers.forEach(header => html += `<th>${header}</th>`);
    html += `<th>כמות</th><th>סהכ</th></tr></thead><tbody>`;

    products.forEach(productRow => {
      const [productId, price, ...productData] = productRow;
      html += `<tr>`;
      html += `<td>${price}</td>`;
      productData.forEach(cell => html += `<td>${cell}</td>`);
      html += `<td><input type='number' min='0' data-product-id='${productId}' data-price='${price}' oninput='updateTotal(this, ${price})'></td>`;
      html += `<td class='total'>0</td></tr>`;
    });

    html += `</tbody></table>`;
  });

  return html;
}


function processOrder(parentName, studentName, grade, email, phone, totalPayment, orderDetails) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const orderInfoSheet = ss.getSheetByName("orderInfo");
  const orderDetailsSheet = ss.getSheetByName("orderDetails");

  const timestamp = new Date();
  const orderId = uuid();

  // Add to orderInfo
  orderInfoSheet.appendRow([orderId, timestamp, parentName, studentName, grade, email, phone, totalPayment]);

  // Add to orderDetails
  orderDetails.forEach(detail => {
    orderDetailsSheet.appendRow([
      orderId,
      detail.productId,
      detail.quantity,
      detail.total,
    ]);
  });

  sendOrderConfirmationEmail(orderId, parentName, studentName, grade, email, totalPayment, orderDetails);

}

