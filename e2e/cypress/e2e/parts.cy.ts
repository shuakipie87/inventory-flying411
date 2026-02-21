describe('Part Search and Pricing', () => {
    beforeEach(() => {
        cy.login();
    });

    describe('Part Autocomplete', () => {
        beforeEach(() => {
            cy.visit('/listings/create');
        });

        it('should show autocomplete suggestions', () => {
            cy.get('[data-testid="part-search-input"]').type('Boeing');

            cy.get('[data-testid="autocomplete-dropdown"]').should('be.visible');
            cy.get('[data-testid="autocomplete-item"]').should('have.length.gte', 1);
        });

        it('should select a part from autocomplete', () => {
            cy.get('[data-testid="part-search-input"]').type('65-02050');

            cy.get('[data-testid="autocomplete-item"]').first().click();

            cy.get('[data-testid="part-search-input"]').should('have.value', '65-02050-5');
        });

        it('should show no results message', () => {
            cy.get('[data-testid="part-search-input"]').type('NONEXISTENTPART12345');

            cy.contains('No parts found').should('be.visible');
        });
    });

    describe('Price Suggestions', () => {
        beforeEach(() => {
            cy.visit('/listings/create');
        });

        it('should show price hint after part selection', () => {
            cy.get('[data-testid="part-search-input"]').type('65-02050');
            cy.get('[data-testid="autocomplete-item"]').first().click();

            cy.get('[data-testid="price-hint"]').should('be.visible');
            cy.get('[data-testid="price-hint"]').should('contain', '$');
        });

        it('should update price hint based on condition', () => {
            cy.get('[data-testid="part-search-input"]').type('65-02050');
            cy.get('[data-testid="autocomplete-item"]').first().click();

            // Check new condition price
            cy.get('select[name="condition"]').select('new');
            cy.get('[data-testid="price-hint"]').invoke('text').then((newPrice) => {

                // Change to used
                cy.get('select[name="condition"]').select('used');
                cy.get('[data-testid="price-hint"]').invoke('text').should('not.eq', newPrice);
            });
        });
    });

    describe('Part Search API', () => {
        it('should return search results via API', () => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/parts/search?q=Boeing&limit=5`,
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.parts).to.be.an('array');
            });
        });

        it('should return pricing suggestions via API', () => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/parts/65-02050-5/pricing?condition=used`,
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.suggestion).to.have.property('min');
                expect(response.body.data.suggestion).to.have.property('max');
            });
        });
    });
});
