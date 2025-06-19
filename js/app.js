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
    const response = await fetch(`${API_BASE_URL}/itens`);
    return await response.json();
}

async function getFeaturedItems() {
    const response = await fetch(`${API_BASE_URL}/itens?destaque=true`);
    return await response.json();
}

async function getItemById(id) {
    const response = await fetch(`${API_BASE_URL}/itens/${id}`);
    return await response.json();
}

async function getUserFavorites(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`);
        const user = await response.json();
        return user.favorites || [];
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        return [];
    }
}

async function toggleFavoriteForUser(userId, itemId) {
    try {
        // Get current user data
        const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`);
        const user = await response.json();
        
        // Get current favorites
        const favorites = user.favorites || [];
        
        // Toggle favorite
        const index = favorites.indexOf(itemId);
        if (index === -1) {
            favorites.push(itemId);
        } else {
            favorites.splice(index, 1);
        }
        
        // Update user favorites in API
        await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                favorites: favorites
            })
        });

        // Update user in sessionStorage
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        currentUser.favorites = favorites;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

        return favorites;
    } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
        throw error;
    }
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
async function updateFavoriteIcons() {
    if (!auth.isLoggedIn()) {
        // Se não estiver logado, garante que todos os ícones estão no estado padrão
        document.querySelectorAll('.favorite-btn i').forEach(icon => {
            icon.className = 'far fa-heart';
            icon.style.color = '#000000';
        });
        return;
    }

    const user = auth.currentUser;
    const favorites = user.favorites || [];  // Usa os favoritos do sessionStorage
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    favoriteButtons.forEach(btn => {
        const itemId = btn.dataset.itemId;
        const isFavorite = favorites.includes(itemId);
        const icon = btn.querySelector('i');
        
        if (isFavorite) {
            icon.className = 'fas fa-heart';
            icon.style.color = '#ff0000';
        } else {
            icon.className = 'far fa-heart';
            icon.style.color = '#000000';
        }

        // Garante que o botão está clicável
        btn.style.pointerEvents = 'auto';
    });
}

async function toggleFavorite(itemId, button) {
    if (!auth.isLoggedIn()) {
        $('#loginModal').modal('show');
        return;
    }

    const icon = button.querySelector('i');
    const originalIcon = icon.className;
    const originalColor = icon.style.color;

    try {
        // Show loading state
        icon.className = 'fas fa-spinner fa-spin';
        button.style.pointerEvents = 'none';

        const favorites = await toggleFavoriteForUser(auth.currentUser.id, itemId);
        const isFavorite = favorites.includes(itemId);
        
        // Atualiza o ícone específico do botão
        icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        icon.style.color = isFavorite ? '#ff0000' : '#000000';
        
        // Show a toast notification
        const toast = new bootstrap.Toast(document.getElementById('favoriteToast'));
        const toastBody = document.getElementById('favoriteToastBody');
        
        toastBody.textContent = isFavorite 
            ? 'Local adicionado aos favoritos!'
            : 'Local removido dos favoritos!';
            
        toast.show();    } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
        
        // Revert icon to original state
        icon.className = originalIcon;
        icon.style.color = originalColor;
        button.style.pointerEvents = 'auto';

        // Show error toast instead of alert
        const toast = new bootstrap.Toast(document.getElementById('favoriteToast'));
        const toastBody = document.getElementById('favoriteToastBody');
        toastBody.textContent = 'Erro ao atualizar favoritos. Tente novamente.';
        toast.show();
    }
}

