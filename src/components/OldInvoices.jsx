import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft, Search, FileText, Trash2, Printer, Download,
  Calendar, User, MapPin, IndianRupee, Tag, ShieldCheck, CheckCircle
} from 'lucide-react';
import bhudevLogo from '../assets/bhudev_logo_png.png';
import { numberToWords } from './InvoicePrintable';

const OldInvoices = () => {
  const navigate = useNavigate();

  // Load Invoices and Company Config from Local Storage
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyInfo, setCompanyInfo] = useState(() => {
    const saved = localStorage.getItem('companyInfo');
    return saved ? JSON.parse(saved) : {};
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Show toast notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync back to local storage if modified (like on delete)
  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Auth Guard
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      navigate('/login');
    }
  }, [navigate]);

  // Calculations for Analytics Banner
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => {
    const subtotal = inv.items?.reduce((s, item) => s + (parseFloat(item.amount) || 0), 0) || 0;
    const discount = parseFloat(inv.discount) || 0;
    const advance = parseFloat(inv.advance) || 0;
    return sum + Math.max(0, subtotal - discount - advance);
  }, 0);

  const totalDiscountGiven = invoices.reduce((sum, inv) => sum + (parseFloat(inv.discount) || 0), 0);

  // Filtered invoices by search query
  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerAddress && inv.customerAddress.toLowerCase().includes(q))
    );
  });

  // Edit / Open invoice: redirects to dashboard with id parameter
  const handleEditInvoice = (id) => {
    navigate(`/?id=${id}`);
  };

  // Delete invoice with confirmation
  const handleDeleteInvoice = (id, invoiceNo) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      showNotification(`Invoice ${invoiceNo} deleted successfully.`, 'info');
    }
  };

  // Vector PDF download inside archives (replicated exact jsPDF coordinate drawing system)
  const handleDownloadPDF = async (activeInvoice) => {
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

    // Company Header Info
    doc.setTextColor(21, 128, 61); // Emerald 700
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
    doc.text(`GST: ${companyInfo.gst || '08AQMPM6732H1ZH'}`, 190, 34, { align: 'right' });

    // Divider
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

    // Customer Info
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

    // --- TABLE COLUMNS ---
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

    // Grid columns vertical boundary lines
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

    // Amount in Words
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

    // Bank details (left) & Totals (right)
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-2 transform transition-all duration-300 animate-slide-in ${notification.type === 'info'
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="bg-emerald-800 text-white shadow-md px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <FileText className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Invoice History Archives</h1>
            <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">Bhudev Agro</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700/60 hover:bg-emerald-700 rounded-lg transition-colors text-sm font-bold border border-emerald-600 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Billing</span>
        </button>
      </header>

      {/* ANALYTICS BANNER */}
      <section className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Invoices Saved</p>
              <h3 className="text-2xl font-bold text-slate-800 font-mono mt-0.5">{totalInvoices}</h3>
            </div>
          </div>

          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Billing Turnover</p>
              <h3 className="text-2xl font-bold text-slate-800 font-mono mt-0.5">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Accumulated Discounts</p>
              <h3 className="text-2xl font-bold text-slate-800 font-mono mt-0.5">₹{totalDiscountGiven.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & INVOICES LIST GRID */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search invoices by Invoice No, Customer Name, Address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>

          {/* Grid display */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 text-center space-y-3">
              <FileText className="w-16 h-16 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700">No Invoices Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? "We couldn't find any generated invoices matching your search criteria. Try modifying your keywords."
                  : "You haven't generated any invoices yet. Go back to billing to start drafting your first bill!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((inv) => {
                const subtotal = inv.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                const discount = parseFloat(inv.discount) || 0;
                const advance = parseFloat(inv.advance) || 0;
                const grandTotal = Math.max(0, subtotal - discount - advance);
                const itemsCount = inv.items?.length || 0;

                return (
                  <div
                    key={inv.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Invoice header bar */}
                    <div className="bg-slate-50/70 border-b border-slate-100 p-4.5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-sm text-slate-800 font-mono tracking-tight">{inv.invoiceNo}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Saved</span>
                      </span>
                    </div>

                    {/* Invoice detail panel */}
                    <div className="p-5 space-y-4 flex-1">
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5 text-xs text-slate-500 font-semibold">
                          <User className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                          <span className="uppercase tracking-wider text-[9px]">Billed To</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm truncate">{inv.customerName || 'Walk-in Customer'}</h4>
                        {inv.customerAddress && (
                          <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium pt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                            <p className="truncate text-[11px] leading-snug">{inv.customerAddress}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            <Calendar className="w-3 h-3" />
                            <span>Date</span>
                          </div>
                          <span className="font-bold text-xs text-slate-700 font-mono">
                            {inv.date.split('-').reverse().join('/')}
                          </span>
                        </div>

                        <div className="space-y-1 text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Items Count
                          </div>
                          <span className="font-bold text-xs text-slate-700">
                            {itemsCount} {itemsCount === 1 ? 'Product' : 'Products'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Footer total and actions */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Total Amount</span>
                        <p className="text-base font-bold text-emerald-800 font-mono">₹{grandTotal.toFixed(0)}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditInvoice(inv.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200/50 transition-colors"
                          title="Open and edit invoice"
                        >
                          View/Edit
                        </button>

                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default OldInvoices;
