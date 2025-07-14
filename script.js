document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu-item input[type="checkbox"]');
    const orderItems = document.getElementById('order-items');
    const totalAmount = document.getElementById('total-amount');
    const printBtn = document.getElementById('print-btn');
    const exportTxtBtn = document.getElementById('export-txt');
    const exportPdfBtn = document.getElementById('export-pdf');
    const modal = document.getElementById('receipt-modal');
    const closeModal = document.querySelector('.close-modal');
    const searchInput = document.getElementById('search-input');
    
    // Add Item Modal elements
    const addItemBtn = document.getElementById('add-item-btn');
    const addItemModal = document.getElementById('add-item-modal');
    const addItemForm = document.getElementById('add-item-form');
    const cancelBtn = document.querySelector('.cancel-btn');
    const menuItemsContainer = document.querySelector('.menu-items');
    const printReceiptBtn = document.getElementById('print-receipt-btn');

    let order = [];
    let updateTimeout;
    let itemIdCounter = 5; // Start from 5 since we have 4 existing items

    // Debounce function for better performance
    function debounceUpdate(callback, delay = 300) {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(callback, delay);
    }

    // Handle search
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const itemName = item.querySelector('label').textContent.toLowerCase();
            if (itemName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Add Item Modal handlers
    addItemBtn.addEventListener('click', function() {
        addItemModal.style.display = 'block';
    });

    cancelBtn.addEventListener('click', function() {
        addItemModal.style.display = 'none';
        addItemForm.reset();
    });

    // Handle add item form submission
    addItemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itemName = document.getElementById('item-name').value.trim();
        const itemPrice = parseInt(document.getElementById('item-price').value);
        const itemUnit = document.getElementById('item-unit').value;
        
        if (itemName && itemPrice >= 0) {
            addNewMenuItem(itemName, itemPrice, itemUnit);
            addItemModal.style.display = 'none';
            addItemForm.reset();
        }
    });

    // Function to add new menu item
    function addNewMenuItem(name, price, unit) {
        const itemId = `item${itemIdCounter}`;
        itemIdCounter++;
        
        // Create new menu item element
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        // Display price with unit
        const displayPrice = unit === 'đ' ? `${price.toLocaleString()}${unit}` : `${price} ${unit}`;
        
        menuItem.innerHTML = `
            <input type="checkbox" id="${itemId}" data-price="${price}" data-unit="${unit}">
            <label for="${itemId}">${name}</label>
            <span class="price">${displayPrice}</span>
            <button class="delete-item-btn" data-item-id="${itemId}">×</button>
        `;
        
        // Add to menu
        menuItemsContainer.appendChild(menuItem);
        
        // Add event listener for the new checkbox
        const newCheckbox = menuItem.querySelector('input[type="checkbox"]');
        newCheckbox.addEventListener('change', function() {
            const itemName = this.nextElementSibling.textContent;
            const price = parseInt(this.dataset.price);
            const unit = this.dataset.unit;
            
            if (this.checked) {
                // Add item to order
                order.push({
                    name: itemName,
                    originalName: itemName,
                    price: price,
                    originalPrice: price,
                    unit: unit,
                    quantity: 1
                });
            } else {
                // Remove item from order
                order = order.filter(item => item.originalPrice !== price || item.originalName !== itemName);
            }
            
            updateOrderDisplay();
        });
        
        // Add event listener for delete button
        const deleteBtn = menuItem.querySelector('.delete-item-btn');
        deleteBtn.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            // Remove from order if exists
            const checkbox = document.getElementById(itemId);
            if (checkbox && checkbox.checked) {
                const itemName = checkbox.nextElementSibling.textContent;
                const price = parseInt(checkbox.dataset.price);
                order = order.filter(item => item.originalPrice !== price || item.originalName !== itemName);
                updateOrderDisplay();
            }
            // Remove from menu
            menuItem.remove();
        });
    }

    // Handle item selection
    menuItems.forEach(item => {
        item.addEventListener('change', function() {
            const itemName = this.nextElementSibling.textContent;
            const price = parseInt(this.dataset.price);
            const unit = this.dataset.unit || 'đ'; // Default to VND
            
            if (this.checked) {
                // Add item to order
                order.push({
                    name: itemName,
                    originalName: itemName, // Store original name
                    price: price,
                    originalPrice: price, // Store original price for checkbox reference
                    unit: unit,
                    quantity: 1
                });
            } else {
                // Remove item from order
                order = order.filter(item => item.originalPrice !== price);
            }
            
            updateOrderDisplay();
        });
    });

    // Update main total function
    function updateMainTotal() {
        debounceUpdate(() => {
            let total = 0;
            order.forEach(item => total += item.price * item.quantity);
            totalAmount.textContent = total.toLocaleString() + 'đ';
        }, 100); // Reduce delay for faster response
    }

    // Update order display
    function updateOrderDisplay() {
        orderItems.innerHTML = '';
        let total = 0;

        order.forEach((item, index) => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            orderItem.innerHTML = `
                <div class="item-controls">
                    <label>Name: <small>(Original: ${item.originalName})</small></label>
                    <div>
                        <input type="text" value="${item.name}" class="item-name-input" data-index="${index}">
                        <button class="reset-btn" data-type="name" data-index="${index}" title="Reset to: ${item.originalName}">↺</button>
                    </div>
                </div>
                <div class="item-controls">
                    <label>Price: <small>(Original: ${item.originalPrice.toLocaleString()}đ)</small></label>
                    <div>
                        <input type="number" value="${item.price}" class="item-price-input" data-index="${index}">đ
                        <button class="reset-btn" data-type="price" data-index="${index}" title="Reset to: ${item.originalPrice.toLocaleString()}đ">↺</button>
                    </div>
                </div>
                <div class="item-controls">
                    <label>Quantity:</label>
                    <input type="number" min="1" value="${item.quantity}" class="quantity-input" data-index="${index}">
                </div>
                <div class="item-total">
                    ${itemTotal.toLocaleString()}đ
                </div>
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            
            orderItems.appendChild(orderItem);
        });

        // Add event listeners after elements are added to DOM
        addEventListeners();

        totalAmount.textContent = total.toLocaleString() + 'đ';
    }

    // Add event listeners function
    function addEventListeners() {
        // Name input listeners
        document.querySelectorAll('.item-name-input').forEach(input => {
            input.addEventListener('input', function() {
                const index = parseInt(this.dataset.index);
                order[index].name = this.value;
            });
        });

        // Price input listeners
        document.querySelectorAll('.item-price-input').forEach(input => {
            input.addEventListener('input', function() {
                const index = parseInt(this.dataset.index);
                const newPrice = parseInt(this.value) || 0;
                order[index].price = newPrice;
                
                // Update item total immediately
                const itemTotal = newPrice * order[index].quantity;
                const totalElement = this.closest('.order-item').querySelector('.item-total');
                if (totalElement) {
                    totalElement.textContent = itemTotal.toLocaleString() + 'đ';
                }
                
                // Update main total
                updateMainTotal();
            });
        });

        // Quantity input listeners
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('input', function() {
                const index = parseInt(this.dataset.index);
                const newQuantity = parseInt(this.value);
                if (newQuantity > 0) {
                    order[index].quantity = newQuantity;
                    
                    // Update item total immediately
                    const itemTotal = order[index].price * newQuantity;
                    const totalElement = this.closest('.order-item').querySelector('.item-total');
                    if (totalElement) {
                        totalElement.textContent = itemTotal.toLocaleString() + 'đ';
                    }
                    
                    // Update main total
                    updateMainTotal();
                } else {
                    this.value = 1;
                    order[index].quantity = 1;
                    updateOrderDisplay();
                }
            });
        });

        // Reset button listeners
        document.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const type = this.dataset.type;
                
                if (type === 'name') {
                    order[index].name = order[index].originalName;
                } else if (type === 'price') {
                    order[index].price = order[index].originalPrice;
                }
                
                updateOrderDisplay();
            });
        });

        // Remove button listeners
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const item = order[index];
                
                // Uncheck the corresponding checkbox
                const checkbox = document.querySelector(`input[data-price="${item.originalPrice}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
                
                order.splice(index, 1);
                updateOrderDisplay();
            });
        });
    }

    // Generate random invoice ID
    function generateReceiptId() {
        return 'INV' + Date.now().toString().slice(-6);
    }

    // Show invoice
    function showReceipt() {
        const receiptId = document.getElementById('receipt-id');
        const receiptTime = document.getElementById('receipt-time');
        const receiptItems = document.getElementById('receipt-items');
        const receiptTotal = document.getElementById('receipt-total');

        receiptId.textContent = generateReceiptId();
        receiptTime.textContent = new Date().toLocaleString('en-US');
        
        let itemsHtml = '';
        let total = 0;

        order.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const unitDisplay = item.unit === 'đ' ? 'đ' : ` ${item.unit}`;
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${itemTotal.toLocaleString()}${unitDisplay}</span>
                </div>
            `;
        });

        receiptItems.innerHTML = itemsHtml;
        receiptTotal.textContent = total.toLocaleString() + 'đ';
        
        modal.style.display = 'block';
    }

    // Print receipt function
    function printReceipt() {
        const receiptContent = document.querySelector('.receipt').innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${document.getElementById('receipt-id').textContent}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        margin: 20px;
                        background: white;
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .receipt-header h2 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .receipt-body {
                        margin-bottom: 20px;
                    }
                    .receipt-total {
                        text-align: right;
                        font-weight: bold;
                        margin-top: 20px;
                        border-top: 1px dashed #000;
                        padding-top: 10px;
                    }
                    .receipt-footer {
                        text-align: center;
                        margin-top: 20px;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    ${receiptContent}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    // Export TXT file
    function exportToTxt() {
        let content = 'STORE ABC\n';
        content += 'Address: 123 ABC Street, XYZ District\n';
        content += 'Phone: 0123.456.789\n\n';
        content += `Invoice No: ${generateReceiptId()}\n`;
        content += `Time: ${new Date().toLocaleString('en-US')}\n\n`;
        
        let total = 0;
        order.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const unitDisplay = item.unit === 'đ' ? 'đ' : ` ${item.unit}`;
            content += `${item.name} x ${item.quantity}: ${itemTotal.toLocaleString()}${unitDisplay}\n`;
        });
        
        content += `\nTotal: ${total.toLocaleString()}đ\n`;
        content += '\nThank you for your purchase!';

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Export PDF file
    function exportToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add store information
        doc.setFontSize(20);
        doc.text('STORE ABC', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Address: 123 ABC Street, XYZ District', 105, 30, { align: 'center' });
        doc.text('Phone: 0123.456.789', 105, 40, { align: 'center' });

        // Add invoice information
        doc.setFontSize(12);
        doc.text(`Invoice No: ${generateReceiptId()}`, 20, 60);
        doc.text(`Time: ${new Date().toLocaleString('en-US')}`, 20, 70);

        // Add items table
        const tableColumn = ['Item', 'Quantity', 'Price', 'Total'];
        const tableRows = [];

        let total = 0;
        order.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const unitDisplay = item.unit === 'đ' ? 'đ' : ` ${item.unit}`;
            tableRows.push([
                item.name,
                item.quantity.toString(),
                item.price.toLocaleString() + (item.unit === 'đ' ? 'đ' : ` ${item.unit}`),
                itemTotal.toLocaleString() + unitDisplay
            ]);
        });

        // Add total row
        tableRows.push(['', '', 'Total:', total.toLocaleString() + 'đ']);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5,
            },
            headStyles: {
                fillColor: [76, 175, 80],
                textColor: 255,
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 40, halign: 'right' },
                3: { cellWidth: 40, halign: 'right' }
            }
        });

        // Add thank you message
        const finalY = doc.lastAutoTable.finalY || 150;
        doc.setFontSize(12);
        doc.text('Thank you for your purchase!', 105, finalY + 20, { align: 'center' });

        // Save the PDF
        doc.save(`invoice_${Date.now()}.pdf`);
    }

    // Event listeners
    printBtn.addEventListener('click', showReceipt);
    exportTxtBtn.addEventListener('click', exportToTxt);
    exportPdfBtn.addEventListener('click', exportToPdf);
    printReceiptBtn.addEventListener('click', printReceipt);
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
        if (e.target === addItemModal) {
            addItemModal.style.display = 'none';
            addItemForm.reset();
        }
    });
});