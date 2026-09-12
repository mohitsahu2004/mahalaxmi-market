import jsPDF from 'jspdf';
import { Receipt, MonthlyReportData } from '../types';
import { formatMonthName } from './db';

export function generateReceiptPDF(receipt: Receipt): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 is standard receipt size
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Header Bar
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(receipt.marketName.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Commercial Shop Rental Management • Official Payment Receipt', pageWidth / 2, 19, {
    align: 'center',
  });

  // Receipt meta banner
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(10, 33, pageWidth - 20, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`RECEIPT NO: ${receipt.receiptNumber}`, 15, 41);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`DATE: ${receipt.paymentDate}`, 15, 46);

  // Status Badge
  doc.setFillColor(34, 197, 94); // emerald-500
  doc.roundedRect(pageWidth - 40, 36, 25, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIRMED', pageWidth - 27.5, 42, { align: 'center' });

  // Details Table
  let y = 58;
  const col1 = 15;
  const col2 = 60;

  const rows = [
    ['Business Name', receipt.businessName],
    ['Shop Number', receipt.shopNumber],
    ['Contact Person', receipt.contactPerson],
    ['Billing Month', formatMonthName(receipt.billingMonth)],
    ['Payment Type', receipt.paymentType === 'rent' ? 'Shop Rent' : 'Electricity Bill'],
    ['Payment Method', receipt.paymentMethod.toUpperCase()],
    ['Transaction ID', receipt.transactionId],
    ['Generated On', new Date(receipt.generatedAt).toLocaleString('en-IN')],
  ];

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);

  rows.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, y - 4.5, pageWidth - 20, 7, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, col1, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), col2, y);

    doc.line(10, y + 2.5, pageWidth - 10, y + 2.5);
    y += 7.5;
  });

  // Amount Box
  y += 5;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(10, y, pageWidth - 20, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('TOTAL AMOUNT RECEIVED', pageWidth / 2, y + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 27, 75); // indigo-950
  doc.text(`INR ${receipt.amountPaid.toLocaleString('en-IN')}`, pageWidth / 2, y + 16, {
    align: 'center',
  });

  // Authorization & Seal
  y += 32;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory', pageWidth - 20, y, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Mahalaxmi Market Management', pageWidth - 20, y + 5, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is an authentic system generated receipt. No physical signature is required.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: 'center' }
  );

  doc.save(`${receipt.receiptNumber}_${receipt.businessName.replace(/\s+/g, '_')}.pdf`);
}

export function generateMonthlyReportPDF(report: MonthlyReportData, marketName: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(marketName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `MONTHLY REVENUE & COLLECTION REPORT — ${formatMonthName(report.billingMonth).toUpperCase()}`,
    pageWidth / 2,
    22,
    { align: 'center' }
  );

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated On: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 28, {
    align: 'center',
  });

  // Summary Metrics Section (Section 40)
  let y = 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('FINANCIAL SUMMARY', 14, y);

  y += 6;
  const colW = (pageWidth - 28 - 6) / 2;

  // Rent Summary Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, colW, 44, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Shop Rent Overview', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Rent Expected:`, 20, y + 17);
  doc.text(`Rent Collected:`, 20, y + 25);
  doc.text(`Rent Pending:`, 20, y + 33);
  doc.text(`Overdue Shops:`, 20, y + 41);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`₹ ${report.totalRentExpected.toLocaleString('en-IN')}`, 14 + colW - 8, y + 17, {
    align: 'right',
  });
  doc.setTextColor(22, 163, 74); // green
  doc.text(`₹ ${report.rentCollected.toLocaleString('en-IN')}`, 14 + colW - 8, y + 25, {
    align: 'right',
  });
  doc.setTextColor(220, 38, 38); // red
  doc.text(`₹ ${report.rentPending.toLocaleString('en-IN')}`, 14 + colW - 8, y + 33, {
    align: 'right',
  });
  doc.setTextColor(185, 28, 28);
  doc.text(`${report.overdueShopsCount} shops`, 14 + colW - 8, y + 41, { align: 'right' });

  // Electricity Summary Card
  const elecX = 14 + colW + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(elecX, y, colW, 44, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Electricity Overview', elecX + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Electricity Billed:`, elecX + 6, y + 17);
  doc.text(`Electricity Collected:`, elecX + 6, y + 25);
  doc.text(`Electricity Pending:`, elecX + 6, y + 33);
  doc.text(`Total Collection:`, elecX + 6, y + 41);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`₹ ${report.totalElectricityBilled.toLocaleString('en-IN')}`, elecX + colW - 8, y + 17, {
    align: 'right',
  });
  doc.setTextColor(22, 163, 74);
  doc.text(
    `₹ ${report.electricityCollected.toLocaleString('en-IN')}`,
    elecX + colW - 8,
    y + 25,
    { align: 'right' }
  );
  doc.setTextColor(202, 138, 4); // amber
  doc.text(
    `₹ ${report.electricityPending.toLocaleString('en-IN')}`,
    elecX + colW - 8,
    y + 33,
    { align: 'right' }
  );
  doc.setTextColor(79, 70, 229);
  doc.text(`₹ ${report.totalCollection.toLocaleString('en-IN')}`, elecX + colW - 8, y + 41, {
    align: 'right',
  });

  // Shop-wise Breakdown Section
  y += 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SHOP-WISE BREAKDOWN', 14, y);

  y += 5;
  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('SHOP', 18, y + 5.5);
  doc.text('BUSINESS / TENANT', 42, y + 5.5);
  doc.text('RENT', 95, y + 5.5);
  doc.text('RENT STATUS', 120, y + 5.5);
  doc.text('ELEC', 150, y + 5.5);
  doc.text('ELEC STATUS', 170, y + 5.5);
  doc.text('TOTAL PAID', pageWidth - 18, y + 5.5, { align: 'right' });

  y += 8;

  report.shopsBreakdown.forEach((shop, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(shop.shopNumber, 18, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.text(shop.businessName, 42, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`₹ ${shop.rentAmount.toLocaleString('en-IN')}`, 95, y + 5.5);

    // Rent status label
    if (shop.rentStatus === 'paid') {
      doc.setTextColor(22, 163, 74);
      doc.text('Paid', 120, y + 5.5);
    } else if (shop.rentStatus === 'overdue') {
      doc.setTextColor(220, 38, 38);
      doc.text('Overdue', 120, y + 5.5);
    } else {
      doc.setTextColor(202, 138, 4);
      doc.text('Pending', 120, y + 5.5);
    }

    doc.setTextColor(15, 23, 42);
    doc.text(
      shop.electricityAmount > 0 ? `₹ ${shop.electricityAmount.toLocaleString('en-IN')}` : '—',
      150,
      y + 5.5
    );

    if (shop.electricityStatus === 'paid') {
      doc.setTextColor(22, 163, 74);
      doc.text('Paid', 170, y + 5.5);
    } else if (shop.electricityStatus === 'pending') {
      doc.setTextColor(202, 138, 4);
      doc.text('Pending', 170, y + 5.5);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('Not Billed', 170, y + 5.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(`₹ ${shop.totalPaidThisMonth.toLocaleString('en-IN')}`, pageWidth - 18, y + 5.5, {
      align: 'right',
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 8, pageWidth - 14, y + 8);
    y += 8;
  });

  // Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'CONFIDENTIAL • Prepared for Property Owner / Admin • Mahalaxmi Market Management',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  doc.save(`Mahalaxmi_Market_Report_${report.billingMonth}.pdf`);
}
