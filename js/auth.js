// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadUserFromSession();
        this.setupEventListeners();
    }

    loadUserFromSession() {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUIForLoggedUser();
        }
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const username = document.getElementById('loginUsername').value;
                    const password = document.getElementById('loginPassword').value;
                    await this.login(username, password);
                    const loginModal = document.getElementById('loginModal');
                    const bootstrapModal = bootstrap.Modal.getInstance(loginModal);
                    if (bootstrapModal) {
                        bootstrapModal.hide();
                    }
                } catch (error) {
                    this.showError('Login falhou: ' + error.message);
                }
            });
        }

        // Register form submission
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const userData = {
                        nome: document.getElementById('registerName').value,
                        login: document.getElementById('registerUsername').value,
                        email: document.getElementById('registerEmail').value,
                        senha: document.getElementById('registerPassword').value
                    };
                    await this.register(userData);
                    const registerModal = document.getElementById('registerModal');
                    const bootstrapModal = bootstrap.Modal.getInstance(registerModal);
                    if (bootstrapModal) {
                        bootstrapModal.hide();
                    }
                } catch (error) {
                    this.showError('Registro falhou: ' + error.message);
                }
            });
        }

        // Logout button click
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                this.logout();
                window.location.reload();
            });
        }

        // Show register modal button
        const btnShowRegister = document.getElementById('btnShowRegister');
        if (btnShowRegister) {
            btnShowRegister.addEventListener('click', () => {
                const loginModal = document.getElementById('loginModal');
                const registerModal = document.getElementById('registerModal');
                const loginBootstrapModal = bootstrap.Modal.getInstance(loginModal);
                if (loginBootstrapModal) {
                    loginBootstrapModal.hide();
                }
                const registerBootstrapModal = new bootstrap.Modal(registerModal);
                registerBootstrapModal.show();
            });
        }

        // Login button click
        const btnLogin = document.getElementById('btnLogin');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            });
        }
    }

    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const form = document.querySelector('.modal.show form');
        if (form) {
            form.insertBefore(alertDiv, form.firstChild);
        }
    }    async login(username, password) {
        try {
            const response = await fetch(`/usuarios?login=${username}`);
            const users = await response.json();
            const user = users[0];
            
            if (!user || user.senha !== password) {
                throw new Error('Usuário ou senha inválidos');
            }

            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUIForLoggedUser();
            
            // Mostrar mensagem de boas-vindas
            const toast = new bootstrap.Toast(document.getElementById('welcomeToast'));
            document.getElementById('welcomeMessage').textContent = `Bem-vindo(a), ${user.nome}!`;
            toast.show();
            
            return true;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            // Check if user already exists
            const response = await fetch(`/usuarios?login=${userData.login}`);
            const existingUsers = await response.json();
            
            if (existingUsers.length > 0) {
                throw new Error('Usuário já existe');
            }

            // Create new user
            const newUser = {
                ...userData,
                id: crypto.randomUUID(),
                admin: false,
                favorites: []  // Initialize empty favorites array
            };

            const createResponse = await fetch('/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser)
            });

            const user = await createResponse.json();
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.updateUIForLoggedUser();

            // Mostrar mensagem de boas-vindas
            const toast = new bootstrap.Toast(document.getElementById('welcomeToast'));
            document.getElementById('welcomeMessage').textContent = `Conta criada com sucesso! Bem-vindo(a), ${user.nome}!`;
            toast.show();

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
        const btnCadastroItem = document.getElementById('btnCadastroItem');
        const btnFavoritos = document.getElementById('btnFavoritos');

        if (this.currentUser) {
            if (btnLogin) btnLogin.style.display = 'none';
            if (btnLogout) {
                btnLogout.style.display = 'block';
                btnLogout.addEventListener('click', () => this.logout());
            }
            if (btnFavoritos) btnFavoritos.style.display = 'block';
            if (btnCadastroItem && this.currentUser.admin) {
                btnCadastroItem.style.display = 'block';
            }
        } else {
            if (btnLogin) btnLogin.style.display = 'block';
            if (btnLogout) btnLogout.style.display = 'none';
            if (btnFavoritos) btnFavoritos.style.display = 'none';
            if (btnCadastroItem) btnCadastroItem.style.display = 'none';
        }
    }
}

// Initialize the auth manager
window.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
});
