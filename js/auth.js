// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadUserFromSession();
    }

    loadUserFromSession() {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUIForLoggedUser();
        }
    }

    async login(username, password) {
        try {
            const user = await db.getUserByLogin(username);
            
            if (!user || user.senha !== password) {
                throw new Error('Usuário ou senha inválidos');
            }

            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUIForLoggedUser();
            return true;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            // Check if user already exists
            const existingUser = await db.getUserByLogin(userData.login);
            if (existingUser) {
                throw new Error('Usuário já existe');
            }

            const user = await db.createUser(userData);
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUIForLoggedUser();
            return true;
        } catch (error) {
            console.error('Erro no registro:', error);
            throw error;
        }
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        this.updateUIForLoggedUser();
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser?.admin === true;
    }

    updateUIForLoggedUser() {
        const btnLogin = document.getElementById('btnLogin');
        const btnLogout = document.getElementById('btnLogout');
        const btnFavoritos = document.getElementById('btnFavoritos');
        const btnCadastroItem = document.getElementById('btnCadastroItem');

        if (this.isLoggedIn()) {
            btnLogin.style.display = 'none';
            btnLogout.style.display = 'block';
            btnFavoritos.style.display = 'block';
            
            if (this.isAdmin()) {
                btnCadastroItem.style.display = 'block';
            } else {
                btnCadastroItem.style.display = 'none';
            }
        } else {
            btnLogin.style.display = 'block';
            btnLogout.style.display = 'none';
            btnFavoritos.style.display = 'none';
            btnCadastroItem.style.display = 'none';
        }
    }
}

const auth = new AuthManager();
