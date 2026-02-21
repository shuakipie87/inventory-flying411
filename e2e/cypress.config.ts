import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.ts',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: true,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 30000,
        retries: {
            runMode: 2,
            openMode: 0,
        },
        env: {
            apiUrl: 'http://localhost:3000/api',
            adminEmail: 'admin@flying411.com',
            adminPassword: 'admin123',
            userEmail: 'user@flying411.com',
            userPassword: 'user123',
        },
    },
});
