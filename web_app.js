let editingItemId = null;
let orderItems = [];

// Notification system
function showNotification(message, type = 'success') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;';
        document.body.appendChild(notificationContainer);
    }

    // Determine background color based on type
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-green-500';
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `${bgColor} text-white px-8 py-4 rounded-lg shadow-2xl max-w-md text-center font-medium animate-pulse`;
    notification.textContent = message;
    
    notificationContainer.innerHTML = '';
    notificationContainer.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            if (notificationContainer.contains(notification)) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Fetch items from API
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        console.log('Loaded items:', items);
        displayItems(items);
        populateItemSelect(items);
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Populate item select dropdown
function populateItemSelect(items) {
    const select = document.getElementById('itemSelect');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Choose an item...</option>';
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = JSON.stringify({
            id: item.item_id,
            name: item.item_name,
            price: item.sell_price
        });
        option.textContent = `${item.item_name} ($${parseFloat(item.sell_price).toFixed(2)})`;
        select.appendChild(option);
    });
}

// Handle item selection change
function setupItemSelectListener() {
    const itemSelect = document.getElementById('itemSelect');
    if (itemSelect) {
        itemSelect.addEventListener('change', function() {
            if (this.value) {
                const item = JSON.parse(this.value);
                document.getElementById('itemPrice').value = parseFloat(item.price).toFixed(2);
                updateItemTotal();
            } else {
                document.getElementById('itemPrice').value = '';
                document.getElementById('itemTotal').value = '';
            }
        });
    }
    
    const qtyInput = document.getElementById('itemQty');
    if (qtyInput) {
        qtyInput.addEventListener('change', updateItemTotal);
        qtyInput.addEventListener('keyup', updateItemTotal);
    }
    
    const discountInput = document.getElementById('discountAmount');
    if (discountInput) {
        discountInput.addEventListener('change', updateGrandTotal);
        discountInput.addEventListener('keyup', updateGrandTotal);
    }
}

// Update item total
function updateItemTotal() {
    const price = parseFloat(document.getElementById('itemPrice').value) || 0;
    const qty = parseFloat(document.getElementById('itemQty').value) || 1;
    const total = price * qty;
    document.getElementById('itemTotal').value = total.toFixed(2);
}

// Add item to order
function addItemToOrder() {
    const itemSelect = document.getElementById('itemSelect');
    const qty = parseFloat(document.getElementById('itemQty').value) || 1;
    const total = parseFloat(document.getElementById('itemTotal').value) || 0;
    
    if (!itemSelect.value) {
        showNotification('Please select an item', 'warning');
        return;
    }
    
    const item = JSON.parse(itemSelect.value);
    
    // Check if item already exists in order
    const existingItem = orderItems.find(i => i.id === item.id);
    if (existingItem) {
        existingItem.qty += qty;
        existingItem.total = existingItem.price * existingItem.qty;
    } else {
        orderItems.push({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: qty,
            total: total
        });
    }
    
    // Reset form
    itemSelect.value = '';
    document.getElementById('itemQty').value = '1';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemTotal').value = '';
    
    // Update display
    displayOrderItems();
    updateOrderTotals();
}

