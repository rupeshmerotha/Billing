import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Printer, Download, CheckCircle, Sprout, FileText } from 'lucide-react';
import bhudevLogo from '../assets/bhudev_logo_png.png';
import { InvoicePrintable, numberToWords } from './InvoicePrintable';

const LivePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const componentRef = useRef(null);
  const containerRef = useRef(null);

  // States
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyInfo, setCompanyInfo] = useState(() => {
    const saved = localStorage.getItem('companyInfo');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [previewScale, setPreviewScale] = useState(0.6);
  const [notification, setNotification] = useState(null);

  // Read URL query parameter for active invoice
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    if (idParam) {
      setSelectedInvoiceId(idParam);
    } else if (invoices.length > 0) {
      setSelectedInvoiceId(invoices[0].id);
    }
  }, [location.search, invoices]);

  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  // Dynamic Scale to fit A4 page in viewport height
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // A4 pixels target at 96 DPI
        const a4Width = 793.8;
        const a4Height = 1122.5;

        // Safe margins
        const paddedWidth = Math.max(100, width - 48);
        const paddedHeight = Math.max(100, height - 48);

        const scaleX = paddedWidth / a4Width;
        const scaleY = paddedHeight / a4Height;
        const scale = Math.min(scaleX, scaleY);

        setPreviewScale(scale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeInvoice]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Direct print action
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: activeInvoice ? `Invoice_${activeInvoice.invoiceNo}` : 'Invoice',
  });

  // Vector PDF export
  const handleDownloadPDF = async () => {
    if (!activeInvoice) return;

    const loadImg = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    const logoImg = await loadImg(bhudevLogo);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const items = activeInvoice.items || [];
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const discount = parseFloat(activeInvoice.discount) || 0;
    const advance = parseFloat(activeInvoice.advance) || 0;
    const grandTotal = Math.max(0, subtotal - discount - advance);

    const tableStartY = 85;

    // Draw Outer Border
    doc.setDrawColor(148, 163, 184); // Slate 400
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // --- HEADER ---
    if (logoImg) {
      try {
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logoImg, 0, 0, size, size);
        const pngData = canvas.toDataURL('image/png');
        doc.addImage(pngData, 'PNG', 11, 10, 32, 32);
      } catch (e) {
        console.error("Failed to render logo to canvas", e);
      }
    }

    // Company details center
    doc.setTextColor(21, 128, 61);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(companyInfo.name?.toUpperCase() || 'BHUDEV SEEDS', 105, 23, { align: 'center' });

    doc.setTextColor(71, 85, 105);
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(companyInfo.tagline || '', 105, 27, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(companyInfo.address || '', 105, 32, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Mobile: ${companyInfo.phones?.split(',')[0].trim()} | Email: ${companyInfo.email}`, 105, 37, { align: 'center' });

    // Licenses & GST (Right)
    doc.setTextColor(21, 128, 61);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LICENSES & GST', 190, 21, { align: 'right' });

    doc.setTextColor(71, 85, 105);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`License no : ${companyInfo.license1 || 'SS/2023-24/32367'}`, 190, 25, { align: 'right' });
    doc.text(`${companyInfo.license2 || 'KTPT-25113'}`, 190, 29, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`GSTIN: ${companyInfo.gstin || '08AQMPM6732H1ZH'}`, 190, 34, { align: 'right' });

    // Divider Line
    doc.setDrawColor(21, 128, 61);
    doc.setLineWidth(0.8);
    doc.line(10, 42, 200, 42);

    // Tax Invoice Badge
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.rect(85, 46, 40, 7, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TAX INVOICE', 105, 51, { align: 'center' });

    // Customer Info Box
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.rect(15, 57, 180, 24);
    doc.line(105, 57, 105, 81);

    // Invoice Meta
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('INVOICE NO:', 18, 63);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(activeInvoice.invoiceNo, 42, 63);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('INVOICE DATE:', 18, 69);
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.text(activeInvoice.date.split('-').reverse().join('/'), 42, 69);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('STATE / CODE:', 18, 75);
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'normal');
    doc.text('RAJASTHAN (08)', 42, 75);

    // Customer Side
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('BILLED TO:', 108, 63);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(activeInvoice.customerName || 'Walk-in Customer', 108, 68);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const splitAddress = doc.splitTextToSize(activeInvoice.customerAddress || 'N/A', 82);
    doc.text(splitAddress, 108, 73);

    // --- PRODUCT TABLE ---
    const colWidths = {
      sn: 8,
      seedName: 48,
      hsn: 18,
      lot: 22,
      exp: 18,
      pkg: 15,
      bags: 10,
      qty: 12,
      rate: 13,
      amt: 16
    };

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.4);
    doc.rect(15, tableStartY, 180, 8, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    let xOffset = 15;
    doc.text('S.N.', xOffset + 4, tableStartY + 5, { align: 'center' }); xOffset += colWidths.sn;
    doc.text('Seed Name', xOffset + 2, tableStartY + 5); xOffset += colWidths.seedName;
    doc.text('HSN Code', xOffset + colWidths.hsn / 2, tableStartY + 5, { align: 'center' }); xOffset += colWidths.hsn;
    doc.text('Lot No.', xOffset + colWidths.lot / 2, tableStartY + 5, { align: 'center' }); xOffset += colWidths.lot;
    doc.text('Expiry', xOffset + colWidths.exp / 2, tableStartY + 5, { align: 'center' }); xOffset += colWidths.exp;
    doc.text('Packing', xOffset + colWidths.pkg / 2, tableStartY + 5, { align: 'center' }); xOffset += colWidths.pkg;
    doc.text('Bags', xOffset + colWidths.bags / 2, tableStartY + 5, { align: 'center' }); xOffset += colWidths.bags;
    doc.text('Qty', xOffset + colWidths.qty - 2, tableStartY + 5, { align: 'right' }); xOffset += colWidths.qty;
    doc.text('Rate', xOffset + colWidths.rate - 2, tableStartY + 5, { align: 'right' }); xOffset += colWidths.rate;
    doc.text('Amount', xOffset + colWidths.amt - 2, tableStartY + 5, { align: 'right' });

    let currentY = tableStartY + 8;
    const rowHeight = 8;
    const minRows = 7;
    const totalRenderedRows = Math.max(minRows, items.length);

    doc.setFontSize(8);

    for (let i = 0; i < totalRenderedRows; i++) {
      const item = items[i];
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);

      if (item) {
        doc.setTextColor(15, 23, 42);
        doc.setFont('Helvetica', 'bold');
        doc.text(String(i + 1), 15 + colWidths.sn / 2, currentY + 5, { align: 'center' });
        doc.text(item.seedName, 15 + colWidths.sn + 2, currentY + 5);

        doc.setFont('Helvetica', 'normal');
        doc.text(item.hsn || 'N/A', 15 + colWidths.sn + colWidths.seedName + colWidths.hsn / 2, currentY + 5, { align: 'center' });
        doc.text(item.lotNumber || 'N/A', 15 + colWidths.sn + colWidths.seedName + colWidths.hsn + colWidths.lot / 2, currentY + 5, { align: 'center' });

        const expStr = item.expiryDate ? (item.expiryDate.includes('-') ? `${item.expiryDate.split('-')[1]}/${item.expiryDate.split('-')[0]}` : item.expiryDate) : 'N/A';
        doc.text(expStr, 15 + colWidths.sn + colWidths.seedName + colWidths.hsn + colWidths.lot + colWidths.exp / 2, currentY + 5, { align: 'center' });
        doc.text(item.packing, 15 + colWidths.sn + colWidths.seedName + colWidths.hsn + colWidths.lot + colWidths.exp + colWidths.pkg / 2, currentY + 5, { align: 'center' });

        doc.setFont('Helvetica', 'bold');
        doc.text(String(item.bags || 0), 15 + colWidths.sn + colWidths.seedName + colWidths.hsn + colWidths.lot + colWidths.exp + colWidths.pkg + colWidths.bags / 2, currentY + 5, { align: 'center' });
        doc.text(String(item.quantity), 15 + colWidths.sn + colWidths.seedName + colWidths.hsn + colWidths.lot + colWidths.exp + colWidths.pkg + colWidths.bags + colWidths.qty - 2, currentY + 5, { align: 'right' });

        doc.setFont('Helvetica', 'normal');
        doc.text(parseFloat(item.rate).toFixed(2), 15 + colWidths.sn + colWidths.seedName + colWidths.hsn + colWidths.lot + colWidths.exp + colWidths.pkg + colWidths.bags + colWidths.qty + colWidths.rate - 2, currentY + 5, { align: 'right' });

        doc.setFont('Helvetica', 'bold');
        doc.text(parseFloat(item.amount).toFixed(2), 15 + colWidths.sn + colWidths.seedName + colWidths.hsn + colWidths.lot + colWidths.exp + colWidths.pkg + colWidths.bags + colWidths.qty + colWidths.rate + colWidths.amt - 2, currentY + 5, { align: 'right' });
      }
      currentY += rowHeight;
    }

    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.line(15, tableStartY, 15, currentY);
    doc.line(195, tableStartY, 195, currentY);

    let verticalX = 15;
    const keys = ['sn', 'seedName', 'hsn', 'lot', 'exp', 'pkg', 'bags', 'qty', 'rate'];
    keys.forEach(key => {
      verticalX += colWidths[key];
      doc.line(verticalX, tableStartY, verticalX, currentY);
    });
    doc.line(15, currentY, 195, currentY);

    // Words
    currentY += 4;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 180, 10, 'FD');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL AMOUNT IN WORDS:', 18, currentY + 4);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(numberToWords(grandTotal), 18, currentY + 8);

    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('E. & O.E.', 192, currentY + 6, { align: 'right' });

    // Bank details
    currentY += 14;
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, currentY, 105, 30);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61);
    doc.text('BANK PAYMENT DETAILS:', 18, currentY + 5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Bank Name:', 18, currentY + 11);
    doc.text('Account No:', 18, currentY + 16);
    doc.text('IFSC Code:', 18, currentY + 21);
    doc.text('Branch:', 18, currentY + 26);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.text(companyInfo.bankDetails?.bankName || '', 42, currentY + 11);
    doc.text(companyInfo.bankDetails?.accountNo || '', 42, currentY + 16);
    doc.text(companyInfo.bankDetails?.ifsc || '', 42, currentY + 21);
    doc.text(companyInfo.bankDetails?.branch || '', 42, currentY + 26);

    // Totals
    doc.setDrawColor(100, 116, 139);
    doc.rect(125, currentY, 70, 31);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal:', 128, currentY + 5);
    doc.text('Discount:', 128, currentY + 11);
    doc.text('Advance Payment:', 128, currentY + 17);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.text(subtotal.toFixed(2), 192, currentY + 5, { align: 'right' });
    doc.text(discount.toFixed(2), 192, currentY + 11, { align: 'right' });
    doc.text(advance.toFixed(2), 192, currentY + 17, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.line(125, currentY + 22, 195, currentY + 22);

    doc.setTextColor(21, 128, 61);
    doc.setFontSize(9);
    doc.text('GRAND TOTAL:', 128, currentY + 27);
    doc.setFontSize(10);
    doc.text(grandTotal.toFixed(2), 192, currentY + 27, { align: 'right' });

    // Terms
    currentY += 32;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Terms & Conditions:', 15, currentY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const splitNotes = doc.splitTextToSize(activeInvoice.notes || '', 180);
    doc.text(splitNotes, 15, currentY + 4);

    // Signatures
    const sigY = 260;
    doc.setDrawColor(148, 163, 184);
    doc.line(15, sigY, 60, sigY);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("Customer's Signature", 15, sigY + 4);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61);
    doc.text(`For ${companyInfo.name?.toUpperCase() || 'BHUDEV SEEDS'}`, 195, sigY - 12, { align: 'right' });

    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text('Authorized Signatory', 195, sigY - 5, { align: 'right' });

    doc.setDrawColor(15, 23, 42);
    doc.line(145, sigY, 195, sigY);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Authorised Signatory", 195, sigY + 4, { align: 'right' });

    doc.save(`Invoice_${activeInvoice.invoiceNo}.pdf`);
    showNotification(`Invoice ${activeInvoice.invoiceNo} PDF Downloaded.`);
  };

  const handleBackToBilling = () => {
    if (activeInvoice) {
      navigate(`/?id=${activeInvoice.id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-2 transform transition-all duration-300 animate-slide-in ${notification.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* TOP UTILITY NAVBAR */}
      <header className="bg-emerald-800 text-white shadow-md px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToBilling}
            className="p-2 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-600 transition-colors mr-1"
            title="Back to billing details form"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <Sprout className="w-5.5 h-5.5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {activeInvoice ? `Live Preview: ${activeInvoice.invoiceNo}` : 'Live Preview'}
            </h1>
            <p className="text-[9px] text-emerald-200 uppercase tracking-widest font-bold">Bhudev Agro</p>
          </div>
        </div>

        {/* Operational buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors border border-emerald-500"
          >
            <Download className="w-4 h-4 text-emerald-100" />
            <span>Download Vector PDF</span>
          </button>

          <button
            onClick={handleBackToBilling}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-emerald-100 border border-emerald-600 transition-colors"
          >
            <span>Resume Editing</span>
          </button>
        </div>
      </header>

      {/* RENDER BOX AREA */}
      {activeInvoice ? (
        <main
          ref={containerRef}
          className="flex-1 overflow-hidden p-6 flex justify-center items-center bg-slate-200/50"
        >
          <div
            style={{
              width: '793.8px',   // 210mm at 96 DPI
              height: '1122.5px', // 297mm at 96 DPI
              transform: `scale(${previewScale})`,
              transformOrigin: 'center center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              backgroundColor: '#fff',
              borderRadius: '2px',
              flexShrink: 0
            }}
          >
            <InvoicePrintable
              ref={componentRef}
              invoice={activeInvoice}
              companyInfo={companyInfo}
            />
          </div>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <FileText className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-700">No Invoice Selected</h2>
            <p className="text-xs text-slate-500 max-w-sm">Please return to billing and select or draft an invoice first.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold"
            >
              Go to Billing
            </button>
          </div>
        </main>
      )}
    </div>
  );
};

export default LivePreview;
