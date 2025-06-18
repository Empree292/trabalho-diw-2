// Aguarda o DOM ser carregado
document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const favoritesContainer = document.getElementById('favoritesContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const itemDetailsContent = document.getElementById('itemDetailsContent');

    // Verifica se o usuário está logado
    const checkAuthentication = () => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        return user;
    };

    // Atualiza o estado dos botões baseado no login
    const updateUIBasedOnAuth = () => {
        const user = checkAuthentication();
        if (!user) return;

        const btnLogin = document.getElementById('btnLogin');
        const btnLogout = document.getElementById('btnLogout');
        const btnCadastroItem = document.getElementById('btnCadastroItem');
        const btnFavoritos = document.getElementById('btnFavoritos');

        btnLogin.style.display = 'none';
        btnLogout.style.display = 'block';
        btnFavoritos.style.display = 'block';
        btnCadastroItem.style.display = user.isAdmin ? 'block' : 'none';
    };

    // Carrega os detalhes de um item específico
    const loadItemDetails = async (itemId) => {
        try {
            const response = await fetch(`http://localhost:3000/places/${itemId}`);
            const item = await response.json();
            return item;
        } catch (error) {
            console.error('Erro ao carregar detalhes do item:', error);
            return null;
        }
    };

    // Mostra os detalhes do item no modal
    const showItemDetails = (item) => {
        itemDetailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${item.images[0]}" class="img-fluid rounded" alt="${item.name}">
                </div>
                <div class="col-md-6">
                    <h4>${item.name}</h4>
                    <p class="text-muted">${item.location}</p>
                    <p>${item.description}</p>
                    <div class="info-section">
                        <h5>Horário de Funcionamento</h5>
                        <p>${item.schedule}</p>
                        <h5>Preço</h5>
                        <p>${item.price}</p>
                        <h5>Infraestrutura</h5>
                        <p>${item.infrastructure.join(', ')}</p>
                        <h5>Atrações</h5>
                        <p>${item.attractions.join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
    };

    // Remove um item dos favoritos
    const removeFavorite = async (itemId) => {
        const user = checkAuthentication();
        if (!user) return;

        try {
            // Obtém o usuário atualizado
            const userResponse = await fetch(`http://localhost:3000/users/${user.id}`);
            const userData = await userResponse.json();

            // Remove o item dos favoritos
            const updatedFavorites = userData.favorites.filter(id => id !== itemId);

            // Atualiza os favoritos do usuário na API
            await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ favorites: updatedFavorites })
            });

            // Remove o card do DOM
            const card = document.querySelector(`[data-item-id="${itemId}"]`);
            card.remove();

            // Verifica se ainda existem favoritos
            if (favoritesContainer.children.length === 0) {
                emptyMessage.style.display = 'block';
            }

            // Atualiza o usuário no sessionStorage
            const updatedUser = { ...user, favorites: updatedFavorites };
            sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

        } catch (error) {
            console.error('Erro ao remover favorito:', error);
            alert('Erro ao remover favorito. Tente novamente.');
        }
    };

    // Cria um card para um item favorito
    const createFavoriteCard = (item) => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.setAttribute('data-item-id', item.id);
        
        card.innerHTML = `
            <div class="card h-100">
                <img src="${item.images[0]}" class="card-img-top" alt="${item.name}" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text text-muted">${item.location}</p>
                    <p class="card-text">${item.description.substring(0, 100)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-outline-primary btn-details" data-id="${item.id}">
                            Ver Detalhes
                        </button>
                        <button class="btn btn-outline-danger btn-remove" data-id="${item.id}">
                            <i class="fas fa-heart-broken"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return card;
    };

    // Carrega todos os favoritos do usuário
    const loadFavorites = async () => {
        const user = checkAuthentication();
        if (!user) return;

        try {
            // Obtém o usuário atualizado
            const userResponse = await fetch(`http://localhost:3000/users/${user.id}`);
            const userData = await userResponse.json();

            if (!userData.favorites || userData.favorites.length === 0) {
                emptyMessage.style.display = 'block';
                return;
            }

            // Carrega os detalhes de cada lugar favorito
            const favorites = await Promise.all(
                userData.favorites.map(id => loadItemDetails(id))
            );

            // Limpa o container e adiciona os cards
            favoritesContainer.innerHTML = '';
            favorites.forEach(item => {
                if (item) {
                    const card = createFavoriteCard(item);
                    favoritesContainer.appendChild(card);
                }
            });

        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            alert('Erro ao carregar favoritos. Tente novamente.');
        }
    };

    // Event Listeners
    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    favoritesContainer.addEventListener('click', async (e) => {
        const itemId = e.target.closest('[data-id]')?.dataset.id;
        if (!itemId) return;

        if (e.target.closest('.btn-details')) {
            const item = await loadItemDetails(itemId);
            if (item) {
                showItemDetails(item);
                new bootstrap.Modal(document.getElementById('itemDetailsModal')).show();
            }
        } else if (e.target.closest('.btn-remove')) {
            if (confirm('Tem certeza que deseja remover este lugar dos favoritos?')) {
                await removeFavorite(itemId);
            }
        }
    });

    // Inicialização
    updateUIBasedOnAuth();
    loadFavorites();
});
