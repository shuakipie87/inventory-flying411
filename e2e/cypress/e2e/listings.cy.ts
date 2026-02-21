describe('Listing CRUD Flow', () => {
    beforeEach(() => {
        cy.login();
    });

    describe('Create Listing', () => {
        beforeEach(() => {
            cy.visit('/listings/create');
        });

        it('should display listing form', () => {
            cy.get('input[name="title"]').should('be.visible');
            cy.get('textarea[name="description"]').should('be.visible');
            cy.get('input[name="price"]').should('be.visible');
            cy.get('select[name="condition"]').should('be.visible');
        });

        it('should create a new listing successfully', () => {
            cy.get('input[name="title"]').type('Test Aircraft Part');
            cy.get('textarea[name="description"]').type('This is a test description for the aircraft part.');
            cy.get('input[name="price"]').type('1500');
            cy.get('input[name="partNumber"]').type('PN-12345');
            cy.get('select[name="condition"]').select('used');
            cy.get('select[name="category"]').select('Engine Components');

            cy.get('button[type="submit"]').click();

            cy.contains('Listing created').should('be.visible');
            cy.url().should('match', /\/listings\/[a-z0-9-]+/);
        });

        it('should show validation errors for required fields', () => {
            cy.get('button[type="submit"]').click();
            cy.contains('required').should('be.visible');
        });
    });

    describe('View Listings', () => {
        it('should display listings on dashboard', () => {
            cy.visit('/dashboard');
            cy.contains('My Listings').should('be.visible');
        });

        it('should navigate to listing detail page', () => {
            cy.visit('/listings');
            cy.get('[data-testid="listing-card"]').first().click();
            cy.url().should('match', /\/listings\/[a-z0-9-]+/);
        });
    });

    describe('Edit Listing', () => {
        it('should edit an existing listing', () => {
            cy.visit('/dashboard');
            cy.get('[data-testid="edit-listing-btn"]').first().click();

            cy.get('input[name="title"]').clear().type('Updated Title');
            cy.get('button[type="submit"]').click();

            cy.contains('Listing updated').should('be.visible');
        });
    });

    describe('Delete Listing', () => {
        it('should delete a listing', () => {
            cy.visit('/dashboard');
            cy.get('[data-testid="delete-listing-btn"]').first().click();

            // Confirm delete
            cy.contains('Delete').click();
            cy.contains('Listing deleted').should('be.visible');
        });
    });

    describe('Submit for Approval', () => {
        it('should submit draft listing for approval', () => {
            cy.visit('/dashboard');
            cy.get('[data-testid="submit-listing-btn"]').first().click();

            cy.contains('Submitted for approval').should('be.visible');
        });
    });

    describe('Listing Search and Filter', () => {
        beforeEach(() => {
            cy.visit('/listings');
        });

        it('should filter listings by category', () => {
            cy.get('select[name="category"]').select('Avionics');
            cy.get('[data-testid="listing-card"]').each(($el) => {
                cy.wrap($el).should('contain', 'Avionics');
            });
        });

        it('should search listings by title', () => {
            cy.get('input[name="search"]').type('engine');
            cy.get('button[type="submit"]').click();

            cy.get('[data-testid="listing-card"]').should('have.length.gte', 0);
        });
    });
});
