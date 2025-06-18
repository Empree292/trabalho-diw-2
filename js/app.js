// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app components
    initializeCarousel();
    loadCards();
    initializeMap();
    setupEventListeners();
});

// API functions
async function getItems() {
    const response = await fetch('http://localhost:3000/itens');
    return await response.json();
}

async function getFeaturedItems() {
    const response = await fetch('http://localhost:3000/itens?destaque=true');
    return await response.json();
}

async function getItemById(id) {
    const response = await fetch(`http://localhost:3000/itens/${id}`);
    return await response.json();
}

async function getFavorites(userId) {
    const response = await fetch(`http://localhost:3000/favoritos?userId=${userId}`);
    return await response.json();
}

async function addFavorite(userId, itemId) {
    const response = await fetch('http://localhost:3000/favoritos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: crypto.randomUUID(),
            userId,
            itemId
        })
    });
    return await response.json();
}

async function removeFavorite(favoriteId) {
    await fetch(`http://localhost:3000/favoritos/${favoriteId}`, {
        method: 'DELETE'
    });
}

// Carousel Management
async function initializeCarousel() {
    try {
        const featuredItems = await getFeaturedItems();
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
        const items = await getItems();
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
    }).addTo(map);    // Add markers for items with locations
    getItems().then(items => {
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
async function updateFavoriteIcons() {    if (!auth.isLoggedIn()) return;

    const favorites = await getFavorites(auth.currentUser.id);
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
        const favorites = await getFavorites(auth.currentUser.id);
        const existingFavorite = favorites.find(fav => fav.itemId === itemId);

        if (existingFavorite) {
            await removeFavorite(existingFavorite.id);
        } else {
            await addFavorite(auth.currentUser.id, itemId);
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
                const item = await getItemById(itemId);
                const modalContent = document.getElementById('itemDetailsContent');                modalContent.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <img src="${item.imagem}" class="img-fluid rounded" alt="${item.nome}">
                            <div class="image-gallery mt-3">
                                ${item.imagensAdicionais ? item.imagensAdicionais.map(img => 
                                    `<img src="${img}" alt="Imagem adicional de ${item.nome}" onclick="this.parentElement.previousElementSibling.src = this.src">`
                                ).join('') : ''}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between align-items-center">
                                <h3>${item.nome}</h3>
                                <div>
                                    <span class="rating-stars">
                                        ${'★'.repeat(Math.floor(item.avaliacao))}${item.avaliacao % 1 >= 0.5 ? '½' : ''}
                                    </span>
                                    <span class="rating-count">(${item.numeroAvaliacoes.toLocaleString()} avaliações)</span>
                                </div>
                            </div>
                            <p class="text-muted"><i class="fas fa-map-marker-alt me-2"></i>${item.endereco}</p>
                            <p>${item.descricao}</p>
                            
                            <div class="info-section">
                                <h5>Informações Principais</h5>
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><i class="far fa-clock me-2"></i> <strong>Horário:</strong> ${item.horarioFuncionamento}</p>
                                        <p><i class="fas fa-ticket-alt me-2"></i> <strong>Entrada:</strong> ${item.precoEntrada}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p><i class="fas fa-calendar-alt me-2"></i> <strong>Melhor época:</strong> ${item.melhorEpoca}</p>
                                        <p><i class="fas fa-temperature-high me-2"></i> <strong>Clima:</strong> ${item.clima}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="info-section">
                                <h5>Dicas para Visitantes</h5>
                                <ul class="list-unstyled">
                                    ${item.dicas ? item.dicas.map(dica => 
                                        `<li><i class="fas fa-check-circle me-2 text-success"></i>${dica}</li>`
                                    ).join('') : ''}
                                </ul>
                            </div>

                            <div class="info-section">
                                <h5>Infraestrutura</h5>
                                <div class="d-flex flex-wrap gap-3">
                                    ${item.infraestrutura ? item.infraestrutura.map(infra => 
                                        `<span class="badge bg-light text-dark p-2">
                                            <i class="fas fa-check me-1 text-success"></i>${infra}
                                        </span>`
                                    ).join('') : ''}
                                </div>
                            </div>

                            <div class="info-section">
                                <h5>Atrações</h5>
                                <div class="row">
                                    ${item.atracoes.map(atracao => 
                                        `<div class="col-md-6">
                                            <p><i class="fas fa-star me-2 text-warning"></i>${atracao}</p>
                                        </div>`
                                    ).join('')}
                                </div>
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