// Display order items in table
function displayOrderItems() {
    const tbody = document.getElementById('orderItemsBody');
    
    if (orderItems.length === 0) {
        tbody.innerHTML = '<tr class="border-b"><td colspan="5" class="px-3 py-4 text-center text-gray-500">No items added</td></tr>';
        return;
    }
    
    tbody.innerHTML = orderItems.map((item, index) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-3 py-2">${item.name}</td>
            <td class="px-3 py-2">$${parseFloat(item.price).toFixed(2)}</td>
            <td class="px-3 py-2">
                <input type="number" value="${item.qty}" min="1" class="w-16 px-2 py-1 border border-gray-300 rounded" onchange="updateItemQty(${index}, this.value)">
            </td>
            <td class="px-3 py-2">$${item.total.toFixed(2)}</td>
            <td class="px-3 py-2">
                <button type="button" onclick="removeItemFromOrder(${index})" class="text-red-600 hover:text-red-800">Remove</button>
            </td>
        </tr>
    `).join('');
}

// Update item quantity in order
function updateItemQty(index, newQty) {
    const qty = parseFloat(newQty) || 1;
    if (qty > 0) {
        orderItems[index].qty = qty;
        orderItems[index].total = orderItems[index].price * qty;
        displayOrderItems();
        updateOrderTotals();
    }
}

// Remove item from order
function removeItemFromOrder(index) {
    orderItems.splice(index, 1);
    displayOrderItems();
    updateOrderTotals();
}

// Update order totals
function updateOrderTotals() {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const discount = parseFloat(document.getElementById('discountAmount').value) || 0;
    const grandTotal = subtotal - discount;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `$${grandTotal.toFixed(2)}`;
}

// Update grand total when discount changes
function updateGrandTotal() {
    updateOrderTotals();
}

// Fetch sales records from API
async function loadSales() {
    try {
        const response = await fetch('/api/sales');
        const sales = await response.json();
        console.log('Loaded sales:', sales);
        displaySales(sales);
    } catch (error) {
        console.error('Error loading sales:', error);
    }
}

// Display items in table
function displayItems(items) {
    const itemsSection = document.querySelector('#items');
    const tbody = itemsSection ? itemsSection.querySelector('tbody') : null;
    
    if (!tbody) {
        console.error('Could not find tbody element');
        return;
    }
    
    if (!Array.isArray(items) || items.length === 0) {
        tbody.innerHTML = '<tr class="border-b hover:bg-gray-50"><td colspan="6" class="px-6 py-4 text-center text-gray-500">No items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-700">${item.item_id}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${item.item_name}</td>
            <td class="px-6 py-4 text-sm text-gray-700">$${parseFloat(item.cost_price).toFixed(2)}</td>
            <td class="px-6 py-4 text-sm text-gray-700">$${parseFloat(item.sell_price).toFixed(2)}</td>
            <td class="px-6 py-4 text-sm text-green-600 font-semibold">${((parseFloat(item.sell_price) - parseFloat(item.cost_price)) / parseFloat(item.cost_price) * 100).toFixed(2)}%</td>
            <td class="px-6 py-4 text-sm">
                <button class="text-blue-600 hover:text-blue-800 mr-3" onclick="openEditModal(${item.item_id}, '${item.item_name}', ${item.cost_price}, ${item.sell_price})">Edit</button>
                <button class="text-red-600 hover:text-red-800" onclick="deleteItem(${item.item_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Display sales in table
function displaySales(sales) {
    const salesSection = document.querySelector('#sales');
    const tbody = salesSection ? salesSection.querySelector('tbody') : null;
    
    if (!tbody) {
        console.error('Could not find sales tbody element');
        return;
    }
    
    if (!Array.isArray(sales) || sales.length === 0) {
        tbody.innerHTML = '<tr class="border-b hover:bg-gray-50"><td colspan="7" class="px-6 py-4 text-center text-gray-500">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = sales.map(sale => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-700">${sale.selling_id}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${sale.customer_name}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${sale.items_count || 0}</td>
            <td class="px-6 py-4 text-sm text-gray-700">$${parseFloat(sale.total_amount).toFixed(2)}</td>
            <td class="px-6 py-4 text-sm text-gray-700">$${parseFloat(sale.discount).toFixed(2)}</td>
            <td class="px-6 py-4 text-sm font-semibold text-blue-600">$${parseFloat(sale.grand_total).toFixed(2)}</td>
            <td class="px-6 py-4 text-sm">
                <button type="button" class="text-blue-600 hover:text-blue-800 mr-3" onclick="viewOrder(${sale.selling_id})">View</button>
                <button type="button" class="text-red-600 hover:text-red-800" onclick="deleteSale(${sale.selling_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Delete item function
async function deleteItem(itemId) {
    if (!confirm(`Are you sure you want to delete this item?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            showNotification('Item deleted successfully!', 'success');
            await loadItems();
        } else {
            const errorData = await response.json();
            showNotification('Error: ' + (errorData.error || 'Failed to delete item'), 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Error deleting item: ' + error.message, 'error');
    }
}

// Open edit modal
function openEditModal(itemId, itemName, costPrice, sellPrice) {
    editingItemId = itemId;
    const modal = document.getElementById('editModal');
    if (modal) {
        document.getElementById('editItemId').value = itemId;
        document.getElementById('editItemName').value = itemName;
        document.getElementById('editCostPrice').value = costPrice;
        document.getElementById('editSellPrice').value = sellPrice;
        modal.style.display = 'flex';
    }
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
        editingItemId = null;
    }
}

