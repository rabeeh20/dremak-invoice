import React, { useState } from "react";
import { Download, Plus, Trash2, FileText } from "lucide-react";

const CateringInvoiceGenerator = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    eventDate: "",
    eventVenue: "",
    items: [{ id: 1, description: "", quantity: 1, amount: 0 }],
    subtotal: 0,

    total: 0,
    notes: "",
  });

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      description: "",
      quantity: 1,

      amount: 0,
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
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "amount") {
            updatedItem.amount = updatedItem.amount;
          }
          return updatedItem;
        }
        return item;
      });

      const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);

      const total = subtotal;

      return {
        ...prev,
        items: updatedItems,
        subtotal,

        total,
      };
    });
  };

  const updateInvoiceData = (field, value) => {
    setInvoiceData((prev) => {
      const updated = { ...prev, [field]: value };

      return updated;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const generatePDF = () => {
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
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>DREMAK CATERERS</h1>
            <p>Invoice #${invoiceData.invoiceNumber}</p>
          </div>

          <div class="invoice-details">
            <div class="business-info info-section">
              <h3>From:</h3>
              <strong>DREMAK CATERERS</strong><br>
              TC Road, Tirurangadi<br>
               Malappuram,Kerala - 676306
              

              <br>
              Phone:+91 9645012224<br>
              Email:support.dremakcaterers@gmail.com
            </div>
            <div class="customer-info info-section">
              <h3>Bill To:</h3>
              <strong>${
                invoiceData.customerName || "Customer Name"
              }</strong><br>
              ${invoiceData.customerAddress || "Customer Address"}<br>
              Phone: ${invoiceData.customerPhone || "Customer Phone"}
            </div>
          </div>

          <div class="invoice-details">
            <div>
              <strong>Invoice Date:</strong> ${new Date(
                invoiceData.date
              ).toLocaleDateString("en-IN")}<br>
              ${
                invoiceData.dueDate
                  ? `<strong>Due Date:</strong> ${new Date(
                      invoiceData.dueDate
                    ).toLocaleDateString("en-IN")}<br>`
                  : ""
              }
            </div>
          </div>

          ${
            invoiceData.eventDate || invoiceData.eventVenue
              ? `
          <div class="event-details">
            <h3 style="margin-top: 0; color: #3b82f6;">Event Details</h3>
            ${
              invoiceData.eventDate
                ? `<strong>Event Date:</strong> ${new Date(
                    invoiceData.eventDate
                  ).toLocaleDateString("en-IN")}<br>`
                : ""
            }
            ${
              invoiceData.eventVenue
                ? `<strong>Venue:</strong> ${invoiceData.eventVenue}`
                : ""
            }
          </div>
          `
              : ""
          }

          <table>
            <thead>
              <tr>
                <th style="width: 50%">Description</th>
                <th style="width: 15%" class="text-right">Quantity</th>
                
                <th style="width: 15%" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.description || "Service Item"}</td>
                  <td class="text-right">${item.quantity}  ${item.unit}</td>
                 
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
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
     
    
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
            <button
              onClick={generatePDF}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </button>
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

          {/* Business Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={invoiceData.businessName}
                  onChange={(e) =>
                    updateInvoiceData("businessName", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Catering Business"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  value={invoiceData.businessPhone}
                  onChange={(e) =>
                    updateInvoiceData("businessPhone", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={invoiceData.businessAddress}
                  onChange={(e) =>
                    updateInvoiceData("businessAddress", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Business Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={invoiceData.businessEmail}
                  onChange={(e) =>
                    updateInvoiceData("businessEmail", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="business@email.com"
                />
              </div>
            </div>
          </div>

          {/* Customer Information */}
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
              <div className="md:col-span-2">
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
                            updateItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
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
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2"
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
                            updateItem(
                              item.id,
                              "amount",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
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
          <button
            onClick={generatePDF}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CateringInvoiceGenerator;
