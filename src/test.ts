// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);
// Then we find all the tests.
if (require && typeof require.context === "function") {
  const context = require.context("./", true, /\.spec\.ts$/);
  context.keys().map(context);
} else {
  // Angular CLI (Webpack 5) may not provide require.context in some setups.
  // Tests will still run if explicitly imported elsewhere.
}
