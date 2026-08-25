import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Printer, Plus, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRGenerator() {
  const [tableCount, setTableCount] = useState(6);
  const [customTables, setCustomTables] = useState([
    { number: '1', label: 'Cozy Window Seat 1' },
    { number: '2', label: 'Cozy Window Seat 2' },
    { number: '3', label: 'Garden Patio 3' },
    { number: '4', label: 'Garden Patio 4' },
    { number: '5', label: 'Traveler High Table 5' },
    { number: '6', label: 'Terrace Lounge 6' },
  ]);

  const [qrCodes, setQrCodes] = useState({});

  // Base URL calculation (current host or fallback)
  const baseUrl = window.location.origin;

  useEffect(() => {
    async function generateAllQrs() {
      const generated = {};
      for (const table of customTables) {
        const targetUrl = `${baseUrl}/menu?table=${table.number}`;
        try {
          const dataUrl = await QRCode.toDataURL(targetUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#1E130D', // Espresso color for QR dots
              light: '#FFFFFF',
            },
          });
          generated[table.number] = dataUrl;
        } catch (err) {
          console.error(`QR gen error for table ${table.number}:`, err);
        }
      }
      setQrCodes(generated);
    }

    generateAllQrs();
  }, [customTables, baseUrl]);

  const downloadQr = (table) => {
    const dataUrl = qrCodes[table.number];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `Musafir-Cafe-Table-${table.number}-QR.png`;
    link.href = dataUrl;
    link.click();
    toast.success(`Downloaded QR code for Table #${table.number}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddTable = () => {
    const nextNum = customTables.length + 1;
    setCustomTables((prev) => [
      ...prev,
      { number: String(nextNum), label: `Table ${nextNum}` },
    ]);
    toast.success(`Added Table #${nextNum}`);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F2] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DF9B52]/20 shadow-cafe-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#C86D3B]/10 text-[#C86D3B] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contactless Dining Standees</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
              Table QR Code Standee Generator
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6F68] mt-1">
              Generate and print aesthetic tabletop cards for Musafir Cafe. Guests can scan with any phone camera to browse and order.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddTable}
              className="px-4 py-2.5 rounded-xl bg-[#F4EDE4] text-[#1E130D] hover:bg-[#DF9B52]/20 text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C86D3B]" />
              <span>Add Table</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-[#1E130D] text-white hover:bg-[#C86D3B] text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-md"
            >
              <Printer className="w-4 h-4 text-[#ECC980]" />
              <span>Print Table Cards</span>
            </button>
          </div>
        </div>

        {/* Standee Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {customTables.map((table) => {
            const qrImage = qrCodes[table.number];
            const menuLink = `/menu?table=${table.number}`;

            return (
              <div
                key={table.number}
                className="bg-white rounded-3xl p-6 border border-[#DF9B52]/30 shadow-cafe-soft flex flex-col items-center text-center space-y-4 relative overflow-hidden group hover:shadow-cafe-card transition-all"
              >
                {/* Decorative Top Arch */}
                <div className="w-full border-b border-[#F4EDE4] pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img src="/logo.jpg" alt="Logo" className="w-6 h-6 rounded-full object-contain" />
                    <span className="font-serif font-bold text-xs text-[#1E130D]">Musafir Cafe</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#C86D3B] bg-[#C86D3B]/10 px-2 py-0.5 rounded-full">
                    Table #{table.number}
                  </span>
                </div>

                {/* Table Standee Banner */}
                <div>
                  <h3 className="font-serif text-2xl font-black text-[#1E130D]">
                    {table.label}
                  </h3>
                  <p className="text-[11px] text-[#7A6F68] mt-0.5">
                    Scan with camera to order freshly crafted food & coffee
                  </p>
                </div>

                {/* QR Code Container with Centered Logo Look */}
                <div className="p-3 bg-[#FDF8F2] rounded-2xl border-2 border-dashed border-[#DF9B52]/40 shadow-inner relative">
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt={`QR Code Table ${table.number}`}
                      className="w-48 h-48 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-[#7A6F68]">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* URL preview */}
                <div className="text-[11px] text-[#7A6F68] font-mono bg-[#F4EDE4] px-3 py-1 rounded-lg">
                  {baseUrl}/menu?table={table.number}
                </div>

                {/* Standee Actions */}
                <div className="w-full pt-2 flex items-center gap-2 border-t border-[#F4EDE4]">
                  <a
                    href={menuLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#FDF8F2] hover:bg-[#F4EDE4] text-[#1E130D] text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#C86D3B]" />
                    <span>Open Menu</span>
                  </a>
                  <button
                    onClick={() => downloadQr(table)}
                    className="p-2 rounded-xl bg-[#1E130D] hover:bg-[#C86D3B] text-white text-xs font-bold transition-colors shadow-sm"
                    title="Download Standee Image"
                  >
                    <Download className="w-4 h-4 text-[#ECC980]" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
