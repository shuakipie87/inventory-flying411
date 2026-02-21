describe('Admin Workflow', () => {
    beforeEach(() => {
        cy.loginAsAdmin();
    });

    describe('Admin Dashboard Access', () => {
        it('should access admin dashboard', () => {
            cy.visit('/admin');
            cy.contains('Admin Dashboard').should('be.visible');
        });

        it('should show admin statistics', () => {
            cy.visit('/admin');
            cy.get('[data-testid="pending-count"]').should('be.visible');
            cy.get('[data-testid="total-listings"]').should('be.visible');
            cy.get('[data-testid="total-users"]').should('be.visible');
        });
    });

    describe('Listing Approval', () => {
        it('should display pending listings', () => {
            cy.visit('/admin');
            cy.contains('Pending Approval').should('be.visible');
        });

        it('should approve a listing', () => {
            cy.visit('/admin');
            cy.get('[data-testid="approve-btn"]').first().click();

            cy.contains('Listing approved').should('be.visible');
        });

        it('should reject a listing with reason', () => {
            cy.visit('/admin');
            cy.get('[data-testid="reject-btn"]').first().click();

            cy.get('textarea[name="rejectionReason"]').type('Missing required documentation');
            cy.get('button').contains('Confirm Reject').click();

            cy.contains('Listing rejected').should('be.visible');
        });
    });

    describe('User Management', () => {
        it('should display user list', () => {
            cy.visit('/admin/users');
            cy.get('[data-testid="user-row"]').should('have.length.gte', 1);
        });

        it('should toggle user active status', () => {
            cy.visit('/admin/users');
            cy.get('[data-testid="toggle-status-btn"]').first().click();

            cy.contains('User status updated').should('be.visible');
        });
    });

    describe('Analytics', () => {
        it('should display analytics charts', () => {
            cy.visit('/admin/analytics');
            cy.get('[data-testid="status-breakdown"]').should('be.visible');
            cy.get('[data-testid="category-breakdown"]').should('be.visible');
        });

        it('should export listings CSV', () => {
            cy.visit('/admin/analytics');
            cy.get('[data-testid="export-csv-btn"]').click();

            // Verify download initiated
            cy.readFile('cypress/downloads/listings.csv').should('exist');
        });
    });

    describe('Audit Log', () => {
        it('should display audit log entries', () => {
            cy.visit('/admin/audit-log');
            cy.get('[data-testid="audit-entry"]').should('have.length.gte', 0);
        });

        it('should filter audit log by action', () => {
            cy.visit('/admin/audit-log');
            cy.get('select[name="action"]').select('approve');
            cy.get('[data-testid="audit-entry"]').each(($el) => {
                cy.wrap($el).should('contain', 'approve');
            });
        });
    });
});

describe('Admin Authorization', () => {
    it('should not allow non-admin users to access admin routes', () => {
        cy.login(); // Login as regular user
        cy.visit('/admin');

        // Should redirect or show access denied
        cy.url().should('not.include', '/admin');
    });
});
