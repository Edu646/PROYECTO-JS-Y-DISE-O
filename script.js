window.onload = function () {
    const inicioSection = document.querySelector('.inicio');
    const categoriasSection = document.querySelector('.categorias');
    const btnInicio = document.querySelector('#btn-inicio');
    const btnCategorias = document.querySelector('#btn-categorias');
    const btnCart = document.querySelector('#btn-cart'); // Botón para abrir el carrito
    const cartModal = document.querySelector('#cart-modal'); // Modal del carrito
    const closeCartModal = document.querySelector('.close-cart-modal'); // Cerrar modal
    const cartItemsContainer = document.querySelector('#cart-items'); // Contenedor de productos en el carrito
    const checkoutButton = document.querySelector('#checkout-btn'); // Botón de pagar

    const productContainer = document.querySelector('.products');
    const categoryForm = document.querySelector('#category-form');
    const categorySelect = document.querySelector('#category-select');
    const loadingSpinner = document.querySelector('#loading-spinner');

    const featuredCategoriesContainer = document.getElementById('featured-categories-container');


    let currentCategoryId = null;
    let currentProductCount = 10; // Cargar 10 productos inicialmente
    let isLoading = false;
    let selectedProduct = null; // Producto seleccionado para añadir a la cesta

    function loadFeaturedCategories() {
        fetch('https://api.escuelajs.co/api/v1/categories')
            .then(response => response.json())
            .then(categories => {
                const limitedCategories = categories.slice(0, 5); // Obtener las primeras 5 categorías
                featuredCategoriesContainer.innerHTML = '';

                limitedCategories.forEach(category => {
                    const categoryElement = document.createElement('div');
                    categoryElement.classList.add('category-path');
                    categoryElement.innerHTML = `
                        <img src="${category.image}" alt="${category.name}">
                        <h3>${category.name}</h3>
                    `;
                    featuredCategoriesContainer.appendChild(categoryElement);
                });
            })
            .catch(error => console.error('Error fetching featured categories:', error));
    }

    loadFeaturedCategories();


    // Crear modal dinámico para detalles de productos
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <div id="modal-details"></div>
            <button id="add-to-cart-btn">Añadir a la cesta</button>
        </div>
    `;
    document.body.appendChild(modal);

    const closeModal = modal.querySelector('.close-btn');
    const modalDetails = modal.querySelector('#modal-details');
    const addToCartBtn = modal.querySelector('#add-to-cart-btn');

    // Función para abrir el modal de detalles
    const openModal = (product, imageUrl) => {
        selectedProduct = product; // Guardar el producto seleccionado
        modalDetails.innerHTML = `
            <h2>${product.title}</h2>
            <p>${product.description}</p>
            <img src="${imageUrl}" alt="${product.title}" width="200">
            <p><strong>Precio:</strong> $${product.price}</p>
        `;
        modal.style.display = 'flex'; // Mostrar el modal centrado
    };

    const closeModalFunction = () => {
        modal.style.display = 'none'; // Ocultar modal
    };

    closeModal.addEventListener('click', closeModalFunction);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModalFunction();
        }
    });

    // Inicializar carrito desde localStorage
    const initializeCart = () => {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    };

    // Guardar carrito en localStorage
    const saveCart = (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    // Añadir producto al carrito
    const addToCart = (product) => {
        const cart = initializeCart();
        const existingProduct = cart.find((item) => item.id === product.id);

        if (existingProduct) {
            existingProduct.quantity += 1; // Incrementar cantidad si ya existe
        } else {
            cart.push({ ...product, quantity: 1 }); // Añadir nuevo producto
        }

        saveCart(cart); // Guardar el carrito actualizado
        console.log('Carrito actualizado:', cart);
    };

    // Evento para añadir producto al carrito
    addToCartBtn.addEventListener('click', () => {
        if (selectedProduct) {
            addToCart(selectedProduct); // Añadir producto al carrito
            modal.style.display = 'none';
            console.log(`Producto añadido al carrito: ${selectedProduct.title}`);
        }
    });

    // Mostrar productos en el modal del carrito
   // Modificación de la función updateCartModal para mostrar la imagen
   const updateCartModal = () => {
    const cart = initializeCart();
    cartItemsContainer.innerHTML = ''; // Limpiar contenido anterior

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
        return;
    }

    let totalPrice = 0; // Variable para calcular el precio total

    cart.forEach((item) => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.setAttribute('data-id', item.id); // Usamos un atributo para identificar el producto
        const itemTotalPrice = item.price * item.quantity; // Calcula el precio total del producto

        // Ejemplo: Condición para elegir el src
        const imageUrl1 = item.images !== "N/A" ? item.images[0] : "default.jpg";

        // Sumar al total general
        totalPrice += itemTotalPrice;

        cartItem.innerHTML = `
            <img src ="${imageUrl1}">
            <p>${item.title} x <span class="quantity-display">${item.quantity}</span></p>
            <p class="cart-item-price">Precio: $${itemTotalPrice.toFixed(2)}</p>
            <div class="cart-controls">
                <button class="decrease-quantity" data-id="${item.id}">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="increase-quantity" data-id="${item.id}">+</button>
            </div>
            <button class="remove-item" data-id="${item.id}">Eliminar</button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    // Mostrar precio total
    const totalPriceElement = document.createElement('div');
    totalPriceElement.classList.add('total-price');
    totalPriceElement.innerHTML = `
        <p><strong>Total:</strong> $${totalPrice.toFixed(2)}</p>
    `;
    cartItemsContainer.appendChild(totalPriceElement); // Añadir el total al final de la lista de productos

    // Eventos para modificar cantidades
    const decreaseButtons = document.querySelectorAll('.decrease-quantity');
    const increaseButtons = document.querySelectorAll('.increase-quantity');

    decreaseButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id, 10);
            modifyCartQuantity(productId, -1);
        });
    });

    increaseButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id, 10);
            modifyCartQuantity(productId, 1);
        });
    });

    // Eventos para eliminar productos del carrito
    const removeButtons = document.querySelectorAll('.remove-item');
    removeButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id, 10);
            removeFromCart(productId);
        });
    });
    };

    // Modificar cantidad de un producto en el carrito
    const modifyCartQuantity = (productId, amount) => {
        const cart = initializeCart();
        const product = cart.find((item) => item.id === productId);

        if (product) {
            product.quantity += amount;

            if (product.quantity <= 0) {
                removeFromCart(productId);
            } else {
                saveCart(cart);
                updateCartModal();
            }
        }
    };

    // Eliminar producto del carrito
    const removeFromCart = (productId) => {
        let cart = initializeCart();
        cart = cart.filter((item) => item.id !== productId);
        saveCart(cart); // Guardar carrito actualizado
        updateCartModal();
    };

    btnCart.addEventListener('click', () => {
        updateCartModal();
        cartModal.style.display = 'block'; // Mostrar modal
    });
    
    // Cerrar el modal
    closeCartModal.addEventListener('click', () => {
        cartModal.style.display = 'none'; // Ocultar modal
    });

    // Evento para pagar (simulación)
    checkoutButton.addEventListener('click', () => {
        localStorage.removeItem('cart'); // Limpiar carrito
        updateCartModal(); // Actualizar vista
    });

    // Mostrar la sección "inicio" al cargar la página
    inicioSection.classList.add('active');
    categoriasSection.classList.remove('active');

    // Evento para mostrar "categorías" y ocultar "inicio"
    btnCategorias.addEventListener('click', () => {
        inicioSection.classList.remove('active');
        categoriasSection.classList.add('active');
    });

    // Evento para mostrar "inicio" y ocultar "categorías"
    btnInicio.addEventListener('click', () => {
        categoriasSection.classList.remove('active');
        inicioSection.classList.add('active');
    });

    // Inicializar categorías
    fetchCategories();

    // Evento para mostrar productos al elegir una categoría y hacer clic en el botón
    categoryForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenir el envío del formulario
        const selectedCategoryId = categorySelect.value;

        if (selectedCategoryId !== currentCategoryId) {
            // Limpiar los productos anteriores
            productContainer.innerHTML = '';
            currentCategoryId = selectedCategoryId;
            currentProductCount = 10; // Reiniciar la cantidad de productos al cambiar de categoría
            fetchProductsByCategory(selectedCategoryId, currentProductCount);
        }
    });

    // Añadir botón "Cargar más" después del contenedor de productos
        const loadMoreButton = document.createElement('button');
         loadMoreButton.textContent = 'Cargar más';
        loadMoreButton.classList.add('load-more-btn');
        productContainer.insertAdjacentElement('afterend', loadMoreButton);

    // Función para cargar más productos al hacer clic en el botón
    loadMoreButton.addEventListener('click', () => {
    if (!currentCategoryId) {
        // Si no hay categoría seleccionada, cargar más productos globales
        fetchProductsByCategory(null, currentProductCount + 10);
    } else {
        // Si hay una categoría seleccionada, cargar más productos de esa categoría
        fetchProductsByCategory(currentCategoryId, currentProductCount + 10);
    }
    currentProductCount += 10; // Incrementar la cantidad de productos a mostrar
    });

    // Evento para detectar el scroll infinito
    window.addEventListener("scroll", () => {
        if (isLoading) return; // Prevenir múltiples llamadas simultáneas
        const nearBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100;

        if (nearBottom) {
            // Llamar a la función para cargar más productos
            fetchProductsByCategory(currentCategoryId, currentProductCount)
                .finally(() => {
                    isLoading = false; // Restablecer estado de carga después de completar
                });
        }
    });


   
    // Función para obtener categorías
    function fetchCategories() {
        fetch('https://api.escuelajs.co/api/v1/categories')
            .then((response) => response.json())
            .then((categories) => {
                const mainCategories = categories.filter((category) => category.id <= 6);
                displayCategories(mainCategories);
            })
            .catch((error) => console.error('Error fetching categories:', error));
    }

    // Función para mostrar categorías en el formulario
    function displayCategories(categories) {
        categorySelect.innerHTML = ''; // Limpiar las opciones anteriores
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecciona una categoría';
        categorySelect.appendChild(defaultOption);

        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    // Función para obtener productos por categoría
    function fetchProductsByCategory(categoryId, count) {
        if (!categoryId) {
            // Si no se ha seleccionado categoría, cargar productos sin filtro
            fetch(`https://api.escuelajs.co/api/v1/products`)
                .then((response) => response.json())
                .then((products) => {
                    displayProducts(products.slice(0, count));
                })
               
        } else {
            // Si hay una categoría seleccionada, cargar productos por categoría
            fetch(`https://api.escuelajs.co/api/v1/categories/${categoryId}/products`)
                .then((response) => response.json())
                .then((products) => {
                    displayProducts(products.slice(0, count));
                })
                .catch((error) => console.error('Error fetching products by category:', error));
        }
    }

    function showCategoryProducts(categoryId) {
        categoriasSection.classList.add('active');
        inicioSection.classList.remove('active');
        currentCategoryId = categoryId;
        currentProductCount = 10;
        fetchProductsByCategory(categoryId, currentProductCount);
    }

    // Función para mostrar los productos
    function displayProducts(products) {
        if (products.length === 0) {
            if (currentProductCount === 10) {
                productContainer.innerHTML = '<p>No hay productos disponibles.</p>';
            }
            return;
        }

        products.forEach((product) => {
            const productElement = document.createElement('article');
            productElement.classList.add('product-item');
            const imageUrl = product.images !== "N/A" ? product.images[0] : imgdef;
            productElement.innerHTML = `
                <h3>${product.title}</h3>
                <img src="${imageUrl}" alt="${product.title}" class="product-image" width="100">
                <p>${product.category.name}</p>
                <p><strong>Price:</strong> $${product.price}</p>
            `;
            productContainer.appendChild(productElement);

            // Evento para abrir modal al hacer clic en la imagen
            const productImage = productElement.querySelector('.product-image');
            productImage.addEventListener('click', () => {
                openModal(product, imageUrl);
            });
        });

        // Ocultar la rueda giratoria después de cargar los productos
        loadingSpinner.style.display = 'none';
        isLoading = false;
    }

    
};
