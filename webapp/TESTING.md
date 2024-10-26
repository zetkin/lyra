# Testing

This contains information on how to run different tests and add new tests for Lyra. 

We are using Playwright to test integration of features. 
Read the documentation at [playwright.dev/docs](https://playwright.dev/docs)

Jest is used to write both integration and unit tests.
[jest.io/docs](https://jestjs.io/docs/getting-started)

## Integration Tests

Lyra uses Playwright together with Jest to test integration.

All integration tests resources are located in the `/integrationTesting` folder. New tests should be added in the `/tests` folder.

To run integration tests:

`npm run playwright`

## Unit tests

Unit tests are written in Jest and located paralell to the unit they are written for.

To run unit tests:

`npm run test`