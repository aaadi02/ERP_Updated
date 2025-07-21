import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Save, 
  Send, 
  ArrowLeft, 
  Upload, 
  AlertCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  FileText,
  Package
} from 'lucide-react';

const PurchaseOrderForm = ({ orderId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    requestedBy: '',
    department: '',
    level: 'Department',
    requiredDate: '',
    priority: 'Medium',
    budgetHead: 'Revenue',
    budgetAllocation: 0,
    items: [
      {
        itemName: '',
        itemCode: '',
        category: '',
        subcategory: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        specifications: '',
        urgency: 'Medium'
      }
    ],
    vendor: {
      name: '',
      contact: '',
      email: '',
      address: '',
      gst: ''
    },
    attachments: []
  });

  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const categories = [
    'Office Supplies',
    'Lab Equipment', 
    'Furniture',
    'Electronics',
    'Software',
    'Books',
    'Maintenance',
    'Other'
  ];

  const subcategories = {
    'Office Supplies': ['Stationery', 'Paper', 'Files & Folders', 'Writing Materials'],
    'Lab Equipment': ['Instruments', 'Chemicals', 'Glassware', 'Safety Equipment'],
    'Furniture': ['Chairs', 'Tables', 'Cabinets', 'Storage'],
    'Electronics': ['Computers', 'Projectors', 'Audio/Video', 'Accessories'],
    'Software': ['Operating Systems', 'Applications', 'Licenses', 'Updates'],
    'Books': ['Textbooks', 'Reference Books', 'Journals', 'Digital Resources'],
    'Maintenance': ['Cleaning Supplies', 'Tools', 'Spare Parts', 'Services'],
    'Other': ['Miscellaneous']
  };

  useEffect(() => {
    fetchDepartments();
    fetchFaculty();
    if (orderId) {
      setIsEdit(true);
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/purchase/departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await fetch('/api/purchase/faculty');
      const data = await response.json();
      setFaculty(data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase/orders/${id}`);
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    // Calculate total price when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    // Generate item code if item name is provided
    if (field === 'itemName' && value) {
      const code = value.toLowerCase().replace(/\s+/g, '_').substring(0, 10);
      const timestamp = Date.now().toString().slice(-4);
      updatedItems[index].itemCode = `${code}_${timestamp}`;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemName: '',
        itemCode: '',
        category: '',
        subcategory: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        specifications: '',
        urgency: 'Medium'
      }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.requestedBy) newErrors.requestedBy = 'Requested by is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.requiredDate) newErrors.requiredDate = 'Required date is required';
    if (!formData.budgetAllocation || formData.budgetAllocation <= 0) {
      newErrors.budgetAllocation = 'Valid budget allocation is required';
    }
    
    // Check if required date is in the future
    if (formData.requiredDate && new Date(formData.requiredDate) <= new Date()) {
      newErrors.requiredDate = 'Required date must be in the future';
    }
    
    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.itemName) newErrors[`item_${index}_name`] = 'Item name is required';
      if (!item.category) newErrors[`item_${index}_category`] = 'Category is required';
      if (!item.quantity || item.quantity <= 0) newErrors[`item_${index}_quantity`] = 'Valid quantity is required';
      if (!item.unitPrice || item.unitPrice <= 0) newErrors[`item_${index}_price`] = 'Valid unit price is required';
      if (!item.specifications) newErrors[`item_${index}_specs`] = 'Specifications are required';
    });
    
    // Check if total amount exceeds budget allocation
    const totalAmount = calculateTotalAmount();
    if (totalAmount > formData.budgetAllocation) {
      newErrors.budget = `Total amount (₹${totalAmount.toLocaleString()}) exceeds budget allocation (₹${formData.budgetAllocation.toLocaleString()})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status = 'Draft') => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      const totalAmount = calculateTotalAmount();
      
      const orderData = {
        ...formData,
        totalAmount,
        status,
        ...(isEdit ? { updatedBy: formData.requestedBy } : {})
      };
      
      const url = isEdit ? `/api/purchase/orders/${orderId}` : '/api/purchase/orders';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const savedOrder = await response.json();
        onSave && onSave(savedOrder);
        
        // Show success message
        alert(`Purchase order ${status === 'Draft' ? 'saved as draft' : 'submitted'} successfully!`);
        
        if (status === 'Submitted') {
          onClose && onClose();
        }
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        alert(`Error: ${errorData.error || errorData.message || 'Failed to save purchase order'}`);
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert(`Error saving purchase order: ${error.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      fileName: file.name,
      filePath: URL.createObjectURL(file), // In real app, upload to server
      uploadedBy: formData.requestedBy,
      uploadedDate: new Date()
    }));
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index) => {
    const updatedAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      attachments: updatedAttachments
    }));
  };

  if (loading && isEdit) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading purchase order...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              SmartProcure - {isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
            </h1>
            <p className="text-gray-600">
              {isEdit ? `Order #${formData.poNumber}` : 'Create intelligent purchase order with automated approval workflow'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleSave('Draft')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave('Submitted')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Send size={20} />
            <span>Submit for Approval</span>
          </button>
        </div>
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-2" size={20} />
            <h3 className="text-red-800 font-medium">Please fix the following errors:</h3>
          </div>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-4">
              <User className="text-blue-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested By *
                </label>
                <select
                  value={formData.requestedBy}
                  onChange={(e) => handleInputChange('requestedBy', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.requestedBy ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Faculty</option>
                  {faculty.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name} - {member.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Department">Department Level</option>
                  <option value="Institute">Institute Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Date *
                </label>
                <input
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => handleInputChange('requiredDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.requiredDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Head
                </label>
                <select
                  value={formData.budgetHead}
                  onChange={(e) => handleInputChange('budgetHead', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Capital">Capital</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Research">Research</option>
                  <option value="Development">Development</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Allocation (₹) *
              </label>
              <input
                type="number"
                value={formData.budgetAllocation}
                onChange={(e) => handleInputChange('budgetAllocation', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.budgetAllocation ? 'border-red-300' : 'border-gray-300'
                }`}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Package className="text-blue-600 mr-2" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              </div>
              <button
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`item_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter item name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Code
                      </label>
                      <input
                        type="text"
                        value={item.itemCode}
                        onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Auto-generated"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`item_${index}_category`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subcategory
                      </label>
                      <select
                        value={item.subcategory}
                        onChange={(e) => handleItemChange(index, 'subcategory', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!item.category}
                      >
                        <option value="">Select Subcategory</option>
                        {item.category && subcategories[item.category]?.map(subcat => (
                          <option key={subcat} value={subcat}>{subcat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgency
                      </label>
                      <select
                        value={item.urgency}
                        onChange={(e) => handleItemChange(index, 'urgency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`item_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`item_${index}_price`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Price (₹)
                      </label>
                      <input
                        type="text"
                        value={`₹${item.totalPrice.toLocaleString()}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specifications *
                    </label>
                    <textarea
                      value={item.specifications}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_specs`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      rows="3"
                      placeholder="Enter detailed specifications for this item..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-4">
              <FileText className="text-blue-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-2">Upload supporting documents</p>
              <p className="text-sm text-gray-500 mb-4">
                Quotations, specifications, approval letters, etc.
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Choose Files
              </label>
            </div>

            {formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium text-gray-900">Uploaded Files:</h3>
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.fileName}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-4">
              <DollarSign className="text-green-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{formData.items.length}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Quantity:</span>
                <span className="font-medium">
                  {formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">
                    ₹{calculateTotalAmount().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Budget Allocation:</span>
                  <span>₹{formData.budgetAllocation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className={
                    formData.budgetAllocation - calculateTotalAmount() >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }>
                    ₹{(formData.budgetAllocation - calculateTotalAmount()).toLocaleString()}
                  </span>
                </div>
              </div>

              {errors.budget && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {errors.budget}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Building2 size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-600">Level:</span>
                <span className="ml-2 font-medium">{formData.level}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <AlertCircle size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-600">Priority:</span>
                <span className={`ml-2 font-medium ${
                  formData.priority === 'Critical' ? 'text-red-600' :
                  formData.priority === 'High' ? 'text-orange-600' :
                  formData.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formData.priority}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <Calendar size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-600">Required:</span>
                <span className="ml-2 font-medium">
                  {formData.requiredDate 
                    ? new Date(formData.requiredDate).toLocaleDateString() 
                    : 'Not set'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Approval Workflow */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Workflow</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-600 mr-3"></div>
                <span>Department Head</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300 mr-3"></div>
                <span>Finance Head</span>
              </div>
              {formData.level === 'Institute' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-3"></div>
                  <span>Director</span>
                </div>
              )}
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300 mr-3"></div>
                <span>Purchase Officer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
