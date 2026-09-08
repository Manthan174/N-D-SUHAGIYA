import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { gujaratiFontBase64 } from "./gujaratiFont";


const renderBillPage = (doc: jsPDF, billData: any) => {
  // Header Section
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const estimateText = "Estimate";
  const estWidth = doc.getStringUnitWidth(estimateText) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(estimateText, (210 - estWidth) / 2, 16);

  doc.setFontSize(10);

  // Left Side - Party Details
  doc.setFont("helvetica", "bold");
  doc.text(`Name : ${billData.partyName || "N/A"}`, 14, 22);
  doc.setFont("helvetica", "normal");
  doc.text(`Address : ${billData.address || "N/A"}     Mo : ${billData.mobile || ""}`, 14, 28);

  // Right Side - Bill Details
  const dateObj = billData.createdAt ? new Date(billData.createdAt) : new Date();
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  doc.setFont("helvetica", "normal");
  doc.text(`Bill Number : ${billData.billNumber || "N/A"}`, 140, 22);
  doc.text(`Date : ${billData.date || "N/A"} ${timeString}`, 140, 28);

  // Border line under header
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Calculations for Totals
  const totalPcs = billData.items ? billData.items.reduce((sum: number, item: any) => sum + (parseInt(item.pcs) || 0), 0) : 0;
  const totalWt = billData.items ? billData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.grwt) || 0), 0) : 0;
  const totalLessWt = billData.items ? billData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.lesswt) || 0), 0) : 0;
  const totalNetWt = billData.items ? billData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.netwt) || 0), 0) : 0;
  const totalFine = billData.items ? billData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.silver) || 0), 0) : 0;
  const totalAmount = billData.items ? billData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.lbramt) || 0), 0) : 0;

  const prevAmount = parseFloat(billData.previousAmount) || 0;
  const prevFine = parseFloat(billData.previousSilver) || 0;

  const currentOutAmount = prevAmount + totalAmount;
  const currentOutFine = prevFine + totalFine;

  // Items Table using jspdf-autotable
  const tableColumn = ["Sr", "Detail", "Pcs", "Lbr Rate", "Total Lbr", "Wt", "Less Wt", "Total Wt", "Touch", "Fine"];
  const tableRows: any[] = [];

  if (billData.items && Array.isArray(billData.items)) {
    billData.items.forEach((item: any, idx: number) => {
      tableRows.push([
        idx + 1,
        item.name,
        item.pcs,
        item.lbrrate,
        item.lbramt,
        item.grwt,
        item.lesswt,
        item.netwt,
        item.touch,
        item.silver
      ]);
    });
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    foot: [
      ["", "Total", totalPcs, "", "Rs. " + Math.round(totalAmount), Number(totalWt.toFixed(3)), Number(totalLessWt.toFixed(3)), Number(totalNetWt.toFixed(3)), "", Math.round(totalFine) + " g"],
      [
        { content: "Total Fine :", colSpan: 9, styles: { halign: 'right', fillColor: [255, 255, 255] } },
        { content: Math.round(totalFine) + " g", colSpan: 1, styles: { halign: 'right', fillColor: [255, 255, 255] } }
      ],
      [
        { content: "Total Amount :", colSpan: 9, styles: { halign: 'right', fillColor: [255, 255, 255] } },
        { content: "Rs. " + Math.round(totalAmount), colSpan: 1, styles: { halign: 'right', fillColor: [255, 255, 255] } }
      ]
    ],
    startY: 38,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Draw Summary Boxes below the table
  const boxHeight = 18;
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  // Outer Rectangle for the summary section
  doc.rect(margin, finalY, contentWidth, boxHeight);
  // Vertical line to split Left and Right sections (approx 40% / 60%)
  doc.line(margin + 80, finalY, margin + 80, finalY + boxHeight);

  // Left Section (Outstanding Balances)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`• Outstanding Amount : Rs. ${Math.round(prevAmount)}`, margin + 4, finalY + 6);
  doc.text(`• Outstanding Fine : ${Math.round(prevFine)} g`, margin + 4, finalY + 12);

  // Right Section (Summary breakdown)
  const rightX = margin + 84;

  doc.text(`• Current Outstanding Amount : Rs. ${Math.round(currentOutAmount)}`, rightX, finalY + 6);
  doc.text(`• Current Outstanding Fine : ${Math.round(currentOutFine)} g`, rightX, finalY + 12);

  // Outer Border covering all data
  doc.setLineWidth(0.5);
  doc.rect(8, 5, 194, finalY + boxHeight);

  // Top Center - Shree Text (Inscribed in border)
  const centerX = 210 / 2;

  // Render Gujarati text using an offscreen canvas to handle complex text shaping natively
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = 'normal 48px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('|| શ્રી 1 ||', 200, 50);
    const shreeDataUrl = canvas.toDataURL('image/png');

    const shreeWidthCentered = 28; // width in mm
    const shreeHeightCentered = 7; // height in mm

    doc.addImage(shreeDataUrl, 'PNG', centerX - (shreeWidthCentered / 2), 6, shreeWidthCentered, shreeHeightCentered);
  }
};

export const generateBillPDF = (billData: any, outputMode: 'download' | 'bloburl' | 'blob' = 'download') => {
  // A5 Landscape is 210 x 148 mm
  const doc = new jsPDF('landscape', 'mm', 'a5');

  doc.addFileToVFS("NotoSansGujarati-Regular.ttf", gujaratiFontBase64);
  doc.addFont("NotoSansGujarati-Regular.ttf", "NotoSansGujarati", "normal");

  renderBillPage(doc, billData);

  if (outputMode === 'bloburl') {
    return doc.output('bloburl');
  }

  if (outputMode === 'blob') {
    return doc.output('blob');
  }

  // Save PDF
  const safePartyName = (billData.partyName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
  const safeBillNumber = (billData.billNumber || 'New').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safePartyName}_${safeBillNumber}.pdf`);
};

export const generateBulkBillPDF = (bills: any[]) => {
  if (!bills || bills.length === 0) return;

  const doc = new jsPDF('landscape', 'mm', 'a5');
  doc.addFileToVFS("NotoSansGujarati-Regular.ttf", gujaratiFontBase64);
  doc.addFont("NotoSansGujarati-Regular.ttf", "NotoSansGujarati", "normal");

  bills.forEach((bill, idx) => {
    if (idx > 0) doc.addPage();
    renderBillPage(doc, bill);
  });

  doc.save(`Bulk_Bills_${new Date().toISOString().split('T')[0]}.pdf`);
};
