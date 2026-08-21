import {
  Component,
  RouterOutlet,
  bootstrapApplication,
  provideBrowserGlobalErrorListeners,
  provideHttpClient,
  provideRouter,
  provideZonelessChangeDetection,
  setClassMetadata,
  signal,
  ɵsetClassDebugInfo,
  ɵɵdefineComponent,
  ɵɵelement
} from "./chunk-2TEABK62.js";

// src/app/app.routes.ts
var routes = [
  { path: "", loadChildren: () => import("./chunk-VGDJNSJS.js").then((module) => module.RIDER_ROUTES) },
  { path: "**", redirectTo: "" }
];

// src/app/app.config.ts
var appConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // API requests are cookie-based and rely on existing customer authentication session.
    provideHttpClient()
  ]
};

// src/app/app.ts
var App = class _App {
  title = signal("Frontend", ...ngDevMode ? [{ debugName: "title" }] : (
    /* istanbul ignore next */
    []
  ));
  static \u0275fac = function App_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _App)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _App, selectors: [["app-root"]], decls: 1, vars: 0, template: function App_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275element(0, "router-outlet");
    }
  }, dependencies: [RouterOutlet], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(App, [{
    type: Component,
    args: [{ selector: "app-root", imports: [RouterOutlet], template: "<router-outlet></router-outlet>\r\n" }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(App, { className: "App", filePath: "app/app.ts", lineNumber: 10 });
})();

// src/main.ts
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
//# sourceMappingURL=main.js.map
