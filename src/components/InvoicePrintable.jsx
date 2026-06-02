import React from 'react';
import bhudevLogo from '../assets/bhudev_logo_png.png';
import signImg from '../assets/sign.png';

// Helper to convert numbers to Indian currency words
export const numberToWords = (num) => {
  if (!num || isNaN(num) || num < 0) return 'Rupees Zero Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const formatThreeDigits = (n) => {
    let str = '';
    const hd = Math.floor(n / 100);
    const rem = n % 100;
    if (hd > 0) {
      str += a[hd] + ' Hundred ';
    }
    if (rem > 0) {
      if (str !== '') str += 'and ';
      if (rem > 19) {
        str += b[Math.floor(rem / 10)] + ' ' + a[rem % 10];
      } else {
        str += a[rem];
      }
    }
    return str.trim();
  };

  let rem = Math.floor(num);
  let word = '';

  // Crore (1,00,00,000)
  const cr = Math.floor(rem / 10000000);
  if (cr > 0) {
    word += formatThreeDigits(cr) + ' Crore ';
    rem %= 10000000;
  }

  // Lakh (1,00,000)
  const lk = Math.floor(rem / 100000);
  if (lk > 0) {
    word += formatThreeDigits(lk) + ' Lakh ';
    rem %= 100000;
  }

  // Thousand (1,000)
  const th = Math.floor(rem / 1000);
  if (th > 0) {
    word += formatThreeDigits(th) + ' Thousand ';
    rem %= 1000;
  }

  // Hundreds, Tens & Ones
  if (rem > 0) {
    word += formatThreeDigits(rem);
  }

  return `Rupees ${word.trim()} Only`;
};