// Save edited item
async function saveEditedItem() {
    if (!editingItemId) {
        showNotification('No item selected for editing', 'warning');
        return;
    }
    
    const itemName = document.getElementById('editItemName').value;
    const costPrice = document.getElementById('editCostPrice').value;
    const sellPrice = document.getElementById('editSellPrice').value;
    
    if (!itemName || !costPrice || !sellPrice) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/items/${editingItemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_name: itemName,
                cost_price: parseFloat(costPrice),
                sell_price: parseFloat(sellPrice)
            })
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            showNotification('Item updated successfully!', 'success');
            closeEditModal();
            await loadItems();
        } else {
            showNotification('Error: ' + (responseData.error || 'Failed to update item'), 'error');
        }
    } catch (error) {
        console.error('Error updating item:', error);
        showNotification('Error updating item: ' + error.message, 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Load initial data
    loadItems();
    loadSales();
    setupItemSelectListener();
    
    // Add item form
    const addItemForm = document.querySelector('#items form');
    
    if (addItemForm) {
        addItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = addItemForm.querySelectorAll('input');
            const [nameInput, costInput, sellInput] = inputs;
            
            try {
                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        item_name: nameInput.value,
                        cost_price: parseFloat(costInput.value),
                        sell_price: parseFloat(sellInput.value)
                    })
                });
                
                const responseData = await response.json();
                
                if (response.ok) {
                    showNotification('Item added successfully!', 'success');
                    addItemForm.reset();
                    await loadItems();
                } else {
                    showNotification('Error: ' + (responseData.error || 'Failed to add item'), 'error');
                }
            } catch (error) {
                console.error('Error adding item:', error);
                showNotification('Error adding item: ' + error.message, 'error');
            }
        });
    }
    
    // Order form
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const customerName = document.getElementById('orderCustomerName').value;
            const discount = parseFloat(document.getElementById('discountAmount').value) || 0;
            const grandTotal = parseFloat(document.getElementById('grandTotal').textContent.replace('$', '')) || 0;
            const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace('$', '')) || 0;
            
            if (!customerName) {
                showNotification('Please enter customer name', 'warning');
                return;
            }
            
            if (orderItems.length === 0) {
                showNotification('Please add at least one item to the order', 'warning');
                return;
            }
            
            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: customerName,
                        items: orderItems,
                        total_amount: subtotal,
                        discount: discount,
                        grand_total: grandTotal
                    })
                });
                
                const responseData = await response.json();
                
                if (response.ok) {
                    showNotification('Order created successfully!', 'success');
                    orderForm.reset();
                    orderItems = [];
                    displayOrderItems();
                    updateOrderTotals();
                    await loadSales();
                } else {
                    showNotification('Error: ' + (responseData.error || 'Failed to create order'), 'error');
                }
            } catch (error) {
                console.error('Error creating order:', error);
                showNotification('Error creating order: ' + error.message, 'error');
            }
        });
    }
    
    // Close modal when clicking outside of it
    const editModal = document.getElementById('editModal');
    if (editModal) {
        window.addEventListener('click', (event) => {
            if (event.target === editModal) {
                closeEditModal();
            }
        });
    }
});

// View order details
async function viewOrder(sellingId) {
    try {
        const response = await fetch(`/api/sales/${sellingId}/details`);
        
        if (!response.ok) {
            showNotification('Failed to load order details', 'error');
            return;
        }
        
        const data = await response.json();
        const order = data.order;
        const items = data.items;
        
        // Build order details HTML
        let html = `
            <div class="mb-6 pb-6 border-b">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-gray-600">Order ID</p>
                        <p class="text-lg font-semibold">${order.selling_id}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Customer Name</p>
                        <p class="text-lg font-semibold">${order.customer_name}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Total Amount</p>
                        <p class="text-lg font-semibold">$${parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Discount</p>
                        <p class="text-lg font-semibold">$${parseFloat(order.discount).toFixed(2)}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Grand Total</p>
                        <p class="text-lg font-semibold text-blue-600">$${parseFloat(order.grand_total).toFixed(2)}</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">Items Purchased</h4>
                <table class="w-full border-collapse">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-2 text-left text-sm font-semibold">Item Name</th>
                            <th class="px-4 py-2 text-left text-sm font-semibold">Price</th>
                            <th class="px-4 py-2 text-left text-sm font-semibold">Qty</th>
                            <th class="px-4 py-2 text-right text-sm font-semibold">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2">${item.item_name || 'N/A'}</td>
                                <td class="px-4 py-2">$${parseFloat(item.sell_price || 0).toFixed(2)}</td>
                                <td class="px-4 py-2">${item.quantity}</td>
                                <td class="px-4 py-2 text-right">$${(parseFloat(item.sell_price || 0) * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('viewOrderContent').innerHTML = html;
        document.getElementById('viewOrderModal').style.display = 'flex';
    } catch (error) {
        console.error('Error fetching order details:', error);
        showNotification('Error loading order details: ' + error.message, 'error');
    }
}

// Close view order modal
function closeViewOrderModal() {
    document.getElementById('viewOrderModal').style.display = 'none';
}

// Delete sale/order
async function deleteSale(sellingId) {
    if (!confirm(`Are you sure you want to delete this order (Order ID: ${sellingId})?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/sales/${sellingId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            showNotification('Order deleted successfully!', 'success');
            await loadSales();
        } else {
            const errorData = await response.json();
            showNotification('Error: ' + (errorData.error || 'Failed to delete order'), 'error');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('Error deleting order: ' + error.message, 'error');
    }
}
