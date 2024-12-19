
function createEmailProductTable(orderDetails) {
    const data = getProductData();
    let html = `<style>
     table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th,
        td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: center;
          font-size: 14px;
        }
        th {
          background-color: #f4f4f4;
          font-weight: bold;
        }
      </style>`;
  
    data.forEach(([categoryName, productArrays]) => {
      const [headers, ...products] = productArrays;
      let productHtml = ""
  
      products.forEach(productRow => {
        const [productId, price, ...productData] = productRow;
        const orderItem = orderDetails.find(item => item.productId === productId);
  
        if (orderItem && orderItem.quantity > 0)
        {   
            // this item is ordered
            productHtml += `<tr>`;
            productHtml += `<td>${price}</td>`;
            productData.forEach(cell => productHtml += `<td>${cell}</td>`);
            productHtml += `<td>${orderItem.quantity}</td>`;
            const total = (orderItem.quantity * price).toFixed(2);
            productHtml += `<td>${total}</td>`;
        }
       
      });
  
      if (productHtml != "")
      {
        html += `<h2>${categoryName}</h2><table><thead><tr>`;
        headers.forEach(header => html += `<th>${header}</th>`);
        html += `<th>כמות</th><th>סהכ</th></tr></thead><tbody>`;
        html += productHtml;
        html += `</tbody></table>`;
      }
  
    });
  
    return html;
  }
  
  function sendOrderConfirmationEmail(name, email, totalPayment, orderDetails) {
    const subjectForCustomer = "הזמנת ציציות ישלצ";
    const subjectForOwner = `הזמנת ציציות ${name}`;
    let emailBody = `<p>לכבוד ${name},</p>`;
  
    emailBody += createEmailProductTable(orderDetails)
  
    // Append the ordered table to the email body
    emailBody += `<p>סהכ: <strong>₪${totalPayment.toFixed(2)}</strong></p>`;
  
    // Send the email
    GmailApp.sendEmail(
      email,
      subjectForCustomer,
      '',
      {
        htmlBody: emailBody,
        name: "ישלצ"
      }
    );
  
     const ownerEmail = Session.getEffectiveUser().getEmail();
  
      // Send the email also to us
    GmailApp.sendEmail(
      ownerEmail,
      subjectForOwner,
      '',
      {htmlBody: emailBody}
    );
  }
  