export const InvoicePrintable = React.forwardRef(({ invoice, companyInfo }, ref) => {
  if (!invoice) return null;

  const items = invoice.items || [];
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const discount = parseFloat(invoice.discount) || 0;
  const advance = parseFloat(invoice.advance) || 0;
  const grandTotal = Math.max(0, subtotal - discount - advance);

  // We enforce a fixed number of rows (e.g., 7) to give it a realistic pre-printed bill book appearance
  const minRows = 7;
  const emptyRowsCount = Math.max(0, minRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  // Format Date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateStr;
  };

  return (
    <div
      ref={ref}
      className="invoice-print-container w-[210mm] min-h-[297mm] bg-white text-slate-800 p-[15mm] font-serif shadow-xl mx-auto flex flex-col justify-between border border-slate-300 relative print:shadow-none print:border-0 print:p-[10mm]"
      style={{ boxSizing: 'border-box' }}
    >
      <div>
        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-3 mb-4">
          {/* Logo */}
          <div className="w-1/4 flex flex-col items-start justify-center -mt-8">
            <img src={bhudevLogo} alt="Bhudev Seeds Logo" className="h-[140px] w-auto shrink-0" />
          </div>

          {/* Company Details */}
          <div className="w-2/4 text-center">
            <h1 className="text-3xl font-extrabold text-emerald-800 tracking-wide uppercase leading-tight font-serif">
              {companyInfo.name}
            </h1>
            <p className="text-[10px] text-slate-600 italic font-sans mb-1">{companyInfo.tagline}</p>
            <p className="text-[11px] leading-relaxed text-slate-700">
              {companyInfo.address}
            </p>
            <p className="text-[11px] font-semibold text-slate-800 mt-1">
              Mobile: <span className="font-mono">{companyInfo.phones.split(',')[0].trim()}</span> | Email: <span className="font-mono text-slate-600">{companyInfo.email}</span>
            </p>
          </div>

          {/* Licenses & GST Details */}
          <div className="w-1/4 text-right flex flex-col justify-start text-[11px] leading-relaxed text-slate-700">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-sans">Licenses & GST</span>
            <span>License No: {companyInfo.license1 || 'SS/2023-24/32367'}</span>
            <span>{companyInfo.license2 || 'KTPT-25113'}</span>
            <span className="font-bold text-slate-800 mt-1">GST: <span className="font-mono">{companyInfo.gst || '08AQMPM6732H1ZH'}</span></span>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-center mb-4">
          <span className="border-2 border-slate-800 px-6 py-1 uppercase tracking-widest font-extrabold text-sm bg-slate-50">
            INVOICE
          </span>
        </div>

        {/* ================= BILL INFO / CUSTOMER INFO ================= */}
        <div className="grid grid-cols-2 gap-4 border border-slate-400 rounded p-3 mb-4 text-xs">
          {/* Left Column: Invoice Details */}
          <div className="space-y-1.5 border-r border-slate-200 pr-3">
            <div className="flex">
              <span className="w-28 text-slate-500 uppercase tracking-wider font-semibold">Invoice No:</span>
              <span className="font-bold text-slate-900 font-mono">{invoice.invoiceNo}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 uppercase tracking-wider font-semibold">Invoice Date:</span>
              <span className="font-semibold text-slate-800 font-mono">{formatDate(invoice.date)}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 uppercase tracking-wider font-semibold">State/Code:</span>
              <span className="text-slate-700">Rajasthan (08)</span>
            </div>
          </div>

          {/* Right Column: Customer Details */}
          <div className="space-y-1.5 pl-3">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Billed To:</span>
              <span className="block font-bold text-slate-900 text-sm">{invoice.customerName || 'Walk-in Customer'}</span>
            </div>
            <div className="text-slate-700 text-[11px] leading-snug">
              {invoice.customerAddress || 'N/A'}
            </div>
          </div>
        </div>

        {/* ================= PRODUCT TABLE ================= */}
        <div className="border border-slate-400 rounded overflow-hidden mb-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-800 border-b border-slate-400 font-semibold text-[11px] tracking-wider">
                <th className="py-2.5 px-2 border-r border-slate-400 text-center w-[5%]">S.N.</th>
                <th className="py-2.5 px-2 border-r border-slate-400 w-[32%]">Seed Name</th>
                <th className="py-2.5 px-2 border-r border-slate-400 text-center w-[10%]">HSN Code</th>
                <th className="py-2.5 px-2 border-r border-slate-400 text-center w-[12%]">Lot No.</th>
                <th className="py-2.5 px-2 border-r border-slate-400 text-center w-[10%]">Expiry</th>
                <th className="py-2.5 px-2 border-r border-slate-400 text-center w-[8%]">Packing</th>
                <th className="py-2.5 px-2 border-r border-slate-400 text-center w-[7%]">Bags</th>
                <th className="py-2.5 px-2 border-r border-slate-400 text-right w-[8%]">Qty</th>
                <th className="py-2.5 px-2 border-r border-slate-400 text-right w-[8%]">Rate</th>
                <th className="py-2.5 px-2 text-right w-[10%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Product Rows */}
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-slate-300 font-mono text-[11px] hover:bg-slate-50/50">
                  <td className="py-2 px-1 border-r border-slate-300 text-center">{idx + 1}</td>
                  <td className="py-2 px-2 border-r border-slate-300 font-serif font-semibold text-slate-900">{item.seedName}</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-700">{item.hsn || 'N/A'}</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-700">{item.lotNumber}</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-700">
                    {item.expiryDate ? (item.expiryDate.includes('-') ? `${item.expiryDate.split('-')[1]}/${item.expiryDate.split('-')[0]}` : item.expiryDate) : 'N/A'}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-700">{item.packing}</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-center font-bold text-slate-900">{item.bags || 0}</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-right text-slate-800">₹{parseFloat(item.rate).toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">₹{parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}

              {/* Padding empty rows to maintain A4 spacing */}
              {emptyRows.map((_, idx) => (
                <tr key={`empty-${idx}`} className="border-b border-slate-200/55 h-[34px]">
                  <td className="py-2 px-1 border-r border-slate-300 text-center text-transparent">{items.length + idx + 1}</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-transparent">&nbsp;</td>
                  <td className="py-2 px-2 text-transparent">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="border border-slate-300 bg-slate-50/40 p-2.5 rounded mb-4 text-xs flex justify-between items-center">
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-0.5">Total Amount (in words)</span>
            <span className="font-bold text-slate-800 italic">{numberToWords(grandTotal)}</span>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            E. & O.E.
          </div>
        </div>
      </div>

      {/* ================= FOOTER / BANK / SIGNATURE ================= */}
      <div>
        {/* Middle Calculation Breakups */}
        <div className="grid grid-cols-12 gap-4 mb-4 items-start">
          {/* Bank Details & Terms */}
          <div className="col-span-7 border border-slate-300 rounded p-2.5 text-[10px] space-y-2">
            <div>
              <span className="font-bold text-emerald-800 uppercase tracking-wide block mb-1">Bank Payment Details:</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700">
                <span className="text-slate-500 font-semibold">Bank Name:</span>
                <span className="font-bold">{companyInfo.bankDetails.bankName}</span>
                <span className="text-slate-500 font-semibold">Account No:</span>
                <span className="font-bold font-mono">{companyInfo.bankDetails.accountNo}</span>
                <span className="text-slate-500 font-semibold">IFSC Code:</span>
                <span className="font-bold font-mono">{companyInfo.bankDetails.ifsc}</span>
                <span className="text-slate-500 font-semibold">Branch:</span>
                <span>{companyInfo.bankDetails.branch}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-1.5">
              <span className="font-bold text-slate-700 block mb-0.5">Terms & Conditions:</span>
              <div className="text-[9px] text-slate-500 leading-normal whitespace-pre-line">
                {invoice.notes || "No extra terms."}
              </div>
            </div>
          </div>

          {/* Calculations Table */}
          <div className="col-span-5 border border-slate-400 rounded overflow-hidden">
            <table className="w-full text-xs font-mono">
              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <td className="py-2 px-2 text-slate-600 font-semibold">Subtotal:</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">₹{subtotal.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-2 text-slate-600 font-semibold">Discount:</td>
                  <td className="py-2 px-2 text-right font-bold text-red-700">-₹{discount.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-2 text-slate-600 font-semibold">Advance Payment:</td>
                  <td className="py-2 px-2 text-right font-bold text-emerald-700">-₹{advance.toFixed(2)}</td>
                </tr>
                <tr className="bg-emerald-50/40 text-sm">
                  <td className="py-2.5 px-2 text-emerald-950 font-bold font-serif uppercase tracking-wider">Grand Total:</td>
                  <td className="py-2.5 px-2 text-right font-bold text-emerald-950 border-double border-t-2 border-b-4 border-emerald-800">
                    ₹{grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Bottom Signatures */}
        <div className="flex justify-between items-end border-t border-slate-300 pt-6 mt-4">
          <div className="w-1/2 text-left">
            <div className="h-10"></div>
            <div className="w-32 border-t border-dashed border-slate-400 my-1"></div>
            <p className="text-[10px] text-slate-500 font-sans">Customer's Signature</p>
          </div>

          <div className="w-1/2 text-right flex flex-col items-end">
            <p className="text-[10px] font-bold text-emerald-900 uppercase">For {companyInfo.name}</p>
            <div className="h-12 flex items-center justify-end pr-6">
              {/* Subtle design flourish for signature placeholder */}
              <img src={signImg} alt="Authorized Signatory" className="h-[50px] w-auto" />
            </div>
            <div className="w-40 border-t border-slate-400 my-1"></div>
            <p className="text-[10px] text-slate-600 font-sans font-semibold">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoicePrintable.displayName = 'InvoicePrintable';
