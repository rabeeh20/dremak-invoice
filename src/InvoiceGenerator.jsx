import React, { useState } from "react";
import { Download, Plus, Trash2, FileText, LogOut } from "lucide-react";

const BUSINESS = {
  name: "DREMAK CATERERS",
  address: "TC Road, Tirurangadi, Malappuram, Kerala - 676306",
  phone: "+91 9645012224",
  email: "support.dremakcaterers@gmail.com",
};

const CateringInvoiceGenerator = ({ userEmail, onLogout }) => {
  const [includePaymentLink, setIncludePaymentLink] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    customerEmail: "",
    eventDate: "",
    eventVenue: "",
    // FIX: added unit: "" to initial item state
    items: [{ id: 1, description: "", quantity: 1, unit: "", amount: "" }],
    subtotal: 0,
    total: 0,
    notes: "",
  });

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      description: "",
      quantity: 1,
      unit: "",
      amount: "",
    };
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (id) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateItem = (id, field, value) => {
    setInvoiceData((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });

      const subtotal = updatedItems.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );

      return {
        ...prev,
        items: updatedItems,
        subtotal,
        total: subtotal,
      };
    });
  };

  const updateInvoiceData = (field, value) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    let paymentLink = null;

    if (includePaymentLink) {
    try {
      const response = await fetch("/api/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: invoiceData.total,
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerPhone,
          customerEmail: invoiceData.customerEmail,
          description:
            invoiceData.items.map((i) => i.description).join(", ") ||
            "Catering Services",
          invoiceNumber: invoiceData.invoiceNumber,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        paymentLink = data.paymentLink;
      } else {
        console.error("Failed to generate payment link", await response.text());
        alert(
          "Warning: Failed to create Razorpay Payment Link. Proceeding to generate PDF without it."
        );
      }
    } catch (err) {
      console.error("Error connecting to payment API", err);
      // PDF generation continues even if payment link fails
    }
    } // end includePaymentLink guard

    const printWindow = window.open("", "_blank");
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333;
            line-height: 1.4;
          }
          .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #3b82f6; 
            padding-bottom: 5px; 
            margin-bottom: 10px;
          }
          .header h1 { 
            color: #3b82f6; 
            margin: 0; 
            font-size: 28px;
          }
          .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px;
          }
          .business-info, .customer-info { 
            width: 48%;
          }
          .info-section h3 { 
            color: #3b82f6; 
            border-bottom: 1px solid #e5e7eb; 
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .event-details {
            background: #f8fafc;
            padding: 15px;
            border-left: 4px solid #3b82f6;
            margin-bottom: 30px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
          }
          th, td { 
            border: 1px solid #e5e7eb; 
            padding: 12px; 
            text-align: left;
          }
          th { 
            background-color: #3b82f6; 
            color: white; 
            font-weight: bold;
          }
          .text-right { 
            text-align: right;
          }
          .total-section { 
            background: #f8fafc; 
            padding: 15px;
            border: 1px solid #e5e7eb;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 5px 0;
          }
          .final-total { 
            font-weight: bold; 
            font-size: 18px; 
            color: #3b82f6;
            border-top: 2px solid #3b82f6;
            padding-top: 10px;
            margin-top: 10px;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
          }
          .pay-button-container {
            text-align: center;
            margin-top: 40px;
          }
          .pay-button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 14px 28px;
            font-size: 18px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>${BUSINESS.name}</h1>
            <p>Invoice #${invoiceData.invoiceNumber}</p>
          </div>

          <div class="invoice-details">
            <!-- FIX: PDF now uses BUSINESS constants, not form fields that were ignored -->
            <div class="business-info info-section">
              <h3>From:</h3>
              <strong>${BUSINESS.name}</strong><br>
              ${BUSINESS.address}<br>
              Phone: ${BUSINESS.phone}<br>
              Email: ${BUSINESS.email}
            </div>
            <div class="customer-info info-section">
              <h3>Bill To:</h3>
              <strong>${invoiceData.customerName || "Customer Name"}</strong><br>
              ${invoiceData.customerAddress || "Customer Address"}<br>
              Phone: ${invoiceData.customerPhone || "Customer Phone"}<br>
              ${invoiceData.customerEmail ? `Email: ${invoiceData.customerEmail}<br>` : ""}
            </div>
          </div>

          <div class="invoice-details">
            <div>
              <strong>Invoice Date:</strong> ${new Date(invoiceData.date).toLocaleDateString("en-IN")}<br>
              ${invoiceData.dueDate ? `<strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString("en-IN")}<br>` : ""}
            </div>
          </div>

          ${
            invoiceData.eventDate || invoiceData.eventVenue
              ? `
          <div class="event-details">
            <h3 style="margin-top: 0; color: #3b82f6;">Event Details</h3>
            ${invoiceData.eventDate ? `<strong>Event Date:</strong> ${new Date(invoiceData.eventDate).toLocaleDateString("en-IN")}<br>` : ""}
            ${invoiceData.eventVenue ? `<strong>Venue:</strong> ${invoiceData.eventVenue}` : ""}
          </div>
          `
              : ""
          }

          <table>
            <thead>
              <tr>
                <th style="width: 50%">Description</th>
                <th style="width: 20%" class="text-right">Qty / Unit</th>
                <th style="width: 30%" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.description || "Service Item"}</td>
                  <!-- FIX: guarded item.unit with fallback to avoid "undefined" in PDF -->
                  <td class="text-right">${item.quantity} ${item.unit || ""}</td>
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoiceData.subtotal)}</span>
            </div>
            <div class="total-row final-total">
              <span>Total Amount:</span>
              <span>${formatCurrency(invoiceData.total)}</span>
            </div>
          </div>

          ${
            invoiceData.notes
              ? `
          <div class="notes">
            <h3 style="margin-top: 0; color: #f59e0b;">Notes:</h3>
            <p>${invoiceData.notes}</p>
          </div>
          `
              : ""
          }

          <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 14px;">
            ${
              paymentLink
                ? `
              <div class="pay-button-container">
                <a href="${paymentLink}" class="pay-button" target="_blank">Pay Now via Razorpay</a>
                <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">(Click above to pay securely online)</p>
              </div>
            `
                : ""
            }
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setIsGeneratingPDF(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Catering Invoice Generator
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {userEmail && (
                <span className="text-sm text-gray-500 hidden md:block">{userEmail}</span>
              )}
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors text-white ${
                  isGeneratingPDF
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Download className="h-5 w-5" />
                <span>{isGeneratingPDF ? "Generating..." : "Download PDF"}</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline text-sm font-medium">Sign Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceData.invoiceNumber}
                onChange={(e) =>
                  updateInvoiceData("invoiceNumber", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceData.date}
                onChange={(e) => updateInvoiceData("date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => updateInvoiceData("dueDate", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Customer Information — FIX: added email field */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={invoiceData.customerName}
                  onChange={(e) =>
                    updateInvoiceData("customerName", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  value={invoiceData.customerPhone}
                  onChange={(e) =>
                    updateInvoiceData("customerPhone", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={invoiceData.customerEmail}
                  onChange={(e) =>
                    updateInvoiceData("customerEmail", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={invoiceData.customerAddress}
                  onChange={(e) =>
                    updateInvoiceData("customerAddress", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Customer Address"
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  value={invoiceData.eventDate}
                  onChange={(e) =>
                    updateInvoiceData("eventDate", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Venue
                </label>
                <input
                  type="text"
                  value={invoiceData.eventVenue}
                  onChange={(e) =>
                    updateInvoiceData("eventVenue", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event Venue"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Items</h2>
              <button
                onClick={addItem}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                      Amount (₹)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Food item or service"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(item.id, "unit", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select unit</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="ltr">ltr</option>
                          <option value="pcs">pcs</option>
                          <option value="pieces">pieces</option>
                          <option value="nos">nos</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(item.id, "amount", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-40"
                          disabled={invoiceData.items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-1/2">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(invoiceData.subtotal)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-blue-600">
                      <span>Total:</span>
                      <span>{formatCurrency(invoiceData.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={invoiceData.notes}
              onChange={(e) => updateInvoiceData("notes", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes, terms, or conditions..."
            />
          </div>

          {/* Payment Link Toggle */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-800">Include Razorpay Payment Button</p>
              <p className="text-xs text-gray-500 mt-0.5">Adds a "Pay Now" link to the generated PDF</p>
            </div>
            <button
              type="button"
              onClick={() => setIncludePaymentLink((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                includePaymentLink ? "bg-blue-600" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={includePaymentLink}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  includePaymentLink ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className={`w-full flex justify-center items-center space-x-2 px-6 py-3 rounded-lg transition-colors text-white ${
              isGeneratingPDF
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Download className="h-5 w-5" />
            <span>
              {isGeneratingPDF
                ? "Generating PDF & Payment Link..."
                : "Download PDF"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CateringInvoiceGenerator;
