document.addEventListener('DOMContentLoaded', () => {
    const cartItemsList = document.getElementById('cart-items-list');
    const subtotalElement = document.querySelector('.totals-row span:last-child');
    const totalElement = document.querySelector('.totals-row.total span:last-child');
    const checkoutButton = document.querySelector('.checkout-btn .btn');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmRemoveButton = document.getElementById('confirmRemove');
    const cancelRemoveButton = document.getElementById('cancelRemove');
    const loader = document.getElementById('loader');

    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    let itemToRemove = null;

    // Currency formatter for Indian Rupees
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    });

    // Fetch cart data
    async function fetchCartData() {
        loader.style.display = 'block';
        try {
            const response = await fetch('https://cdn.shopify.com/s/files/1/0883/2188/4479/files/apiCartData.json?v=1728384889');
            if (!response.ok) {
                throw new Error('Failed to fetch cart data');
            }
            const data = await response.json();

            // Transform API data to match the expected format
            cartItems = data.items.map((item) => ({
                id: item.id,
                name: item.title,
                price: item.presentment_price / 100,
                quantity: item.quantity,
                image: item.image,
            }));

            localStorage.setItem('cart', JSON.stringify(cartItems));
            renderCartItems();
        } catch (error) {
            console.error('Error fetching cart data:', error);
        } finally {
            loader.style.display = 'none';
        }
    }

    // Render cart items
    function renderCartItems() {
        cartItemsList.innerHTML = '';
        let subtotal = 0;

        cartItems.forEach((item) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="product-col">
                <img src="${item.image}" alt="${item.name}" class="product-image">
                <span>${item.name}</span>
                </div>
                <div>${formatter.format(item.price)}</div>
                <div class="quantity">
                    <input type="number" min="1" value="${item.quantity}" data-id="${item.id}" class="quantity-input">
                </div>
                <div class="subtotal-col">
                    <span>${formatter.format(itemTotal)}</span>
                    <button class="remove-btn" id="delete-btn" data-id="${item.id}">
                      <svg class="remove-btn" data-id="${item.id} width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path d="M16 6v-.8c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C14.48 2 13.92 2 12.8 2h-1.6c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C8 3.52 8 4.08 8 5.2V6m2 5.5v5m4-5v5M3 6h18m-2 0v11.2c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C16.72 22 15.88 22 14.2 22H9.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C5 19.72 5 18.88 5 17.2V6"/>
                      </svg>
                    </button>
                </div> 
            `;
            cartItemsList.appendChild(itemElement);
        });

        subtotalElement.textContent = formatter.format(subtotal);
        totalElement.textContent = formatter.format(subtotal);
    }

    // Update quantity
    function updateQuantity(itemId, newQuantity) {
        const item = cartItems.find((item) => item.id === itemId);
        if (item) {
            item.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cartItems));
            renderCartItems();
        }
    }

    // Remove item
    function removeItem(itemId) {
        cartItems = cartItems.filter((item) => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(cartItems));
        renderCartItems();
    }

    // Show confirmation modal
    function showConfirmationModal(itemId) {
        itemToRemove = itemId;
        confirmationModal.style.display = 'block';
    }

    // Hide confirmation modal
    function hideConfirmationModal() {
        confirmationModal.style.display = 'none';
        itemToRemove = null;
    }

    // CheckOut Logic
    function processCheckout() {
        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add items before checking out.');
            return;
        }

        // Collect order details
        const orderDetails = {
            items: cartItems,
            subtotal: parseFloat(subtotalElement.textContent.replace(/[^0-9.-]+/g, '')),
            total: parseFloat(totalElement.textContent.replace(/[^0-9.-]+/g, '')),
            timestamp: new Date().toISOString()
        };

        try {
            loader.style.display = 'block';
            setTimeout(() => {
                cartItems = [];
                localStorage.removeItem('cart');
                alert('Thank you for your purchase! Order processed successfully.');
                renderCartItems();
                loader.style.display = 'none';
            }, 2000);
        } catch (error) {
            console.error('Checkout error:', error);
            alert('An error occurred during checkout. Please try again.');
            loader.style.display = 'none';
        }
    }

    checkoutButton.addEventListener('click', processCheckout);
    cartItemsList.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const itemId = parseInt(e.target.dataset.id);
            const newQuantity = parseInt(e.target.value);
            updateQuantity(itemId, newQuantity);
        }
    });

    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const itemId = parseInt(e.target.dataset.id);
            showConfirmationModal(itemId);
        }
    });

    confirmRemoveButton.addEventListener('click', () => {
        if (itemToRemove) {
            removeItem(itemToRemove);
            hideConfirmationModal();
        }
    });

    cancelRemoveButton.addEventListener('click', hideConfirmationModal);

    checkoutButton.addEventListener('click', () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add items before checking out.');
        } else {
            alert('Proceeding to checkout...');
            processCheckout();
        }
    });

    fetchCartData();
});