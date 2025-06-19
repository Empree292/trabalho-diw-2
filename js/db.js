// Database Configuration and API Endpoints
// Todas as requisições agora usam a URL do backend Render
const API_BASE_URL = 'https://trabalho-diw-2.onrender.com';

const db = {
    async getUsers() {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        return await response.json();
    },

    async getUserByLogin(login) {
        const response = await fetch(`${API_BASE_URL}/usuarios?login=${login}`);
        const users = await response.json();
        return users[0];
    },

    async createUser(userData) {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...userData,
                id: crypto.randomUUID(),
                admin: false
            })
        });
        return await response.json();
    },

    async getItems() {
        const response = await fetch(`${API_BASE_URL}/itens`);
        return await response.json();
    },

    async getFeaturedItems() {
        const response = await fetch(`${API_BASE_URL}/itens?destaque=true`);
        return await response.json();
    },

    async getItemById(id) {
        const response = await fetch(`${API_BASE_URL}/itens/${id}`);
        return await response.json();
    },

    async createItem(itemData) {
        const response = await fetch(`${API_BASE_URL}/itens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...itemData,
                id: crypto.randomUUID()
            })
        });
        return await response.json();
    },

    async updateItem(id, itemData) {
        const response = await fetch(`${API_BASE_URL}/itens/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });
        return await response.json();
    },

    async deleteItem(id) {
        await fetch(`${API_BASE_URL}/itens/${id}`, {
            method: 'DELETE'
        });
    },

    async getFavorites(userId) {
        const response = await fetch(`${API_BASE_URL}/favoritos?userId=${userId}`);
        return await response.json();
    },

    async addFavorite(userId, itemId) {
        const response = await fetch(`${API_BASE_URL}/favoritos`, {
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
    },

    async removeFavorite(favoriteId) {
        await fetch(`${API_BASE_URL}/favoritos/${favoriteId}`, {
            method: 'DELETE'
        });
    }
};

// Exemplo de uso:
// fetch(`${API_BASE_URL}/itens`)
// fetch(`${API_BASE_URL}/usuarios/${userId}`)
