describe('Authentication Flow', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    describe('Login Page', () => {
        it('should display login form', () => {
            cy.get('input[type="email"]').should('be.visible');
            cy.get('input[type="password"]').should('be.visible');
            cy.get('button[type="submit"]').should('contain', 'Login');
        });

        it('should show error for invalid credentials', () => {
            cy.get('input[type="email"]').type('invalid@email.com');
            cy.get('input[type="password"]').type('wrongpassword');
            cy.get('button[type="submit"]').click();

            cy.contains('Invalid credentials').should('be.visible');
        });

        it('should login successfully with valid credentials', () => {
            cy.get('input[type="email"]').type(Cypress.env('userEmail'));
            cy.get('input[type="password"]').type(Cypress.env('userPassword'));
            cy.get('button[type="submit"]').click();

            cy.url().should('include', '/dashboard');
            cy.contains('Dashboard').should('be.visible');
        });

        it('should redirect to dashboard if already logged in', () => {
            cy.login();
            cy.visit('/login');
            cy.url().should('include', '/dashboard');
        });
    });

    describe('Registration', () => {
        beforeEach(() => {
            cy.visit('/register');
        });

        it('should display registration form', () => {
            cy.get('input[name="email"]').should('be.visible');
            cy.get('input[name="username"]').should('be.visible');
            cy.get('input[name="password"]').should('be.visible');
        });

        it('should show validation errors for invalid input', () => {
            cy.get('input[name="email"]').type('notanemail');
            cy.get('input[name="username"]').type('ab'); // Too short
            cy.get('input[name="password"]').type('short');
            cy.get('button[type="submit"]').click();

            cy.contains('valid email').should('be.visible');
        });
    });

    describe('Logout', () => {
        beforeEach(() => {
            cy.login();
            cy.visit('/dashboard');
        });

        it('should logout successfully', () => {
            cy.contains('Logout').click();
            cy.url().should('include', '/login');
        });
    });

    describe('Protected Routes', () => {
        it('should redirect to login for unauthenticated users', () => {
            cy.visit('/dashboard');
            cy.url().should('include', '/login');
        });

        it('should allow access after login', () => {
            cy.login();
            cy.visit('/dashboard');
            cy.url().should('include', '/dashboard');
        });
    });
});
