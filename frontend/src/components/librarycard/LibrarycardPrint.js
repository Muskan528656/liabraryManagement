export const handlePrintBarcode = (
  card,
  API_BASE_URL,
  generateCardNumber,
  formatDate,
  setBarcodeError
) => {
  try {
    const barcodeId = `barcode-modal-${card.id}`;
    const barcodeEl = document.getElementById(barcodeId);

    if (!barcodeEl) {
      setBarcodeError("Barcode not found for printing");
      return;
    }

    const imagePath = card.user_image || card.image;
    let imageUrl = null;
    const baseUrl = API_BASE_URL

    if (imagePath) {
      imageUrl = imagePath.startsWith("http")
        ? imagePath
        : imagePath.startsWith("/uploads/")
          ? baseUrl + imagePath
          : baseUrl + "/uploads/librarycards/" + imagePath;
    }

    const printContent = `
      <html>
      <head>
        <title>Library Card - ${generateCardNumber(card)}</title>
        <style>
          body { font-family: Arial; background: white; padding: 20px; }
          .library-card { border: 3px solid var(--primary-color); border-radius: 15px; max-width: 500px; margin: 0 auto; }
          .card-header { background: var(--primary-color); color: white; padding: 15px; text-align: center; border-radius: 12px 12px 0 0; }
          .card-body { padding: 20px; }
          .barcode-container { text-align: center; padding: 15px; }
          @media print { @page { margin: 0.5cm; } }
        </style>
      </head>
      <body>
        <div class="library-card">
          <div class="card-header"><h2>LIBRARY CARD</h2></div>
          <div class="card-body">

            ${imageUrl
        ? `
    <div style="display:flex; justify-content:center; margin-bottom:15px;">
      <img src="${imageUrl}" 
        style="width:80px;height:80px;border-radius:50%;border:3px solid var(--primary-color);object-fit:cover;">
    </div>`
        : `
    <div style="display:flex; justify-content:center; margin-bottom:15px;">
      <div style="width:80px;height:80px;border-radius:50%;background:#eee;border:3px solid var(--primary-color);display:flex;align-items:center;justify-content:center;">
        <span>User</span>
      </div>
    </div>`
      }

            <p><strong>Card No:</strong> ${generateCardNumber(card)}</p>
    <p><strong>Name:</strong> ${card.first_name || ''} ${card.last_name || ''}</p>
            <p><strong>Email:</strong> ${card.email}</p>
            <p><strong>Registration Date:</strong> ${formatDate(card.registration_date)}</p>
            <p><strong>Registration Date:</strong> ${formatDate(card.renewal)}</p>
           

            <div class="barcode-container">${barcodeEl.outerHTML}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
  } catch (err) {
    console.error("Print error:", err);
    setBarcodeError("Failed to generate print view");
  }
};
