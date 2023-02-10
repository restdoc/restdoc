import "hammerjs";
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

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
}

const loadingElement = document.querySelector(".app-loading");

platformBrowserDynamic()
  .bootstrapModule(AppModule, { preserveWhitespaces: false })
  .then(() => loadingElement.classList.add("loaded"))
  .then((success) => console.log(`Bootstrap success`))
  .then(() => (document as any).fonts.ready.then(() => loadingElement.remove()))
  .catch((err) => console.error(err));
