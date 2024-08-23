document.addEventListener('DOMContentLoaded', function() {
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.displayCart = displayCart;
    window.updateCartCount = updateCartCount;
    window.clearCart = clearCart;

    async function getCart() {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Brak tokena. Proszę zalogować się ponownie.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('https://sklep2.onrender.com/api/cart', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error('Błąd podczas pobierania koszyka:', errorMessage);
                alert('Błąd podczas pobierania koszyka: ' + errorMessage);
                return [];
            }

            return await response.json();
        } catch (error) {
            console.error('Błąd sieci podczas pobierania koszyka:', error);
            alert('Wystąpił błąd podczas pobierania koszyka.');
            return [];
        }
    }

    async function addToCart(productName) {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Brak tokena. Proszę zalogować się ponownie.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('https://sklep2.onrender.com/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productName })
            });

            const result = await response.json();
            if (response.ok) {
                updateCartCount(result.cart);
                showNotification('Dodano do koszyka');
            } else {
                alert(result.message || 'Wystąpił problem z dodaniem produktu do koszyka.');
            }
        } catch (error) {
            console.error('Błąd podczas dodawania produktu do koszyka:', error);
            alert('Wystąpił błąd podczas dodawania produktu do koszyka.');
        }
    }

    async function removeFromCart(index) {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Brak tokena. Proszę zalogować się ponownie.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`https://sklep2.onrender.com/api/cart/${index}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                displayCart();
                updateCartCount([]);
            } else {
                alert('Nie udało się usunąć produktu z koszyka.');
            }
        } catch (error) {
            console.error('Błąd podczas usuwania produktu z koszyka:', error);
            alert('Wystąpił błąd podczas usuwania produktu z koszyka.');
        }
    }

    function updateCartCount(cart) {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById('cart-count');
        const floatingCartCountElement = document.getElementById('floating-cart-count');

        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
        if (floatingCartCountElement) {
            floatingCartCountElement.textContent = count;
        }

        checkCartVisibility();
    }

    async function displayCart() {
        const cart = await getCart();
        const cartItemsContainer = document.getElementById('cart-items');

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';

            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                cartItem.style.display = 'flex';
                cartItem.style.alignItems = 'center';

                let imageName = item.productName.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and');

                const productImage = document.createElement('img');
                productImage.src = `images/${imageName}.webp`;
                productImage.alt = item.productName;
                productImage.style.width = '50px';
                productImage.style.height = '50px';
                productImage.style.marginRight = '10px';

                const productInfo = document.createElement('p');
                productInfo.textContent = `${item.productName} - ilość: ${item.quantity}`;

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Usuń';
                removeButton.onclick = () => removeFromCart(index);

                cartItem.appendChild(productImage);
                cartItem.appendChild(productInfo);
                cartItem.appendChild(removeButton);
                cartItemsContainer.appendChild(cartItem);
            });

            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            const totalQuantityElement = document.getElementById('total-quantity');
            if (totalQuantityElement) {
                totalQuantityElement.textContent = totalQuantity;
            }
        }
    }

    async function clearCart() {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Brak tokena. Proszę zalogować się ponownie.');
            window.location.href = 'login.html';
            return;
        }

        try {
            await fetch('https://sklep2.onrender.com/api/cart', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            displayCart();
            updateCartCount([]);
        } catch (error) {
            console.error('Błąd podczas czyszczenia koszyka:', error);
            alert('Wystąpił błąd podczas czyszczenia koszyka.');
        }
    }

    function showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');

        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.style.display = 'flex';
            notification.style.opacity = '1';

            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 500);
            }, 3000);
        }
    }

    function checkCartVisibility() {
        const cartCountElement = document.getElementById('cart-count');
        const floatingCart = document.getElementById('floating-cart');

        if (!cartCountElement || !floatingCart) {
            return;
        }

        const rect = cartCountElement.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            floatingCart.style.display = 'block';
        } else {
            floatingCart.style.display = 'none';
        }
    }

    window.addEventListener('scroll', function() {
        checkCartVisibility();
    });

    async function fetchProducts() {
        try {
            const response = await fetch('https://sklep2.onrender.com/api/products');
            if (!response.ok) {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }

            const products = await response.json();
            displayProducts(products);
        } catch (error) {
            console.error('Błąd podczas pobierania produktów:', error);
            alert('Nie udało się pobrać produktów.');
        }
    }

    function displayProducts(products) {
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '';  // Wyczyść istniejącą zawartość

        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.classList.add('product');

            productElement.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <button onclick="addToCart('${product.name}')">Dodaj do koszyka</button>
            `;

            productGrid.appendChild(productElement);
        });
    }

    fetchProducts();  // Wywołaj funkcję do pobierania produktów na początku

    displayCart();
});
