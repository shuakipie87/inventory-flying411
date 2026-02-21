import './commands';

// Prevent Cypress from failing on uncaught exceptions
Cypress.on('uncaught:exception', () => false);

// Log API requests for debugging
Cypress.on('window:before:load', (win) => {
    cy.spy(win.console, 'error').as('consoleError');
});

beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
});
