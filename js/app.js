// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app components
    initializeCarousel();
    loadCards();
    initializeMap();
    setupEventListeners();
});

// Carousel Management
async function initializeCarousel() {
    try {
        const featuredItems = await db.getFeaturedItems();
        const carouselInner = document.querySelector('.carousel-inner');
        
        featuredItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            div.innerHTML = `
                <img src="${item.imagem}" class="d-block w-100" alt="${item.nome}">
                <div class="carousel-caption">
                    <h5>${item.nome}</h5>
                    <p>${item.descricao}</p>
                </div>
            `;
            carouselInner.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao carregar itens em destaque:', error);
    }
}

// Cards Management
async function loadCards(searchTerm = '') {
    try {
        const items = await db.getItems();
        const filteredItems = searchTerm
            ? items.filter(item => 
                item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : items;

        const cardsContainer = document.getElementById('cardsContainer');
        cardsContainer.innerHTML = '';

        filteredItems.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';            col.innerHTML = `
                <div class="card h-100">
                    <div class="favorite-btn" data-item-id="${item.id}">
                        <i class="far fa-heart"></i>
                    </div>
                    <img src="${item.imagem}" class="card-img-top" alt="${item.nome}">
                    <div class="card-body">
                        <h5 class="card-title">${item.nome}</h5>
                        <p class="text-muted small mb-2"><i class="fas fa-map-marker-alt me-1"></i>${item.cidade} - ${item.estado}</p>
                        <p class="card-text small">${item.descricao.substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="small text-muted">
                                <i class="far fa-clock me-1"></i>${item.horarioFuncionamento}
                            </div>
                            <button class="btn btn-primary btn-sm view-details" data-item-id="${item.id}">
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(col);
        });

        // Update favorites if user is logged in
        if (auth.isLoggedIn()) {
            updateFavoriteIcons();
        }
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
    }
}

// Map Initialization
function initializeMap() {
    const map = L.map('mapContainer').setView([-19.9167, -43.9345], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers for items with locations
    db.getItems().then(items => {
        items.forEach(item => {
            if (item.latitude && item.longitude) {
                L.marker([item.latitude, item.longitude])
                    .bindPopup(`<b>${item.nome}</b><br>${item.descricao}`)
                    .addTo(map);
            }
        });
    });
}

// Favorites Management
async function updateFavoriteIcons() {
    if (!auth.isLoggedIn()) return;

    const favorites = await db.getFavorites(auth.currentUser.id);
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    favoriteButtons.forEach(btn => {
        const itemId = btn.dataset.itemId;
        const isFavorite = favorites.some(fav => fav.itemId === itemId);
        const icon = btn.querySelector('i');
        
        if (isFavorite) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });
}

async function toggleFavorite(itemId) {
    if (!auth.isLoggedIn()) {
        $('#loginModal').modal('show');
        return;
    }

    try {
        const favorites = await db.getFavorites(auth.currentUser.id);
        const existingFavorite = favorites.find(fav => fav.itemId === itemId);

        if (existingFavorite) {
            await db.removeFavorite(existingFavorite.id);
        } else {
            await db.addFavorite(auth.currentUser.id, itemId);
        }

        updateFavoriteIcons();
    } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
    }
}

// Event Listeners
function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await auth.login(
                document.getElementById('loginUsername').value,
                document.getElementById('loginPassword').value
            );
            $('#loginModal').modal('hide');
        } catch (error) {
            alert(error.message);
        }
    });

    // Register Form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await auth.register({
                nome: document.getElementById('registerName').value,
                login: document.getElementById('registerUsername').value,
                email: document.getElementById('registerEmail').value,
                senha: document.getElementById('registerPassword').value
            });
            $('#registerModal').modal('hide');
        } catch (error) {
            alert(error.message);
        }
    });

    // Logout Button
    document.getElementById('btnLogout').addEventListener('click', () => {
        auth.logout();
    });

    // Show Register Modal
    document.getElementById('btnShowRegister').addEventListener('click', () => {
        $('#loginModal').modal('hide');
        $('#registerModal').modal('show');
    });

    // Search
    document.getElementById('searchButton').addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value;
        loadCards(searchTerm);
    });

    // Favorite Buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn')) {
            const btn = e.target.closest('.favorite-btn');
            toggleFavorite(btn.dataset.itemId);
        }
    });

    // View Details Buttons
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-details')) {
            const itemId = e.target.dataset.itemId;
            try {
                const item = await db.getItemById(itemId);
                const modalContent = document.getElementById('itemDetailsContent');                modalContent.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <img src="${item.imagem}" class="img-fluid" alt="${item.nome}">
                        </div>
                        <div class="col-md-6">
                            <h3>${item.nome}</h3>
                            <p class="text-muted">${item.endereco}</p>
                            <p>${item.descricao}</p>
                            <div class="mt-4">
                                <h5>Informações</h5>
                                <ul class="list-unstyled">
                                    <li><i class="far fa-clock me-2"></i> <strong>Horário:</strong> ${item.horarioFuncionamento}</li>
                                    <li><i class="fas fa-ticket-alt me-2"></i> <strong>Entrada:</strong> ${item.precoEntrada}</li>
                                    <li><i class="fas fa-map-marker-alt me-2"></i> <strong>Cidade:</strong> ${item.cidade} - ${item.estado}</li>
                                </ul>
                            </div>
                            <div class="mt-4">
                                <h5>Atrações</h5>
                                <ul>
                                    ${item.atracoes.map(atracao => `<li>${atracao}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
                $('#itemDetailsModal').modal('show');
            } catch (error) {
                console.error('Erro ao carregar detalhes do item:', error);
            }
        }
    });
}
