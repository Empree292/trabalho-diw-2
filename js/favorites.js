const API_BASE_URL = 'https://trabalho-diw-2.onrender.com';

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
        const btnFavoritos = document.getElementById('btnFavoritos');

        btnLogin.style.display = 'none';
        btnLogout.style.display = 'block';
        btnFavoritos.style.display = 'block';
    };

    // Cache for item details
    const itemCache = new Map();

    // Carrega os detalhes de um item específico
    const loadItemDetails = async (itemId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/itens/${itemId}`);
            const item = await response.json();
            return item;
        } catch (error) {
            console.error('Erro ao carregar detalhes do item:', error);
            return null;
        }
    };

    // Cria um card para um item favorito
    const createFavoriteCard = (item) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.setAttribute('data-item-id', item.id);
        
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-img-wrapper position-relative">
                    <img src="${item.imagem}" class="card-img-top" alt="${item.nome}" 
                         style="height: 200px; object-fit: cover;">
                    <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle"
                            data-remove-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.nome}</h5>
                    <p class="text-muted small">
                        <i class="fas fa-map-marker-alt me-1"></i>${item.cidade} - ${item.estado}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <small class="text-muted">
                            <i class="far fa-clock me-1"></i>${item.horarioFuncionamento}
                        </small>
                        <div class="rating text-warning">
                            ${'★'.repeat(Math.floor(item.avaliacao))}${item.avaliacao % 1 >= 0.5 ? '½' : ''}
                            <small class="text-muted">(${item.numeroAvaliacoes})</small>
                        </div>
                    </div>
                    <hr>
                    <p class="card-text small">${item.descricao.substring(0, 100)}...</p>
                    <button class="btn btn-primary btn-sm w-100" data-details-id="${item.id}">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
        
        return col;
    };

    // Mostra os detalhes do item no modal
    const showItemDetails = (item) => {
        itemDetailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${item.imagem}" class="img-fluid rounded" alt="${item.nome}" 
                         style="width: 100%; height: 300px; object-fit: cover;">
                    ${(item.imagensAdicionais && item.imagensAdicionais.length > 0) ? `
                        <div class="image-gallery mt-3 d-flex gap-2 overflow-auto">
                            ${item.imagensAdicionais.map(img => `
                                <img src="${img}" alt="${item.nome}" 
                                     style="width: 80px; height: 60px; object-fit: cover; cursor: pointer;"
                                     onclick="document.querySelector('#itemDetailsContent .img-fluid').src = this.src">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="col-md-6">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3>${item.nome}</h3>
                        <div class="rating text-warning">
                            ${'★'.repeat(Math.floor(item.avaliacao || 0))}${item.avaliacao % 1 >= 0.5 ? '½' : ''}
                            <small class="text-muted">(${item.numeroAvaliacoes ? item.numeroAvaliacoes.toLocaleString() : 0})</small>
                        </div>
                    </div>
                    <p class="text-muted">
                        <i class="fas fa-map-marker-alt me-2"></i>${item.endereco}
                    </p>
                    <p>${item.descricao}</p>
                    <div class="info-section mt-4">
                        <h5>Informações</h5>
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="bg-light p-2 rounded">
                                    <i class="far fa-clock me-2"></i>
                                    <strong>Horário:</strong><br>
                                    ${item.horarioFuncionamento}
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-light p-2 rounded">
                                    <i class="fas fa-ticket-alt me-2"></i>
                                    <strong>Entrada:</strong><br>
                                    ${item.precoEntrada}
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-light p-2 rounded">
                                    <i class="fas fa-calendar-alt me-2"></i>
                                    <strong>Melhor época:</strong><br>
                                    ${item.melhorEpoca}
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-light p-2 rounded">
                                    <i class="fas fa-temperature-high me-2"></i>
                                    <strong>Clima:</strong><br>
                                    ${item.clima}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="info-section mt-4">
                        <h5>Dicas para Visitantes</h5>
                        <div class="row">
                            ${(item.dicas || []).map(dica => `
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
                            ${(item.infraestrutura || []).map(infra => `
                                <span class="badge bg-light text-dark p-2">
                                    <i class="fas fa-check text-success me-1"></i>${infra}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="info-section mt-4">
                        <h5>Atrações</h5>
                        <div class="row">
                            ${(item.atracoes || []).map(atracao => `
                                <div class="col-md-6 mb-2">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-star text-warning me-2"></i>
                                        <span>${atracao}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="mt-4 text-end">
                        <button class="btn btn-outline-danger" id="btnRemoveFavoriteModal" data-remove-id="${item.id}">
                            <i class="fas fa-heart-broken me-2"></i>Remover dos Favoritos
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    // Evento para remover favorito pelo modal
    itemDetailsContent.addEventListener('click', async (e) => {
        const btn = e.target.closest('#btnRemoveFavoriteModal');
        if (btn) {
            const itemId = btn.getAttribute('data-remove-id');
            await removeFavorite(itemId);
            // Fecha o modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('itemDetailsModal'));
            if (modal) modal.hide();
        }
    });

    // Remove um item dos favoritos
    const removeFavorite = async (itemId) => {
        const user = checkAuthentication();
        if (!user) return;

        let removed = false;
        try {
            // Obtém o usuário atualizado
            const userResponse = await fetch(`${API_BASE_URL}/usuarios/${user.id}`);
            const userData = await userResponse.json();

            // Remove o item dos favoritos (garantindo string)
            const updatedFavorites = (userData.favorites || []).map(String).filter(id => id !== String(itemId));

            // Atualiza os favoritos do usuário na API
            await fetch(`${API_BASE_URL}/usuarios/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ favorites: updatedFavorites })
            });

            // Remove o card do DOM com animação
            const card = document.querySelector(`[data-item-id="${itemId}"]`);
            if (card) {
                removed = true;
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    card.remove();
                    if (favoritesContainer.children.length === 0) {
                        emptyMessage.style.display = 'block';
                    }
                }, 300);
            }

            // Atualiza o usuário no sessionStorage
            const updatedUser = { ...user, favorites: updatedFavorites };
            sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

            // Mostra notificação
            const toast = new bootstrap.Toast(document.getElementById('favoriteToast'));
            document.getElementById('favoriteToastBody').textContent = 'Local removido dos favoritos!';
            toast.show();

            // Recarrega a lista para garantir sincronização
            await loadFavorites();

        } catch (error) {
            console.error('Erro ao remover favorito:', error);
            if (!removed) {
                alert('Erro ao remover favorito. Tente novamente.');
            } else {
                // Se já removeu visualmente, só loga o erro
                console.warn('Remoção visual feita, mas houve erro de sincronização:', error);
            }
        }
    };

    // Carrega todos os favoritos
    const loadFavorites = async () => {
        const user = checkAuthentication();
        if (!user) return;

        const loadingSpinner = document.getElementById('loadingSpinner');
        loadingSpinner.style.display = 'block';
        emptyMessage.style.display = 'none';

        try {
            // Obtém o usuário atualizado
            const userResponse = await fetch(`${API_BASE_URL}/usuarios/${user.id}`);
            const userData = await userResponse.json();
            
            // Carrega todos os itens para validar favoritos
            const itensResponse = await fetch(`${API_BASE_URL}/itens`);
            const allItens = await itensResponse.json();
            const validItemIds = new Set(allItens.map(i => String(i.id)));

            // Filtra favoritos inválidos
            const validFavorites = (userData.favorites || []).map(String).filter(id => validItemIds.has(id));

            // Se havia favoritos inválidos, atualiza backend e sessionStorage
            if (validFavorites.length !== (userData.favorites || []).length) {
                await fetch(`${API_BASE_URL}/usuarios/${user.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ favorites: validFavorites })
                });
                userData.favorites = validFavorites;
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
            }

            // Se não houver favoritos, mostra mensagem
            if (!validFavorites.length) {
                emptyMessage.style.display = 'block';
                favoritesContainer.innerHTML = '';
                loadingSpinner.style.display = 'none';
                return;
            }

            // Esconde mensagem de vazio
            emptyMessage.style.display = 'none';

            // Carrega os detalhes de cada lugar favorito
            const favoriteDetails = await Promise.all(
                validFavorites.map(id => loadItemDetails(id))
            );

            // Limpa o container e adiciona os cards
            favoritesContainer.innerHTML = '';
            let algumValido = false;
            favoriteDetails.forEach(item => {
                if (item) {
                    algumValido = true;
                    const card = createFavoriteCard(item);
                    favoritesContainer.appendChild(card);
                }
            });
            if (!algumValido) {
                emptyMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            alert('Erro ao carregar favoritos. Tente novamente.');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    // Inicializa
    updateUIBasedOnAuth();
    loadFavorites();

    // Event listeners
    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Delegated event listener for favorite removal
    favoritesContainer.addEventListener('click', (event) => {
        const removeBtn = event.target.closest('[data-remove-id]');
        if (removeBtn) {
            const itemId = removeBtn.getAttribute('data-remove-id'); // string
            removeFavorite(itemId);
        }
    });

    // Delegated event listener for showing item details
    favoritesContainer.addEventListener('click', (event) => {
        if (event.target.matches('[data-details-id]')) {
            const itemId = event.target.getAttribute('data-details-id'); // string
            loadItemDetails(itemId).then(item => {
                if (item) {
                    showItemDetails(item);
                    const modal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
                    modal.show();
                }
            });
        }
    });
});
