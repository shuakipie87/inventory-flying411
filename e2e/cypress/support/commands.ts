/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        /**
         * Custom command to login via API
         */
        login(email?: string, password?: string): Chainable<void>;

        /**
         * Custom command to login as admin
         */
        loginAsAdmin(): Chainable<void>;

        /**
         * Custom command to logout
         */
        logout(): Chainable<void>;

        /**
         * Custom command to get by data-testid
         */
        getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
    }
}

// Login command
Cypress.Commands.add('login', (email?: string, password?: string) => {
    const userEmail = email || Cypress.env('userEmail');
    const userPassword = password || Cypress.env('userPassword');

    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { email: userEmail, password: userPassword },
    }).then((response) => {
        expect(response.status).to.eq(200);
        // Cookie is set automatically via httpOnly
    });
});

// Login as admin
Cypress.Commands.add('loginAsAdmin', () => {
    cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
});

// Logout command
Cypress.Commands.add('logout', () => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/logout`,
        failOnStatusCode: false,
    });
    cy.clearCookies();
});

// Get by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
    return cy.get(`[data-testid="${testId}"]`);
});
