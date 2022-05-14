import "hammerjs";
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import * as Sentry from "@sentry/angular";
import { Integrations } from "@sentry/tracing";

import "codemirror/mode/javascript/javascript";
import "codemirror/mode/markdown/markdown";
import "codemirror/mode/xml/xml";
import 'codemirror/lib/codemirror';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/indent-fold'

if (environment.production) {
  enableProdMode();

  Sentry.init({
    dsn: "https://69e2aebaa4e940a3bd774848d34b7095@sty.hedwi.com/4",
    integrations: [
      // Registers and configures the Tracing integration,
      // which automatically instruments your application to monitor its
      // performance, including custom Angular routing instrumentation
      new Integrations.BrowserTracing({
        tracingOrigins: ["https://www.hedwi.com", "https://www.hedwi.com/api"],
        routingInstrumentation: Sentry.routingInstrumentation,
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

const loadingElement = document.querySelector(".app-loading");

platformBrowserDynamic()
  .bootstrapModule(AppModule, { preserveWhitespaces: false })
  .then(() => loadingElement.classList.add("loaded"))
  .then((success) => console.log(`Bootstrap success`))
  .then(() => (document as any).fonts.ready.then(() => loadingElement.remove()))
  .catch((err) => console.error(err));
