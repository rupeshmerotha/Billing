import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import {
  Sprout, Plus, Trash2, Printer, Download, LogOut,
  Settings, History, FileText, User, MapPin, Tag, CheckCircle, Eye
} from 'lucide-react';
import bhudevLogo from '../assets/bhudev_logo_png.png';
import { numberToWords } from './InvoicePrintable';
import {
  DEFAULT_COMPANY_INFO,
  getTodayDateString
} from '../utils/mockData';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Invoices & Company Config State
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('invoices');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Remove legacy mock data automatically
      const hasMock = parsed.some(inv => inv.id === 'invoice-1' || inv.id === 'invoice-2');
      if (hasMock) {
        localStorage.removeItem('invoices');
        return [];
      }
      return parsed;
    }
    return [];
  });

  const [companyInfo, setCompanyInfo] = useState(() => {
    const saved = localStorage.getItem('companyInfo');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  });

  // URL Parameter selection for active invoice
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Temp Form State for adding a product line
  const [newSeedName, setNewSeedName] = useState('');
  const [newHsnCode, setNewHsnCode] = useState('10061010'); // Default Paddy
  const [newLotNumber, setNewLotNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newPacking, setNewPacking] = useState('40'); // Kg default
  const [newBags, setNewBags] = useState('10');       // Bags default
  const [newQuantity, setNewQuantity] = useState('400');
  const [newRate, setNewRate] = useState('0');

  // Sync selected invoice with query parameter in URL (?id=xxxx)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    if (idParam) {
      const exists = invoices.some(inv => inv.id === idParam);
      if (exists) {
        setSelectedInvoiceId(idParam);
        return;
      }
    }
    // Fallback to first invoice if no valid query param
    if (invoices.length > 0) {
      setSelectedInvoiceId(invoices[0].id);
    } else {
      setSelectedInvoiceId('');
    }
  }, [location.search, invoices]);

  // Current active invoice object
  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];

  // Auto-calculate Quantity = Packing Weight * Bags
  useEffect(() => {
    const packingVal = parseFloat(newPacking);
    const bagsVal = parseInt(newBags, 10);
    if (!isNaN(packingVal) && !isNaN(bagsVal)) {
      setNewQuantity(String(packingVal * bagsVal));
    } else {
      setNewQuantity('');
    }
  }, [newPacking, newBags]);

  // Save changes to local storage on state change
  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
  }, [companyInfo]);

  // Show Toast
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Auth Guard
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  // Create Invoice (Navbar Action)
  const handleCreateInvoice = () => {
    let nextNum = 1;
    if (invoices.length > 0) {
      const numbers = invoices.map(inv => {
        const match = inv.invoiceNo.match(/BHU-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNum = Math.max(...numbers, 0) + 1;
    }
    const nextInvoiceNo = `BHU-${String(nextNum).padStart(4, '0')}`;

    const newInvoice = {
      id: `invoice-${Date.now()}`,
      invoiceNo: nextInvoiceNo,
      date: getTodayDateString(),
      customerName: '',
      customerAddress: '',
      items: [],
      discount: '',
      advance: '',
      notes: "1. All disputes shall be subject to the jurisdiction of Bundi courts.\n2. Seed once sold shall not be returned or exchanged.\n3. Errors and omissions excepted (E.&O.E.)."
    };

    setInvoices([newInvoice, ...invoices]);
    navigate(`/?id=${newInvoice.id}`);
    showNotification(`New invoice ${nextInvoiceNo} created!`);
  };

  // Delete invoice handler
  const handleDeleteInvoiceCurrent = () => {
    if (!activeInvoice) return;
    if (window.confirm(`Are you sure you want to delete invoice ${activeInvoice.invoiceNo}?`)) {
      const filtered = invoices.filter(inv => inv.id !== activeInvoice.id);
      setInvoices(filtered);
      showNotification(`Invoice ${activeInvoice.invoiceNo} deleted.`, 'info');
      navigate('/');
    }
  };

  // Reset active invoice to clean state
  const handleResetCurrentInvoice = () => {
    if (!activeInvoice) return;
    if (window.confirm("Are you sure you want to reset this invoice? This will clear all items and details.")) {
      setInvoices(invoices.map(inv => {
        if (inv.id === activeInvoice.id) {
          return {
            ...inv,
            customerName: '',
            customerAddress: '',
            items: [],
            discount: '',
            advance: ''
          };
        }
        return inv;
      }));
      showNotification("Invoice reset complete.");
    }
  };

  // Update Customer & Metadata fields
  const handleUpdateInvoiceMeta = (field, value) => {
    if (!activeInvoice) return;
    setInvoices(invoices.map(inv => {
      if (inv.id === activeInvoice.id) {
        return { ...inv, [field]: value };
      }
      return inv;
    }));
  };

  // Add Item to active invoice
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!activeInvoice) {
      alert("Please create or select an invoice first.");
      return;
    }
    if (!newSeedName.trim()) {
      alert("Please enter a seed name.");
      return;
    }

    const packingVal = parseFloat(newPacking);
    if (isNaN(packingVal) || packingVal <= 0) {
      alert("Please enter a valid packing weight greater than 0.");
      return;
    }

    const bagsVal = parseInt(newBags, 10);
    if (isNaN(bagsVal) || bagsVal <= 0) {
      alert("Please enter a valid number of bags greater than 0.");
      return;
    }

    const rateVal = parseFloat(newRate);
    if (isNaN(rateVal) || rateVal < 0) {
      alert("Please enter a valid non-negative rate.");
      return;
    }

    const qty = packingVal * bagsVal;
    const amount = qty * rateVal;

    const newItem = {
      id: `item-${Date.now()}`,
      seedName: newSeedName,
      hsn: newHsnCode,
      manufacturer: '',
      lotNumber: newLotNumber || 'BHU-GENERIC',
      expiryDate: newExpiryDate || '2027-12',
      packing: `${packingVal} kg`,
      bags: bagsVal,
      quantity: qty,
      rate: rateVal,
      amount: amount
    };

    setInvoices(invoices.map(inv => {
      if (inv.id === activeInvoice.id) {
        return {
          ...inv,
          items: [...inv.items, newItem]
        };
      }
      return inv;
    }));

    // Reset Form Fields
    setNewSeedName('');
    setNewHsnCode('10061010');
    setNewLotNumber('');
    setNewExpiryDate('');
    setNewPacking('40');
    setNewBags('10');
    setNewQuantity('400');
    setNewRate('0');
    showNotification("Product added to invoice");
  };

  // Delete product from active invoice
  const handleDeleteItem = (itemId) => {
    if (!activeInvoice) return;
    setInvoices(invoices.map(inv => {
      if (inv.id === activeInvoice.id) {
        return {
          ...inv,
          items: inv.items.filter(item => item.id !== itemId)
        };
      }
      return inv;
    }));
    showNotification("Product removed from invoice", "info");
  };

  // Navigate to Live Preview Page
  const handleGoToPreview = () => {
    if (activeInvoice) {
      navigate(`/live-preview?id=${activeInvoice.id}`);
    } else {
      navigate('/live-preview');
    }
  };

  // Vector PDF Export
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

    // Border
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Logo image to canvas
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

    // Centered Company Details
    doc.setTextColor(21, 128, 61);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(companyInfo.name.toUpperCase(), 105, 23, { align: 'center' });

    doc.setTextColor(71, 85, 105);
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(companyInfo.tagline, 105, 27, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(companyInfo.address, 105, 32, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Mobile: ${companyInfo.phones.split(',')[0].trim()} | Email: ${companyInfo.email}`, 105, 37, { align: 'center' });

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

    // Customer Box
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.rect(15, 57, 180, 24);
    doc.line(105, 57, 105, 81);

    // Meta Details
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

    // Customer Details
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

    // Table Column Widths
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

    // Draw Table Headings
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

    // Words total
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

    // Bank
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
    doc.text(companyInfo.bankDetails.bankName, 42, currentY + 11);
    doc.text(companyInfo.bankDetails.accountNo, 42, currentY + 16);
    doc.text(companyInfo.bankDetails.ifsc, 42, currentY + 21);
    doc.text(companyInfo.bankDetails.branch, 42, currentY + 26);

    // Calculations
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

    // Terms Notes
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
    doc.text(`For ${companyInfo.name.toUpperCase()}`, 195, sigY - 12, { align: 'right' });

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
    showNotification(`PDF Invoice ${activeInvoice.invoiceNo} downloaded!`);
  };

  // Calculations for current active invoice
  const items = activeInvoice?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const discount = parseFloat(activeInvoice?.discount) || 0;
  const advance = parseFloat(activeInvoice?.advance) || 0;
  const grandTotal = Math.max(0, subtotal - discount - advance);

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

      {/* ================= MAIN NAVBAR HEADER ================= */}
      <header className="bg-emerald-800 text-white shadow-md px-6 py-3.5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <Sprout className="w-5.5 h-5.5 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Bhudev Seeds (BTC)</h1>
            <p className="text-[9px] text-emerald-200 uppercase tracking-widest font-bold">Billing Management System</p>
          </div>
        </div>

        {/* Global Toolbar actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateInvoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-xs font-bold border border-emerald-500 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>

          <button
            onClick={handleGoToPreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 transition-colors text-xs font-bold border border-teal-500 shadow-sm"
          >
            <Eye className="w-4 h-4 text-teal-100" />
            <span>View Current Preview</span>
          </button>

          <button
            onClick={() => navigate('/old-invoices')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 transition-colors text-xs font-bold border border-emerald-600 shadow-sm text-emerald-100"
          >
            <History className="w-4 h-4 text-emerald-300" />
            <span>View Invoice History</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 transition-colors text-xs font-bold border border-emerald-600"
          >
            <Settings className="w-4 h-4" />
            <span>Company Config</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700/20 hover:bg-red-700/40 border border-red-500/30 transition-colors text-xs font-bold text-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ================= APPLICATION LAYOUT (100% WIDESCREEN DETAILS ONLY) ================= */}
      <div className="flex-1 flex overflow-hidden">
        {activeInvoice ? (
          <section className="w-full bg-white flex flex-col p-2.5 space-y-2.5 overflow-hidden h-full">

            {/* SECTION 1: CUSTOMER METADATA (Horizontal Bar) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 space-y-1 shrink-0">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Customer & Invoice Metadata</span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Verma Agri Solutions"
                    value={activeInvoice.customerName}
                    onChange={(e) => handleUpdateInvoiceMeta('customerName', e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Customer Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Kurukshetra, Haryana"
                    value={activeInvoice.customerAddress}
                    onChange={(e) => handleUpdateInvoiceMeta('customerAddress', e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Invoice Date</label>
                  <input
                    type="date"
                    value={activeInvoice.date}
                    onChange={(e) => handleUpdateInvoiceMeta('date', e.target.value)}
                    className="w-full p-1 border border-slate-300 rounded-lg focus:outline-none text-[11px] h-[30px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Invoice Number</label>
                  <input
                    type="text"
                    value={activeInvoice.invoiceNo}
                    onChange={(e) => handleUpdateInvoiceMeta('invoiceNo', e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PRODUCTS FORM & TABLE LIST (Middle Panel) */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-3.5 overflow-hidden">

              {/* 2A: Add Product Form (Col-span-5) */}
              <form onSubmit={handleAddItem} className="col-span-5 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between overflow-hidden bg-white shadow-sm h-full shrink-0">
                <div className="font-bold text-slate-700 border-b pb-0.5 flex items-center gap-1 uppercase tracking-wider text-[9px] shrink-0">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add Seed / Product Row</span>
                </div>

                <div className="flex-1 py-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs overflow-hidden">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-600 mb-0.5">Seed Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BHU Premium Paddy-11"
                      value={newSeedName}
                      onChange={(e) => setNewSeedName(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">HSN Code *</label>
                    <select
                      value={newHsnCode}
                      onChange={(e) => setNewHsnCode(e.target.value)}
                      className="w-full p-1 border border-slate-300 rounded-lg focus:outline-none bg-white text-[11px] font-semibold text-slate-700 h-[30px]"
                    >
                      <option value="10061010">Paddy (10061010)</option>
                      <option value="10019010">Wheat (10019010)</option>
                      <option value="12075010">Mustard (12075010)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Lot Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BHU-PD-12A"
                      value={newLotNumber}
                      onChange={(e) => setNewLotNumber(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:outline-none text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Expiry Date</label>
                    <input
                      type="month"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full p-1 border border-slate-300 rounded-lg focus:outline-none text-[11px] h-[30px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Packing (Kg/Bag)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newPacking}
                      onChange={(e) => setNewPacking(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:outline-none font-bold text-emerald-800 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Number of Bags</label>
                    <input
                      type="number"
                      min="1"
                      value={newBags}
                      onChange={(e) => setNewBags(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:outline-none font-bold text-emerald-800 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-0.5">Qty (Kg) [Auto]</label>
                    <input
                      type="number"
                      readOnly
                      disabled
                      value={newQuantity}
                      className="w-full p-1.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg font-mono text-[11px]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-slate-600 mb-0.5">Rate (Price Per Kg, ₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none text-[11px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1 py-1.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow transition-colors shrink-0 mt-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item to Invoice</span>
                </button>
              </form>

              {/* 2B: Added Products List (Col-span-7) */}
              <div className="col-span-7 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-slate-50/50 shadow-sm max-h-full">
                <div className="p-2.5 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Added Products ({items.length})</span>
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                      <FileText className="w-10 h-10 text-slate-200 mb-1" />
                      <span className="text-xs font-semibold">No products added yet</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Fill form on left and click "Add Item"</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold text-[9px] uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2 px-3 text-center w-[10%]">S.N.</th>
                          <th className="py-2 px-2 w-[40%]">Seed Name</th>
                          <th className="py-2 px-2 text-center w-[15%]">Bags</th>
                          <th className="py-2 px-2 text-right w-[15%]">Qty</th>
                          <th className="py-2 px-2 text-right w-[15%]">Rate</th>
                          <th className="py-2 px-2 text-right w-[15%]">Amount</th>
                          <th className="py-2 px-2 text-center w-[10%]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 bg-white font-mono text-[11px] text-slate-700">
                        {items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/70">
                            <td className="py-1.5 px-3 text-center font-bold">{idx + 1}</td>
                            <td className="py-1.5 px-2 font-serif font-semibold text-slate-900 truncate max-w-[150px]">{item.seedName}</td>
                            <td className="py-1.5 px-2 text-center">{item.bags}</td>
                            <td className="py-1.5 px-2 text-right font-bold">{item.quantity}</td>
                            <td className="py-1.5 px-2 text-right">₹{item.rate}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-slate-900">₹{item.amount}</td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* SECTION 3: DISCOUNTS, TERMS & ACTIONS (Bottom Bar) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 grid grid-cols-12 gap-3 items-center shrink-0">
              {/* Col A (col-span-5): Notes */}
              <div className="col-span-5 text-xs">
                <label className="block font-bold text-slate-600 mb-0.5">Invoice Notes / Terms</label>
                <textarea
                  value={activeInvoice.notes}
                  onChange={(e) => handleUpdateInvoiceMeta('notes', e.target.value)}
                  rows="2"
                  placeholder="E.g., Seed once sold shall not be returned..."
                  className="w-full p-1.5 border border-slate-300 rounded-lg focus:outline-none text-[10px]"
                />
              </div>

              {/* Col B (col-span-4): Finance Inputs */}
              <div className="col-span-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Discount Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={activeInvoice.discount ?? ''}
                    onChange={(e) => handleUpdateInvoiceMeta('discount', e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Advance Payment (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={activeInvoice.advance ?? ''}
                    onChange={(e) => handleUpdateInvoiceMeta('advance', e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* Col C (col-span-3): Grand Total & Actions */}
              <div className="col-span-3 text-right flex flex-col justify-between items-end h-full py-0.5">
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Grand Total</span>
                  <strong className="text-lg font-bold text-emerald-800 font-mono">₹{grandTotal.toFixed(2)}</strong>
                </div>

                {/* Operational actions */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={handleGoToPreview}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-colors border border-teal-500"
                    title="Open widescreen live preview screen"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs transition-colors"
                    title="Download vector PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={handleResetCurrentInvoice}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Clear Invoice Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </section>
        ) : (
          <main className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-slate-300 mx-auto" />
              <h2 className="text-xl font-bold text-slate-700">No Active Invoices</h2>
              <p className="text-xs text-slate-500 max-w-sm">Click "Create New Invoice" in the top bar to begin drafting a seed bill.</p>
            </div>
          </main>
        )}
      </div>

      {/* ================= COMPANY SETTINGS OVERLAY PANEL ================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-[450px] bg-white h-full shadow-2xl p-6 flex flex-col justify-between animate-slide-left overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>Company Configuration</span>
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={companyInfo.tagline}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address</label>
                  <textarea
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    rows="3"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phones</label>
                  <input
                    type="text"
                    value={companyInfo.phones}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phones: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="text"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={companyInfo.gst}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, gst: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold text-emerald-800 text-sm mb-3">Bank Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={companyInfo.bankDetails.bankName}
                        onChange={(e) => setCompanyInfo({
                          ...companyInfo,
                          bankDetails: { ...companyInfo.bankDetails, bankName: e.target.value }
                        })}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={companyInfo.bankDetails.accountNo}
                        onChange={(e) => setCompanyInfo({
                          ...companyInfo,
                          bankDetails: { ...companyInfo.bankDetails, accountNo: e.target.value }
                        })}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={companyInfo.bankDetails.ifsc}
                        onChange={(e) => setCompanyInfo({
                          ...companyInfo,
                          bankDetails: { ...companyInfo.bankDetails, ifsc: e.target.value }
                        })}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={companyInfo.bankDetails.branch}
                        onChange={(e) => setCompanyInfo({
                          ...companyInfo,
                          bankDetails: { ...companyInfo.bankDetails, branch: e.target.value }
                        })}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t mt-6">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  showNotification("Company settings saved!");
                }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