// Função global para mostrar detalhes do item (tolerante a campos ausentes)
window.showItemDetails = function(item) {
    const itemDetailsContent = document.getElementById('itemDetailsContent');
    if (!itemDetailsContent) return;
    itemDetailsContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${item.imagem || ''}" class="img-fluid rounded" alt="${item.nome || ''}" 
                     style="width: 100%; height: 300px; object-fit: cover;">
                ${(Array.isArray(item.imagensAdicionais) && item.imagensAdicionais.length > 0) ? `
                    <div class="image-gallery mt-3 d-flex gap-2 overflow-auto">
                        ${(item.imagensAdicionais || []).map(img => `
                            <img src="${img}" alt="${item.nome || ''}" 
                                 style="width: 80px; height: 60px; object-fit: cover; cursor: pointer;"
                                 onclick="document.querySelector('#itemDetailsContent .img-fluid').src = this.src">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="col-md-6">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3>${item.nome || ''}</h3>
                    <div class="rating text-warning">
                        ${'★'.repeat(Math.floor(item.avaliacao || 0))}${(item.avaliacao && item.avaliacao % 1 >= 0.5) ? '½' : ''}
                        <small class="text-muted">(${typeof item.numeroAvaliacoes === 'number' ? item.numeroAvaliacoes.toLocaleString() : '0'})</small>
                    </div>
                </div>
                <p class="text-muted">
                    <i class="fas fa-map-marker-alt me-2"></i>${item.endereco || ''}
                </p>
                <p>${item.descricao || ''}</p>
                <div class="info-section mt-4">
                    <h5>Informações</h5>
                    <div class="row g-3">
                        <div class="col-6">
                            <div class="bg-light p-2 rounded">
                                <i class="far fa-clock me-2"></i>
                                <strong>Horário:</strong><br>
                                ${item.horarioFuncionamento || ''}
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="bg-light p-2 rounded">
                                <i class="fas fa-ticket-alt me-2"></i>
                                <strong>Entrada:</strong><br>
                                ${item.precoEntrada || ''}
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="bg-light p-2 rounded">
                                <i class="fas fa-calendar-alt me-2"></i>
                                <strong>Melhor época:</strong><br>
                                ${item.melhorEpoca || ''}
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="bg-light p-2 rounded">
                                <i class="fas fa-temperature-high me-2"></i>
                                <strong>Clima:</strong><br>
                                ${item.clima || ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="info-section mt-4">
                    <h5>Dicas para Visitantes</h5>
                    <div class="row">
                        ${(Array.isArray(item.dicas) ? item.dicas : []).map(dica => `
                            <div class="col-12 mb-2">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-check-circle text-success me-2"></i>
                                    <span>${dica}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="info-section mt-4">
                    <h5>Infraestrutura</h5>
                    <div class="d-flex flex-wrap gap-2">
                        ${(Array.isArray(item.infraestrutura) ? item.infraestrutura : []).map(infra => `
                            <span class="badge bg-light text-dark p-2">
                                <i class="fas fa-check text-success me-1"></i>${infra}
                            </span>
                        `).join('')}
                    </div>
                </div>
                <div class="info-section mt-4">
                    <h5>Atrações</h5>
                    <div class="row">
                        ${(Array.isArray(item.atracoes) ? item.atracoes : []).map(atracao => `
                            <div class="col-md-6 mb-2">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-star text-warning me-2"></i>
                                    <span>${atracao}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};

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
            updateFavoriteIcons(); // Atualiza os ícones após login
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
                senha: document.getElementById('registerPassword').value,
                favorites: [] // Inicializa array de favoritos
            });
            $('#registerModal').modal('hide');
        } catch (error) {
            alert(error.message);
        }
    });

    // Logout Button
    document.getElementById('btnLogout').addEventListener('click', () => {
        auth.logout();
        updateFavoriteIcons(); // Atualiza os ícones após logout
    });

    // Show Register Modal
    document.getElementById('btnShowRegister').addEventListener('click', () => {
        $('#loginModal').modal('hide');
        $('#registerModal').modal('show');
    });

    // Favoritos Button
    document.getElementById('btnFavoritos').addEventListener('click', (e) => {
        e.preventDefault();
        if (!auth.isLoggedIn()) {
            $('#loginModal').modal('show');
            return;
        }
        window.location.href = 'favorites.html';
    });

    // Search
    document.getElementById('searchButton').addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value;
        loadCards(searchTerm);
    });

    // Favorite Buttons
    document.addEventListener('click', async (e) => {
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (favoriteBtn) {
            e.preventDefault();
            e.stopPropagation();
            await toggleFavorite(favoriteBtn.dataset.itemId, favoriteBtn);
        }
    });

    // View Details Buttons
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-details')) {
            const itemId = e.target.dataset.itemId;
            try {
                const item = await getItemById(itemId);
                if (!item || !item.id) {
                    alert('Item não encontrado ou dados incompletos. ID: ' + itemId);
                    console.error('Item retornado por getItemById:', item);
                    return;
                }
                showItemDetails(item);
                const modal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
                modal.show();
            } catch (error) {
                console.error('Erro ao carregar detalhes do item:', error);
                alert('Erro ao carregar detalhes. Tente novamente.');
            }
        }
    });
}

