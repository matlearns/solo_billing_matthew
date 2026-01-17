// Fetch items from API
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        console.log('Loaded items:', items);
        displayItems(items);
    } catch (error) {
        console.error('Error loading items:', error);
    }
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
    
    console.log('Items section:', itemsSection);
    console.log('Tbody:', tbody);
    
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
                <button class="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                <button class="text-red-600 hover:text-red-800">Delete</button>
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
                <button class="text-blue-600 hover:text-blue-800 mr-3">View</button>
                <button class="text-red-600 hover:text-red-800">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Add item form handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Load initial data
    loadItems();
    loadSales();
    
    // Add item form
    const addItemForm = document.querySelector('#items form');
    console.log('Add item form:', addItemForm);
    
    if (addItemForm) {
        addItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = addItemForm.querySelectorAll('input');
            const [nameInput, costInput, sellInput] = inputs;
            
            console.log('Form submitted:', {
                name: nameInput.value,
                cost: costInput.value,
                sell: sellInput.value
            });
            
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
                console.log('Response:', responseData);
                
                if (response.ok) {
                    alert('Item added successfully!');
                    addItemForm.reset();
                    await loadItems();
                } else {
                    alert('Error: ' + (responseData.error || 'Failed to add item'));
                }
            } catch (error) {
                console.error('Error adding item:', error);
                alert('Error adding item: ' + error.message);
            }
        });
    }
    
    // Add sales form
    const addSalesForm = document.querySelector('#sales form');
    if (addSalesForm) {
        addSalesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const [customerNameInput] = addSalesForm.querySelectorAll('input');
            
            try {
                const response = await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: customerNameInput.value
                    })
                });
                
                if (response.ok) {
                    alert('Order created successfully!');
                    addSalesForm.reset();
                    await loadSales();
                }
            } catch (error) {
                console.error('Error creating order:', error);
                alert('Error creating order: ' + error.message);
            }
        });
    }
});
