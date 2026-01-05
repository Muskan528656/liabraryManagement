
import JsBarcode from "jsbarcode";

export const handleDownloadBarcode = (
    card,
    API_BASE_URL,
    generateCardNumber,
    setBarcodeError,
    formatDate
) => {
    if (!card) return;

    try {

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const CARD_WIDTH = 600;
        const CARD_HEIGHT = 500;

        canvas.width = CARD_WIDTH;
        canvas.height = CARD_HEIGHT;

        const cardNumber = card.card_number || generateCardNumber(card);


        const barcodeSvg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        JsBarcode(barcodeSvg, cardNumber, {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: true,
            fontSize: 14,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000",
        });

        barcodeSvg.setAttribute("width", "400");
        barcodeSvg.setAttribute("height", "120");

        const svgData = new XMLSerializer().serializeToString(barcodeSvg);
        const svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8",
        });
        const barcodeUrl = URL.createObjectURL(svgBlob);

        const barcodeImg = new Image();

        barcodeImg.onload = () => {

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);


            ctx.fillStyle = "#000";
            ctx.font = "bold 26px Arial";
            ctx.textAlign = "center";
            ctx.fillText("LIBRARY CARD", CARD_WIDTH / 2, 40);

            const imagePath = card.user_image || card.image;
            const cleanApiBaseUrl = API_BASE_URL?.replace(/\/ibs$/, "");
            console.log("cleanApiBaseUrl", cleanApiBaseUrl)
            const imageUrl = imagePath
                ? imagePath.startsWith("http")
                    ? imagePath
                    : imagePath.startsWith("/uploads/")
                        ? `${cleanApiBaseUrl}${imagePath}`
                        : `${cleanApiBaseUrl}/uploads/librarycards/${imagePath}`
                : null;


            const drawDetails = () => {
                ctx.textAlign = "left";
                ctx.fillStyle = "#000";
                ctx.font = "16px Arial";

                let y = 120;
                const x = 50;

                ctx.fillText(`Card Number: ${cardNumber}`, x, y); y += 25;
                ctx.fillText(`First Name: ${card.first_name || "N/A"}`, x, y); y += 25;
                ctx.fillText(`Last Name: ${card.last_name || "N/A"}`, x, y); y += 25;
                ctx.fillText(`Email: ${card.email || "N/A"}`, x, y); y += 25;
                ctx.fillText(`Country Code: ${card.country_code || "N/A"}`, x, y); y += 25;
                ctx.fillText(
                    `Registration Date: ${formatDate(card.registration_date)}`,
                    x,
                    y
                );
                y += 25;

                ctx.fillStyle = card.is_active ? "green" : "red";
                ctx.fillText(
                    `Status: ${card.is_active ? "Active" : "Inactive"}`,
                    x,
                    y
                );


                ctx.drawImage(barcodeImg, 100, 300, 400, 120);


                const pngUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = pngUrl;
                link.download = `library-card-${cardNumber}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(barcodeUrl);
            };

            if (imageUrl) {
                const userImg = new Image();
                userImg.crossOrigin = "anonymous";

                userImg.onload = () => {
                    const size = 100;
                    const imgX = CARD_WIDTH - size - 40;
                    const imgY = 80;

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(
                        imgX + size / 2,
                        imgY + size / 2,
                        size / 2,
                        0,
                        Math.PI * 2
                    );
                    ctx.clip();
                    ctx.drawImage(userImg, imgX, imgY, size, size);
                    ctx.restore();

                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(
                        imgX + size / 2,
                        imgY + size / 2,
                        size / 2,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();

                    drawDetails();
                };

                userImg.onerror = drawDetails;
                userImg.src = imageUrl;
            } else {
                drawDetails();
            }
        };

        barcodeImg.src = barcodeUrl;

    } catch (error) {
        console.error("Barcode download error:", error);
        setBarcodeError("Failed to download barcode");
    }
};
