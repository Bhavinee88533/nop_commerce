import {
  ActivatedRoute,
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  CommonModule,
  Component,
  DatePipe,
  DecimalPipe,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  Host,
  HttpClient,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  NgClass,
  NgForOf,
  NgIf,
  NgModule,
  NgZone,
  Optional,
  Output,
  Renderer2,
  Router,
  RuntimeError,
  Self,
  SkipSelf,
  Subject,
  Version,
  __require,
  __spreadProps,
  __spreadValues,
  afterNextRender,
  booleanAttribute,
  catchError,
  computed,
  forkJoin,
  forwardRef,
  from,
  getDOM,
  inject,
  isPromise,
  isSubscribable,
  map,
  of,
  setClassMetadata,
  signal,
  tap,
  timeout,
  untracked,
  ɵsetClassDebugInfo,
  ɵɵInheritDefinitionFeature,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵinject,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-2TEABK62.js";

// src/app/features/rider/rider-api.service.ts
var RiderApiService = class _RiderApiService {
  http;
  baseUrl = "/api/rider";
  constructor(http) {
    this.http = http;
  }
  getSession() {
    return this.http.get(`${this.baseUrl}/session`, { withCredentials: true });
  }
  checkExists() {
    return this.http.get(`${this.baseUrl}/exists`, { withCredentials: true });
  }
  onboard(payload) {
    return this.http.post(`${this.baseUrl}/onboard`, payload, { withCredentials: true });
  }
  getProfile() {
    return this.http.get(`${this.baseUrl}/profile`, { withCredentials: true });
  }
  updateStatus(payload) {
    return this.http.patch(`${this.baseUrl}/status`, payload, { withCredentials: true });
  }
  getDashboard() {
    return this.http.get(`${this.baseUrl}/dashboard`, { withCredentials: true });
  }
  acceptOrder(orderId) {
    return this.http.post(`${this.baseUrl}/accept-order?orderId=${orderId}`, {}, { withCredentials: true });
  }
  rejectOrder(orderId) {
    return this.http.post(`${this.baseUrl}/reject-order?orderId=${orderId}`, {}, { withCredentials: true });
  }
  getOrderDetails(orderId) {
    return this.http.get(`${this.baseUrl}/orders/${orderId}`, { withCredentials: true });
  }
  static \u0275fac = function RiderApiService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderApiService)(\u0275\u0275inject(HttpClient));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RiderApiService, factory: _RiderApiService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderApiService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: HttpClient }], null);
})();

// src/app/features/rider/rider-session.service.ts
var RiderSessionService = class _RiderSessionService {
  riderApi;
  sessionState = signal(null, ...ngDevMode ? [{ debugName: "sessionState" }] : (
    /* istanbul ignore next */
    []
  ));
  loadingState = signal(false, ...ngDevMode ? [{ debugName: "loadingState" }] : (
    /* istanbul ignore next */
    []
  ));
  session = computed(() => this.sessionState(), ...ngDevMode ? [{ debugName: "session" }] : (
    /* istanbul ignore next */
    []
  ));
  loading = computed(() => this.loadingState(), ...ngDevMode ? [{ debugName: "loading" }] : (
    /* istanbul ignore next */
    []
  ));
  constructor(riderApi) {
    this.riderApi = riderApi;
  }
  refreshSession() {
    this.loadingState.set(true);
    return this.riderApi.getSession().pipe(
      // Avoid indefinite "preparing" state when network/proxy stalls.
      timeout(1e4),
      tap((session) => {
        this.sessionState.set(session);
        this.loadingState.set(false);
      }),
      catchError(() => {
        this.sessionState.set({
          authenticated: false,
          customerId: 0,
          name: "",
          email: "",
          isRider: false
        });
        this.loadingState.set(false);
        return of(this.sessionState());
      })
    );
  }
  setSession(session) {
    this.sessionState.set(session);
  }
  clearSession() {
    this.sessionState.set(null);
  }
  static \u0275fac = function RiderSessionService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderSessionService)(\u0275\u0275inject(RiderApiService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RiderSessionService, factory: _RiderSessionService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderSessionService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: RiderApiService }], null);
})();

// src/app/features/rider/guards/customer-auth.guard.ts
var customerAuthGuard = () => {
  const router = inject(Router);
  const sessionService = inject(RiderSessionService);
  return sessionService.refreshSession().pipe(map((session) => {
    if (session?.authenticated) {
      return true;
    }
    window.location.href = "/login?returnUrl=%2Frider";
    return router.createUrlTree(["/"]);
  }));
};

// src/app/features/rider/guards/non-rider.guard.ts
var nonRiderGuard = () => {
  const router = inject(Router);
  const sessionService = inject(RiderSessionService);
  return sessionService.refreshSession().pipe(map((session) => session?.isRider ? router.createUrlTree(["/dashboard"]) : true));
};

// src/app/features/rider/guards/rider-only.guard.ts
var riderOnlyGuard = () => {
  const router = inject(Router);
  const sessionService = inject(RiderSessionService);
  return sessionService.refreshSession().pipe(map((session) => session?.isRider ? true : router.createUrlTree(["/onboarding"])));
};

// node_modules/@microsoft/signalr/dist/esm/Errors.js
var HttpError = class extends Error {
  /** Constructs a new instance of {@link @microsoft/signalr.HttpError}.
   *
   * @param {string} errorMessage A descriptive error message.
   * @param {number} statusCode The HTTP status code represented by this error.
   */
  constructor(errorMessage, statusCode) {
    const trueProto = new.target.prototype;
    super(`${errorMessage}: Status code '${statusCode}'`);
    this.statusCode = statusCode;
    this.__proto__ = trueProto;
  }
};
var TimeoutError = class extends Error {
  /** Constructs a new instance of {@link @microsoft/signalr.TimeoutError}.
   *
   * @param {string} errorMessage A descriptive error message.
   */
  constructor(errorMessage = "A timeout occurred.") {
    const trueProto = new.target.prototype;
    super(errorMessage);
    this.__proto__ = trueProto;
  }
};
var AbortError = class extends Error {
  /** Constructs a new instance of {@link AbortError}.
   *
   * @param {string} errorMessage A descriptive error message.
   */
  constructor(errorMessage = "An abort occurred.") {
    const trueProto = new.target.prototype;
    super(errorMessage);
    this.__proto__ = trueProto;
  }
};
var UnsupportedTransportError = class extends Error {
  /** Constructs a new instance of {@link @microsoft/signalr.UnsupportedTransportError}.
   *
   * @param {string} message A descriptive error message.
   * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
   */
  constructor(message, transport) {
    const trueProto = new.target.prototype;
    super(message);
    this.transport = transport;
    this.errorType = "UnsupportedTransportError";
    this.__proto__ = trueProto;
  }
};
var DisabledTransportError = class extends Error {
  /** Constructs a new instance of {@link @microsoft/signalr.DisabledTransportError}.
   *
   * @param {string} message A descriptive error message.
   * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
   */
  constructor(message, transport) {
    const trueProto = new.target.prototype;
    super(message);
    this.transport = transport;
    this.errorType = "DisabledTransportError";
    this.__proto__ = trueProto;
  }
};
var FailedToStartTransportError = class extends Error {
  /** Constructs a new instance of {@link @microsoft/signalr.FailedToStartTransportError}.
   *
   * @param {string} message A descriptive error message.
   * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
   */
  constructor(message, transport) {
    const trueProto = new.target.prototype;
    super(message);
    this.transport = transport;
    this.errorType = "FailedToStartTransportError";
    this.__proto__ = trueProto;
  }
};
var FailedToNegotiateWithServerError = class extends Error {
  /** Constructs a new instance of {@link @microsoft/signalr.FailedToNegotiateWithServerError}.
   *
   * @param {string} message A descriptive error message.
   */
  constructor(message) {
    const trueProto = new.target.prototype;
    super(message);
    this.errorType = "FailedToNegotiateWithServerError";
    this.__proto__ = trueProto;
  }
};
var AggregateErrors = class extends Error {
  /** Constructs a new instance of {@link @microsoft/signalr.AggregateErrors}.
   *
   * @param {string} message A descriptive error message.
   * @param {Error[]} innerErrors The collection of errors this error is aggregating.
   */
  constructor(message, innerErrors) {
    const trueProto = new.target.prototype;
    super(message);
    this.innerErrors = innerErrors;
    this.__proto__ = trueProto;
  }
};

// node_modules/@microsoft/signalr/dist/esm/HttpClient.js
var HttpResponse = class {
  constructor(statusCode, statusText, content) {
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.content = content;
  }
};
var HttpClient2 = class {
  get(url, options) {
    return this.send(__spreadProps(__spreadValues({}, options), {
      method: "GET",
      url
    }));
  }
  post(url, options) {
    return this.send(__spreadProps(__spreadValues({}, options), {
      method: "POST",
      url
    }));
  }
  delete(url, options) {
    return this.send(__spreadProps(__spreadValues({}, options), {
      method: "DELETE",
      url
    }));
  }
  /** Gets all cookies that apply to the specified URL.
   *
   * @param url The URL that the cookies are valid for.
   * @returns {string} A string containing all the key-value cookie pairs for the specified URL.
   */
  // @ts-ignore
  getCookieString(url) {
    return "";
  }
};

// node_modules/@microsoft/signalr/dist/esm/ILogger.js
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["Trace"] = 0] = "Trace";
  LogLevel2[LogLevel2["Debug"] = 1] = "Debug";
  LogLevel2[LogLevel2["Information"] = 2] = "Information";
  LogLevel2[LogLevel2["Warning"] = 3] = "Warning";
  LogLevel2[LogLevel2["Error"] = 4] = "Error";
  LogLevel2[LogLevel2["Critical"] = 5] = "Critical";
  LogLevel2[LogLevel2["None"] = 6] = "None";
})(LogLevel || (LogLevel = {}));

// node_modules/@microsoft/signalr/dist/esm/Loggers.js
var NullLogger = class {
  constructor() {
  }
  /** @inheritDoc */
  // eslint-disable-next-line
  log(_logLevel, _message) {
  }
};
NullLogger.instance = new NullLogger();

// node_modules/@microsoft/signalr/dist/esm/pkg-version.js
var VERSION = "10.0.0";

// node_modules/@microsoft/signalr/dist/esm/Utils.js
var Arg = class {
  static isRequired(val, name) {
    if (val === null || val === void 0) {
      throw new Error(`The '${name}' argument is required.`);
    }
  }
  static isNotEmpty(val, name) {
    if (!val || val.match(/^\s*$/)) {
      throw new Error(`The '${name}' argument should not be empty.`);
    }
  }
  static isIn(val, values, name) {
    if (!(val in values)) {
      throw new Error(`Unknown ${name} value: ${val}.`);
    }
  }
};
var Platform = class _Platform {
  // react-native has a window but no document so we should check both
  static get isBrowser() {
    return !_Platform.isNode && typeof window === "object" && typeof window.document === "object";
  }
  // WebWorkers don't have a window object so the isBrowser check would fail
  static get isWebWorker() {
    return !_Platform.isNode && typeof self === "object" && "importScripts" in self;
  }
  // react-native has a window but no document
  static get isReactNative() {
    return !_Platform.isNode && typeof window === "object" && typeof window.document === "undefined";
  }
  // Node apps shouldn't have a window object, but WebWorkers don't either
  // so we need to check for both WebWorker and window
  static get isNode() {
    return typeof process !== "undefined" && process.release && process.release.name === "node";
  }
};
function getDataDetail(data, includeContent) {
  let detail = "";
  if (isArrayBuffer(data)) {
    detail = `Binary data of length ${data.byteLength}`;
    if (includeContent) {
      detail += `. Content: '${formatArrayBuffer(data)}'`;
    }
  } else if (typeof data === "string") {
    detail = `String data of length ${data.length}`;
    if (includeContent) {
      detail += `. Content: '${data}'`;
    }
  }
  return detail;
}
function formatArrayBuffer(data) {
  const view = new Uint8Array(data);
  let str = "";
  view.forEach((num) => {
    const pad = num < 16 ? "0" : "";
    str += `0x${pad}${num.toString(16)} `;
  });
  return str.substring(0, str.length - 1);
}
function isArrayBuffer(val) {
  return val && typeof ArrayBuffer !== "undefined" && (val instanceof ArrayBuffer || // Sometimes we get an ArrayBuffer that doesn't satisfy instanceof
  val.constructor && val.constructor.name === "ArrayBuffer");
}
async function sendMessage(logger, transportName, httpClient, url, content, options) {
  const headers = {};
  const [name, value] = getUserAgentHeader();
  headers[name] = value;
  logger.log(LogLevel.Trace, `(${transportName} transport) sending data. ${getDataDetail(content, options.logMessageContent)}.`);
  const responseType = isArrayBuffer(content) ? "arraybuffer" : "text";
  const response = await httpClient.post(url, {
    content,
    headers: __spreadValues(__spreadValues({}, headers), options.headers),
    responseType,
    timeout: options.timeout,
    withCredentials: options.withCredentials
  });
  logger.log(LogLevel.Trace, `(${transportName} transport) request complete. Response status: ${response.statusCode}.`);
}
function createLogger(logger) {
  if (logger === void 0) {
    return new ConsoleLogger(LogLevel.Information);
  }
  if (logger === null) {
    return NullLogger.instance;
  }
  if (logger.log !== void 0) {
    return logger;
  }
  return new ConsoleLogger(logger);
}
var SubjectSubscription = class {
  constructor(subject, observer) {
    this._subject = subject;
    this._observer = observer;
  }
  dispose() {
    const index = this._subject.observers.indexOf(this._observer);
    if (index > -1) {
      this._subject.observers.splice(index, 1);
    }
    if (this._subject.observers.length === 0 && this._subject.cancelCallback) {
      this._subject.cancelCallback().catch((_) => {
      });
    }
  }
};
var ConsoleLogger = class {
  constructor(minimumLogLevel) {
    this._minLevel = minimumLogLevel;
    this.out = console;
  }
  log(logLevel, message) {
    if (logLevel >= this._minLevel) {
      const msg = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${LogLevel[logLevel]}: ${message}`;
      switch (logLevel) {
        case LogLevel.Critical:
        case LogLevel.Error:
          this.out.error(msg);
          break;
        case LogLevel.Warning:
          this.out.warn(msg);
          break;
        case LogLevel.Information:
          this.out.info(msg);
          break;
        default:
          this.out.log(msg);
          break;
      }
    }
  }
};
function getUserAgentHeader() {
  let userAgentHeaderName = "X-SignalR-User-Agent";
  if (Platform.isNode) {
    userAgentHeaderName = "User-Agent";
  }
  return [userAgentHeaderName, constructUserAgent(VERSION, getOsName(), getRuntime(), getRuntimeVersion())];
}
function constructUserAgent(version, os, runtime, runtimeVersion) {
  let userAgent = "Microsoft SignalR/";
  const majorAndMinor = version.split(".");
  userAgent += `${majorAndMinor[0]}.${majorAndMinor[1]}`;
  userAgent += ` (${version}; `;
  if (os && os !== "") {
    userAgent += `${os}; `;
  } else {
    userAgent += "Unknown OS; ";
  }
  userAgent += `${runtime}`;
  if (runtimeVersion) {
    userAgent += `; ${runtimeVersion}`;
  } else {
    userAgent += "; Unknown Runtime Version";
  }
  userAgent += ")";
  return userAgent;
}
function getOsName() {
  if (Platform.isNode) {
    switch (process.platform) {
      case "win32":
        return "Windows NT";
      case "darwin":
        return "macOS";
      case "linux":
        return "Linux";
      default:
        return process.platform;
    }
  } else {
    return "";
  }
}
function getRuntimeVersion() {
  if (Platform.isNode) {
    return process.versions.node;
  }
  return void 0;
}
function getRuntime() {
  if (Platform.isNode) {
    return "NodeJS";
  } else {
    return "Browser";
  }
}
function getErrorString(e) {
  if (e.stack) {
    return e.stack;
  } else if (e.message) {
    return e.message;
  }
  return `${e}`;
}
function getGlobalThis() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("could not find global");
}

// node_modules/@microsoft/signalr/dist/esm/FetchHttpClient.js
var FetchHttpClient = class extends HttpClient2 {
  constructor(logger) {
    super();
    this._logger = logger;
    if (typeof fetch === "undefined" || Platform.isNode) {
      const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
      this._jar = new (requireFunc("tough-cookie")).CookieJar();
      if (typeof fetch === "undefined") {
        this._fetchType = requireFunc("node-fetch");
      } else {
        this._fetchType = fetch;
      }
      this._fetchType = requireFunc("fetch-cookie")(this._fetchType, this._jar);
    } else {
      this._fetchType = fetch.bind(getGlobalThis());
    }
    if (typeof AbortController === "undefined") {
      const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
      this._abortControllerType = requireFunc("abort-controller");
    } else {
      this._abortControllerType = AbortController;
    }
  }
  /** @inheritDoc */
  async send(request) {
    if (request.abortSignal && request.abortSignal.aborted) {
      throw new AbortError();
    }
    if (!request.method) {
      throw new Error("No method defined.");
    }
    if (!request.url) {
      throw new Error("No url defined.");
    }
    const abortController = new this._abortControllerType();
    let error;
    if (request.abortSignal) {
      request.abortSignal.onabort = () => {
        abortController.abort();
        error = new AbortError();
      };
    }
    let timeoutId = null;
    if (request.timeout) {
      const msTimeout = request.timeout;
      timeoutId = setTimeout(() => {
        abortController.abort();
        this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
        error = new TimeoutError();
      }, msTimeout);
    }
    if (request.content === "") {
      request.content = void 0;
    }
    if (request.content) {
      request.headers = request.headers || {};
      if (isArrayBuffer(request.content)) {
        request.headers["Content-Type"] = "application/octet-stream";
      } else {
        request.headers["Content-Type"] = "text/plain;charset=UTF-8";
      }
    }
    let response;
    try {
      response = await this._fetchType(request.url, {
        body: request.content,
        cache: "no-cache",
        credentials: request.withCredentials === true ? "include" : "same-origin",
        headers: __spreadValues({
          "X-Requested-With": "XMLHttpRequest"
        }, request.headers),
        method: request.method,
        mode: "cors",
        redirect: "follow",
        signal: abortController.signal
      });
    } catch (e) {
      if (error) {
        throw error;
      }
      this._logger.log(LogLevel.Warning, `Error from HTTP request. ${e}.`);
      throw e;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (request.abortSignal) {
        request.abortSignal.onabort = null;
      }
    }
    if (!response.ok) {
      const errorMessage = await deserializeContent(response, "text");
      throw new HttpError(errorMessage || response.statusText, response.status);
    }
    const content = deserializeContent(response, request.responseType);
    const payload = await content;
    return new HttpResponse(response.status, response.statusText, payload);
  }
  getCookieString(url) {
    let cookies = "";
    if (Platform.isNode && this._jar) {
      this._jar.getCookies(url, (e, c) => cookies = c.join("; "));
    }
    return cookies;
  }
};
function deserializeContent(response, responseType) {
  let content;
  switch (responseType) {
    case "arraybuffer":
      content = response.arrayBuffer();
      break;
    case "text":
      content = response.text();
      break;
    case "blob":
    case "document":
    case "json":
      throw new Error(`${responseType} is not supported.`);
    default:
      content = response.text();
      break;
  }
  return content;
}

// node_modules/@microsoft/signalr/dist/esm/XhrHttpClient.js
var XhrHttpClient = class extends HttpClient2 {
  constructor(logger) {
    super();
    this._logger = logger;
  }
  /** @inheritDoc */
  send(request) {
    if (request.abortSignal && request.abortSignal.aborted) {
      return Promise.reject(new AbortError());
    }
    if (!request.method) {
      return Promise.reject(new Error("No method defined."));
    }
    if (!request.url) {
      return Promise.reject(new Error("No url defined."));
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(request.method, request.url, true);
      xhr.withCredentials = request.withCredentials === void 0 ? true : request.withCredentials;
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      if (request.content === "") {
        request.content = void 0;
      }
      if (request.content) {
        if (isArrayBuffer(request.content)) {
          xhr.setRequestHeader("Content-Type", "application/octet-stream");
        } else {
          xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        }
      }
      const headers = request.headers;
      if (headers) {
        Object.keys(headers).forEach((header) => {
          xhr.setRequestHeader(header, headers[header]);
        });
      }
      if (request.responseType) {
        xhr.responseType = request.responseType;
      }
      if (request.abortSignal) {
        request.abortSignal.onabort = () => {
          xhr.abort();
          reject(new AbortError());
        };
      }
      if (request.timeout) {
        xhr.timeout = request.timeout;
      }
      xhr.onload = () => {
        if (request.abortSignal) {
          request.abortSignal.onabort = null;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new HttpResponse(xhr.status, xhr.statusText, xhr.response || xhr.responseText));
        } else {
          reject(new HttpError(xhr.response || xhr.responseText || xhr.statusText, xhr.status));
        }
      };
      xhr.onerror = () => {
        this._logger.log(LogLevel.Warning, `Error from HTTP request. ${xhr.status}: ${xhr.statusText}.`);
        reject(new HttpError(xhr.statusText, xhr.status));
      };
      xhr.ontimeout = () => {
        this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
        reject(new TimeoutError());
      };
      xhr.send(request.content);
    });
  }
};

// node_modules/@microsoft/signalr/dist/esm/DefaultHttpClient.js
var DefaultHttpClient = class extends HttpClient2 {
  /** Creates a new instance of the {@link @microsoft/signalr.DefaultHttpClient}, using the provided {@link @microsoft/signalr.ILogger} to log messages. */
  constructor(logger) {
    super();
    if (typeof fetch !== "undefined" || Platform.isNode) {
      this._httpClient = new FetchHttpClient(logger);
    } else if (typeof XMLHttpRequest !== "undefined") {
      this._httpClient = new XhrHttpClient(logger);
    } else {
      throw new Error("No usable HttpClient found.");
    }
  }
  /** @inheritDoc */
  send(request) {
    if (request.abortSignal && request.abortSignal.aborted) {
      return Promise.reject(new AbortError());
    }
    if (!request.method) {
      return Promise.reject(new Error("No method defined."));
    }
    if (!request.url) {
      return Promise.reject(new Error("No url defined."));
    }
    return this._httpClient.send(request);
  }
  getCookieString(url) {
    return this._httpClient.getCookieString(url);
  }
};

// node_modules/@microsoft/signalr/dist/esm/TextMessageFormat.js
var TextMessageFormat = class _TextMessageFormat {
  static write(output) {
    return `${output}${_TextMessageFormat.RecordSeparator}`;
  }
  static parse(input) {
    if (input[input.length - 1] !== _TextMessageFormat.RecordSeparator) {
      throw new Error("Message is incomplete.");
    }
    const messages = input.split(_TextMessageFormat.RecordSeparator);
    messages.pop();
    return messages;
  }
};
TextMessageFormat.RecordSeparatorCode = 30;
TextMessageFormat.RecordSeparator = String.fromCharCode(TextMessageFormat.RecordSeparatorCode);

// node_modules/@microsoft/signalr/dist/esm/HandshakeProtocol.js
var HandshakeProtocol = class {
  // Handshake request is always JSON
  writeHandshakeRequest(handshakeRequest) {
    return TextMessageFormat.write(JSON.stringify(handshakeRequest));
  }
  parseHandshakeResponse(data) {
    let messageData;
    let remainingData;
    if (isArrayBuffer(data)) {
      const binaryData = new Uint8Array(data);
      const separatorIndex = binaryData.indexOf(TextMessageFormat.RecordSeparatorCode);
      if (separatorIndex === -1) {
        throw new Error("Message is incomplete.");
      }
      const responseLength = separatorIndex + 1;
      messageData = String.fromCharCode.apply(null, Array.prototype.slice.call(binaryData.slice(0, responseLength)));
      remainingData = binaryData.byteLength > responseLength ? binaryData.slice(responseLength).buffer : null;
    } else {
      const textData = data;
      const separatorIndex = textData.indexOf(TextMessageFormat.RecordSeparator);
      if (separatorIndex === -1) {
        throw new Error("Message is incomplete.");
      }
      const responseLength = separatorIndex + 1;
      messageData = textData.substring(0, responseLength);
      remainingData = textData.length > responseLength ? textData.substring(responseLength) : null;
    }
    const messages = TextMessageFormat.parse(messageData);
    const response = JSON.parse(messages[0]);
    if (response.type) {
      throw new Error("Expected a handshake response from the server.");
    }
    const responseMessage = response;
    return [remainingData, responseMessage];
  }
};

// node_modules/@microsoft/signalr/dist/esm/IHubProtocol.js
var MessageType;
(function(MessageType2) {
  MessageType2[MessageType2["Invocation"] = 1] = "Invocation";
  MessageType2[MessageType2["StreamItem"] = 2] = "StreamItem";
  MessageType2[MessageType2["Completion"] = 3] = "Completion";
  MessageType2[MessageType2["StreamInvocation"] = 4] = "StreamInvocation";
  MessageType2[MessageType2["CancelInvocation"] = 5] = "CancelInvocation";
  MessageType2[MessageType2["Ping"] = 6] = "Ping";
  MessageType2[MessageType2["Close"] = 7] = "Close";
  MessageType2[MessageType2["Ack"] = 8] = "Ack";
  MessageType2[MessageType2["Sequence"] = 9] = "Sequence";
})(MessageType || (MessageType = {}));

// node_modules/@microsoft/signalr/dist/esm/Subject.js
var Subject2 = class {
  constructor() {
    this.observers = [];
  }
  next(item) {
    for (const observer of this.observers) {
      observer.next(item);
    }
  }
  error(err) {
    for (const observer of this.observers) {
      if (observer.error) {
        observer.error(err);
      }
    }
  }
  complete() {
    for (const observer of this.observers) {
      if (observer.complete) {
        observer.complete();
      }
    }
  }
  subscribe(observer) {
    this.observers.push(observer);
    return new SubjectSubscription(this, observer);
  }
};

// node_modules/@microsoft/signalr/dist/esm/MessageBuffer.js
var MessageBuffer = class {
  constructor(protocol, connection, bufferSize) {
    this._bufferSize = 1e5;
    this._messages = [];
    this._totalMessageCount = 0;
    this._waitForSequenceMessage = false;
    this._nextReceivingSequenceId = 1;
    this._latestReceivedSequenceId = 0;
    this._bufferedByteCount = 0;
    this._reconnectInProgress = false;
    this._protocol = protocol;
    this._connection = connection;
    this._bufferSize = bufferSize;
  }
  async _send(message) {
    const serializedMessage = this._protocol.writeMessage(message);
    let backpressurePromise = Promise.resolve();
    if (this._isInvocationMessage(message)) {
      this._totalMessageCount++;
      let backpressurePromiseResolver = () => {
      };
      let backpressurePromiseRejector = () => {
      };
      if (isArrayBuffer(serializedMessage)) {
        this._bufferedByteCount += serializedMessage.byteLength;
      } else {
        this._bufferedByteCount += serializedMessage.length;
      }
      if (this._bufferedByteCount >= this._bufferSize) {
        backpressurePromise = new Promise((resolve, reject) => {
          backpressurePromiseResolver = resolve;
          backpressurePromiseRejector = reject;
        });
      }
      this._messages.push(new BufferedItem(serializedMessage, this._totalMessageCount, backpressurePromiseResolver, backpressurePromiseRejector));
    }
    try {
      if (!this._reconnectInProgress) {
        await this._connection.send(serializedMessage);
      }
    } catch {
      this._disconnected();
    }
    await backpressurePromise;
  }
  _ack(ackMessage) {
    let newestAckedMessage = -1;
    for (let index = 0; index < this._messages.length; index++) {
      const element = this._messages[index];
      if (element._id <= ackMessage.sequenceId) {
        newestAckedMessage = index;
        if (isArrayBuffer(element._message)) {
          this._bufferedByteCount -= element._message.byteLength;
        } else {
          this._bufferedByteCount -= element._message.length;
        }
        element._resolver();
      } else if (this._bufferedByteCount < this._bufferSize) {
        element._resolver();
      } else {
        break;
      }
    }
    if (newestAckedMessage !== -1) {
      this._messages = this._messages.slice(newestAckedMessage + 1);
    }
  }
  _shouldProcessMessage(message) {
    if (this._waitForSequenceMessage) {
      if (message.type !== MessageType.Sequence) {
        return false;
      } else {
        this._waitForSequenceMessage = false;
        return true;
      }
    }
    if (!this._isInvocationMessage(message)) {
      return true;
    }
    const currentId = this._nextReceivingSequenceId;
    this._nextReceivingSequenceId++;
    if (currentId <= this._latestReceivedSequenceId) {
      if (currentId === this._latestReceivedSequenceId) {
        this._ackTimer();
      }
      return false;
    }
    this._latestReceivedSequenceId = currentId;
    this._ackTimer();
    return true;
  }
  _resetSequence(message) {
    if (message.sequenceId > this._nextReceivingSequenceId) {
      this._connection.stop(new Error("Sequence ID greater than amount of messages we've received."));
      return;
    }
    this._nextReceivingSequenceId = message.sequenceId;
  }
  _disconnected() {
    this._reconnectInProgress = true;
    this._waitForSequenceMessage = true;
  }
  async _resend() {
    const sequenceId = this._messages.length !== 0 ? this._messages[0]._id : this._totalMessageCount + 1;
    await this._connection.send(this._protocol.writeMessage({ type: MessageType.Sequence, sequenceId }));
    const messages = this._messages;
    for (const element of messages) {
      await this._connection.send(element._message);
    }
    this._reconnectInProgress = false;
  }
  _dispose(error) {
    error !== null && error !== void 0 ? error : error = new Error("Unable to reconnect to server.");
    for (const element of this._messages) {
      element._rejector(error);
    }
  }
  _isInvocationMessage(message) {
    switch (message.type) {
      case MessageType.Invocation:
      case MessageType.StreamItem:
      case MessageType.Completion:
      case MessageType.StreamInvocation:
      case MessageType.CancelInvocation:
        return true;
      case MessageType.Close:
      case MessageType.Sequence:
      case MessageType.Ping:
      case MessageType.Ack:
        return false;
    }
  }
  _ackTimer() {
    if (this._ackTimerHandle === void 0) {
      this._ackTimerHandle = setTimeout(async () => {
        try {
          if (!this._reconnectInProgress) {
            await this._connection.send(this._protocol.writeMessage({ type: MessageType.Ack, sequenceId: this._latestReceivedSequenceId }));
          }
        } catch {
        }
        clearTimeout(this._ackTimerHandle);
        this._ackTimerHandle = void 0;
      }, 1e3);
    }
  }
};
var BufferedItem = class {
  constructor(message, id, resolver, rejector) {
    this._message = message;
    this._id = id;
    this._resolver = resolver;
    this._rejector = rejector;
  }
};

// node_modules/@microsoft/signalr/dist/esm/HubConnection.js
var DEFAULT_TIMEOUT_IN_MS = 30 * 1e3;
var DEFAULT_PING_INTERVAL_IN_MS = 15 * 1e3;
var DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE = 1e5;
var HubConnectionState;
(function(HubConnectionState2) {
  HubConnectionState2["Disconnected"] = "Disconnected";
  HubConnectionState2["Connecting"] = "Connecting";
  HubConnectionState2["Connected"] = "Connected";
  HubConnectionState2["Disconnecting"] = "Disconnecting";
  HubConnectionState2["Reconnecting"] = "Reconnecting";
})(HubConnectionState || (HubConnectionState = {}));
var HubConnection = class _HubConnection {
  /** @internal */
  // Using a public static factory method means we can have a private constructor and an _internal_
  // create method that can be used by HubConnectionBuilder. An "internal" constructor would just
  // be stripped away and the '.d.ts' file would have no constructor, which is interpreted as a
  // public parameter-less constructor.
  static create(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
    return new _HubConnection(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize);
  }
  constructor(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
    this._nextKeepAlive = 0;
    this._freezeEventListener = () => {
      this._logger.log(LogLevel.Warning, "The page is being frozen, this will likely lead to the connection being closed and messages being lost. For more information see the docs at https://learn.microsoft.com/aspnet/core/signalr/javascript-client#bsleep");
    };
    Arg.isRequired(connection, "connection");
    Arg.isRequired(logger, "logger");
    Arg.isRequired(protocol, "protocol");
    this.serverTimeoutInMilliseconds = serverTimeoutInMilliseconds !== null && serverTimeoutInMilliseconds !== void 0 ? serverTimeoutInMilliseconds : DEFAULT_TIMEOUT_IN_MS;
    this.keepAliveIntervalInMilliseconds = keepAliveIntervalInMilliseconds !== null && keepAliveIntervalInMilliseconds !== void 0 ? keepAliveIntervalInMilliseconds : DEFAULT_PING_INTERVAL_IN_MS;
    this._statefulReconnectBufferSize = statefulReconnectBufferSize !== null && statefulReconnectBufferSize !== void 0 ? statefulReconnectBufferSize : DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE;
    this._logger = logger;
    this._protocol = protocol;
    this.connection = connection;
    this._reconnectPolicy = reconnectPolicy;
    this._handshakeProtocol = new HandshakeProtocol();
    this.connection.onreceive = (data) => this._processIncomingData(data);
    this.connection.onclose = (error) => this._connectionClosed(error);
    this._callbacks = {};
    this._methods = {};
    this._closedCallbacks = [];
    this._reconnectingCallbacks = [];
    this._reconnectedCallbacks = [];
    this._invocationId = 0;
    this._receivedHandshakeResponse = false;
    this._connectionState = HubConnectionState.Disconnected;
    this._connectionStarted = false;
    this._cachedPingMessage = this._protocol.writeMessage({ type: MessageType.Ping });
  }
  /** Indicates the state of the {@link HubConnection} to the server. */
  get state() {
    return this._connectionState;
  }
  /** Represents the connection id of the {@link HubConnection} on the server. The connection id will be null when the connection is either
   *  in the disconnected state or if the negotiation step was skipped.
   */
  get connectionId() {
    return this.connection ? this.connection.connectionId || null : null;
  }
  /** Indicates the url of the {@link HubConnection} to the server. */
  get baseUrl() {
    return this.connection.baseUrl || "";
  }
  /**
   * Sets a new url for the HubConnection. Note that the url can only be changed when the connection is in either the Disconnected or
   * Reconnecting states.
   * @param {string} url The url to connect to.
   */
  set baseUrl(url) {
    if (this._connectionState !== HubConnectionState.Disconnected && this._connectionState !== HubConnectionState.Reconnecting) {
      throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");
    }
    if (!url) {
      throw new Error("The HubConnection url must be a valid url.");
    }
    this.connection.baseUrl = url;
  }
  /** Starts the connection.
   *
   * @returns {Promise<void>} A Promise that resolves when the connection has been successfully established, or rejects with an error.
   */
  start() {
    this._startPromise = this._startWithStateTransitions();
    return this._startPromise;
  }
  async _startWithStateTransitions() {
    if (this._connectionState !== HubConnectionState.Disconnected) {
      return Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));
    }
    this._connectionState = HubConnectionState.Connecting;
    this._logger.log(LogLevel.Debug, "Starting HubConnection.");
    try {
      await this._startInternal();
      if (Platform.isBrowser) {
        window.document.addEventListener("freeze", this._freezeEventListener);
      }
      this._connectionState = HubConnectionState.Connected;
      this._connectionStarted = true;
      this._logger.log(LogLevel.Debug, "HubConnection connected successfully.");
    } catch (e) {
      this._connectionState = HubConnectionState.Disconnected;
      this._logger.log(LogLevel.Debug, `HubConnection failed to start successfully because of error '${e}'.`);
      return Promise.reject(e);
    }
  }
  async _startInternal() {
    this._stopDuringStartError = void 0;
    this._receivedHandshakeResponse = false;
    const handshakePromise = new Promise((resolve, reject) => {
      this._handshakeResolver = resolve;
      this._handshakeRejecter = reject;
    });
    await this.connection.start(this._protocol.transferFormat);
    try {
      let version = this._protocol.version;
      if (!this.connection.features.reconnect) {
        version = 1;
      }
      const handshakeRequest = {
        protocol: this._protocol.name,
        version
      };
      this._logger.log(LogLevel.Debug, "Sending handshake request.");
      await this._sendMessage(this._handshakeProtocol.writeHandshakeRequest(handshakeRequest));
      this._logger.log(LogLevel.Information, `Using HubProtocol '${this._protocol.name}'.`);
      this._cleanupTimeout();
      this._resetTimeoutPeriod();
      this._resetKeepAliveInterval();
      await handshakePromise;
      if (this._stopDuringStartError) {
        throw this._stopDuringStartError;
      }
      const useStatefulReconnect = this.connection.features.reconnect || false;
      if (useStatefulReconnect) {
        this._messageBuffer = new MessageBuffer(this._protocol, this.connection, this._statefulReconnectBufferSize);
        this.connection.features.disconnected = this._messageBuffer._disconnected.bind(this._messageBuffer);
        this.connection.features.resend = () => {
          if (this._messageBuffer) {
            return this._messageBuffer._resend();
          }
        };
      }
      if (!this.connection.features.inherentKeepAlive) {
        await this._sendMessage(this._cachedPingMessage);
      }
    } catch (e) {
      this._logger.log(LogLevel.Debug, `Hub handshake failed with error '${e}' during start(). Stopping HubConnection.`);
      this._cleanupTimeout();
      this._cleanupPingTimer();
      await this.connection.stop(e);
      throw e;
    }
  }
  /** Stops the connection.
   *
   * @returns {Promise<void>} A Promise that resolves when the connection has been successfully terminated, or rejects with an error.
   */
  async stop() {
    const startPromise = this._startPromise;
    this.connection.features.reconnect = false;
    this._stopPromise = this._stopInternal();
    await this._stopPromise;
    try {
      await startPromise;
    } catch (e) {
    }
  }
  _stopInternal(error) {
    if (this._connectionState === HubConnectionState.Disconnected) {
      this._logger.log(LogLevel.Debug, `Call to HubConnection.stop(${error}) ignored because it is already in the disconnected state.`);
      return Promise.resolve();
    }
    if (this._connectionState === HubConnectionState.Disconnecting) {
      this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
      return this._stopPromise;
    }
    const state = this._connectionState;
    this._connectionState = HubConnectionState.Disconnecting;
    this._logger.log(LogLevel.Debug, "Stopping HubConnection.");
    if (this._reconnectDelayHandle) {
      this._logger.log(LogLevel.Debug, "Connection stopped during reconnect delay. Done reconnecting.");
      clearTimeout(this._reconnectDelayHandle);
      this._reconnectDelayHandle = void 0;
      this._completeClose();
      return Promise.resolve();
    }
    if (state === HubConnectionState.Connected) {
      this._sendCloseMessage();
    }
    this._cleanupTimeout();
    this._cleanupPingTimer();
    this._stopDuringStartError = error || new AbortError("The connection was stopped before the hub handshake could complete.");
    return this.connection.stop(error);
  }
  async _sendCloseMessage() {
    try {
      await this._sendWithProtocol(this._createCloseMessage());
    } catch {
    }
  }
  /** Invokes a streaming hub method on the server using the specified name and arguments.
   *
   * @typeparam T The type of the items returned by the server.
   * @param {string} methodName The name of the server method to invoke.
   * @param {any[]} args The arguments used to invoke the server method.
   * @returns {IStreamResult<T>} An object that yields results from the server as they are received.
   */
  stream(methodName, ...args) {
    const [streams, streamIds] = this._replaceStreamingParams(args);
    const invocationDescriptor = this._createStreamInvocation(methodName, args, streamIds);
    let promiseQueue;
    const subject = new Subject2();
    subject.cancelCallback = () => {
      const cancelInvocation = this._createCancelInvocation(invocationDescriptor.invocationId);
      delete this._callbacks[invocationDescriptor.invocationId];
      return promiseQueue.then(() => {
        return this._sendWithProtocol(cancelInvocation);
      });
    };
    this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
      if (error) {
        subject.error(error);
        return;
      } else if (invocationEvent) {
        if (invocationEvent.type === MessageType.Completion) {
          if (invocationEvent.error) {
            subject.error(new Error(invocationEvent.error));
          } else {
            subject.complete();
          }
        } else {
          subject.next(invocationEvent.item);
        }
      }
    };
    promiseQueue = this._sendWithProtocol(invocationDescriptor).catch((e) => {
      subject.error(e);
      delete this._callbacks[invocationDescriptor.invocationId];
    });
    this._launchStreams(streams, promiseQueue);
    return subject;
  }
  _sendMessage(message) {
    this._resetKeepAliveInterval();
    return this.connection.send(message);
  }
  /**
   * Sends a js object to the server.
   * @param message The js object to serialize and send.
   */
  _sendWithProtocol(message) {
    if (this._messageBuffer) {
      return this._messageBuffer._send(message);
    } else {
      return this._sendMessage(this._protocol.writeMessage(message));
    }
  }
  /** Invokes a hub method on the server using the specified name and arguments. Does not wait for a response from the receiver.
   *
   * The Promise returned by this method resolves when the client has sent the invocation to the server. The server may still
   * be processing the invocation.
   *
   * @param {string} methodName The name of the server method to invoke.
   * @param {any[]} args The arguments used to invoke the server method.
   * @returns {Promise<void>} A Promise that resolves when the invocation has been successfully sent, or rejects with an error.
   */
  send(methodName, ...args) {
    const [streams, streamIds] = this._replaceStreamingParams(args);
    const sendPromise = this._sendWithProtocol(this._createInvocation(methodName, args, true, streamIds));
    this._launchStreams(streams, sendPromise);
    return sendPromise;
  }
  /** Invokes a hub method on the server using the specified name and arguments.
   *
   * The Promise returned by this method resolves when the server indicates it has finished invoking the method. When the promise
   * resolves, the server has finished invoking the method. If the server method returns a result, it is produced as the result of
   * resolving the Promise.
   *
   * @typeparam T The expected return type.
   * @param {string} methodName The name of the server method to invoke.
   * @param {any[]} args The arguments used to invoke the server method.
   * @returns {Promise<T>} A Promise that resolves with the result of the server method (if any), or rejects with an error.
   */
  invoke(methodName, ...args) {
    const [streams, streamIds] = this._replaceStreamingParams(args);
    const invocationDescriptor = this._createInvocation(methodName, args, false, streamIds);
    const p = new Promise((resolve, reject) => {
      this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
        if (error) {
          reject(error);
          return;
        } else if (invocationEvent) {
          if (invocationEvent.type === MessageType.Completion) {
            if (invocationEvent.error) {
              reject(new Error(invocationEvent.error));
            } else {
              resolve(invocationEvent.result);
            }
          } else {
            reject(new Error(`Unexpected message type: ${invocationEvent.type}`));
          }
        }
      };
      const promiseQueue = this._sendWithProtocol(invocationDescriptor).catch((e) => {
        reject(e);
        delete this._callbacks[invocationDescriptor.invocationId];
      });
      this._launchStreams(streams, promiseQueue);
    });
    return p;
  }
  on(methodName, newMethod) {
    if (!methodName || !newMethod) {
      return;
    }
    methodName = methodName.toLowerCase();
    if (!this._methods[methodName]) {
      this._methods[methodName] = [];
    }
    if (this._methods[methodName].indexOf(newMethod) !== -1) {
      return;
    }
    this._methods[methodName].push(newMethod);
  }
  off(methodName, method) {
    if (!methodName) {
      return;
    }
    methodName = methodName.toLowerCase();
    const handlers = this._methods[methodName];
    if (!handlers) {
      return;
    }
    if (method) {
      const removeIdx = handlers.indexOf(method);
      if (removeIdx !== -1) {
        handlers.splice(removeIdx, 1);
        if (handlers.length === 0) {
          delete this._methods[methodName];
        }
      }
    } else {
      delete this._methods[methodName];
    }
  }
  /** Registers a handler that will be invoked when the connection is closed.
   *
   * @param {Function} callback The handler that will be invoked when the connection is closed. Optionally receives a single argument containing the error that caused the connection to close (if any).
   */
  onclose(callback) {
    if (callback) {
      this._closedCallbacks.push(callback);
    }
  }
  /** Registers a handler that will be invoked when the connection starts reconnecting.
   *
   * @param {Function} callback The handler that will be invoked when the connection starts reconnecting. Optionally receives a single argument containing the error that caused the connection to start reconnecting (if any).
   */
  onreconnecting(callback) {
    if (callback) {
      this._reconnectingCallbacks.push(callback);
    }
  }
  /** Registers a handler that will be invoked when the connection successfully reconnects.
   *
   * @param {Function} callback The handler that will be invoked when the connection successfully reconnects.
   */
  onreconnected(callback) {
    if (callback) {
      this._reconnectedCallbacks.push(callback);
    }
  }
  _processIncomingData(data) {
    this._cleanupTimeout();
    if (!this._receivedHandshakeResponse) {
      data = this._processHandshakeResponse(data);
      this._receivedHandshakeResponse = true;
    }
    if (data) {
      const messages = this._protocol.parseMessages(data, this._logger);
      for (const message of messages) {
        if (this._messageBuffer && !this._messageBuffer._shouldProcessMessage(message)) {
          continue;
        }
        switch (message.type) {
          case MessageType.Invocation:
            this._invokeClientMethod(message).catch((e) => {
              this._logger.log(LogLevel.Error, `Invoke client method threw error: ${getErrorString(e)}`);
            });
            break;
          case MessageType.StreamItem:
          case MessageType.Completion: {
            const callback = this._callbacks[message.invocationId];
            if (callback) {
              if (message.type === MessageType.Completion) {
                delete this._callbacks[message.invocationId];
              }
              try {
                callback(message);
              } catch (e) {
                this._logger.log(LogLevel.Error, `Stream callback threw error: ${getErrorString(e)}`);
              }
            }
            break;
          }
          case MessageType.Ping:
            break;
          case MessageType.Close: {
            this._logger.log(LogLevel.Information, "Close message received from server.");
            const error = message.error ? new Error("Server returned an error on close: " + message.error) : void 0;
            if (message.allowReconnect === true) {
              this.connection.stop(error);
            } else {
              this._stopPromise = this._stopInternal(error);
            }
            break;
          }
          case MessageType.Ack:
            if (this._messageBuffer) {
              this._messageBuffer._ack(message);
            }
            break;
          case MessageType.Sequence:
            if (this._messageBuffer) {
              this._messageBuffer._resetSequence(message);
            }
            break;
          default:
            this._logger.log(LogLevel.Warning, `Invalid message type: ${message.type}.`);
            break;
        }
      }
    }
    this._resetTimeoutPeriod();
  }
  _processHandshakeResponse(data) {
    let responseMessage;
    let remainingData;
    try {
      [remainingData, responseMessage] = this._handshakeProtocol.parseHandshakeResponse(data);
    } catch (e) {
      const message = "Error parsing handshake response: " + e;
      this._logger.log(LogLevel.Error, message);
      const error = new Error(message);
      this._handshakeRejecter(error);
      throw error;
    }
    if (responseMessage.error) {
      const message = "Server returned handshake error: " + responseMessage.error;
      this._logger.log(LogLevel.Error, message);
      const error = new Error(message);
      this._handshakeRejecter(error);
      throw error;
    } else {
      this._logger.log(LogLevel.Debug, "Server handshake complete.");
    }
    this._handshakeResolver();
    return remainingData;
  }
  _resetKeepAliveInterval() {
    if (this.connection.features.inherentKeepAlive) {
      return;
    }
    this._nextKeepAlive = (/* @__PURE__ */ new Date()).getTime() + this.keepAliveIntervalInMilliseconds;
    this._cleanupPingTimer();
  }
  _resetTimeoutPeriod() {
    if (!this.connection.features || !this.connection.features.inherentKeepAlive) {
      this._timeoutHandle = setTimeout(() => this.serverTimeout(), this.serverTimeoutInMilliseconds);
      let nextPing = this._nextKeepAlive - (/* @__PURE__ */ new Date()).getTime();
      if (nextPing < 0) {
        if (this._connectionState === HubConnectionState.Connected) {
          this._trySendPingMessage();
        }
        return;
      }
      if (this._pingServerHandle === void 0) {
        if (nextPing < 0) {
          nextPing = 0;
        }
        this._pingServerHandle = setTimeout(async () => {
          if (this._connectionState === HubConnectionState.Connected) {
            await this._trySendPingMessage();
          }
        }, nextPing);
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  serverTimeout() {
    this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."));
  }
  async _invokeClientMethod(invocationMessage) {
    const methodName = invocationMessage.target.toLowerCase();
    const methods = this._methods[methodName];
    if (!methods) {
      this._logger.log(LogLevel.Warning, `No client method with the name '${methodName}' found.`);
      if (invocationMessage.invocationId) {
        this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
        await this._sendWithProtocol(this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null));
      }
      return;
    }
    const methodsCopy = methods.slice();
    const expectsResponse = invocationMessage.invocationId ? true : false;
    let res;
    let exception;
    let completionMessage;
    for (const m of methodsCopy) {
      try {
        const prevRes = res;
        res = await m.apply(this, invocationMessage.arguments);
        if (expectsResponse && res && prevRes) {
          this._logger.log(LogLevel.Error, `Multiple results provided for '${methodName}'. Sending error to server.`);
          completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `Client provided multiple results.`, null);
        }
        exception = void 0;
      } catch (e) {
        exception = e;
        this._logger.log(LogLevel.Error, `A callback for the method '${methodName}' threw error '${e}'.`);
      }
    }
    if (completionMessage) {
      await this._sendWithProtocol(completionMessage);
    } else if (expectsResponse) {
      if (exception) {
        completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `${exception}`, null);
      } else if (res !== void 0) {
        completionMessage = this._createCompletionMessage(invocationMessage.invocationId, null, res);
      } else {
        this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
        completionMessage = this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null);
      }
      await this._sendWithProtocol(completionMessage);
    } else {
      if (res) {
        this._logger.log(LogLevel.Error, `Result given for '${methodName}' method but server is not expecting a result.`);
      }
    }
  }
  _connectionClosed(error) {
    this._logger.log(LogLevel.Debug, `HubConnection.connectionClosed(${error}) called while in state ${this._connectionState}.`);
    this._stopDuringStartError = this._stopDuringStartError || error || new AbortError("The underlying connection was closed before the hub handshake could complete.");
    if (this._handshakeResolver) {
      this._handshakeResolver();
    }
    this._cancelCallbacksWithError(error || new Error("Invocation canceled due to the underlying connection being closed."));
    this._cleanupTimeout();
    this._cleanupPingTimer();
    if (this._connectionState === HubConnectionState.Disconnecting) {
      this._completeClose(error);
    } else if (this._connectionState === HubConnectionState.Connected && this._reconnectPolicy) {
      this._reconnect(error);
    } else if (this._connectionState === HubConnectionState.Connected) {
      this._completeClose(error);
    }
  }
  _completeClose(error) {
    if (this._connectionStarted) {
      this._connectionState = HubConnectionState.Disconnected;
      this._connectionStarted = false;
      if (this._messageBuffer) {
        this._messageBuffer._dispose(error !== null && error !== void 0 ? error : new Error("Connection closed."));
        this._messageBuffer = void 0;
      }
      if (Platform.isBrowser) {
        window.document.removeEventListener("freeze", this._freezeEventListener);
      }
      try {
        this._closedCallbacks.forEach((c) => c.apply(this, [error]));
      } catch (e) {
        this._logger.log(LogLevel.Error, `An onclose callback called with error '${error}' threw error '${e}'.`);
      }
    }
  }
  async _reconnect(error) {
    const reconnectStartTime = Date.now();
    let previousReconnectAttempts = 0;
    let retryError = error !== void 0 ? error : new Error("Attempting to reconnect due to a unknown error.");
    let nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts, 0, retryError);
    if (nextRetryDelay === null) {
      this._logger.log(LogLevel.Debug, "Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt.");
      this._completeClose(error);
      return;
    }
    this._connectionState = HubConnectionState.Reconnecting;
    if (error) {
      this._logger.log(LogLevel.Information, `Connection reconnecting because of error '${error}'.`);
    } else {
      this._logger.log(LogLevel.Information, "Connection reconnecting.");
    }
    if (this._reconnectingCallbacks.length !== 0) {
      try {
        this._reconnectingCallbacks.forEach((c) => c.apply(this, [error]));
      } catch (e) {
        this._logger.log(LogLevel.Error, `An onreconnecting callback called with error '${error}' threw error '${e}'.`);
      }
      if (this._connectionState !== HubConnectionState.Reconnecting) {
        this._logger.log(LogLevel.Debug, "Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");
        return;
      }
    }
    while (nextRetryDelay !== null) {
      this._logger.log(LogLevel.Information, `Reconnect attempt number ${previousReconnectAttempts + 1} will start in ${nextRetryDelay} ms.`);
      await new Promise((resolve) => {
        this._reconnectDelayHandle = setTimeout(resolve, nextRetryDelay);
      });
      this._reconnectDelayHandle = void 0;
      if (this._connectionState !== HubConnectionState.Reconnecting) {
        this._logger.log(LogLevel.Debug, "Connection left the reconnecting state during reconnect delay. Done reconnecting.");
        return;
      }
      try {
        await this._startInternal();
        this._connectionState = HubConnectionState.Connected;
        this._logger.log(LogLevel.Information, "HubConnection reconnected successfully.");
        if (this._reconnectedCallbacks.length !== 0) {
          try {
            this._reconnectedCallbacks.forEach((c) => c.apply(this, [this.connection.connectionId]));
          } catch (e) {
            this._logger.log(LogLevel.Error, `An onreconnected callback called with connectionId '${this.connection.connectionId}; threw error '${e}'.`);
          }
        }
        return;
      } catch (e) {
        this._logger.log(LogLevel.Information, `Reconnect attempt failed because of error '${e}'.`);
        if (this._connectionState !== HubConnectionState.Reconnecting) {
          this._logger.log(LogLevel.Debug, `Connection moved to the '${this._connectionState}' from the reconnecting state during reconnect attempt. Done reconnecting.`);
          if (this._connectionState === HubConnectionState.Disconnecting) {
            this._completeClose();
          }
          return;
        }
        previousReconnectAttempts++;
        retryError = e instanceof Error ? e : new Error(e.toString());
        nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts, Date.now() - reconnectStartTime, retryError);
      }
    }
    this._logger.log(LogLevel.Information, `Reconnect retries have been exhausted after ${Date.now() - reconnectStartTime} ms and ${previousReconnectAttempts} failed attempts. Connection disconnecting.`);
    this._completeClose();
  }
  _getNextRetryDelay(previousRetryCount, elapsedMilliseconds, retryReason) {
    try {
      return this._reconnectPolicy.nextRetryDelayInMilliseconds({
        elapsedMilliseconds,
        previousRetryCount,
        retryReason
      });
    } catch (e) {
      this._logger.log(LogLevel.Error, `IRetryPolicy.nextRetryDelayInMilliseconds(${previousRetryCount}, ${elapsedMilliseconds}) threw error '${e}'.`);
      return null;
    }
  }
  _cancelCallbacksWithError(error) {
    const callbacks = this._callbacks;
    this._callbacks = {};
    Object.keys(callbacks).forEach((key) => {
      const callback = callbacks[key];
      try {
        callback(null, error);
      } catch (e) {
        this._logger.log(LogLevel.Error, `Stream 'error' callback called with '${error}' threw error: ${getErrorString(e)}`);
      }
    });
  }
  _cleanupPingTimer() {
    if (this._pingServerHandle) {
      clearTimeout(this._pingServerHandle);
      this._pingServerHandle = void 0;
    }
  }
  _cleanupTimeout() {
    if (this._timeoutHandle) {
      clearTimeout(this._timeoutHandle);
    }
  }
  _createInvocation(methodName, args, nonblocking, streamIds) {
    if (nonblocking) {
      if (streamIds.length !== 0) {
        return {
          target: methodName,
          arguments: args,
          streamIds,
          type: MessageType.Invocation
        };
      } else {
        return {
          target: methodName,
          arguments: args,
          type: MessageType.Invocation
        };
      }
    } else {
      const invocationId = this._invocationId;
      this._invocationId++;
      if (streamIds.length !== 0) {
        return {
          target: methodName,
          arguments: args,
          invocationId: invocationId.toString(),
          streamIds,
          type: MessageType.Invocation
        };
      } else {
        return {
          target: methodName,
          arguments: args,
          invocationId: invocationId.toString(),
          type: MessageType.Invocation
        };
      }
    }
  }
  _launchStreams(streams, promiseQueue) {
    if (streams.length === 0) {
      return;
    }
    if (!promiseQueue) {
      promiseQueue = Promise.resolve();
    }
    for (const streamId in streams) {
      streams[streamId].subscribe({
        complete: () => {
          promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId)));
        },
        error: (err) => {
          let message;
          if (err instanceof Error) {
            message = err.message;
          } else if (err && err.toString) {
            message = err.toString();
          } else {
            message = "Unknown error";
          }
          promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId, message)));
        },
        next: (item) => {
          promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createStreamItemMessage(streamId, item)));
        }
      });
    }
  }
  _replaceStreamingParams(args) {
    const streams = [];
    const streamIds = [];
    for (let i = 0; i < args.length; i++) {
      const argument = args[i];
      if (this._isObservable(argument)) {
        const streamId = this._invocationId;
        this._invocationId++;
        streams[streamId] = argument;
        streamIds.push(streamId.toString());
        args.splice(i, 1);
      }
    }
    return [streams, streamIds];
  }
  _isObservable(arg) {
    return arg && arg.subscribe && typeof arg.subscribe === "function";
  }
  _createStreamInvocation(methodName, args, streamIds) {
    const invocationId = this._invocationId;
    this._invocationId++;
    if (streamIds.length !== 0) {
      return {
        target: methodName,
        arguments: args,
        invocationId: invocationId.toString(),
        streamIds,
        type: MessageType.StreamInvocation
      };
    } else {
      return {
        target: methodName,
        arguments: args,
        invocationId: invocationId.toString(),
        type: MessageType.StreamInvocation
      };
    }
  }
  _createCancelInvocation(id) {
    return {
      invocationId: id,
      type: MessageType.CancelInvocation
    };
  }
  _createStreamItemMessage(id, item) {
    return {
      invocationId: id,
      item,
      type: MessageType.StreamItem
    };
  }
  _createCompletionMessage(id, error, result) {
    if (error) {
      return {
        error,
        invocationId: id,
        type: MessageType.Completion
      };
    }
    return {
      invocationId: id,
      result,
      type: MessageType.Completion
    };
  }
  _createCloseMessage() {
    return { type: MessageType.Close };
  }
  async _trySendPingMessage() {
    try {
      await this._sendMessage(this._cachedPingMessage);
    } catch {
      this._cleanupPingTimer();
    }
  }
};

// node_modules/@microsoft/signalr/dist/esm/DefaultReconnectPolicy.js
var DEFAULT_RETRY_DELAYS_IN_MILLISECONDS = [0, 2e3, 1e4, 3e4, null];
var DefaultReconnectPolicy = class {
  constructor(retryDelays) {
    this._retryDelays = retryDelays !== void 0 ? [...retryDelays, null] : DEFAULT_RETRY_DELAYS_IN_MILLISECONDS;
  }
  nextRetryDelayInMilliseconds(retryContext) {
    return this._retryDelays[retryContext.previousRetryCount];
  }
};

// node_modules/@microsoft/signalr/dist/esm/HeaderNames.js
var HeaderNames = class {
};
HeaderNames.Authorization = "Authorization";
HeaderNames.Cookie = "Cookie";

// node_modules/@microsoft/signalr/dist/esm/AccessTokenHttpClient.js
var AccessTokenHttpClient = class extends HttpClient2 {
  constructor(innerClient, accessTokenFactory) {
    super();
    this._innerClient = innerClient;
    this._accessTokenFactory = accessTokenFactory;
  }
  async send(request) {
    let allowRetry = true;
    if (this._accessTokenFactory && (!this._accessToken || request.url && request.url.indexOf("/negotiate?") > 0)) {
      allowRetry = false;
      this._accessToken = await this._accessTokenFactory();
    }
    this._setAuthorizationHeader(request);
    const response = await this._innerClient.send(request);
    if (allowRetry && response.statusCode === 401 && this._accessTokenFactory) {
      this._accessToken = await this._accessTokenFactory();
      this._setAuthorizationHeader(request);
      return await this._innerClient.send(request);
    }
    return response;
  }
  _setAuthorizationHeader(request) {
    if (!request.headers) {
      request.headers = {};
    }
    if (this._accessToken) {
      request.headers[HeaderNames.Authorization] = `Bearer ${this._accessToken}`;
    } else if (this._accessTokenFactory) {
      if (request.headers[HeaderNames.Authorization]) {
        delete request.headers[HeaderNames.Authorization];
      }
    }
  }
  getCookieString(url) {
    return this._innerClient.getCookieString(url);
  }
};

// node_modules/@microsoft/signalr/dist/esm/ITransport.js
var HttpTransportType;
(function(HttpTransportType2) {
  HttpTransportType2[HttpTransportType2["None"] = 0] = "None";
  HttpTransportType2[HttpTransportType2["WebSockets"] = 1] = "WebSockets";
  HttpTransportType2[HttpTransportType2["ServerSentEvents"] = 2] = "ServerSentEvents";
  HttpTransportType2[HttpTransportType2["LongPolling"] = 4] = "LongPolling";
})(HttpTransportType || (HttpTransportType = {}));
var TransferFormat;
(function(TransferFormat2) {
  TransferFormat2[TransferFormat2["Text"] = 1] = "Text";
  TransferFormat2[TransferFormat2["Binary"] = 2] = "Binary";
})(TransferFormat || (TransferFormat = {}));

// node_modules/@microsoft/signalr/dist/esm/AbortController.js
var AbortController2 = class {
  constructor() {
    this._isAborted = false;
    this.onabort = null;
  }
  abort() {
    if (!this._isAborted) {
      this._isAborted = true;
      if (this.onabort) {
        this.onabort();
      }
    }
  }
  get signal() {
    return this;
  }
  get aborted() {
    return this._isAborted;
  }
};

// node_modules/@microsoft/signalr/dist/esm/LongPollingTransport.js
var LongPollingTransport = class {
  // This is an internal type, not exported from 'index' so this is really just internal.
  get pollAborted() {
    return this._pollAbort.aborted;
  }
  constructor(httpClient, logger, options) {
    this._httpClient = httpClient;
    this._logger = logger;
    this._pollAbort = new AbortController2();
    this._options = options;
    this._running = false;
    this.onreceive = null;
    this.onclose = null;
  }
  async connect(url, transferFormat) {
    Arg.isRequired(url, "url");
    Arg.isRequired(transferFormat, "transferFormat");
    Arg.isIn(transferFormat, TransferFormat, "transferFormat");
    this._url = url;
    this._logger.log(LogLevel.Trace, "(LongPolling transport) Connecting.");
    if (transferFormat === TransferFormat.Binary && (typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string")) {
      throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");
    }
    const [name, value] = getUserAgentHeader();
    const headers = __spreadValues({ [name]: value }, this._options.headers);
    const pollOptions = {
      abortSignal: this._pollAbort.signal,
      headers,
      timeout: 1e5,
      withCredentials: this._options.withCredentials
    };
    if (transferFormat === TransferFormat.Binary) {
      pollOptions.responseType = "arraybuffer";
    }
    const pollUrl = `${url}&_=${Date.now()}`;
    this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
    const response = await this._httpClient.get(pollUrl, pollOptions);
    if (response.statusCode !== 200) {
      this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
      this._closeError = new HttpError(response.statusText || "", response.statusCode);
      this._running = false;
    } else {
      this._running = true;
    }
    this._receiving = this._poll(this._url, pollOptions);
  }
  async _poll(url, pollOptions) {
    try {
      while (this._running) {
        try {
          const pollUrl = `${url}&_=${Date.now()}`;
          this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
          const response = await this._httpClient.get(pollUrl, pollOptions);
          if (response.statusCode === 204) {
            this._logger.log(LogLevel.Information, "(LongPolling transport) Poll terminated by server.");
            this._running = false;
          } else if (response.statusCode !== 200) {
            this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
            this._closeError = new HttpError(response.statusText || "", response.statusCode);
            this._running = false;
          } else {
            if (response.content) {
              this._logger.log(LogLevel.Trace, `(LongPolling transport) data received. ${getDataDetail(response.content, this._options.logMessageContent)}.`);
              if (this.onreceive) {
                this.onreceive(response.content);
              }
            } else {
              this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
            }
          }
        } catch (e) {
          if (!this._running) {
            this._logger.log(LogLevel.Trace, `(LongPolling transport) Poll errored after shutdown: ${e.message}`);
          } else {
            if (e instanceof TimeoutError) {
              this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
            } else {
              this._closeError = e;
              this._running = false;
            }
          }
        }
      }
    } finally {
      this._logger.log(LogLevel.Trace, "(LongPolling transport) Polling complete.");
      if (!this.pollAborted) {
        this._raiseOnClose();
      }
    }
  }
  async send(data) {
    if (!this._running) {
      return Promise.reject(new Error("Cannot send until the transport is connected"));
    }
    return sendMessage(this._logger, "LongPolling", this._httpClient, this._url, data, this._options);
  }
  async stop() {
    this._logger.log(LogLevel.Trace, "(LongPolling transport) Stopping polling.");
    this._running = false;
    this._pollAbort.abort();
    try {
      await this._receiving;
      this._logger.log(LogLevel.Trace, `(LongPolling transport) sending DELETE request to ${this._url}.`);
      const headers = {};
      const [name, value] = getUserAgentHeader();
      headers[name] = value;
      const deleteOptions = {
        headers: __spreadValues(__spreadValues({}, headers), this._options.headers),
        timeout: this._options.timeout,
        withCredentials: this._options.withCredentials
      };
      let error;
      try {
        await this._httpClient.delete(this._url, deleteOptions);
      } catch (err) {
        error = err;
      }
      if (error) {
        if (error instanceof HttpError) {
          if (error.statusCode === 404) {
            this._logger.log(LogLevel.Trace, "(LongPolling transport) A 404 response was returned from sending a DELETE request.");
          } else {
            this._logger.log(LogLevel.Trace, `(LongPolling transport) Error sending a DELETE request: ${error}`);
          }
        }
      } else {
        this._logger.log(LogLevel.Trace, "(LongPolling transport) DELETE request accepted.");
      }
    } finally {
      this._logger.log(LogLevel.Trace, "(LongPolling transport) Stop finished.");
      this._raiseOnClose();
    }
  }
  _raiseOnClose() {
    if (this.onclose) {
      let logMessage = "(LongPolling transport) Firing onclose event.";
      if (this._closeError) {
        logMessage += " Error: " + this._closeError;
      }
      this._logger.log(LogLevel.Trace, logMessage);
      this.onclose(this._closeError);
    }
  }
};

// node_modules/@microsoft/signalr/dist/esm/ServerSentEventsTransport.js
var ServerSentEventsTransport = class {
  constructor(httpClient, accessToken, logger, options) {
    this._httpClient = httpClient;
    this._accessToken = accessToken;
    this._logger = logger;
    this._options = options;
    this.onreceive = null;
    this.onclose = null;
  }
  async connect(url, transferFormat) {
    Arg.isRequired(url, "url");
    Arg.isRequired(transferFormat, "transferFormat");
    Arg.isIn(transferFormat, TransferFormat, "transferFormat");
    this._logger.log(LogLevel.Trace, "(SSE transport) Connecting.");
    this._url = url;
    if (this._accessToken) {
      url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(this._accessToken)}`;
    }
    return new Promise((resolve, reject) => {
      let opened = false;
      if (transferFormat !== TransferFormat.Text) {
        reject(new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));
        return;
      }
      let eventSource;
      if (Platform.isBrowser || Platform.isWebWorker) {
        eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials });
      } else {
        const cookies = this._httpClient.getCookieString(url);
        const headers = {};
        headers.Cookie = cookies;
        const [name, value] = getUserAgentHeader();
        headers[name] = value;
        eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials, headers: __spreadValues(__spreadValues({}, headers), this._options.headers) });
      }
      try {
        eventSource.onmessage = (e) => {
          if (this.onreceive) {
            try {
              this._logger.log(LogLevel.Trace, `(SSE transport) data received. ${getDataDetail(e.data, this._options.logMessageContent)}.`);
              this.onreceive(e.data);
            } catch (error) {
              this._close(error);
              return;
            }
          }
        };
        eventSource.onerror = (e) => {
          if (opened) {
            this._close();
          } else {
            reject(new Error("EventSource failed to connect. The connection could not be found on the server, either the connection ID is not present on the server, or a proxy is refusing/buffering the connection. If you have multiple servers check that sticky sessions are enabled."));
          }
        };
        eventSource.onopen = () => {
          this._logger.log(LogLevel.Information, `SSE connected to ${this._url}`);
          this._eventSource = eventSource;
          opened = true;
          resolve();
        };
      } catch (e) {
        reject(e);
        return;
      }
    });
  }
  async send(data) {
    if (!this._eventSource) {
      return Promise.reject(new Error("Cannot send until the transport is connected"));
    }
    return sendMessage(this._logger, "SSE", this._httpClient, this._url, data, this._options);
  }
  stop() {
    this._close();
    return Promise.resolve();
  }
  _close(e) {
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = void 0;
      if (this.onclose) {
        this.onclose(e);
      }
    }
  }
};

// node_modules/@microsoft/signalr/dist/esm/WebSocketTransport.js
var WebSocketTransport = class {
  constructor(httpClient, accessTokenFactory, logger, logMessageContent, webSocketConstructor, headers) {
    this._logger = logger;
    this._accessTokenFactory = accessTokenFactory;
    this._logMessageContent = logMessageContent;
    this._webSocketConstructor = webSocketConstructor;
    this._httpClient = httpClient;
    this.onreceive = null;
    this.onclose = null;
    this._headers = headers;
  }
  async connect(url, transferFormat) {
    Arg.isRequired(url, "url");
    Arg.isRequired(transferFormat, "transferFormat");
    Arg.isIn(transferFormat, TransferFormat, "transferFormat");
    this._logger.log(LogLevel.Trace, "(WebSockets transport) Connecting.");
    let token;
    if (this._accessTokenFactory) {
      token = await this._accessTokenFactory();
    }
    return new Promise((resolve, reject) => {
      url = url.replace(/^http/, "ws");
      let webSocket;
      const cookies = this._httpClient.getCookieString(url);
      let opened = false;
      if (Platform.isNode || Platform.isReactNative) {
        const headers = {};
        const [name, value] = getUserAgentHeader();
        headers[name] = value;
        if (token) {
          headers[HeaderNames.Authorization] = `Bearer ${token}`;
        }
        if (cookies) {
          headers[HeaderNames.Cookie] = cookies;
        }
        webSocket = new this._webSocketConstructor(url, void 0, {
          headers: __spreadValues(__spreadValues({}, headers), this._headers)
        });
      } else {
        if (token) {
          url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(token)}`;
        }
      }
      if (!webSocket) {
        webSocket = new this._webSocketConstructor(url);
      }
      if (transferFormat === TransferFormat.Binary) {
        webSocket.binaryType = "arraybuffer";
      }
      webSocket.onopen = (_event) => {
        this._logger.log(LogLevel.Information, `WebSocket connected to ${url}.`);
        this._webSocket = webSocket;
        opened = true;
        resolve();
      };
      webSocket.onerror = (event) => {
        let error = null;
        if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
          error = event.error;
        } else {
          error = "There was an error with the transport";
        }
        this._logger.log(LogLevel.Information, `(WebSockets transport) ${error}.`);
      };
      webSocket.onmessage = (message) => {
        this._logger.log(LogLevel.Trace, `(WebSockets transport) data received. ${getDataDetail(message.data, this._logMessageContent)}.`);
        if (this.onreceive) {
          try {
            this.onreceive(message.data);
          } catch (error) {
            this._close(error);
            return;
          }
        }
      };
      webSocket.onclose = (event) => {
        if (opened) {
          this._close(event);
        } else {
          let error = null;
          if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
            error = event.error;
          } else {
            error = "WebSocket failed to connect. The connection could not be found on the server, either the endpoint may not be a SignalR endpoint, the connection ID is not present on the server, or there is a proxy blocking WebSockets. If you have multiple servers check that sticky sessions are enabled.";
          }
          reject(new Error(error));
        }
      };
    });
  }
  send(data) {
    if (this._webSocket && this._webSocket.readyState === this._webSocketConstructor.OPEN) {
      this._logger.log(LogLevel.Trace, `(WebSockets transport) sending data. ${getDataDetail(data, this._logMessageContent)}.`);
      this._webSocket.send(data);
      return Promise.resolve();
    }
    return Promise.reject("WebSocket is not in the OPEN state");
  }
  stop() {
    if (this._webSocket) {
      this._close(void 0);
    }
    return Promise.resolve();
  }
  _close(event) {
    if (this._webSocket) {
      this._webSocket.onclose = () => {
      };
      this._webSocket.onmessage = () => {
      };
      this._webSocket.onerror = () => {
      };
      this._webSocket.close();
      this._webSocket = void 0;
    }
    this._logger.log(LogLevel.Trace, "(WebSockets transport) socket closed.");
    if (this.onclose) {
      if (this._isCloseEvent(event) && (event.wasClean === false || event.code !== 1e3)) {
        this.onclose(new Error(`WebSocket closed with status code: ${event.code} (${event.reason || "no reason given"}).`));
      } else if (event instanceof Error) {
        this.onclose(event);
      } else {
        this.onclose();
      }
    }
  }
  _isCloseEvent(event) {
    return event && typeof event.wasClean === "boolean" && typeof event.code === "number";
  }
};

// node_modules/@microsoft/signalr/dist/esm/HttpConnection.js
var MAX_REDIRECTS = 100;
var HttpConnection = class {
  constructor(url, options = {}) {
    this._stopPromiseResolver = () => {
    };
    this.features = {};
    this._negotiateVersion = 1;
    Arg.isRequired(url, "url");
    this._logger = createLogger(options.logger);
    this.baseUrl = this._resolveUrl(url);
    options = options || {};
    options.logMessageContent = options.logMessageContent === void 0 ? false : options.logMessageContent;
    if (typeof options.withCredentials === "boolean" || options.withCredentials === void 0) {
      options.withCredentials = options.withCredentials === void 0 ? true : options.withCredentials;
    } else {
      throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");
    }
    options.timeout = options.timeout === void 0 ? 100 * 1e3 : options.timeout;
    let webSocketModule = null;
    let eventSourceModule = null;
    if (Platform.isNode && typeof __require !== "undefined") {
      const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
      webSocketModule = requireFunc("ws");
      eventSourceModule = requireFunc("eventsource");
    }
    if (!Platform.isNode && typeof WebSocket !== "undefined" && !options.WebSocket) {
      options.WebSocket = WebSocket;
    } else if (Platform.isNode && !options.WebSocket) {
      if (webSocketModule) {
        options.WebSocket = webSocketModule;
      }
    }
    if (!Platform.isNode && typeof EventSource !== "undefined" && !options.EventSource) {
      options.EventSource = EventSource;
    } else if (Platform.isNode && !options.EventSource) {
      if (typeof eventSourceModule !== "undefined") {
        options.EventSource = eventSourceModule;
      }
    }
    this._httpClient = new AccessTokenHttpClient(options.httpClient || new DefaultHttpClient(this._logger), options.accessTokenFactory);
    this._connectionState = "Disconnected";
    this._connectionStarted = false;
    this._options = options;
    this.onreceive = null;
    this.onclose = null;
  }
  async start(transferFormat) {
    transferFormat = transferFormat || TransferFormat.Binary;
    Arg.isIn(transferFormat, TransferFormat, "transferFormat");
    this._logger.log(LogLevel.Debug, `Starting connection with transfer format '${TransferFormat[transferFormat]}'.`);
    if (this._connectionState !== "Disconnected") {
      return Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));
    }
    this._connectionState = "Connecting";
    this._startInternalPromise = this._startInternal(transferFormat);
    await this._startInternalPromise;
    if (this._connectionState === "Disconnecting") {
      const message = "Failed to start the HttpConnection before stop() was called.";
      this._logger.log(LogLevel.Error, message);
      await this._stopPromise;
      return Promise.reject(new AbortError(message));
    } else if (this._connectionState !== "Connected") {
      const message = "HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";
      this._logger.log(LogLevel.Error, message);
      return Promise.reject(new AbortError(message));
    }
    this._connectionStarted = true;
  }
  send(data) {
    if (this._connectionState !== "Connected") {
      return Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State."));
    }
    if (!this._sendQueue) {
      this._sendQueue = new TransportSendQueue(this.transport);
    }
    return this._sendQueue.send(data);
  }
  async stop(error) {
    if (this._connectionState === "Disconnected") {
      this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnected state.`);
      return Promise.resolve();
    }
    if (this._connectionState === "Disconnecting") {
      this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
      return this._stopPromise;
    }
    this._connectionState = "Disconnecting";
    this._stopPromise = new Promise((resolve) => {
      this._stopPromiseResolver = resolve;
    });
    await this._stopInternal(error);
    await this._stopPromise;
  }
  async _stopInternal(error) {
    this._stopError = error;
    try {
      await this._startInternalPromise;
    } catch (e) {
    }
    if (this.transport) {
      try {
        await this.transport.stop();
      } catch (e) {
        this._logger.log(LogLevel.Error, `HttpConnection.transport.stop() threw error '${e}'.`);
        this._stopConnection();
      }
      this.transport = void 0;
    } else {
      this._logger.log(LogLevel.Debug, "HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.");
    }
  }
  async _startInternal(transferFormat) {
    let url = this.baseUrl;
    this._accessTokenFactory = this._options.accessTokenFactory;
    this._httpClient._accessTokenFactory = this._accessTokenFactory;
    try {
      if (this._options.skipNegotiation) {
        if (this._options.transport === HttpTransportType.WebSockets) {
          this.transport = this._constructTransport(HttpTransportType.WebSockets);
          await this._startTransport(url, transferFormat);
        } else {
          throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");
        }
      } else {
        let negotiateResponse = null;
        let redirects = 0;
        do {
          negotiateResponse = await this._getNegotiationResponse(url);
          if (this._connectionState === "Disconnecting" || this._connectionState === "Disconnected") {
            throw new AbortError("The connection was stopped during negotiation.");
          }
          if (negotiateResponse.error) {
            throw new Error(negotiateResponse.error);
          }
          if (negotiateResponse.ProtocolVersion) {
            throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");
          }
          if (negotiateResponse.url) {
            url = negotiateResponse.url;
          }
          if (negotiateResponse.accessToken) {
            const accessToken = negotiateResponse.accessToken;
            this._accessTokenFactory = () => accessToken;
            this._httpClient._accessToken = accessToken;
            this._httpClient._accessTokenFactory = void 0;
          }
          redirects++;
        } while (negotiateResponse.url && redirects < MAX_REDIRECTS);
        if (redirects === MAX_REDIRECTS && negotiateResponse.url) {
          throw new Error("Negotiate redirection limit exceeded.");
        }
        await this._createTransport(url, this._options.transport, negotiateResponse, transferFormat);
      }
      if (this.transport instanceof LongPollingTransport) {
        this.features.inherentKeepAlive = true;
      }
      if (this._connectionState === "Connecting") {
        this._logger.log(LogLevel.Debug, "The HttpConnection connected successfully.");
        this._connectionState = "Connected";
      }
    } catch (e) {
      this._logger.log(LogLevel.Error, "Failed to start the connection: " + e);
      this._connectionState = "Disconnected";
      this.transport = void 0;
      this._stopPromiseResolver();
      return Promise.reject(e);
    }
  }
  async _getNegotiationResponse(url) {
    const headers = {};
    const [name, value] = getUserAgentHeader();
    headers[name] = value;
    const negotiateUrl = this._resolveNegotiateUrl(url);
    this._logger.log(LogLevel.Debug, `Sending negotiation request: ${negotiateUrl}.`);
    try {
      const response = await this._httpClient.post(negotiateUrl, {
        content: "",
        headers: __spreadValues(__spreadValues({}, headers), this._options.headers),
        timeout: this._options.timeout,
        withCredentials: this._options.withCredentials
      });
      if (response.statusCode !== 200) {
        return Promise.reject(new Error(`Unexpected status code returned from negotiate '${response.statusCode}'`));
      }
      const negotiateResponse = JSON.parse(response.content);
      if (!negotiateResponse.negotiateVersion || negotiateResponse.negotiateVersion < 1) {
        negotiateResponse.connectionToken = negotiateResponse.connectionId;
      }
      if (negotiateResponse.useStatefulReconnect && this._options._useStatefulReconnect !== true) {
        return Promise.reject(new FailedToNegotiateWithServerError("Client didn't negotiate Stateful Reconnect but the server did."));
      }
      return negotiateResponse;
    } catch (e) {
      let errorMessage = "Failed to complete negotiation with the server: " + e;
      if (e instanceof HttpError) {
        if (e.statusCode === 404) {
          errorMessage = errorMessage + " Either this is not a SignalR endpoint or there is a proxy blocking the connection.";
        }
      }
      this._logger.log(LogLevel.Error, errorMessage);
      return Promise.reject(new FailedToNegotiateWithServerError(errorMessage));
    }
  }
  _createConnectUrl(url, connectionToken) {
    if (!connectionToken) {
      return url;
    }
    return url + (url.indexOf("?") === -1 ? "?" : "&") + `id=${connectionToken}`;
  }
  async _createTransport(url, requestedTransport, negotiateResponse, requestedTransferFormat) {
    let connectUrl = this._createConnectUrl(url, negotiateResponse.connectionToken);
    if (this._isITransport(requestedTransport)) {
      this._logger.log(LogLevel.Debug, "Connection was provided an instance of ITransport, using that directly.");
      this.transport = requestedTransport;
      await this._startTransport(connectUrl, requestedTransferFormat);
      this.connectionId = negotiateResponse.connectionId;
      return;
    }
    const transportExceptions = [];
    const transports = negotiateResponse.availableTransports || [];
    let negotiate = negotiateResponse;
    for (const endpoint of transports) {
      const transportOrError = this._resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, (negotiate === null || negotiate === void 0 ? void 0 : negotiate.useStatefulReconnect) === true);
      if (transportOrError instanceof Error) {
        transportExceptions.push(`${endpoint.transport} failed:`);
        transportExceptions.push(transportOrError);
      } else if (this._isITransport(transportOrError)) {
        this.transport = transportOrError;
        if (!negotiate) {
          try {
            negotiate = await this._getNegotiationResponse(url);
          } catch (ex) {
            return Promise.reject(ex);
          }
          connectUrl = this._createConnectUrl(url, negotiate.connectionToken);
        }
        try {
          await this._startTransport(connectUrl, requestedTransferFormat);
          this.connectionId = negotiate.connectionId;
          return;
        } catch (ex) {
          this._logger.log(LogLevel.Error, `Failed to start the transport '${endpoint.transport}': ${ex}`);
          negotiate = void 0;
          transportExceptions.push(new FailedToStartTransportError(`${endpoint.transport} failed: ${ex}`, HttpTransportType[endpoint.transport]));
          if (this._connectionState !== "Connecting") {
            const message = "Failed to select transport before stop() was called.";
            this._logger.log(LogLevel.Debug, message);
            return Promise.reject(new AbortError(message));
          }
        }
      }
    }
    if (transportExceptions.length > 0) {
      return Promise.reject(new AggregateErrors(`Unable to connect to the server with any of the available transports. ${transportExceptions.join(" ")}`, transportExceptions));
    }
    return Promise.reject(new Error("None of the transports supported by the client are supported by the server."));
  }
  _constructTransport(transport) {
    switch (transport) {
      case HttpTransportType.WebSockets:
        if (!this._options.WebSocket) {
          throw new Error("'WebSocket' is not supported in your environment.");
        }
        return new WebSocketTransport(this._httpClient, this._accessTokenFactory, this._logger, this._options.logMessageContent, this._options.WebSocket, this._options.headers || {});
      case HttpTransportType.ServerSentEvents:
        if (!this._options.EventSource) {
          throw new Error("'EventSource' is not supported in your environment.");
        }
        return new ServerSentEventsTransport(this._httpClient, this._httpClient._accessToken, this._logger, this._options);
      case HttpTransportType.LongPolling:
        return new LongPollingTransport(this._httpClient, this._logger, this._options);
      default:
        throw new Error(`Unknown transport: ${transport}.`);
    }
  }
  _startTransport(url, transferFormat) {
    this.transport.onreceive = this.onreceive;
    if (this.features.reconnect) {
      this.transport.onclose = async (e) => {
        let callStop = false;
        if (this.features.reconnect) {
          try {
            this.features.disconnected();
            await this.transport.connect(url, transferFormat);
            await this.features.resend();
          } catch {
            callStop = true;
          }
        } else {
          this._stopConnection(e);
          return;
        }
        if (callStop) {
          this._stopConnection(e);
        }
      };
    } else {
      this.transport.onclose = (e) => this._stopConnection(e);
    }
    return this.transport.connect(url, transferFormat);
  }
  _resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, useStatefulReconnect) {
    const transport = HttpTransportType[endpoint.transport];
    if (transport === null || transport === void 0) {
      this._logger.log(LogLevel.Debug, `Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
      return new Error(`Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
    } else {
      if (transportMatches(requestedTransport, transport)) {
        const transferFormats = endpoint.transferFormats.map((s) => TransferFormat[s]);
        if (transferFormats.indexOf(requestedTransferFormat) >= 0) {
          if (transport === HttpTransportType.WebSockets && !this._options.WebSocket || transport === HttpTransportType.ServerSentEvents && !this._options.EventSource) {
            this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it is not supported in your environment.'`);
            return new UnsupportedTransportError(`'${HttpTransportType[transport]}' is not supported in your environment.`, transport);
          } else {
            this._logger.log(LogLevel.Debug, `Selecting transport '${HttpTransportType[transport]}'.`);
            try {
              this.features.reconnect = transport === HttpTransportType.WebSockets ? useStatefulReconnect : void 0;
              return this._constructTransport(transport);
            } catch (ex) {
              return ex;
            }
          }
        } else {
          this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it does not support the requested transfer format '${TransferFormat[requestedTransferFormat]}'.`);
          return new Error(`'${HttpTransportType[transport]}' does not support ${TransferFormat[requestedTransferFormat]}.`);
        }
      } else {
        this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it was disabled by the client.`);
        return new DisabledTransportError(`'${HttpTransportType[transport]}' is disabled by the client.`, transport);
      }
    }
  }
  _isITransport(transport) {
    return transport && typeof transport === "object" && "connect" in transport;
  }
  _stopConnection(error) {
    this._logger.log(LogLevel.Debug, `HttpConnection.stopConnection(${error}) called while in state ${this._connectionState}.`);
    this.transport = void 0;
    error = this._stopError || error;
    this._stopError = void 0;
    if (this._connectionState === "Disconnected") {
      this._logger.log(LogLevel.Debug, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is already in the disconnected state.`);
      return;
    }
    if (this._connectionState === "Connecting") {
      this._logger.log(LogLevel.Warning, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is still in the connecting state.`);
      throw new Error(`HttpConnection.stopConnection(${error}) was called while the connection is still in the connecting state.`);
    }
    if (this._connectionState === "Disconnecting") {
      this._stopPromiseResolver();
    }
    if (error) {
      this._logger.log(LogLevel.Error, `Connection disconnected with error '${error}'.`);
    } else {
      this._logger.log(LogLevel.Information, "Connection disconnected.");
    }
    if (this._sendQueue) {
      this._sendQueue.stop().catch((e) => {
        this._logger.log(LogLevel.Error, `TransportSendQueue.stop() threw error '${e}'.`);
      });
      this._sendQueue = void 0;
    }
    this.connectionId = void 0;
    this._connectionState = "Disconnected";
    if (this._connectionStarted) {
      this._connectionStarted = false;
      try {
        if (this.onclose) {
          this.onclose(error);
        }
      } catch (e) {
        this._logger.log(LogLevel.Error, `HttpConnection.onclose(${error}) threw error '${e}'.`);
      }
    }
  }
  _resolveUrl(url) {
    if (url.lastIndexOf("https://", 0) === 0 || url.lastIndexOf("http://", 0) === 0) {
      return url;
    }
    if (!Platform.isBrowser) {
      throw new Error(`Cannot resolve '${url}'.`);
    }
    const aTag = window.document.createElement("a");
    aTag.href = url;
    this._logger.log(LogLevel.Information, `Normalizing '${url}' to '${aTag.href}'.`);
    return aTag.href;
  }
  _resolveNegotiateUrl(url) {
    const negotiateUrl = new URL(url);
    if (negotiateUrl.pathname.endsWith("/")) {
      negotiateUrl.pathname += "negotiate";
    } else {
      negotiateUrl.pathname += "/negotiate";
    }
    const searchParams = new URLSearchParams(negotiateUrl.searchParams);
    if (!searchParams.has("negotiateVersion")) {
      searchParams.append("negotiateVersion", this._negotiateVersion.toString());
    }
    if (searchParams.has("useStatefulReconnect")) {
      if (searchParams.get("useStatefulReconnect") === "true") {
        this._options._useStatefulReconnect = true;
      }
    } else if (this._options._useStatefulReconnect === true) {
      searchParams.append("useStatefulReconnect", "true");
    }
    negotiateUrl.search = searchParams.toString();
    return negotiateUrl.toString();
  }
};
function transportMatches(requestedTransport, actualTransport) {
  return !requestedTransport || (actualTransport & requestedTransport) !== 0;
}
var TransportSendQueue = class _TransportSendQueue {
  constructor(_transport) {
    this._transport = _transport;
    this._buffer = [];
    this._executing = true;
    this._sendBufferedData = new PromiseSource();
    this._transportResult = new PromiseSource();
    this._sendLoopPromise = this._sendLoop();
  }
  send(data) {
    this._bufferData(data);
    if (!this._transportResult) {
      this._transportResult = new PromiseSource();
    }
    return this._transportResult.promise;
  }
  stop() {
    this._executing = false;
    this._sendBufferedData.resolve();
    return this._sendLoopPromise;
  }
  _bufferData(data) {
    if (this._buffer.length && typeof this._buffer[0] !== typeof data) {
      throw new Error(`Expected data to be of type ${typeof this._buffer} but was of type ${typeof data}`);
    }
    this._buffer.push(data);
    this._sendBufferedData.resolve();
  }
  async _sendLoop() {
    while (true) {
      await this._sendBufferedData.promise;
      if (!this._executing) {
        if (this._transportResult) {
          this._transportResult.reject("Connection stopped.");
        }
        break;
      }
      this._sendBufferedData = new PromiseSource();
      const transportResult = this._transportResult;
      this._transportResult = void 0;
      const data = typeof this._buffer[0] === "string" ? this._buffer.join("") : _TransportSendQueue._concatBuffers(this._buffer);
      this._buffer.length = 0;
      try {
        await this._transport.send(data);
        transportResult.resolve();
      } catch (error) {
        transportResult.reject(error);
      }
    }
  }
  static _concatBuffers(arrayBuffers) {
    const totalLength = arrayBuffers.map((b) => b.byteLength).reduce((a, b) => a + b);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const item of arrayBuffers) {
      result.set(new Uint8Array(item), offset);
      offset += item.byteLength;
    }
    return result.buffer;
  }
};
var PromiseSource = class {
  constructor() {
    this.promise = new Promise((resolve, reject) => [this._resolver, this._rejecter] = [resolve, reject]);
  }
  resolve() {
    this._resolver();
  }
  reject(reason) {
    this._rejecter(reason);
  }
};

// node_modules/@microsoft/signalr/dist/esm/JsonHubProtocol.js
var JSON_HUB_PROTOCOL_NAME = "json";
var JsonHubProtocol = class {
  constructor() {
    this.name = JSON_HUB_PROTOCOL_NAME;
    this.version = 2;
    this.transferFormat = TransferFormat.Text;
  }
  /** Creates an array of {@link @microsoft/signalr.HubMessage} objects from the specified serialized representation.
   *
   * @param {string} input A string containing the serialized representation.
   * @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
   */
  parseMessages(input, logger) {
    if (typeof input !== "string") {
      throw new Error("Invalid input for JSON hub protocol. Expected a string.");
    }
    if (!input) {
      return [];
    }
    if (logger === null) {
      logger = NullLogger.instance;
    }
    const messages = TextMessageFormat.parse(input);
    const hubMessages = [];
    for (const message of messages) {
      const parsedMessage = JSON.parse(message);
      if (typeof parsedMessage.type !== "number") {
        throw new Error("Invalid payload.");
      }
      switch (parsedMessage.type) {
        case MessageType.Invocation:
          this._isInvocationMessage(parsedMessage);
          break;
        case MessageType.StreamItem:
          this._isStreamItemMessage(parsedMessage);
          break;
        case MessageType.Completion:
          this._isCompletionMessage(parsedMessage);
          break;
        case MessageType.Ping:
          break;
        case MessageType.Close:
          break;
        case MessageType.Ack:
          this._isAckMessage(parsedMessage);
          break;
        case MessageType.Sequence:
          this._isSequenceMessage(parsedMessage);
          break;
        default:
          logger.log(LogLevel.Information, "Unknown message type '" + parsedMessage.type + "' ignored.");
          continue;
      }
      hubMessages.push(parsedMessage);
    }
    return hubMessages;
  }
  /** Writes the specified {@link @microsoft/signalr.HubMessage} to a string and returns it.
   *
   * @param {HubMessage} message The message to write.
   * @returns {string} A string containing the serialized representation of the message.
   */
  writeMessage(message) {
    return TextMessageFormat.write(JSON.stringify(message));
  }
  _isInvocationMessage(message) {
    this._assertNotEmptyString(message.target, "Invalid payload for Invocation message.");
    if (message.invocationId !== void 0) {
      this._assertNotEmptyString(message.invocationId, "Invalid payload for Invocation message.");
    }
  }
  _isStreamItemMessage(message) {
    this._assertNotEmptyString(message.invocationId, "Invalid payload for StreamItem message.");
    if (message.item === void 0) {
      throw new Error("Invalid payload for StreamItem message.");
    }
  }
  _isCompletionMessage(message) {
    if (message.result && message.error) {
      throw new Error("Invalid payload for Completion message.");
    }
    if (!message.result && message.error) {
      this._assertNotEmptyString(message.error, "Invalid payload for Completion message.");
    }
    this._assertNotEmptyString(message.invocationId, "Invalid payload for Completion message.");
  }
  _isAckMessage(message) {
    if (typeof message.sequenceId !== "number") {
      throw new Error("Invalid SequenceId for Ack message.");
    }
  }
  _isSequenceMessage(message) {
    if (typeof message.sequenceId !== "number") {
      throw new Error("Invalid SequenceId for Sequence message.");
    }
  }
  _assertNotEmptyString(value, errorMessage) {
    if (typeof value !== "string" || value === "") {
      throw new Error(errorMessage);
    }
  }
};

// node_modules/@microsoft/signalr/dist/esm/HubConnectionBuilder.js
var LogLevelNameMapping = {
  trace: LogLevel.Trace,
  debug: LogLevel.Debug,
  info: LogLevel.Information,
  information: LogLevel.Information,
  warn: LogLevel.Warning,
  warning: LogLevel.Warning,
  error: LogLevel.Error,
  critical: LogLevel.Critical,
  none: LogLevel.None
};
function parseLogLevel(name) {
  const mapping = LogLevelNameMapping[name.toLowerCase()];
  if (typeof mapping !== "undefined") {
    return mapping;
  } else {
    throw new Error(`Unknown log level: ${name}`);
  }
}
var HubConnectionBuilder = class {
  configureLogging(logging) {
    Arg.isRequired(logging, "logging");
    if (isLogger(logging)) {
      this.logger = logging;
    } else if (typeof logging === "string") {
      const logLevel = parseLogLevel(logging);
      this.logger = new ConsoleLogger(logLevel);
    } else {
      this.logger = new ConsoleLogger(logging);
    }
    return this;
  }
  withUrl(url, transportTypeOrOptions) {
    Arg.isRequired(url, "url");
    Arg.isNotEmpty(url, "url");
    this.url = url;
    if (typeof transportTypeOrOptions === "object") {
      this.httpConnectionOptions = __spreadValues(__spreadValues({}, this.httpConnectionOptions), transportTypeOrOptions);
    } else {
      this.httpConnectionOptions = __spreadProps(__spreadValues({}, this.httpConnectionOptions), {
        transport: transportTypeOrOptions
      });
    }
    return this;
  }
  /** Configures the {@link @microsoft/signalr.HubConnection} to use the specified Hub Protocol.
   *
   * @param {IHubProtocol} protocol The {@link @microsoft/signalr.IHubProtocol} implementation to use.
   */
  withHubProtocol(protocol) {
    Arg.isRequired(protocol, "protocol");
    this.protocol = protocol;
    return this;
  }
  withAutomaticReconnect(retryDelaysOrReconnectPolicy) {
    if (this.reconnectPolicy) {
      throw new Error("A reconnectPolicy has already been set.");
    }
    if (!retryDelaysOrReconnectPolicy) {
      this.reconnectPolicy = new DefaultReconnectPolicy();
    } else if (Array.isArray(retryDelaysOrReconnectPolicy)) {
      this.reconnectPolicy = new DefaultReconnectPolicy(retryDelaysOrReconnectPolicy);
    } else {
      this.reconnectPolicy = retryDelaysOrReconnectPolicy;
    }
    return this;
  }
  /** Configures {@link @microsoft/signalr.HubConnection.serverTimeoutInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
   *
   * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
   */
  withServerTimeout(milliseconds) {
    Arg.isRequired(milliseconds, "milliseconds");
    this._serverTimeoutInMilliseconds = milliseconds;
    return this;
  }
  /** Configures {@link @microsoft/signalr.HubConnection.keepAliveIntervalInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
   *
   * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
   */
  withKeepAliveInterval(milliseconds) {
    Arg.isRequired(milliseconds, "milliseconds");
    this._keepAliveIntervalInMilliseconds = milliseconds;
    return this;
  }
  /** Enables and configures options for the Stateful Reconnect feature.
   *
   * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
   */
  withStatefulReconnect(options) {
    if (this.httpConnectionOptions === void 0) {
      this.httpConnectionOptions = {};
    }
    this.httpConnectionOptions._useStatefulReconnect = true;
    this._statefulReconnectBufferSize = options === null || options === void 0 ? void 0 : options.bufferSize;
    return this;
  }
  /** Creates a {@link @microsoft/signalr.HubConnection} from the configuration options specified in this builder.
   *
   * @returns {HubConnection} The configured {@link @microsoft/signalr.HubConnection}.
   */
  build() {
    const httpConnectionOptions = this.httpConnectionOptions || {};
    if (httpConnectionOptions.logger === void 0) {
      httpConnectionOptions.logger = this.logger;
    }
    if (!this.url) {
      throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");
    }
    const connection = new HttpConnection(this.url, httpConnectionOptions);
    return HubConnection.create(connection, this.logger || NullLogger.instance, this.protocol || new JsonHubProtocol(), this.reconnectPolicy, this._serverTimeoutInMilliseconds, this._keepAliveIntervalInMilliseconds, this._statefulReconnectBufferSize);
  }
};
function isLogger(logger) {
  return logger.log !== void 0;
}

// src/app/features/rider/rider-notification.service.ts
var RiderNotificationService = class _RiderNotificationService {
  riderApi;
  shownNotifications = /* @__PURE__ */ new Set();
  hubConnection = null;
  /**
   * Track active timers so we can clear them
   * if another rider accepts the order
   */
  activeTimers = /* @__PURE__ */ new Map();
  // ─────────────────────────────────────────────────────────────
  // RXJS EVENTS
  // ─────────────────────────────────────────────────────────────
  /** New order pushed from SignalR */
  newOrder$ = new Subject();
  /** Another rider accepted */
  orderAccepted$ = new Subject();
  /** Server-side expiration */
  orderExpired$ = new Subject();
  /** Current rider accepted */
  orderAcceptedByCurrentRider$ = new Subject();
  /** Current rider rejected OR timeout */
  orderRejected$ = new Subject();
  constructor(riderApi) {
    this.riderApi = riderApi;
  }
  // ─────────────────────────────────────────────────────────────
  // SIGNALR HUB
  // ─────────────────────────────────────────────────────────────
  connectToHub(customerId) {
    if (this.hubConnection) {
      return;
    }
    this.hubConnection = new HubConnectionBuilder().withUrl("/hubs/rider-notifications", {
      withCredentials: true
    }).withAutomaticReconnect([0, 2e3, 5e3, 1e4, 3e4]).configureLogging(LogLevel.Warning).build();
    this.hubConnection.on("NewOrderAvailable", (payload) => {
      console.log("[SignalR] New order received:", payload.orderId);
      this.newOrder$.next(payload);
      this.notifyRider({
        id: payload.notificationId ?? `order-${payload.orderId}`,
        title: "\u{1F6F5} New Order Available!",
        message: `Order #${payload.orderId} \u2014 ${payload.orderTotal}${payload.shippingAddress ? " \xB7 " + payload.shippingAddress : ""}`,
        data: payload
      });
    });
    this.hubConnection.on("OrderNotificationExpired", (payload) => {
      console.log("[SignalR] Order expired:", payload.orderId);
      this.clearOrderTimer(payload.orderId);
      this.orderExpired$.next(payload.orderId);
    });
    this.hubConnection.on("OrderAlreadyAccepted", (payload) => {
      console.log("[SignalR] Already accepted by another rider:", payload.orderId);
      this.clearOrderTimer(payload.orderId);
      this.orderAccepted$.next(payload.orderId);
    });
    this.hubConnection.onreconnected(() => {
      console.log("[SignalR] Reconnected \u2014 re-registering rider", customerId);
      this.hubConnection?.invoke("RegisterRider", customerId).catch((err) => console.error("[SignalR] Re-register after reconnect failed:", err));
    });
    this.hubConnection.start().then(() => {
      console.log("[SignalR] Connected \u2014 registering rider", customerId);
      return this.hubConnection.invoke("RegisterRider", customerId);
    }).catch((err) => {
      console.error("[SignalR] Connection error:", err);
      this.hubConnection = null;
    });
  }
  disconnectFromHub() {
    if (this.hubConnection) {
      const conn = this.hubConnection;
      this.hubConnection = null;
      conn.stop().catch(() => {
      });
    }
  }
  ngOnDestroy() {
    this.disconnectFromHub();
    this.activeTimers.forEach((timer) => {
      clearInterval(timer);
    });
    this.activeTimers.clear();
    this.newOrder$.complete();
    this.orderAccepted$.complete();
    this.orderExpired$.complete();
    this.orderAcceptedByCurrentRider$.complete();
    this.orderRejected$.complete();
  }
  // ─────────────────────────────────────────────────────────────
  // NOTIFICATION ENTRY
  // ─────────────────────────────────────────────────────────────
  notifyRider(options) {
    if (this.shownNotifications.has(options.id)) {
      return;
    }
    this.shownNotifications.add(options.id);
    this.showToast(options);
    this.playSound(options.soundUrl);
  }
  // ─────────────────────────────────────────────────────────────
  // TOAST UI
  // ─────────────────────────────────────────────────────────────
  showToast(options) {
    const payload = options.data;
    let handled = false;
    const expiresIn = payload?.expiresInSeconds ?? 60;
    const expiresAt = Date.now() + expiresIn * 1e3;
    let remaining = expiresIn;
    const toast = document.createElement("div");
    toast.setAttribute("role", "alert");
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      min-width: 320px;
      max-width: 380px;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      color: #fff;
      border-left: 5px solid #f5a623;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      font-family: 'Poppins', 'Segoe UI', sans-serif;
      animation: slideInRight 0.4s ease;
    `;
    toast.innerHTML = `
      <style>

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(120px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }

          to {
            opacity: 0;
            transform: translateX(120px);
          }
        }

        .toast-btn {
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .toast-btn:hover {
          transform: scale(1.03);
        }

        .accept-btn {
          background: #22c55e;
          color: white;
        }

        .reject-btn {
          background: #ef4444;
          color: white;
        }

      </style>

      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        margin-bottom:6px;
      ">

        <span style="font-size:1.4rem;">\u{1F6F5}</span>

        <strong style="
          font-size:0.95rem;
          color:#f5a623;
        ">
          ${options.title}
        </strong>

      </div>

      <p style="
        font-size:0.85rem;
        opacity:0.9;
        margin:0;
      ">
        ${options.message}
      </p>

      <div style="
        margin-top:14px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
      ">

        <div style="
          font-size:0.82rem;
          opacity:0.85;
        ">
          \u23F3 Auto reject in
        </div>

        <div
          id="countdown"
          style="
            min-width:42px;
            height:42px;
            border-radius:50%;
            background:#f5a623;
            color:#111;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:1rem;
            font-weight:700;
            box-shadow:0 0 10px rgba(245,166,35,0.35);
          "
        >
          ${remaining}
        </div>

      </div>

      <div style="
        display:flex;
        gap:10px;
        margin-top:16px;
      ">

        <button
          class="toast-btn accept-btn"
          id="accept-btn"
        >
          Accept
        </button>

        <button
          class="toast-btn reject-btn"
          id="reject-btn"
        >
          Reject
        </button>

      </div>

      <p style="
        font-size:0.72rem;
        opacity:0.45;
        margin-top:10px;
      ">
        ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}
      </p>
    `;
    document.body.appendChild(toast);
    const countdownEl = toast.querySelector("#countdown");
    const dismiss = () => {
      if (handled) {
        return;
      }
      handled = true;
      const existingTimer = this.activeTimers.get(payload.orderId);
      if (existingTimer) {
        clearInterval(existingTimer);
        this.activeTimers.delete(payload.orderId);
      }
      toast.style.animation = "fadeOut 0.3s ease forwards";
      setTimeout(() => {
        toast.remove();
      }, 300);
    };
    toast.querySelector("#accept-btn")?.addEventListener("click", () => {
      if (handled) {
        return;
      }
      console.log("[Toast] Accepting order:", payload.orderId);
      this.riderApi.acceptOrder(payload.orderId).subscribe({
        next: (response) => {
          console.log("[API] Order accepted:", response);
          this.orderAcceptedByCurrentRider$.next(payload.orderId);
          dismiss();
        },
        error: (err) => {
          console.error("[API] Accept failed:", err);
        }
      });
    });
    toast.querySelector("#reject-btn")?.addEventListener("click", () => {
      if (handled) {
        return;
      }
      console.log("[Toast] Rejecting order:", payload.orderId);
      this.rejectOrder(payload.orderId, dismiss);
    });
    const timer = setInterval(() => {
      if (handled) {
        return;
      }
      remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1e3));
      if (countdownEl) {
        countdownEl.textContent = remaining.toString();
      }
      if (remaining <= 0) {
        clearInterval(timer);
        this.activeTimers.delete(payload.orderId);
        console.log("[Toast] Timer expired \u2192 auto reject:", payload.orderId);
        this.rejectOrder(payload.orderId, dismiss);
      }
    }, 250);
    this.activeTimers.set(payload.orderId, timer);
  }
  // ─────────────────────────────────────────────────────────────
  // REJECT HELPER
  // ─────────────────────────────────────────────────────────────
  rejectOrder(orderId, dismiss) {
    this.riderApi.rejectOrder(orderId).subscribe({
      next: (response) => {
        console.log("[API] Order rejected:", response);
        this.orderRejected$.next(orderId);
        dismiss();
      },
      error: (err) => {
        console.error("[API] Reject failed:", err);
        dismiss();
      }
    });
  }
  // ─────────────────────────────────────────────────────────────
  // CLEAR TIMER
  // ─────────────────────────────────────────────────────────────
  clearOrderTimer(orderId) {
    const timer = this.activeTimers.get(orderId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(orderId);
    }
  }
  // ─────────────────────────────────────────────────────────────
  // AUDIO
  // ─────────────────────────────────────────────────────────────
  playSound(soundUrl) {
    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.play().catch(() => this.playBeep());
        return;
      } catch {
      }
    }
    this.playBeep();
  }
  playBeep() {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.6);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.6);
    } catch {
    }
  }
  static \u0275fac = function RiderNotificationService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderNotificationService)(\u0275\u0275inject(RiderApiService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _RiderNotificationService, factory: _RiderNotificationService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderNotificationService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: RiderApiService }], null);
})();

// src/app/features/rider/rider-dashboard.component.ts
function RiderDashboardComponent_section_0_p_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Updated at ", ctx_r1.lastUpdated);
  }
}
function RiderDashboardComponent_section_0_main_13_section_21_article_3_span_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 45);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const order_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("\u{1F464} ", order_r5.customerName);
  }
}
function RiderDashboardComponent_section_0_main_13_section_21_article_3_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 45);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const order_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("\u{1F4DE} ", order_r5.customerPhone);
  }
}
function RiderDashboardComponent_section_0_main_13_section_21_article_3_span_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 46);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const order_r5 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("\u{1F4CD} ", order_r5.shippingAddress);
  }
}
function RiderDashboardComponent_section_0_main_13_section_21_article_3_div_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 47)(1, "div", 48)(2, "span", 49);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 50);
    \u0275\u0275text(5, "sec");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 51)(7, "div", 52);
    \u0275\u0275text(8, " Auto-rejected in ");
    \u0275\u0275elementStart(9, "strong");
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275text(11, " \u2014 respond now! ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "div", 53);
    \u0275\u0275element(13, "div", 54);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const order_r5 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance();
    \u0275\u0275classProp("warn", (ctx_r1.orderCountdowns()[order_r5.orderId] ?? 0) <= 20)("urgent", (ctx_r1.orderCountdowns()[order_r5.orderId] ?? 0) <= 10);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.orderCountdowns()[order_r5.orderId] ?? 0);
    \u0275\u0275advance(7);
    \u0275\u0275textInterpolate1("", ctx_r1.orderCountdowns()[order_r5.orderId] ?? 0, "s");
    \u0275\u0275advance(3);
    \u0275\u0275styleProp("width", ctx_r1.getCountdownPercent(order_r5.orderId, order_r5.expiresInSeconds ?? 60), "%");
    \u0275\u0275classProp("warn", (ctx_r1.orderCountdowns()[order_r5.orderId] ?? 0) <= 20)("urgent", (ctx_r1.orderCountdowns()[order_r5.orderId] ?? 0) <= 10);
  }
}
function RiderDashboardComponent_section_0_main_13_section_21_article_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 34)(1, "div", 35)(2, "span", 36);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 37);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 38);
    \u0275\u0275template(7, RiderDashboardComponent_section_0_main_13_section_21_article_3_span_7_Template, 2, 1, "span", 39)(8, RiderDashboardComponent_section_0_main_13_section_21_article_3_span_8_Template, 2, 1, "span", 39)(9, RiderDashboardComponent_section_0_main_13_section_21_article_3_span_9_Template, 2, 1, "span", 40);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, RiderDashboardComponent_section_0_main_13_section_21_article_3_div_10_Template, 14, 12, "div", 41);
    \u0275\u0275elementStart(11, "div", 42)(12, "button", 43);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_main_13_section_21_article_3_Template_button_click_12_listener() {
      const order_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.acceptOrder(order_r5));
    });
    \u0275\u0275text(13, "\u2705 Accept");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "button", 44);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_main_13_section_21_article_3_Template_button_click_14_listener() {
      const order_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.rejectOrder(order_r5));
    });
    \u0275\u0275text(15, "\u274C Reject");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const order_r5 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Order #", order_r5.orderId);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(order_r5.orderTotal);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngIf", order_r5.customerName);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", order_r5.customerPhone);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", order_r5.shippingAddress);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.getCountdown(order_r5.orderId) > 0);
  }
}
function RiderDashboardComponent_section_0_main_13_section_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 31)(1, "h2", 32);
    \u0275\u0275text(2, "\u{1F6F5} New Orders \u2014 Action Required");
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, RiderDashboardComponent_section_0_main_13_section_21_article_3_Template, 16, 6, "article", 33);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", ctx_r1.pendingOrders());
  }
}
function RiderDashboardComponent_section_0_main_13_p_48_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2("You currently have ", ctx_r1.dashboard.activeDeliveries, " live ", ctx_r1.dashboard.activeDeliveries === 1 ? "task" : "tasks", " in progress.");
  }
}
function RiderDashboardComponent_section_0_main_13_p_49_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "No live delivery yet. Stay online to receive the next order.");
    \u0275\u0275elementEnd();
  }
}
function RiderDashboardComponent_section_0_main_13_div_50_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 55);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" Selected Order: #", ctx_r1.selectedActiveOrderId, " ");
  }
}
function RiderDashboardComponent_section_0_main_13_button_51_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 56);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_main_13_button_51_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.openActiveDelivery());
    });
    \u0275\u0275text(1, " Open Selected Delivery ");
    \u0275\u0275elementEnd();
  }
}
function RiderDashboardComponent_section_0_main_13_p_55_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "View all orders accepted by you and choose one for active delivery.");
    \u0275\u0275elementEnd();
  }
}
function RiderDashboardComponent_section_0_main_13_p_56_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "No available orders right now. Keep app status online.");
    \u0275\u0275elementEnd();
  }
}
function RiderDashboardComponent_section_0_main_13_button_57_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 56);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_main_13_button_57_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.goToAcceptedOrders());
    });
    \u0275\u0275text(1, " View Accepted Orders ");
    \u0275\u0275elementEnd();
  }
}
function RiderDashboardComponent_section_0_main_13_p_63_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 57);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.errorMessage);
  }
}
function RiderDashboardComponent_section_0_main_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "main", 12)(1, "header", 13)(2, "div")(3, "p", 14);
    \u0275\u0275text(4, "Rider Profile");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h1");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 15);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "div", 16)(10, "span", 17);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "span", 17);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(14, "section", 18)(15, "button", 19);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_main_13_Template_button_click_15_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.toggleOnline());
    });
    \u0275\u0275text(16);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "button", 19);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_main_13_Template_button_click_17_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.toggleAvailability());
    });
    \u0275\u0275text(18);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "p", 20);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(21, RiderDashboardComponent_section_0_main_13_section_21_Template, 4, 1, "section", 21);
    \u0275\u0275elementStart(22, "section", 22)(23, "article", 23)(24, "h3");
    \u0275\u0275text(25, "Earnings");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(26, "p", 24);
    \u0275\u0275text(27);
    \u0275\u0275pipe(28, "number");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(29, "article", 23)(30, "h3");
    \u0275\u0275text(31, "Active Deliveries");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(32, "p", 24);
    \u0275\u0275text(33);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(34, "article", 23)(35, "h3");
    \u0275\u0275text(36, "Available Orders");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(37, "p", 24);
    \u0275\u0275text(38);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(39, "article", 23)(40, "h3");
    \u0275\u0275text(41, "Delivered");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(42, "p", 24);
    \u0275\u0275text(43);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(44, "section", 25)(45, "article", 26)(46, "h2");
    \u0275\u0275text(47, "Active Delivery");
    \u0275\u0275elementEnd();
    \u0275\u0275template(48, RiderDashboardComponent_section_0_main_13_p_48_Template, 2, 2, "p", 27)(49, RiderDashboardComponent_section_0_main_13_p_49_Template, 2, 0, "p", 27)(50, RiderDashboardComponent_section_0_main_13_div_50_Template, 2, 1, "div", 28)(51, RiderDashboardComponent_section_0_main_13_button_51_Template, 2, 0, "button", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(52, "article", 26)(53, "h2");
    \u0275\u0275text(54, "Available Orders");
    \u0275\u0275elementEnd();
    \u0275\u0275template(55, RiderDashboardComponent_section_0_main_13_p_55_Template, 2, 0, "p", 27)(56, RiderDashboardComponent_section_0_main_13_p_56_Template, 2, 0, "p", 27)(57, RiderDashboardComponent_section_0_main_13_button_57_Template, 2, 0, "button", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(58, "article", 26)(59, "h2");
    \u0275\u0275text(60, "Delivery History");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(61, "p");
    \u0275\u0275text(62);
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(63, RiderDashboardComponent_section_0_main_13_p_63_Template, 2, 1, "p", 30);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r1.dashboard.riderName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.dashboard.currentLocation || "Location not set");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("online", ctx_r1.dashboard.riderStatus === "Online");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.dashboard.riderStatus, " ");
    \u0275\u0275advance();
    \u0275\u0275classProp("approved", ctx_r1.dashboard.isApproved);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.dashboard.isApproved ? "Approved" : "Pending Approval", " ");
    \u0275\u0275advance(2);
    \u0275\u0275property("disabled", ctx_r1.statusSaving);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.dashboard.riderStatus === "Online" ? "Go Offline" : "Go Online", " ");
    \u0275\u0275advance();
    \u0275\u0275property("disabled", ctx_r1.statusSaving);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.dashboard.availability ? "Set Unavailable" : "Set Available", " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Vehicle: ", ctx_r1.dashboard.vehicleType || "Not configured");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.pendingOrders().length > 0);
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate1("Rs ", \u0275\u0275pipeBind2(28, 27, ctx_r1.dashboard.earnings, "1.0-0"));
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(ctx_r1.dashboard.activeDeliveries);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.dashboard.availableOrders);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.dashboard.deliveredCount);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngIf", ctx_r1.dashboard.activeDeliveries > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.dashboard.activeDeliveries === 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.selectedActiveOrderId > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.selectedActiveOrderId > 0);
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r1.dashboard.activeOrderIds.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.dashboard.activeOrderIds.length === 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.dashboard.activeOrderIds.length > 0);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("You have completed ", ctx_r1.dashboard.deliveredCount, " deliveries so far.");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.errorMessage);
  }
}
function RiderDashboardComponent_section_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "section", 2)(1, "aside", 3)(2, "div", 4);
    \u0275\u0275text(3, "nopCommerce Rider");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 5);
    \u0275\u0275text(5, "Rapid delivery control center");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "button", 6);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_Template_button_click_6_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.backToStore());
    });
    \u0275\u0275text(7, "Store Home");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "button", 7);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.manualRefresh());
    });
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 8);
    \u0275\u0275listener("click", function RiderDashboardComponent_section_0_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.logout());
    });
    \u0275\u0275text(11, "Logout");
    \u0275\u0275elementEnd();
    \u0275\u0275template(12, RiderDashboardComponent_section_0_p_12_Template, 2, 1, "p", 9);
    \u0275\u0275elementEnd();
    \u0275\u0275template(13, RiderDashboardComponent_section_0_main_13_Template, 64, 30, "main", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275property("disabled", ctx_r1.refreshing);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.refreshing ? "Refreshing..." : "Refresh Data");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.lastUpdated);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.dashboard);
  }
}
function RiderDashboardComponent_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 58)(1, "div", 59);
    \u0275\u0275text(2, "Loading your rider dashboard...");
    \u0275\u0275elementEnd()();
  }
}
var RiderDashboardComponent = class _RiderDashboardComponent {
  riderApi;
  notificationService;
  ngZone;
  static selectedOrderStorageKey = "rider_selected_active_order_id";
  dashboardState = signal(null, ...ngDevMode ? [{ debugName: "dashboardState" }] : (
    /* istanbul ignore next */
    []
  ));
  selectedActiveOrderIdState = signal(0, ...ngDevMode ? [{ debugName: "selectedActiveOrderIdState" }] : (
    /* istanbul ignore next */
    []
  ));
  loadingState = signal(true, ...ngDevMode ? [{ debugName: "loadingState" }] : (
    /* istanbul ignore next */
    []
  ));
  statusSavingState = signal(false, ...ngDevMode ? [{ debugName: "statusSavingState" }] : (
    /* istanbul ignore next */
    []
  ));
  errorMessageState = signal("", ...ngDevMode ? [{ debugName: "errorMessageState" }] : (
    /* istanbul ignore next */
    []
  ));
  refreshingState = signal(false, ...ngDevMode ? [{ debugName: "refreshingState" }] : (
    /* istanbul ignore next */
    []
  ));
  lastUpdatedState = signal("", ...ngDevMode ? [{ debugName: "lastUpdatedState" }] : (
    /* istanbul ignore next */
    []
  ));
  refreshTimer = null;
  orderSub = null;
  expiredSub = null;
  acceptedSub = null;
  orderTimers = /* @__PURE__ */ new Map();
  countdownTick = null;
  static AUTO_REJECT_SECONDS = 60;
  /** Incoming orders waiting for Accept/Reject */
  pendingOrders = signal([], ...ngDevMode ? [{ debugName: "pendingOrders" }] : (
    /* istanbul ignore next */
    []
  ));
  /** Remaining seconds per orderId — updated by a setInterval tick */
  orderCountdowns = signal({}, ...ngDevMode ? [{ debugName: "orderCountdowns" }] : (
    /* istanbul ignore next */
    []
  ));
  getCountdown(orderId) {
    return this.orderCountdowns()[orderId] ?? 0;
  }
  getCountdownPercent(orderId, totalSeconds) {
    const remaining = this.orderCountdowns()[orderId] ?? 0;
    return Math.round(remaining / totalSeconds * 100);
  }
  get dashboard() {
    return this.dashboardState();
  }
  get loading() {
    return this.loadingState();
  }
  get statusSaving() {
    return this.statusSavingState();
  }
  get errorMessage() {
    return this.errorMessageState();
  }
  get refreshing() {
    return this.refreshingState();
  }
  get lastUpdated() {
    return this.lastUpdatedState();
  }
  get selectedActiveOrderId() {
    return this.selectedActiveOrderIdState();
  }
  constructor(riderApi, notificationService, ngZone) {
    this.riderApi = riderApi;
    this.notificationService = notificationService;
    this.ngZone = ngZone;
  }
  ngOnInit() {
    this.riderApi.getSession().subscribe({
      next: (session) => {
        if (session?.customerId) {
          this.notificationService.connectToHub(session.customerId);
        } else {
          console.warn("[Dashboard] Session returned no customerId \u2014 SignalR hub not connected");
        }
      },
      error: (err) => {
        console.error("[Dashboard] getSession() failed \u2014 SignalR hub not connected:", err);
      }
    });
    this.orderSub = this.notificationService.newOrder$.subscribe((order) => {
      const current = this.pendingOrders();
      if (!current.some((o) => o.orderId === order.orderId)) {
        this.pendingOrders.set([...current, order]);
        this.startOrderTimer(order.orderId, order.expiresInSeconds ?? _RiderDashboardComponent.AUTO_REJECT_SECONDS);
      }
    });
    this.expiredSub = this.notificationService.orderExpired$.subscribe((orderId) => {
      this.clearOrderTimer(orderId);
      this.removePendingOrder(orderId);
    });
    this.acceptedSub = this.notificationService.orderAccepted$.subscribe((orderId) => {
      this.clearOrderTimer(orderId);
      this.removePendingOrder(orderId);
    });
    this.loadDashboard(true);
    this.refreshTimer = setInterval(() => this.loadDashboard(false), 15e3);
  }
  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.countdownTick) {
      clearInterval(this.countdownTick);
      this.countdownTick = null;
    }
    this.orderSub?.unsubscribe();
    this.expiredSub?.unsubscribe();
    this.acceptedSub?.unsubscribe();
    this.orderTimers.forEach((t) => clearTimeout(t));
    this.orderTimers.clear();
    this.notificationService.disconnectFromHub();
  }
  acceptOrder(order) {
    this.clearOrderTimer(order.orderId);
    this.riderApi.acceptOrder(order.orderId).subscribe({
      next: () => {
        this.removePendingOrder(order.orderId);
        const dashboard = this.dashboardState();
        if (dashboard) {
          this.dashboardState.set(__spreadProps(__spreadValues({}, dashboard), { availability: false }));
        }
        this.loadDashboard(false);
      },
      error: (err) => {
        if (err?.status === 409) {
          this.removePendingOrder(order.orderId);
          this.errorMessageState.set("Order was already accepted by another rider.");
        } else {
          this.errorMessageState.set(err?.error?.error ?? "Failed to accept order.");
        }
      }
    });
  }
  rejectOrder(order) {
    this.clearOrderTimer(order.orderId);
    this.riderApi.rejectOrder(order.orderId).subscribe({
      next: () => this.removePendingOrder(order.orderId),
      error: () => this.removePendingOrder(order.orderId)
    });
  }
  /**
   * Starts a per-order countdown and schedules an auto-reject.
   *
   * FIX: Both setInterval (countdown tick) and setTimeout (auto-reject) are now
   * wrapped in this.ngZone.run(). SignalR hub callbacks execute outside Angular's
   * NgZone, so any timers created inside them also run outside the zone. Angular
   * signals only schedule change detection when a signal write happens inside the
   * zone (or via the signals scheduler microtask). Without ngZone.run(), the
   * orderCountdowns signal updates every second but Angular never re-renders, so
   * the countdown appears frozen at the initial value and the auto-reject fires
   * the HTTP call but the card is never removed from the view.
   */
  startOrderTimer(orderId, seconds = _RiderDashboardComponent.AUTO_REJECT_SECONDS) {
    this.ngZone.run(() => {
      this.orderCountdowns.update((prev) => __spreadProps(__spreadValues({}, prev), { [orderId]: seconds }));
    });
    if (!this.countdownTick) {
      this.countdownTick = this.ngZone.run(() => setInterval(() => {
        this.orderCountdowns.update((prev) => {
          const next = __spreadValues({}, prev);
          Object.keys(next).forEach((k) => {
            next[+k] = Math.max(0, (next[+k] ?? 0) - 1);
          });
          return next;
        });
      }, 1e3));
    }
    const timer = this.ngZone.run(() => setTimeout(() => {
      this.clearOrderTimer(orderId);
      this.riderApi.rejectOrder(orderId).subscribe({
        next: () => this.removePendingOrder(orderId),
        error: () => this.removePendingOrder(orderId)
      });
    }, seconds * 1e3));
    this.orderTimers.set(orderId, timer);
  }
  clearOrderTimer(orderId) {
    const timer = this.orderTimers.get(orderId);
    if (timer !== void 0) {
      clearTimeout(timer);
      this.orderTimers.delete(orderId);
    }
    this.orderCountdowns.update((prev) => {
      const next = __spreadValues({}, prev);
      delete next[orderId];
      return next;
    });
    if (this.orderTimers.size === 0 && this.countdownTick) {
      clearInterval(this.countdownTick);
      this.countdownTick = null;
    }
  }
  removePendingOrder(orderId) {
    this.pendingOrders.set(this.pendingOrders().filter((o) => o.orderId !== orderId));
  }
  manualRefresh() {
    this.loadDashboard(false);
  }
  loadDashboard(showLoader) {
    if (showLoader) {
      this.loadingState.set(true);
    } else {
      this.refreshingState.set(true);
    }
    this.errorMessageState.set("");
    this.riderApi.getDashboard().subscribe({
      next: (result) => {
        const normalized = this.normalizeDashboard(result);
        this.dashboardState.set(normalized);
        this.syncSelectedOrder(normalized);
        this.loadingState.set(false);
        this.refreshingState.set(false);
        this.lastUpdatedState.set((/* @__PURE__ */ new Date()).toLocaleTimeString());
      },
      error: (error) => {
        this.loadingState.set(false);
        this.refreshingState.set(false);
        this.errorMessageState.set(error?.error?.error ?? "Unable to load rider dashboard.");
      }
    });
  }
  toggleOnline() {
    const dashboard = this.dashboardState();
    if (!dashboard || this.statusSavingState()) {
      return;
    }
    const nextOnline = dashboard.riderStatus !== "Online";
    this.statusSavingState.set(true);
    this.riderApi.updateStatus({
      isOnline: nextOnline,
      availability: dashboard.availability
    }).subscribe({
      next: (result) => {
        const riderStatus = this.getStringProp(result.rider, "riderStatus", "RiderStatus", dashboard.riderStatus);
        this.statusSavingState.set(false);
        this.dashboardState.set(__spreadProps(__spreadValues({}, dashboard), {
          riderStatus
        }));
      },
      error: () => {
        this.statusSavingState.set(false);
        this.errorMessageState.set("Unable to update rider status. Please retry.");
      }
    });
  }
  toggleAvailability() {
    const dashboard = this.dashboardState();
    if (!dashboard || this.statusSavingState()) {
      return;
    }
    const nextAvailability = !dashboard.availability;
    this.statusSavingState.set(true);
    this.riderApi.updateStatus({
      isOnline: dashboard.riderStatus === "Online",
      availability: nextAvailability
    }).subscribe({
      next: (result) => {
        const availability = this.getBooleanProp(result.rider, "availability", "Availability", dashboard.availability);
        this.statusSavingState.set(false);
        this.dashboardState.set(__spreadProps(__spreadValues({}, dashboard), {
          availability
        }));
      },
      error: () => {
        this.statusSavingState.set(false);
        this.errorMessageState.set("Unable to update availability. Please retry.");
      }
    });
  }
  logout() {
    window.location.href = "/logout?returnUrl=%2Frider";
  }
  backToStore() {
    window.location.href = "/";
  }
  goToAcceptedOrders() {
    window.location.href = "/rider/accepted-orders";
  }
  openActiveDelivery() {
    const selectedOrderId = this.selectedActiveOrderIdState();
    if (selectedOrderId <= 0) {
      this.errorMessageState.set("No active delivery order is available right now.");
      return;
    }
    window.location.href = `/rider/orders/${selectedOrderId}`;
  }
  syncSelectedOrder(dashboard) {
    const ids = dashboard.activeOrderIds;
    if (ids.length === 0) {
      this.selectedActiveOrderIdState.set(0);
      this.setStoredSelectedOrderId(0);
      return;
    }
    const selectedFromState = this.selectedActiveOrderIdState();
    if (selectedFromState > 0 && ids.includes(selectedFromState)) {
      return;
    }
    const selectedFromStorage = this.getStoredSelectedOrderId();
    if (selectedFromStorage > 0 && ids.includes(selectedFromStorage)) {
      this.selectedActiveOrderIdState.set(selectedFromStorage);
      return;
    }
    const fallback = dashboard.activeOrderId > 0 ? dashboard.activeOrderId : ids[0];
    this.selectedActiveOrderIdState.set(fallback);
    this.setStoredSelectedOrderId(fallback);
  }
  getStoredSelectedOrderId() {
    const raw = window.localStorage.getItem(_RiderDashboardComponent.selectedOrderStorageKey);
    if (!raw) {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }
  setStoredSelectedOrderId(orderId) {
    if (orderId <= 0) {
      window.localStorage.removeItem(_RiderDashboardComponent.selectedOrderStorageKey);
      return;
    }
    window.localStorage.setItem(_RiderDashboardComponent.selectedOrderStorageKey, String(orderId));
  }
  getNumberArrayProp(raw, camel, pascal) {
    const value = raw[camel] ?? raw[pascal];
    if (Array.isArray(value)) {
      return value.filter((v) => typeof v === "number");
    }
    return [];
  }
  getStringProp(raw, camel, pascal, fallback) {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "string") {
      return value;
    }
    return fallback;
  }
  getNumberProp(raw, camel, pascal, fallback) {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }
  getBooleanProp(raw, camel, pascal, fallback) {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return fallback;
  }
  normalizeDashboard(raw) {
    return {
      riderId: this.getNumberProp(raw, "riderId", "RiderId", 0),
      riderName: this.getStringProp(raw, "riderName", "RiderName", ""),
      riderStatus: this.getStringProp(raw, "riderStatus", "RiderStatus", "Offline"),
      availability: this.getBooleanProp(raw, "availability", "Availability", false),
      isApproved: this.getBooleanProp(raw, "isApproved", "IsApproved", false),
      vehicleType: this.getStringProp(raw, "vehicleType", "VehicleType", ""),
      currentLocation: this.getStringProp(raw, "currentLocation", "CurrentLocation", ""),
      activeDeliveries: this.getNumberProp(raw, "activeDeliveries", "ActiveDeliveries", 0),
      activeOrderId: this.getNumberProp(raw, "activeOrderId", "ActiveOrderId", 0),
      activeOrderIds: this.getNumberArrayProp(raw, "activeOrderIds", "ActiveOrderIds"),
      availableOrders: this.getNumberProp(raw, "availableOrders", "AvailableOrders", 0),
      deliveredCount: this.getNumberProp(raw, "deliveredCount", "DeliveredCount", 0),
      earnings: this.getNumberProp(raw, "earnings", "Earnings", 0)
    };
  }
  static \u0275fac = function RiderDashboardComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderDashboardComponent)(\u0275\u0275directiveInject(RiderApiService), \u0275\u0275directiveInject(RiderNotificationService), \u0275\u0275directiveInject(NgZone));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RiderDashboardComponent, selectors: [["app-rider-dashboard"]], decls: 3, vars: 2, consts: [["loadingTpl", ""], ["class", "dashboard-page", 4, "ngIf", "ngIfElse"], [1, "dashboard-page"], [1, "dashboard-sidebar"], [1, "brand"], [1, "brand-sub"], [1, "nav-chip", 3, "click"], [1, "nav-chip", 3, "click", "disabled"], [1, "nav-chip", "danger", 3, "click"], ["class", "updated", 4, "ngIf"], ["class", "dashboard-main", 4, "ngIf"], [1, "updated"], [1, "dashboard-main"], [1, "topbar", "glass"], [1, "eyebrow"], [1, "location"], [1, "status-cluster"], [1, "badge"], [1, "toggle-row", "glass"], [3, "click", "disabled"], [1, "meta"], ["class", "incoming-orders glass", 4, "ngIf"], [1, "cards-grid"], [1, "glass", "stat-card"], [1, "value"], [1, "detail-grid"], [1, "glass", "detail-card"], [4, "ngIf"], ["class", "selected-order", 4, "ngIf"], ["class", "detail-action", 3, "click", 4, "ngIf"], ["class", "error", 4, "ngIf"], [1, "incoming-orders", "glass"], [1, "incoming-title"], ["class", "order-card glass", 4, "ngFor", "ngForOf"], [1, "order-card", "glass"], [1, "order-card-header"], [1, "order-id"], [1, "order-total-badge"], [1, "order-card-body"], ["class", "order-meta", 4, "ngIf"], ["class", "order-meta order-address", 4, "ngIf"], ["class", "countdown-row", 4, "ngIf"], [1, "order-card-actions"], [1, "btn-accept", 3, "click"], [1, "btn-reject", 3, "click"], [1, "order-meta"], [1, "order-meta", "order-address"], [1, "countdown-row"], [1, "countdown-circle"], [1, "countdown-number"], [1, "countdown-unit"], [1, "countdown-bar-wrap"], [1, "countdown-label-text"], [1, "countdown-bar-track"], [1, "countdown-bar-fill"], [1, "selected-order"], [1, "detail-action", 3, "click"], [1, "error"], [1, "dashboard-loading"], [1, "loader-card"]], template: function RiderDashboardComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, RiderDashboardComponent_section_0_Template, 14, 4, "section", 1)(1, RiderDashboardComponent_ng_template_1_Template, 3, 0, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    }
    if (rf & 2) {
      const loadingTpl_r8 = \u0275\u0275reference(2);
      \u0275\u0275property("ngIf", !ctx.loading)("ngIfElse", loadingTpl_r8);
    }
  }, dependencies: [CommonModule, NgForOf, NgIf, DecimalPipe], styles: ['\n[_nghost-%COMP%] {\n  --bg-1: #3f0f5f;\n  --bg-2: #6f1b8a;\n  --bg-3: #ff4ca5;\n  --glass-bg: rgba(255, 255, 255, 0.16);\n  --glass-border: rgba(255, 255, 255, 0.28);\n  --text-1: #fff;\n  --text-2: rgba(255, 255, 255, 0.88);\n  --font-main:\n    "Poppins",\n    "Segoe UI",\n    sans-serif;\n  display: block;\n}\n.countdown-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  padding: 10px 0 4px;\n}\n.countdown-circle[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  width: 64px;\n  height: 64px;\n  border-radius: 50%;\n  border: 3px solid #f5a623;\n  background: rgba(245, 166, 35, 0.15);\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  transition: border-color 0.3s, background 0.3s;\n  animation: _ngcontent-%COMP%_ring-pulse 1s infinite alternate;\n}\n.countdown-circle.warn[_ngcontent-%COMP%] {\n  border-color: #fb923c;\n  background: rgba(251, 146, 60, 0.2);\n}\n.countdown-circle.urgent[_ngcontent-%COMP%] {\n  border-color: #ef4444;\n  background: rgba(239, 68, 68, 0.25);\n  animation: _ngcontent-%COMP%_ring-urgent 0.4s infinite alternate;\n}\n@keyframes _ngcontent-%COMP%_ring-pulse {\n  from {\n    box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.4);\n  }\n  to {\n    box-shadow: 0 0 0 8px rgba(245, 166, 35, 0);\n  }\n}\n@keyframes _ngcontent-%COMP%_ring-urgent {\n  from {\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);\n  }\n  to {\n    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);\n  }\n}\n.countdown-number[_ngcontent-%COMP%] {\n  font-size: 1.5rem;\n  font-weight: 900;\n  color: #fff;\n  line-height: 1;\n}\n.countdown-unit[_ngcontent-%COMP%] {\n  font-size: 0.65rem;\n  color: rgba(255, 255, 255, 0.7);\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n.countdown-bar-wrap[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n.countdown-label-text[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  color: rgba(255, 255, 255, 0.8);\n}\n.countdown-label-text[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  color: #f5a623;\n}\n.countdown-bar-track[_ngcontent-%COMP%] {\n  height: 8px;\n  background: rgba(255, 255, 255, 0.15);\n  border-radius: 999px;\n  overflow: hidden;\n}\n.countdown-bar-fill[_ngcontent-%COMP%] {\n  height: 100%;\n  background:\n    linear-gradient(\n      90deg,\n      #f5a623,\n      #ffd700);\n  border-radius: 999px;\n  transition: width 1s linear, background 0.3s;\n}\n.countdown-bar-fill.warn[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      #fb923c,\n      #f97316);\n}\n.countdown-bar-fill.urgent[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      90deg,\n      #ef4444,\n      #dc2626);\n  animation: _ngcontent-%COMP%_bar-flash 0.5s infinite alternate;\n}\n@keyframes _ngcontent-%COMP%_bar-flash {\n  from {\n    opacity: 1;\n  }\n  to {\n    opacity: 0.6;\n  }\n}\n.incoming-orders[_ngcontent-%COMP%] {\n  margin-bottom: 24px;\n  padding: 20px;\n  border-left: 4px solid #f5a623;\n  animation: _ngcontent-%COMP%_pulse-border 1.5s infinite alternate;\n}\n@keyframes _ngcontent-%COMP%_pulse-border {\n  from {\n    border-left-color: #f5a623;\n  }\n  to {\n    border-left-color: #ff6b35;\n  }\n}\n.order-card[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n  padding: 14px 16px;\n  margin-bottom: 10px;\n  border-radius: 10px;\n  background: rgba(255, 255, 255, 0.08);\n  flex-wrap: wrap;\n}\n.order-card-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n.order-card-info[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  color: #fff;\n}\n.order-total[_ngcontent-%COMP%] {\n  font-size: 1.1rem;\n  font-weight: 700;\n  color: #f5a623;\n}\n.order-address[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  opacity: 0.75;\n}\n.order-card-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 10px;\n}\n.btn-accept[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #22c55e,\n      #16a34a);\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  padding: 10px 20px;\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: opacity 0.2s;\n}\n.btn-accept[_ngcontent-%COMP%]:hover {\n  opacity: 0.88;\n}\n.btn-reject[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      #b91c1c);\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  padding: 10px 20px;\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: opacity 0.2s;\n}\n.btn-reject[_ngcontent-%COMP%]:hover {\n  opacity: 0.88;\n}\n.dashboard-page[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  display: grid;\n  grid-template-columns: 260px 1fr;\n  text-transform: capitalize;\n  background:\n    radial-gradient(\n      circle at 15% 5%,\n      rgba(255, 204, 232, 0.45),\n      transparent 25%),\n    radial-gradient(\n      circle at 95% 12%,\n      rgba(226, 161, 255, 0.4),\n      transparent 30%),\n    linear-gradient(\n      145deg,\n      var(--bg-1) 0%,\n      var(--bg-2) 44%,\n      var(--bg-3) 100%);\n  color: var(--text-1);\n  font-family: var(--font-main);\n}\n.dashboard-sidebar[_ngcontent-%COMP%] {\n  padding: 1.3rem 1rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.8rem;\n  border-right: 1px solid rgba(255, 255, 255, 0.2);\n  background: rgba(15, 8, 36, 0.26);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n}\n.brand[_ngcontent-%COMP%] {\n  font-size: 1.35rem;\n  font-weight: 800;\n}\n.brand-sub[_ngcontent-%COMP%] {\n  margin: 0;\n  color: var(--text-2);\n  font-size: 0.92rem;\n}\n.nav-chip[_ngcontent-%COMP%] {\n  border: 1px solid rgba(255, 255, 255, 0.3);\n  color: #fff;\n  background: rgba(255, 255, 255, 0.08);\n  border-radius: 999px;\n  padding: 0.64rem 1rem;\n  text-align: left;\n  cursor: pointer;\n}\n.nav-chip[_ngcontent-%COMP%]:disabled {\n  opacity: 0.65;\n  cursor: not-allowed;\n}\n.nav-chip.danger[_ngcontent-%COMP%] {\n  margin-top: auto;\n  border-color: rgba(255, 182, 203, 0.45);\n  background: rgba(255, 121, 157, 0.22);\n}\n.updated[_ngcontent-%COMP%] {\n  margin: 0;\n  color: var(--text-2);\n  font-size: 0.82rem;\n}\n.dashboard-main[_ngcontent-%COMP%] {\n  padding: clamp(1rem, 2.4vw, 1.8rem);\n  display: grid;\n  align-content: start;\n  gap: 1rem;\n}\n.glass[_ngcontent-%COMP%] {\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  border-radius: 20px;\n  -webkit-backdrop-filter: blur(15px);\n  backdrop-filter: blur(15px);\n  box-shadow: 0 18px 45px rgba(27, 9, 45, 0.25);\n}\n.topbar[_ngcontent-%COMP%] {\n  padding: 1rem 1.1rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 1rem;\n}\n.eyebrow[_ngcontent-%COMP%] {\n  margin: 0;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #ffd5ec;\n  font-size: 0.7rem;\n}\nh1[_ngcontent-%COMP%] {\n  margin: 0.25rem 0;\n  font-size: clamp(1.35rem, 3.6vw, 2.2rem);\n}\n.location[_ngcontent-%COMP%] {\n  margin: 0;\n  color: var(--text-2);\n}\n.status-cluster[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  flex-wrap: wrap;\n}\n.badge[_ngcontent-%COMP%] {\n  border-radius: 999px;\n  padding: 0.35rem 0.8rem;\n  font-size: 0.78rem;\n  background: rgba(255, 255, 255, 0.2);\n}\n.badge.online[_ngcontent-%COMP%] {\n  background: rgba(84, 255, 170, 0.3);\n}\n.badge.approved[_ngcontent-%COMP%] {\n  background: rgba(152, 227, 255, 0.34);\n}\n.toggle-row[_ngcontent-%COMP%] {\n  padding: 0.8rem 1rem;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: center;\n}\n.toggle-row[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  border: none;\n  border-radius: 999px;\n  padding: 0.55rem 1rem;\n  background:\n    linear-gradient(\n      120deg,\n      #ffe49b,\n      #ff9ac7);\n  color: #3d124e;\n  font-weight: 800;\n  cursor: pointer;\n}\n.toggle-row[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:disabled {\n  opacity: 0.7;\n}\n.meta[_ngcontent-%COMP%] {\n  margin: 0;\n  color: var(--text-2);\n}\n.cards-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 0.8rem;\n}\n.stat-card[_ngcontent-%COMP%] {\n  padding: 0.85rem;\n}\n.stat-card[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 0.9rem;\n  color: var(--text-2);\n}\n.value[_ngcontent-%COMP%] {\n  margin: 0.5rem 0 0;\n  font-size: 1.65rem;\n  font-weight: 800;\n}\n.detail-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 0.8rem;\n}\n.detail-card[_ngcontent-%COMP%] {\n  padding: 0.95rem;\n}\n.detail-card[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0 0 0.45rem;\n  font-size: 1rem;\n}\n.detail-card[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n  color: var(--text-2);\n  line-height: 1.5;\n}\n.detail-action[_ngcontent-%COMP%] {\n  margin-top: 0.7rem;\n  border: none;\n  border-radius: 999px;\n  padding: 0.48rem 0.9rem;\n  background:\n    linear-gradient(\n      120deg,\n      #9be7ff,\n      #ffd5ec);\n  color: #3b1852;\n  font-weight: 800;\n  cursor: pointer;\n}\n.selected-order[_ngcontent-%COMP%] {\n  margin-top: 0.7rem;\n  color: #9be7ff;\n  font-weight: 700;\n}\n.incoming-orders[_ngcontent-%COMP%] {\n  padding: 1rem 1.1rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n}\n.incoming-title[_ngcontent-%COMP%] {\n  margin: 0 0 4px;\n  font-size: 1rem;\n  font-weight: 800;\n  color: #f5a623;\n}\n.order-card[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  padding: 0.85rem 1rem;\n}\n.order-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.order-id[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 800;\n}\n.order-total-badge[_ngcontent-%COMP%] {\n  background: rgba(255, 200, 100, 0.25);\n  border: 1px solid rgba(255, 200, 100, 0.5);\n  border-radius: 999px;\n  padding: 0.2rem 0.65rem;\n  font-size: 0.85rem;\n  font-weight: 700;\n  color: #ffe49b;\n}\n.order-card-body[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.5rem 1rem;\n}\n.order-meta[_ngcontent-%COMP%] {\n  font-size: 0.88rem;\n  color: var(--text-2);\n}\n.order-address[_ngcontent-%COMP%] {\n  flex-basis: 100%;\n}\n.order-card-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.6rem;\n  margin-top: 0.25rem;\n}\n.btn-accept[_ngcontent-%COMP%] {\n  border: none;\n  border-radius: 999px;\n  padding: 0.45rem 1.1rem;\n  background: rgba(74, 222, 128, 0.25);\n  border: 1px solid rgba(74, 222, 128, 0.5);\n  color: #4ade80;\n  font-weight: 700;\n  cursor: pointer;\n}\n.btn-reject[_ngcontent-%COMP%] {\n  border: none;\n  border-radius: 999px;\n  padding: 0.45rem 1.1rem;\n  background: rgba(255, 107, 138, 0.22);\n  border: 1px solid rgba(255, 107, 138, 0.45);\n  color: #ff6b8a;\n  font-weight: 700;\n  cursor: pointer;\n}\n.btn-accept[_ngcontent-%COMP%]:hover {\n  background: rgba(74, 222, 128, 0.38);\n}\n.btn-reject[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 107, 138, 0.38);\n}\n.available-orders-list[_ngcontent-%COMP%] {\n  margin-top: 0.65rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.45rem;\n}\n.available-order-item[_ngcontent-%COMP%] {\n  width: 100%;\n  text-align: left;\n  border: 1px solid rgba(155, 231, 255, 0.4);\n  border-radius: 999px;\n  padding: 0.5rem 1rem;\n  background: rgba(155, 231, 255, 0.12);\n  color: #9be7ff;\n  font-weight: 700;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.available-order-item[_ngcontent-%COMP%]:hover {\n  background: rgba(155, 231, 255, 0.24);\n}\n.available-order-item.selected[_ngcontent-%COMP%] {\n  background: rgba(255, 213, 236, 0.3);\n  border-color: rgba(255, 213, 236, 0.7);\n  color: #ffd5ec;\n}\n.error[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #ffe4ef;\n  font-weight: 700;\n}\n.dashboard-loading[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    linear-gradient(\n      140deg,\n      #360f53 0%,\n      #6c1f8f 55%,\n      #ef4aa8 100%);\n}\n.loader-card[_ngcontent-%COMP%] {\n  color: #fff;\n  border-radius: 16px;\n  padding: 1.2rem 1.4rem;\n  background: rgba(255, 255, 255, 0.14);\n  border: 1px solid rgba(255, 255, 255, 0.3);\n}\n@media (max-width: 980px) {\n  .dashboard-page[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n  .dashboard-sidebar[_ngcontent-%COMP%] {\n    border-right: none;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.2);\n    flex-direction: row;\n    flex-wrap: wrap;\n    align-items: center;\n  }\n  .nav-chip.danger[_ngcontent-%COMP%] {\n    margin-top: 0;\n  }\n  .cards-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n  .detail-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n@media (max-width: 640px) {\n  .topbar[_ngcontent-%COMP%] {\n    flex-direction: column;\n    align-items: flex-start;\n  }\n  .cards-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-dashboard.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderDashboardComponent, [{
    type: Component,
    args: [{ selector: "app-rider-dashboard", standalone: true, imports: [CommonModule], template: `<section class="dashboard-page" *ngIf="!loading; else loadingTpl">\r
  <aside class="dashboard-sidebar">\r
    <div class="brand">nopCommerce Rider</div>\r
    <p class="brand-sub">Rapid delivery control center</p>\r
    <button class="nav-chip" (click)="backToStore()">Store Home</button>\r
    <button class="nav-chip" (click)="manualRefresh()" [disabled]="refreshing">{{ refreshing ? 'Refreshing...' : 'Refresh Data' }}</button>\r
    <button class="nav-chip danger" (click)="logout()">Logout</button>\r
    <p class="updated" *ngIf="lastUpdated">Updated at {{ lastUpdated }}</p>\r
  </aside>\r
\r
  <main class="dashboard-main" *ngIf="dashboard">\r
    <header class="topbar glass">\r
      <div>\r
        <p class="eyebrow">Rider Profile</p>\r
        <h1>{{ dashboard.riderName }}</h1>\r
        <p class="location">{{ dashboard.currentLocation || 'Location not set' }}</p>\r
      </div>\r
\r
      <div class="status-cluster">\r
        <span class="badge" [class.online]="dashboard.riderStatus === 'Online'">\r
          {{ dashboard.riderStatus }}\r
        </span>\r
        <span class="badge" [class.approved]="dashboard.isApproved">\r
          {{ dashboard.isApproved ? 'Approved' : 'Pending Approval' }}\r
        </span>\r
      </div>\r
    </header>\r
\r
    <section class="toggle-row glass">\r
      <button (click)="toggleOnline()" [disabled]="statusSaving">\r
        {{ dashboard.riderStatus === 'Online' ? 'Go Offline' : 'Go Online' }}\r
      </button>\r
      <button (click)="toggleAvailability()" [disabled]="statusSaving">\r
        {{ dashboard.availability ? 'Set Unavailable' : 'Set Available' }}\r
      </button>\r
      <p class="meta">Vehicle: {{ dashboard.vehicleType || 'Not configured' }}</p>\r
    </section>\r
\r
    <!-- \u2500\u2500 Incoming Orders (Accept / Reject) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\r
    <section *ngIf="pendingOrders().length > 0" class="incoming-orders glass">\r
      <h2 class="incoming-title">\u{1F6F5} New Orders \u2014 Action Required</h2>\r
      <article *ngFor="let order of pendingOrders()" class="order-card glass">\r
        <div class="order-card-header">\r
          <span class="order-id">Order #{{ order.orderId }}</span>\r
          <span class="order-total-badge">{{ order.orderTotal }}</span>\r
        </div>\r
        <div class="order-card-body">\r
          <span *ngIf="order.customerName" class="order-meta">\u{1F464} {{ order.customerName }}</span>\r
          <span *ngIf="order.customerPhone" class="order-meta">\u{1F4DE} {{ order.customerPhone }}</span>\r
          <span *ngIf="order.shippingAddress" class="order-meta order-address">\u{1F4CD} {{ order.shippingAddress }}</span>\r
        </div>\r
\r
        <!-- \u2500\u2500 Countdown timer \u2014 only shown while timer is running \u2500\u2500 -->\r
        <div class="countdown-row" *ngIf="getCountdown(order.orderId) > 0">\r
          <div class="countdown-circle"\r
               [class.warn]="(orderCountdowns()[order.orderId] ?? 0) <= 20"\r
               [class.urgent]="(orderCountdowns()[order.orderId] ?? 0) <= 10">\r
            <span class="countdown-number">{{ orderCountdowns()[order.orderId] ?? 0 }}</span>\r
            <span class="countdown-unit">sec</span>\r
          </div>\r
          <div class="countdown-bar-wrap">\r
            <div class="countdown-label-text">\r
              Auto-rejected in <strong>{{ orderCountdowns()[order.orderId] ?? 0 }}s</strong> \u2014 respond now!\r
            </div>\r
            <div class="countdown-bar-track">\r
              <div class="countdown-bar-fill"\r
                   [class.warn]="(orderCountdowns()[order.orderId] ?? 0) <= 20"\r
                   [class.urgent]="(orderCountdowns()[order.orderId] ?? 0) <= 10"\r
                   [style.width.%]="getCountdownPercent(order.orderId, order.expiresInSeconds ?? 60)">\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
\r
        <div class="order-card-actions">\r
          <button class="btn-accept" (click)="acceptOrder(order)">\u2705 Accept</button>\r
          <button class="btn-reject" (click)="rejectOrder(order)">\u274C Reject</button>\r
        </div>\r
      </article>\r
    </section>\r
\r
    <section class="cards-grid">\r
      <article class="glass stat-card">\r
        <h3>Earnings</h3>\r
        <p class="value">Rs {{ dashboard.earnings | number : '1.0-0' }}</p>\r
      </article>\r
      <article class="glass stat-card">\r
        <h3>Active Deliveries</h3>\r
        <p class="value">{{ dashboard.activeDeliveries }}</p>\r
      </article>\r
      <article class="glass stat-card">\r
        <h3>Available Orders</h3>\r
        <p class="value">{{ dashboard.availableOrders }}</p>\r
      </article>\r
      <article class="glass stat-card">\r
        <h3>Delivered</h3>\r
        <p class="value">{{ dashboard.deliveredCount }}</p>\r
      </article>\r
    </section>\r
\r
    <section class="detail-grid">\r
      <article class="glass detail-card">\r
        <h2>Active Delivery</h2>\r
        <p *ngIf="dashboard.activeDeliveries > 0">You currently have {{ dashboard.activeDeliveries }} live {{ dashboard.activeDeliveries === 1 ? 'task' : 'tasks' }} in progress.</p>\r
        <p *ngIf="dashboard.activeDeliveries === 0">No live delivery yet. Stay online to receive the next order.</p>\r
        <div class="selected-order" *ngIf="selectedActiveOrderId > 0">\r
          Selected Order: #{{ selectedActiveOrderId }}\r
        </div>\r
        <button class="detail-action" *ngIf="selectedActiveOrderId > 0" (click)="openActiveDelivery()">\r
          Open Selected Delivery\r
        </button>\r
      </article>\r
\r
      <article class="glass detail-card">\r
        <h2>Available Orders</h2>\r
        <p *ngIf="dashboard.activeOrderIds.length > 0">View all orders accepted by you and choose one for active delivery.</p>\r
        <p *ngIf="dashboard.activeOrderIds.length === 0">No available orders right now. Keep app status online.</p>\r
        <button class="detail-action" *ngIf="dashboard.activeOrderIds.length > 0" (click)="goToAcceptedOrders()">\r
          View Accepted Orders\r
        </button>\r
      </article>\r
\r
      <article class="glass detail-card">\r
        <h2>Delivery History</h2>\r
        <p>You have completed {{ dashboard.deliveredCount }} deliveries so far.</p>\r
      </article>\r
    </section>\r
\r
    <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>\r
  </main>\r
</section>\r
\r
<ng-template #loadingTpl>\r
  <section class="dashboard-loading">\r
    <div class="loader-card">Loading your rider dashboard...</div>\r
  </section>\r
</ng-template>\r
`, styles: ['/* src/app/features/rider/rider-dashboard.component.css */\n:host {\n  --bg-1: #3f0f5f;\n  --bg-2: #6f1b8a;\n  --bg-3: #ff4ca5;\n  --glass-bg: rgba(255, 255, 255, 0.16);\n  --glass-border: rgba(255, 255, 255, 0.28);\n  --text-1: #fff;\n  --text-2: rgba(255, 255, 255, 0.88);\n  --font-main:\n    "Poppins",\n    "Segoe UI",\n    sans-serif;\n  display: block;\n}\n.countdown-row {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  padding: 10px 0 4px;\n}\n.countdown-circle {\n  flex-shrink: 0;\n  width: 64px;\n  height: 64px;\n  border-radius: 50%;\n  border: 3px solid #f5a623;\n  background: rgba(245, 166, 35, 0.15);\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  transition: border-color 0.3s, background 0.3s;\n  animation: ring-pulse 1s infinite alternate;\n}\n.countdown-circle.warn {\n  border-color: #fb923c;\n  background: rgba(251, 146, 60, 0.2);\n}\n.countdown-circle.urgent {\n  border-color: #ef4444;\n  background: rgba(239, 68, 68, 0.25);\n  animation: ring-urgent 0.4s infinite alternate;\n}\n@keyframes ring-pulse {\n  from {\n    box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.4);\n  }\n  to {\n    box-shadow: 0 0 0 8px rgba(245, 166, 35, 0);\n  }\n}\n@keyframes ring-urgent {\n  from {\n    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);\n  }\n  to {\n    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);\n  }\n}\n.countdown-number {\n  font-size: 1.5rem;\n  font-weight: 900;\n  color: #fff;\n  line-height: 1;\n}\n.countdown-unit {\n  font-size: 0.65rem;\n  color: rgba(255, 255, 255, 0.7);\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n.countdown-bar-wrap {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n.countdown-label-text {\n  font-size: 0.82rem;\n  color: rgba(255, 255, 255, 0.8);\n}\n.countdown-label-text strong {\n  color: #f5a623;\n}\n.countdown-bar-track {\n  height: 8px;\n  background: rgba(255, 255, 255, 0.15);\n  border-radius: 999px;\n  overflow: hidden;\n}\n.countdown-bar-fill {\n  height: 100%;\n  background:\n    linear-gradient(\n      90deg,\n      #f5a623,\n      #ffd700);\n  border-radius: 999px;\n  transition: width 1s linear, background 0.3s;\n}\n.countdown-bar-fill.warn {\n  background:\n    linear-gradient(\n      90deg,\n      #fb923c,\n      #f97316);\n}\n.countdown-bar-fill.urgent {\n  background:\n    linear-gradient(\n      90deg,\n      #ef4444,\n      #dc2626);\n  animation: bar-flash 0.5s infinite alternate;\n}\n@keyframes bar-flash {\n  from {\n    opacity: 1;\n  }\n  to {\n    opacity: 0.6;\n  }\n}\n.incoming-orders {\n  margin-bottom: 24px;\n  padding: 20px;\n  border-left: 4px solid #f5a623;\n  animation: pulse-border 1.5s infinite alternate;\n}\n@keyframes pulse-border {\n  from {\n    border-left-color: #f5a623;\n  }\n  to {\n    border-left-color: #ff6b35;\n  }\n}\n.order-card {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n  padding: 14px 16px;\n  margin-bottom: 10px;\n  border-radius: 10px;\n  background: rgba(255, 255, 255, 0.08);\n  flex-wrap: wrap;\n}\n.order-card-info {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n.order-card-info strong {\n  font-size: 1rem;\n  color: #fff;\n}\n.order-total {\n  font-size: 1.1rem;\n  font-weight: 700;\n  color: #f5a623;\n}\n.order-address {\n  font-size: 0.82rem;\n  opacity: 0.75;\n}\n.order-card-actions {\n  display: flex;\n  gap: 10px;\n}\n.btn-accept {\n  background:\n    linear-gradient(\n      135deg,\n      #22c55e,\n      #16a34a);\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  padding: 10px 20px;\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: opacity 0.2s;\n}\n.btn-accept:hover {\n  opacity: 0.88;\n}\n.btn-reject {\n  background:\n    linear-gradient(\n      135deg,\n      #ef4444,\n      #b91c1c);\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  padding: 10px 20px;\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: opacity 0.2s;\n}\n.btn-reject:hover {\n  opacity: 0.88;\n}\n.dashboard-page {\n  min-height: 100vh;\n  display: grid;\n  grid-template-columns: 260px 1fr;\n  text-transform: capitalize;\n  background:\n    radial-gradient(\n      circle at 15% 5%,\n      rgba(255, 204, 232, 0.45),\n      transparent 25%),\n    radial-gradient(\n      circle at 95% 12%,\n      rgba(226, 161, 255, 0.4),\n      transparent 30%),\n    linear-gradient(\n      145deg,\n      var(--bg-1) 0%,\n      var(--bg-2) 44%,\n      var(--bg-3) 100%);\n  color: var(--text-1);\n  font-family: var(--font-main);\n}\n.dashboard-sidebar {\n  padding: 1.3rem 1rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.8rem;\n  border-right: 1px solid rgba(255, 255, 255, 0.2);\n  background: rgba(15, 8, 36, 0.26);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n}\n.brand {\n  font-size: 1.35rem;\n  font-weight: 800;\n}\n.brand-sub {\n  margin: 0;\n  color: var(--text-2);\n  font-size: 0.92rem;\n}\n.nav-chip {\n  border: 1px solid rgba(255, 255, 255, 0.3);\n  color: #fff;\n  background: rgba(255, 255, 255, 0.08);\n  border-radius: 999px;\n  padding: 0.64rem 1rem;\n  text-align: left;\n  cursor: pointer;\n}\n.nav-chip:disabled {\n  opacity: 0.65;\n  cursor: not-allowed;\n}\n.nav-chip.danger {\n  margin-top: auto;\n  border-color: rgba(255, 182, 203, 0.45);\n  background: rgba(255, 121, 157, 0.22);\n}\n.updated {\n  margin: 0;\n  color: var(--text-2);\n  font-size: 0.82rem;\n}\n.dashboard-main {\n  padding: clamp(1rem, 2.4vw, 1.8rem);\n  display: grid;\n  align-content: start;\n  gap: 1rem;\n}\n.glass {\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  border-radius: 20px;\n  -webkit-backdrop-filter: blur(15px);\n  backdrop-filter: blur(15px);\n  box-shadow: 0 18px 45px rgba(27, 9, 45, 0.25);\n}\n.topbar {\n  padding: 1rem 1.1rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 1rem;\n}\n.eyebrow {\n  margin: 0;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #ffd5ec;\n  font-size: 0.7rem;\n}\nh1 {\n  margin: 0.25rem 0;\n  font-size: clamp(1.35rem, 3.6vw, 2.2rem);\n}\n.location {\n  margin: 0;\n  color: var(--text-2);\n}\n.status-cluster {\n  display: flex;\n  gap: 0.5rem;\n  flex-wrap: wrap;\n}\n.badge {\n  border-radius: 999px;\n  padding: 0.35rem 0.8rem;\n  font-size: 0.78rem;\n  background: rgba(255, 255, 255, 0.2);\n}\n.badge.online {\n  background: rgba(84, 255, 170, 0.3);\n}\n.badge.approved {\n  background: rgba(152, 227, 255, 0.34);\n}\n.toggle-row {\n  padding: 0.8rem 1rem;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.6rem;\n  align-items: center;\n}\n.toggle-row button {\n  border: none;\n  border-radius: 999px;\n  padding: 0.55rem 1rem;\n  background:\n    linear-gradient(\n      120deg,\n      #ffe49b,\n      #ff9ac7);\n  color: #3d124e;\n  font-weight: 800;\n  cursor: pointer;\n}\n.toggle-row button:disabled {\n  opacity: 0.7;\n}\n.meta {\n  margin: 0;\n  color: var(--text-2);\n}\n.cards-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 0.8rem;\n}\n.stat-card {\n  padding: 0.85rem;\n}\n.stat-card h3 {\n  margin: 0;\n  font-size: 0.9rem;\n  color: var(--text-2);\n}\n.value {\n  margin: 0.5rem 0 0;\n  font-size: 1.65rem;\n  font-weight: 800;\n}\n.detail-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 0.8rem;\n}\n.detail-card {\n  padding: 0.95rem;\n}\n.detail-card h2 {\n  margin: 0 0 0.45rem;\n  font-size: 1rem;\n}\n.detail-card p {\n  margin: 0;\n  color: var(--text-2);\n  line-height: 1.5;\n}\n.detail-action {\n  margin-top: 0.7rem;\n  border: none;\n  border-radius: 999px;\n  padding: 0.48rem 0.9rem;\n  background:\n    linear-gradient(\n      120deg,\n      #9be7ff,\n      #ffd5ec);\n  color: #3b1852;\n  font-weight: 800;\n  cursor: pointer;\n}\n.selected-order {\n  margin-top: 0.7rem;\n  color: #9be7ff;\n  font-weight: 700;\n}\n.incoming-orders {\n  padding: 1rem 1.1rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.75rem;\n}\n.incoming-title {\n  margin: 0 0 4px;\n  font-size: 1rem;\n  font-weight: 800;\n  color: #f5a623;\n}\n.order-card {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  padding: 0.85rem 1rem;\n}\n.order-card-header {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.order-id {\n  font-size: 1rem;\n  font-weight: 800;\n}\n.order-total-badge {\n  background: rgba(255, 200, 100, 0.25);\n  border: 1px solid rgba(255, 200, 100, 0.5);\n  border-radius: 999px;\n  padding: 0.2rem 0.65rem;\n  font-size: 0.85rem;\n  font-weight: 700;\n  color: #ffe49b;\n}\n.order-card-body {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.5rem 1rem;\n}\n.order-meta {\n  font-size: 0.88rem;\n  color: var(--text-2);\n}\n.order-address {\n  flex-basis: 100%;\n}\n.order-card-actions {\n  display: flex;\n  gap: 0.6rem;\n  margin-top: 0.25rem;\n}\n.btn-accept {\n  border: none;\n  border-radius: 999px;\n  padding: 0.45rem 1.1rem;\n  background: rgba(74, 222, 128, 0.25);\n  border: 1px solid rgba(74, 222, 128, 0.5);\n  color: #4ade80;\n  font-weight: 700;\n  cursor: pointer;\n}\n.btn-reject {\n  border: none;\n  border-radius: 999px;\n  padding: 0.45rem 1.1rem;\n  background: rgba(255, 107, 138, 0.22);\n  border: 1px solid rgba(255, 107, 138, 0.45);\n  color: #ff6b8a;\n  font-weight: 700;\n  cursor: pointer;\n}\n.btn-accept:hover {\n  background: rgba(74, 222, 128, 0.38);\n}\n.btn-reject:hover {\n  background: rgba(255, 107, 138, 0.38);\n}\n.available-orders-list {\n  margin-top: 0.65rem;\n  display: flex;\n  flex-direction: column;\n  gap: 0.45rem;\n}\n.available-order-item {\n  width: 100%;\n  text-align: left;\n  border: 1px solid rgba(155, 231, 255, 0.4);\n  border-radius: 999px;\n  padding: 0.5rem 1rem;\n  background: rgba(155, 231, 255, 0.12);\n  color: #9be7ff;\n  font-weight: 700;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.available-order-item:hover {\n  background: rgba(155, 231, 255, 0.24);\n}\n.available-order-item.selected {\n  background: rgba(255, 213, 236, 0.3);\n  border-color: rgba(255, 213, 236, 0.7);\n  color: #ffd5ec;\n}\n.error {\n  margin: 0;\n  color: #ffe4ef;\n  font-weight: 700;\n}\n.dashboard-loading {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    linear-gradient(\n      140deg,\n      #360f53 0%,\n      #6c1f8f 55%,\n      #ef4aa8 100%);\n}\n.loader-card {\n  color: #fff;\n  border-radius: 16px;\n  padding: 1.2rem 1.4rem;\n  background: rgba(255, 255, 255, 0.14);\n  border: 1px solid rgba(255, 255, 255, 0.3);\n}\n@media (max-width: 980px) {\n  .dashboard-page {\n    grid-template-columns: 1fr;\n  }\n  .dashboard-sidebar {\n    border-right: none;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.2);\n    flex-direction: row;\n    flex-wrap: wrap;\n    align-items: center;\n  }\n  .nav-chip.danger {\n    margin-top: 0;\n  }\n  .cards-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n  .detail-grid {\n    grid-template-columns: 1fr;\n  }\n}\n@media (max-width: 640px) {\n  .topbar {\n    flex-direction: column;\n    align-items: flex-start;\n  }\n  .cards-grid {\n    grid-template-columns: 1fr;\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-dashboard.component.css.map */\n'] }]
  }], () => [{ type: RiderApiService }, { type: RiderNotificationService }, { type: NgZone }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RiderDashboardComponent, { className: "RiderDashboardComponent", filePath: "app/features/rider/rider-dashboard.component.ts", lineNumber: 27 });
})();

// src/app/features/rider/rider-entry.component.ts
function RiderEntryComponent_h1_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h1");
    \u0275\u0275text(1, "Preparing your rider portal");
    \u0275\u0275elementEnd();
  }
}
function RiderEntryComponent_h1_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h1");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Welcome, ", ctx_r0.customerName() || "Customer");
  }
}
function RiderEntryComponent_p_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "We are checking your customer and rider profile.");
    \u0275\u0275elementEnd();
  }
}
function RiderEntryComponent_p_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p");
    \u0275\u0275text(1, "Complete onboarding to unlock rider dashboard, live status controls, and delivery insights.");
    \u0275\u0275elementEnd();
  }
}
function RiderEntryComponent_button_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 4);
    \u0275\u0275listener("click", function RiderEntryComponent_button_6_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.goToOnboarding());
    });
    \u0275\u0275text(1, "Become a Rider");
    \u0275\u0275elementEnd();
  }
}
var RiderEntryComponent = class _RiderEntryComponent {
  router;
  sessionService;
  loading = signal(true, ...ngDevMode ? [{ debugName: "loading" }] : (
    /* istanbul ignore next */
    []
  ));
  customerName = signal("", ...ngDevMode ? [{ debugName: "customerName" }] : (
    /* istanbul ignore next */
    []
  ));
  constructor(router, sessionService) {
    this.router = router;
    this.sessionService = sessionService;
    this.sessionService.refreshSession().subscribe((session) => {
      if (!session?.authenticated) {
        window.location.href = "/login?returnUrl=%2Frider";
        return;
      }
      this.customerName.set(session.name);
      this.loading.set(false);
      if (session.isRider) {
        this.router.navigateByUrl("/dashboard");
      }
    });
  }
  goToOnboarding() {
    this.router.navigateByUrl("/onboarding");
  }
  static \u0275fac = function RiderEntryComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderEntryComponent)(\u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(RiderSessionService));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RiderEntryComponent, selectors: [["app-rider-entry"]], decls: 7, vars: 5, consts: [[1, "entry-shell"], [1, "entry-card"], [4, "ngIf"], [3, "click", 4, "ngIf"], [3, "click"]], template: function RiderEntryComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "section", 0)(1, "div", 1);
      \u0275\u0275template(2, RiderEntryComponent_h1_2_Template, 2, 0, "h1", 2)(3, RiderEntryComponent_h1_3_Template, 2, 1, "h1", 2)(4, RiderEntryComponent_p_4_Template, 2, 0, "p", 2)(5, RiderEntryComponent_p_5_Template, 2, 0, "p", 2)(6, RiderEntryComponent_button_6_Template, 2, 0, "button", 3);
      \u0275\u0275elementEnd()();
    }
    if (rf & 2) {
      \u0275\u0275advance(2);
      \u0275\u0275property("ngIf", ctx.loading());
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.loading());
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", ctx.loading());
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.loading());
      \u0275\u0275advance();
      \u0275\u0275property("ngIf", !ctx.loading());
    }
  }, dependencies: [CommonModule, NgIf], styles: ["\n.entry-shell[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    radial-gradient(\n      circle at 20% 20%,\n      #f8d9ff 0%,\n      #f5f0ff 40%,\n      #f7f7ff 100%);\n}\n.entry-card[_ngcontent-%COMP%] {\n  border-radius: 18px;\n  padding: 1.5rem 1.75rem;\n  background: rgba(255, 255, 255, 0.72);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.65);\n  box-shadow: 0 12px 40px rgba(126, 56, 173, 0.17);\n  width: min(480px, 92vw);\n}\nh1[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem;\n  font-size: clamp(1.2rem, 3.8vw, 1.6rem);\n}\np[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #4d4061;\n}\nbutton[_ngcontent-%COMP%] {\n  margin-top: 1rem;\n  border: none;\n  border-radius: 999px;\n  padding: 0.7rem 1.1rem;\n  background:\n    linear-gradient(\n      140deg,\n      #ff93c7,\n      #d468ff);\n  color: #fff;\n  font-weight: 700;\n  cursor: pointer;\n}\n/*# sourceMappingURL=/rider/browser/rider-entry.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderEntryComponent, [{
    type: Component,
    args: [{ selector: "app-rider-entry", standalone: true, imports: [CommonModule], template: `
    <section class="entry-shell">
      <div class="entry-card">
        <h1 *ngIf="loading()">Preparing your rider portal</h1>
        <h1 *ngIf="!loading()">Welcome, {{ customerName() || 'Customer' }}</h1>
        <p *ngIf="loading()">We are checking your customer and rider profile.</p>
        <p *ngIf="!loading()">Complete onboarding to unlock rider dashboard, live status controls, and delivery insights.</p>
        <button *ngIf="!loading()" (click)="goToOnboarding()">Become a Rider</button>
      </div>
    </section>
  `, styles: ["/* angular:styles/component:css;5c70dbea3e1ceac58ee8f8bdbc03deceb98e2f0919454aca0dbdfecb02224359;C:/Users/DiwanshiR/Downloads/nop_commerce-team-7/Frontend/src/app/features/rider/rider-entry.component.ts */\n.entry-shell {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    radial-gradient(\n      circle at 20% 20%,\n      #f8d9ff 0%,\n      #f5f0ff 40%,\n      #f7f7ff 100%);\n}\n.entry-card {\n  border-radius: 18px;\n  padding: 1.5rem 1.75rem;\n  background: rgba(255, 255, 255, 0.72);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.65);\n  box-shadow: 0 12px 40px rgba(126, 56, 173, 0.17);\n  width: min(480px, 92vw);\n}\nh1 {\n  margin: 0 0 0.5rem;\n  font-size: clamp(1.2rem, 3.8vw, 1.6rem);\n}\np {\n  margin: 0;\n  color: #4d4061;\n}\nbutton {\n  margin-top: 1rem;\n  border: none;\n  border-radius: 999px;\n  padding: 0.7rem 1.1rem;\n  background:\n    linear-gradient(\n      140deg,\n      #ff93c7,\n      #d468ff);\n  color: #fff;\n  font-weight: 700;\n  cursor: pointer;\n}\n/*# sourceMappingURL=/rider/browser/rider-entry.component.css.map */\n"] }]
  }], () => [{ type: Router }, { type: RiderSessionService }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RiderEntryComponent, { className: "RiderEntryComponent", filePath: "app/features/rider/rider-entry.component.ts", lineNumber: 71 });
})();

// node_modules/@angular/forms/fesm2022/forms.mjs
/**
 * @license Angular v21.2.10
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
var BaseControlValueAccessor = class _BaseControlValueAccessor {
  _renderer;
  _elementRef;
  onChange = (_) => {
  };
  onTouched = () => {
  };
  constructor(_renderer, _elementRef) {
    this._renderer = _renderer;
    this._elementRef = _elementRef;
  }
  setProperty(key, value) {
    this._renderer.setProperty(this._elementRef.nativeElement, key, value);
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  setDisabledState(isDisabled) {
    this.setProperty("disabled", isDisabled);
  }
  static \u0275fac = function BaseControlValueAccessor_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BaseControlValueAccessor)(\u0275\u0275directiveInject(Renderer2), \u0275\u0275directiveInject(ElementRef));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _BaseControlValueAccessor
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseControlValueAccessor, [{
    type: Directive
  }], () => [{
    type: Renderer2
  }, {
    type: ElementRef
  }], null);
})();
var BuiltInControlValueAccessor = class _BuiltInControlValueAccessor extends BaseControlValueAccessor {
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275BuiltInControlValueAccessor_BaseFactory;
    return function BuiltInControlValueAccessor_Factory(__ngFactoryType__) {
      return (\u0275BuiltInControlValueAccessor_BaseFactory || (\u0275BuiltInControlValueAccessor_BaseFactory = \u0275\u0275getInheritedFactory(_BuiltInControlValueAccessor)))(__ngFactoryType__ || _BuiltInControlValueAccessor);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _BuiltInControlValueAccessor,
    features: [\u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BuiltInControlValueAccessor, [{
    type: Directive
  }], null, null);
})();
var NG_VALUE_ACCESSOR = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgValueAccessor" : "");
var CHECKBOX_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CheckboxControlValueAccessor),
  multi: true
};
var CheckboxControlValueAccessor = class _CheckboxControlValueAccessor extends BuiltInControlValueAccessor {
  writeValue(value) {
    this.setProperty("checked", value);
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275CheckboxControlValueAccessor_BaseFactory;
    return function CheckboxControlValueAccessor_Factory(__ngFactoryType__) {
      return (\u0275CheckboxControlValueAccessor_BaseFactory || (\u0275CheckboxControlValueAccessor_BaseFactory = \u0275\u0275getInheritedFactory(_CheckboxControlValueAccessor)))(__ngFactoryType__ || _CheckboxControlValueAccessor);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CheckboxControlValueAccessor,
    selectors: [["input", "type", "checkbox", "formControlName", ""], ["input", "type", "checkbox", "formControl", ""], ["input", "type", "checkbox", "ngModel", ""]],
    hostBindings: function CheckboxControlValueAccessor_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("change", function CheckboxControlValueAccessor_change_HostBindingHandler($event) {
          return ctx.onChange($event.target.checked);
        })("blur", function CheckboxControlValueAccessor_blur_HostBindingHandler() {
          return ctx.onTouched();
        });
      }
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([CHECKBOX_VALUE_ACCESSOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CheckboxControlValueAccessor, [{
    type: Directive,
    args: [{
      selector: "input[type=checkbox][formControlName],input[type=checkbox][formControl],input[type=checkbox][ngModel]",
      host: {
        "(change)": "onChange($any($event.target).checked)",
        "(blur)": "onTouched()"
      },
      providers: [CHECKBOX_VALUE_ACCESSOR],
      standalone: false
    }]
  }], null, null);
})();
var DEFAULT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DefaultValueAccessor),
  multi: true
};
function _isAndroid() {
  const userAgent = getDOM() ? getDOM().getUserAgent() : "";
  return /android (\d+)/.test(userAgent.toLowerCase());
}
var COMPOSITION_BUFFER_MODE = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "CompositionEventMode" : "");
var DefaultValueAccessor = class _DefaultValueAccessor extends BaseControlValueAccessor {
  _compositionMode;
  _composing = false;
  constructor(renderer, elementRef, _compositionMode) {
    super(renderer, elementRef);
    this._compositionMode = _compositionMode;
    if (this._compositionMode == null) {
      this._compositionMode = !_isAndroid();
    }
  }
  writeValue(value) {
    const normalizedValue = value == null ? "" : value;
    this.setProperty("value", normalizedValue);
  }
  _handleInput(value) {
    if (!this._compositionMode || this._compositionMode && !this._composing) {
      this.onChange(value);
    }
  }
  _compositionStart() {
    this._composing = true;
  }
  _compositionEnd(value) {
    this._composing = false;
    this._compositionMode && this.onChange(value);
  }
  static \u0275fac = function DefaultValueAccessor_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DefaultValueAccessor)(\u0275\u0275directiveInject(Renderer2), \u0275\u0275directiveInject(ElementRef), \u0275\u0275directiveInject(COMPOSITION_BUFFER_MODE, 8));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _DefaultValueAccessor,
    selectors: [["input", "formControlName", "", 3, "type", "checkbox"], ["textarea", "formControlName", ""], ["input", "formControl", "", 3, "type", "checkbox"], ["textarea", "formControl", ""], ["input", "ngModel", "", 3, "type", "checkbox"], ["textarea", "ngModel", ""], ["", "ngDefaultControl", ""]],
    hostBindings: function DefaultValueAccessor_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("input", function DefaultValueAccessor_input_HostBindingHandler($event) {
          return ctx._handleInput($event.target.value);
        })("blur", function DefaultValueAccessor_blur_HostBindingHandler() {
          return ctx.onTouched();
        })("compositionstart", function DefaultValueAccessor_compositionstart_HostBindingHandler() {
          return ctx._compositionStart();
        })("compositionend", function DefaultValueAccessor_compositionend_HostBindingHandler($event) {
          return ctx._compositionEnd($event.target.value);
        });
      }
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([DEFAULT_VALUE_ACCESSOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DefaultValueAccessor, [{
    type: Directive,
    args: [{
      selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]",
      host: {
        "(input)": "_handleInput($any($event.target).value)",
        "(blur)": "onTouched()",
        "(compositionstart)": "_compositionStart()",
        "(compositionend)": "_compositionEnd($any($event.target).value)"
      },
      providers: [DEFAULT_VALUE_ACCESSOR],
      standalone: false
    }]
  }], () => [{
    type: Renderer2
  }, {
    type: ElementRef
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [COMPOSITION_BUFFER_MODE]
    }]
  }], null);
})();
function isEmptyInputValue(value) {
  return value == null || lengthOrSize(value) === 0;
}
function lengthOrSize(value) {
  if (value == null) {
    return null;
  } else if (Array.isArray(value) || typeof value === "string") {
    return value.length;
  } else if (value instanceof Set) {
    return value.size;
  }
  return null;
}
var NG_VALIDATORS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgValidators" : "");
var NG_ASYNC_VALIDATORS = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgAsyncValidators" : "");
var EMAIL_REGEXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
function minValidator(min) {
  return (control) => {
    if (control.value == null || min == null) {
      return null;
    }
    const value = parseFloat(control.value);
    return !isNaN(value) && value < min ? {
      "min": {
        "min": min,
        "actual": control.value
      }
    } : null;
  };
}
function maxValidator(max) {
  return (control) => {
    if (control.value == null || max == null) {
      return null;
    }
    const value = parseFloat(control.value);
    return !isNaN(value) && value > max ? {
      "max": {
        "max": max,
        "actual": control.value
      }
    } : null;
  };
}
function requiredValidator(control) {
  return isEmptyInputValue(control.value) ? {
    "required": true
  } : null;
}
function requiredTrueValidator(control) {
  return control.value === true ? null : {
    "required": true
  };
}
function emailValidator(control) {
  if (isEmptyInputValue(control.value)) {
    return null;
  }
  return EMAIL_REGEXP.test(control.value) ? null : {
    "email": true
  };
}
function minLengthValidator(minLength) {
  return (control) => {
    const length = control.value?.length ?? lengthOrSize(control.value);
    if (length === null || length === 0) {
      return null;
    }
    return length < minLength ? {
      "minlength": {
        "requiredLength": minLength,
        "actualLength": length
      }
    } : null;
  };
}
function maxLengthValidator(maxLength) {
  return (control) => {
    const length = control.value?.length ?? lengthOrSize(control.value);
    if (length !== null && length > maxLength) {
      return {
        "maxlength": {
          "requiredLength": maxLength,
          "actualLength": length
        }
      };
    }
    return null;
  };
}
function patternValidator(pattern) {
  if (!pattern) return nullValidator;
  let regex;
  let regexStr;
  if (typeof pattern === "string") {
    regexStr = "";
    if (pattern.charAt(0) !== "^") regexStr += "^";
    regexStr += pattern;
    if (pattern.charAt(pattern.length - 1) !== "$") regexStr += "$";
    regex = new RegExp(regexStr);
  } else {
    regexStr = pattern.toString();
    regex = pattern;
  }
  return (control) => {
    if (isEmptyInputValue(control.value)) {
      return null;
    }
    const value = control.value;
    return regex.test(value) ? null : {
      "pattern": {
        "requiredPattern": regexStr,
        "actualValue": value
      }
    };
  };
}
function nullValidator(control) {
  return null;
}
function isPresent(o) {
  return o != null;
}
function toObservable(value) {
  const obs = isPromise(value) ? from(value) : value;
  if ((typeof ngDevMode === "undefined" || ngDevMode) && !isSubscribable(obs)) {
    let errorMessage = `Expected async validator to return Promise or Observable.`;
    if (typeof value === "object") {
      errorMessage += " Are you using a synchronous validator where an async validator is expected?";
    }
    throw new RuntimeError(-1101, errorMessage);
  }
  return obs;
}
function mergeErrors(arrayOfErrors) {
  let res = {};
  arrayOfErrors.forEach((errors) => {
    res = errors != null ? __spreadValues(__spreadValues({}, res), errors) : res;
  });
  return Object.keys(res).length === 0 ? null : res;
}
function executeValidators(control, validators) {
  return validators.map((validator) => validator(control));
}
function isValidatorFn(validator) {
  return !validator.validate;
}
function normalizeValidators(validators) {
  return validators.map((validator) => {
    return isValidatorFn(validator) ? validator : (c) => validator.validate(c);
  });
}
function compose(validators) {
  if (!validators) return null;
  const presentValidators = validators.filter(isPresent);
  if (presentValidators.length == 0) return null;
  return function(control) {
    return mergeErrors(executeValidators(control, presentValidators));
  };
}
function composeValidators(validators) {
  return validators != null ? compose(normalizeValidators(validators)) : null;
}
function composeAsync(validators) {
  if (!validators) return null;
  const presentValidators = validators.filter(isPresent);
  if (presentValidators.length == 0) return null;
  return function(control) {
    const observables = executeValidators(control, presentValidators).map(toObservable);
    return forkJoin(observables).pipe(map(mergeErrors));
  };
}
function composeAsyncValidators(validators) {
  return validators != null ? composeAsync(normalizeValidators(validators)) : null;
}
function mergeValidators(controlValidators, dirValidator) {
  if (controlValidators === null) return [dirValidator];
  return Array.isArray(controlValidators) ? [...controlValidators, dirValidator] : [controlValidators, dirValidator];
}
function getControlValidators(control) {
  return control._rawValidators;
}
function getControlAsyncValidators(control) {
  return control._rawAsyncValidators;
}
function makeValidatorsArray(validators) {
  if (!validators) return [];
  return Array.isArray(validators) ? validators : [validators];
}
function hasValidator(validators, validator) {
  return Array.isArray(validators) ? validators.includes(validator) : validators === validator;
}
function addValidators(validators, currentValidators) {
  const current = makeValidatorsArray(currentValidators);
  const validatorsToAdd = makeValidatorsArray(validators);
  validatorsToAdd.forEach((v) => {
    if (!hasValidator(current, v)) {
      current.push(v);
    }
  });
  return current;
}
function removeValidators(validators, currentValidators) {
  return makeValidatorsArray(currentValidators).filter((v) => !hasValidator(validators, v));
}
var AbstractControlDirective = class {
  get value() {
    return this.control ? this.control.value : null;
  }
  get valid() {
    return this.control ? this.control.valid : null;
  }
  get invalid() {
    return this.control ? this.control.invalid : null;
  }
  get pending() {
    return this.control ? this.control.pending : null;
  }
  get disabled() {
    return this.control ? this.control.disabled : null;
  }
  get enabled() {
    return this.control ? this.control.enabled : null;
  }
  get errors() {
    return this.control ? this.control.errors : null;
  }
  get pristine() {
    return this.control ? this.control.pristine : null;
  }
  get dirty() {
    return this.control ? this.control.dirty : null;
  }
  get touched() {
    return this.control ? this.control.touched : null;
  }
  get status() {
    return this.control ? this.control.status : null;
  }
  get untouched() {
    return this.control ? this.control.untouched : null;
  }
  get statusChanges() {
    return this.control ? this.control.statusChanges : null;
  }
  get valueChanges() {
    return this.control ? this.control.valueChanges : null;
  }
  get path() {
    return null;
  }
  _composedValidatorFn;
  _composedAsyncValidatorFn;
  _rawValidators = [];
  _rawAsyncValidators = [];
  _setValidators(validators) {
    this._rawValidators = validators || [];
    this._composedValidatorFn = composeValidators(this._rawValidators);
  }
  _setAsyncValidators(validators) {
    this._rawAsyncValidators = validators || [];
    this._composedAsyncValidatorFn = composeAsyncValidators(this._rawAsyncValidators);
  }
  get validator() {
    return this._composedValidatorFn || null;
  }
  get asyncValidator() {
    return this._composedAsyncValidatorFn || null;
  }
  _onDestroyCallbacks = [];
  _registerOnDestroy(fn) {
    this._onDestroyCallbacks.push(fn);
  }
  _invokeOnDestroyCallbacks() {
    this._onDestroyCallbacks.forEach((fn) => fn());
    this._onDestroyCallbacks = [];
  }
  reset(value = void 0) {
    this.control?.reset(value);
  }
  hasError(errorCode, path) {
    return this.control ? this.control.hasError(errorCode, path) : false;
  }
  getError(errorCode, path) {
    return this.control ? this.control.getError(errorCode, path) : null;
  }
};
var ControlContainer = class extends AbstractControlDirective {
  name;
  get formDirective() {
    return null;
  }
  get path() {
    return null;
  }
};
var NgControl = class extends AbstractControlDirective {
  _parent = null;
  name = null;
  valueAccessor = null;
};
var AbstractControlStatus = class {
  _cd;
  constructor(cd) {
    this._cd = cd;
  }
  get isTouched() {
    this._cd?.control?._touched?.();
    return !!this._cd?.control?.touched;
  }
  get isUntouched() {
    return !!this._cd?.control?.untouched;
  }
  get isPristine() {
    this._cd?.control?._pristine?.();
    return !!this._cd?.control?.pristine;
  }
  get isDirty() {
    return !!this._cd?.control?.dirty;
  }
  get isValid() {
    this._cd?.control?._status?.();
    return !!this._cd?.control?.valid;
  }
  get isInvalid() {
    return !!this._cd?.control?.invalid;
  }
  get isPending() {
    return !!this._cd?.control?.pending;
  }
  get isSubmitted() {
    this._cd?._submitted?.();
    return !!this._cd?.submitted;
  }
};
var ngControlStatusHost = {
  "[class.ng-untouched]": "isUntouched",
  "[class.ng-touched]": "isTouched",
  "[class.ng-pristine]": "isPristine",
  "[class.ng-dirty]": "isDirty",
  "[class.ng-valid]": "isValid",
  "[class.ng-invalid]": "isInvalid",
  "[class.ng-pending]": "isPending"
};
var NgControlStatus = class _NgControlStatus extends AbstractControlStatus {
  constructor(cd) {
    super(cd);
  }
  static \u0275fac = function NgControlStatus_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgControlStatus)(\u0275\u0275directiveInject(NgControl, 2));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _NgControlStatus,
    selectors: [["", "formControlName", ""], ["", "ngModel", ""], ["", "formControl", ""]],
    hostVars: 14,
    hostBindings: function NgControlStatus_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275classProp("ng-untouched", ctx.isUntouched)("ng-touched", ctx.isTouched)("ng-pristine", ctx.isPristine)("ng-dirty", ctx.isDirty)("ng-valid", ctx.isValid)("ng-invalid", ctx.isInvalid)("ng-pending", ctx.isPending);
      }
    },
    standalone: false,
    features: [\u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgControlStatus, [{
    type: Directive,
    args: [{
      selector: "[formControlName],[ngModel],[formControl]",
      host: ngControlStatusHost,
      standalone: false
    }]
  }], () => [{
    type: NgControl,
    decorators: [{
      type: Self
    }]
  }], null);
})();
var NgControlStatusGroup = class _NgControlStatusGroup extends AbstractControlStatus {
  constructor(cd) {
    super(cd);
  }
  static \u0275fac = function NgControlStatusGroup_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgControlStatusGroup)(\u0275\u0275directiveInject(ControlContainer, 10));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _NgControlStatusGroup,
    selectors: [["", "formGroupName", ""], ["", "formArrayName", ""], ["", "ngModelGroup", ""], ["", "formGroup", ""], ["", "formArray", ""], ["form", 3, "ngNoForm", ""], ["", "ngForm", ""]],
    hostVars: 16,
    hostBindings: function NgControlStatusGroup_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275classProp("ng-untouched", ctx.isUntouched)("ng-touched", ctx.isTouched)("ng-pristine", ctx.isPristine)("ng-dirty", ctx.isDirty)("ng-valid", ctx.isValid)("ng-invalid", ctx.isInvalid)("ng-pending", ctx.isPending)("ng-submitted", ctx.isSubmitted);
      }
    },
    standalone: false,
    features: [\u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgControlStatusGroup, [{
    type: Directive,
    args: [{
      selector: "[formGroupName],[formArrayName],[ngModelGroup],[formGroup],[formArray],form:not([ngNoForm]),[ngForm]",
      host: __spreadProps(__spreadValues({}, ngControlStatusHost), {
        "[class.ng-submitted]": "isSubmitted"
      }),
      standalone: false
    }]
  }], () => [{
    type: ControlContainer,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }]
  }], null);
})();
var formControlNameExample = `
  <div [formGroup]="myGroup">
    <input formControlName="firstName">
  </div>

  In your class:

  this.myGroup = new FormGroup({
      firstName: new FormControl()
  });`;
var formGroupNameExample = `
  <div [formGroup]="myGroup">
      <div formGroupName="person">
        <input formControlName="firstName">
      </div>
  </div>

  In your class:

  this.myGroup = new FormGroup({
      person: new FormGroup({ firstName: new FormControl() })
  });`;
var formArrayNameExample = `
  <div [formGroup]="myGroup">
    <div formArrayName="cities">
      <div *ngFor="let city of cityArray.controls; index as i">
        <input [formControlName]="i">
      </div>
    </div>
  </div>

  In your class:

  this.cityArray = new FormArray([new FormControl('SF')]);
  this.myGroup = new FormGroup({
    cities: this.cityArray
  });`;
var ngModelGroupExample = `
  <form>
      <div ngModelGroup="person">
        <input [(ngModel)]="person.name" name="firstName">
      </div>
  </form>`;
var ngModelWithFormGroupExample = `
  <div [formGroup]="myGroup">
      <input formControlName="firstName">
      <input [(ngModel)]="showMoreControls" [ngModelOptions]="{standalone: true}">
  </div>
`;
var VERSION2 = /* @__PURE__ */ new Version("21.2.10");
function controlParentException(nameOrIndex) {
  return new RuntimeError(1050, `formControlName must be used with a parent formGroup or formArray directive. You'll want to add a formGroup/formArray
      directive and pass it an existing FormGroup/FormArray instance (you can create one in your class).

      ${describeFormControl(nameOrIndex)}

    Example:

    ${formControlNameExample}`);
}
function describeFormControl(nameOrIndex) {
  if (nameOrIndex == null || nameOrIndex === "") {
    return "";
  }
  const valueType = typeof nameOrIndex === "string" ? "name" : "index";
  return `Affected Form Control ${valueType}: "${nameOrIndex}"`;
}
function ngModelGroupException() {
  return new RuntimeError(1051, `formControlName cannot be used with an ngModelGroup parent. It is only compatible with parents
      that also have a "form" prefix: formGroupName, formArrayName, or formGroup.

      Option 1:  Update the parent to be formGroupName (reactive form strategy)

      ${formGroupNameExample}

      Option 2: Use ngModel instead of formControlName (template-driven strategy)

      ${ngModelGroupExample}`);
}
function missingFormException() {
  return new RuntimeError(1052, `formGroup expects a FormGroup instance. Please pass one in.

      Example:

      ${formControlNameExample}`);
}
function groupParentException() {
  return new RuntimeError(1053, `formGroupName must be used with a parent formGroup directive.  You'll want to add a formGroup
    directive and pass it an existing FormGroup instance (you can create one in your class).

    Example:

    ${formGroupNameExample}`);
}
function arrayParentException() {
  return new RuntimeError(1054, `formArrayName must be used with a parent formGroup directive.  You'll want to add a formGroup
      directive and pass it an existing FormGroup instance (you can create one in your class).

      Example:

      ${formArrayNameExample}`);
}
var disabledAttrWarning = `
  It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true
  when you set up this control in your component class, the disabled attribute will actually be set in the DOM for
  you. We recommend using this approach to avoid 'changed after checked' errors.

  Example:
  // Specify the \`disabled\` property at control creation time:
  form = new FormGroup({
    first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),
    last: new FormControl('Drew', Validators.required)
  });

  // Controls can also be enabled/disabled after creation:
  form.get('first')?.enable();
  form.get('last')?.disable();
`;
var asyncValidatorsDroppedWithOptsWarning = `
  It looks like you're constructing using a FormControl with both an options argument and an
  async validators argument. Mixing these arguments will cause your async validators to be dropped.
  You should either put all your validators in the options object, or in separate validators
  arguments. For example:

  // Using validators arguments
  fc = new FormControl(42, Validators.required, myAsyncValidator);

  // Using AbstractControlOptions
  fc = new FormControl(42, {validators: Validators.required, asyncValidators: myAV});

  // Do NOT mix them: async validators will be dropped!
  fc = new FormControl(42, {validators: Validators.required}, /* Oops! */ myAsyncValidator);
`;
function ngModelWarning(directiveName) {
  const versionSubDomain = VERSION2.major !== "0" ? `v${VERSION2.major}.` : "";
  return `
  It looks like you're using ngModel on the same form field as ${directiveName}.
  Support for using the ngModel input property and ngModelChange event with
  reactive form directives has been deprecated in Angular v6 and will be removed
  in a future version of Angular.

  For more information on this, see our API docs here:
  https://${versionSubDomain}angular.dev/api/forms/${directiveName === "formControl" ? "FormControlDirective" : "FormControlName"}
  `;
}
function describeKey(isFormGroup, key) {
  return isFormGroup ? `with name: '${key}'` : `at index: ${key}`;
}
function noControlsError(isFormGroup) {
  return `
    There are no form controls registered with this ${isFormGroup ? "group" : "array"} yet. If you're using ngModel,
    you may want to check next tick (e.g. use setTimeout).
  `;
}
function missingControlError(isFormGroup, key) {
  return `Cannot find form control ${describeKey(isFormGroup, key)}`;
}
function missingControlValueError(isFormGroup, key) {
  return `Must supply a value for form control ${describeKey(isFormGroup, key)}`;
}
var VALID = "VALID";
var INVALID = "INVALID";
var PENDING = "PENDING";
var DISABLED = "DISABLED";
var ControlEvent = class {
};
var ValueChangeEvent = class extends ControlEvent {
  value;
  source;
  constructor(value, source) {
    super();
    this.value = value;
    this.source = source;
  }
};
var PristineChangeEvent = class extends ControlEvent {
  pristine;
  source;
  constructor(pristine, source) {
    super();
    this.pristine = pristine;
    this.source = source;
  }
};
var TouchedChangeEvent = class extends ControlEvent {
  touched;
  source;
  constructor(touched, source) {
    super();
    this.touched = touched;
    this.source = source;
  }
};
var StatusChangeEvent = class extends ControlEvent {
  status;
  source;
  constructor(status, source) {
    super();
    this.status = status;
    this.source = source;
  }
};
var FormSubmittedEvent = class extends ControlEvent {
  source;
  constructor(source) {
    super();
    this.source = source;
  }
};
var FormResetEvent = class extends ControlEvent {
  source;
  constructor(source) {
    super();
    this.source = source;
  }
};
function pickValidators(validatorOrOpts) {
  return (isOptionsObj(validatorOrOpts) ? validatorOrOpts.validators : validatorOrOpts) || null;
}
function coerceToValidator(validator) {
  return Array.isArray(validator) ? composeValidators(validator) : validator || null;
}
function pickAsyncValidators(asyncValidator, validatorOrOpts) {
  if (typeof ngDevMode === "undefined" || ngDevMode) {
    if (isOptionsObj(validatorOrOpts) && asyncValidator) {
      console.warn(asyncValidatorsDroppedWithOptsWarning);
    }
  }
  return (isOptionsObj(validatorOrOpts) ? validatorOrOpts.asyncValidators : asyncValidator) || null;
}
function coerceToAsyncValidator(asyncValidator) {
  return Array.isArray(asyncValidator) ? composeAsyncValidators(asyncValidator) : asyncValidator || null;
}
function isOptionsObj(validatorOrOpts) {
  return validatorOrOpts != null && !Array.isArray(validatorOrOpts) && typeof validatorOrOpts === "object";
}
function assertControlPresent(parent, isGroup, key) {
  const controls = parent.controls;
  const collection = isGroup ? Object.keys(controls) : controls;
  if (!collection.length) {
    throw new RuntimeError(1e3, typeof ngDevMode === "undefined" || ngDevMode ? noControlsError(isGroup) : "");
  }
  if (!controls[key]) {
    throw new RuntimeError(1001, typeof ngDevMode === "undefined" || ngDevMode ? missingControlError(isGroup, key) : "");
  }
}
function assertAllValuesPresent(control, isGroup, value) {
  control._forEachChild((_, key) => {
    if (value[key] === void 0) {
      throw new RuntimeError(-1002, typeof ngDevMode === "undefined" || ngDevMode ? missingControlValueError(isGroup, key) : "");
    }
  });
}
var AbstractControl = class {
  _pendingDirty = false;
  _hasOwnPendingAsyncValidator = null;
  _pendingTouched = false;
  _onCollectionChange = () => {
  };
  _updateOn;
  _parent = null;
  _asyncValidationSubscription;
  _composedValidatorFn;
  _composedAsyncValidatorFn;
  _rawValidators;
  _rawAsyncValidators;
  value;
  constructor(validators, asyncValidators) {
    this._assignValidators(validators);
    this._assignAsyncValidators(asyncValidators);
  }
  get validator() {
    return this._composedValidatorFn;
  }
  set validator(validatorFn) {
    this._rawValidators = this._composedValidatorFn = validatorFn;
  }
  get asyncValidator() {
    return this._composedAsyncValidatorFn;
  }
  set asyncValidator(asyncValidatorFn) {
    this._rawAsyncValidators = this._composedAsyncValidatorFn = asyncValidatorFn;
  }
  get parent() {
    return this._parent;
  }
  get status() {
    return untracked(this.statusReactive);
  }
  set status(v) {
    untracked(() => this.statusReactive.set(v));
  }
  _status = computed(() => this.statusReactive(), ...ngDevMode ? [{
    debugName: "_status"
  }] : []);
  statusReactive = signal(void 0, ...ngDevMode ? [{
    debugName: "statusReactive"
  }] : []);
  get valid() {
    return this.status === VALID;
  }
  get invalid() {
    return this.status === INVALID;
  }
  get pending() {
    return this.status === PENDING;
  }
  get disabled() {
    return this.status === DISABLED;
  }
  get enabled() {
    return this.status !== DISABLED;
  }
  errors;
  get pristine() {
    return untracked(this.pristineReactive);
  }
  set pristine(v) {
    untracked(() => this.pristineReactive.set(v));
  }
  _pristine = computed(() => this.pristineReactive(), ...ngDevMode ? [{
    debugName: "_pristine"
  }] : []);
  pristineReactive = signal(true, ...ngDevMode ? [{
    debugName: "pristineReactive"
  }] : []);
  get dirty() {
    return !this.pristine;
  }
  get touched() {
    return untracked(this.touchedReactive);
  }
  set touched(v) {
    untracked(() => this.touchedReactive.set(v));
  }
  _touched = computed(() => this.touchedReactive(), ...ngDevMode ? [{
    debugName: "_touched"
  }] : []);
  touchedReactive = signal(false, ...ngDevMode ? [{
    debugName: "touchedReactive"
  }] : []);
  get untouched() {
    return !this.touched;
  }
  _events = new Subject();
  events = this._events.asObservable();
  valueChanges;
  statusChanges;
  get updateOn() {
    return this._updateOn ? this._updateOn : this.parent ? this.parent.updateOn : "change";
  }
  setValidators(validators) {
    this._assignValidators(validators);
  }
  setAsyncValidators(validators) {
    this._assignAsyncValidators(validators);
  }
  addValidators(validators) {
    this.setValidators(addValidators(validators, this._rawValidators));
  }
  addAsyncValidators(validators) {
    this.setAsyncValidators(addValidators(validators, this._rawAsyncValidators));
  }
  removeValidators(validators) {
    this.setValidators(removeValidators(validators, this._rawValidators));
  }
  removeAsyncValidators(validators) {
    this.setAsyncValidators(removeValidators(validators, this._rawAsyncValidators));
  }
  hasValidator(validator) {
    return hasValidator(this._rawValidators, validator);
  }
  hasAsyncValidator(validator) {
    return hasValidator(this._rawAsyncValidators, validator);
  }
  clearValidators() {
    this.validator = null;
  }
  clearAsyncValidators() {
    this.asyncValidator = null;
  }
  markAsTouched(opts = {}) {
    const changed = this.touched === false;
    this.touched = true;
    const sourceControl = opts.sourceControl ?? this;
    if (!opts.onlySelf) {
      this._parent?.markAsTouched(__spreadProps(__spreadValues({}, opts), {
        sourceControl
      }));
    }
    if (changed && opts.emitEvent !== false) {
      this._events.next(new TouchedChangeEvent(true, sourceControl));
    }
  }
  markAllAsDirty(opts = {}) {
    this.markAsDirty({
      onlySelf: true,
      emitEvent: opts.emitEvent,
      sourceControl: this
    });
    this._forEachChild((control) => control.markAllAsDirty(opts));
  }
  markAllAsTouched(opts = {}) {
    this.markAsTouched({
      onlySelf: true,
      emitEvent: opts.emitEvent,
      sourceControl: this
    });
    this._forEachChild((control) => control.markAllAsTouched(opts));
  }
  markAsUntouched(opts = {}) {
    const changed = this.touched === true;
    this.touched = false;
    this._pendingTouched = false;
    const sourceControl = opts.sourceControl ?? this;
    this._forEachChild((control) => {
      control.markAsUntouched({
        onlySelf: true,
        emitEvent: opts.emitEvent,
        sourceControl
      });
    });
    if (!opts.onlySelf) {
      this._parent?._updateTouched(opts, sourceControl);
    }
    if (changed && opts.emitEvent !== false) {
      this._events.next(new TouchedChangeEvent(false, sourceControl));
    }
  }
  markAsDirty(opts = {}) {
    const changed = this.pristine === true;
    this.pristine = false;
    const sourceControl = opts.sourceControl ?? this;
    if (!opts.onlySelf) {
      this._parent?.markAsDirty(__spreadProps(__spreadValues({}, opts), {
        sourceControl
      }));
    }
    if (changed && opts.emitEvent !== false) {
      this._events.next(new PristineChangeEvent(false, sourceControl));
    }
  }
  markAsPristine(opts = {}) {
    const changed = this.pristine === false;
    this.pristine = true;
    this._pendingDirty = false;
    const sourceControl = opts.sourceControl ?? this;
    this._forEachChild((control) => {
      control.markAsPristine({
        onlySelf: true,
        emitEvent: opts.emitEvent
      });
    });
    if (!opts.onlySelf) {
      this._parent?._updatePristine(opts, sourceControl);
    }
    if (changed && opts.emitEvent !== false) {
      this._events.next(new PristineChangeEvent(true, sourceControl));
    }
  }
  markAsPending(opts = {}) {
    this.status = PENDING;
    const sourceControl = opts.sourceControl ?? this;
    if (opts.emitEvent !== false) {
      this._events.next(new StatusChangeEvent(this.status, sourceControl));
      this.statusChanges.emit(this.status);
    }
    if (!opts.onlySelf) {
      this._parent?.markAsPending(__spreadProps(__spreadValues({}, opts), {
        sourceControl
      }));
    }
  }
  disable(opts = {}) {
    const skipPristineCheck = this._parentMarkedDirty(opts.onlySelf);
    this.status = DISABLED;
    this.errors = null;
    this._forEachChild((control) => {
      control.disable(__spreadProps(__spreadValues({}, opts), {
        onlySelf: true
      }));
    });
    this._updateValue();
    const sourceControl = opts.sourceControl ?? this;
    if (opts.emitEvent !== false) {
      this._events.next(new ValueChangeEvent(this.value, sourceControl));
      this._events.next(new StatusChangeEvent(this.status, sourceControl));
      this.valueChanges.emit(this.value);
      this.statusChanges.emit(this.status);
    }
    this._updateAncestors(__spreadProps(__spreadValues({}, opts), {
      skipPristineCheck
    }), this);
    this._onDisabledChange.forEach((changeFn) => changeFn(true));
  }
  enable(opts = {}) {
    const skipPristineCheck = this._parentMarkedDirty(opts.onlySelf);
    this.status = VALID;
    this._forEachChild((control) => {
      control.enable(__spreadProps(__spreadValues({}, opts), {
        onlySelf: true
      }));
    });
    this.updateValueAndValidity({
      onlySelf: true,
      emitEvent: opts.emitEvent
    });
    this._updateAncestors(__spreadProps(__spreadValues({}, opts), {
      skipPristineCheck
    }), this);
    this._onDisabledChange.forEach((changeFn) => changeFn(false));
  }
  _updateAncestors(opts, sourceControl) {
    if (!opts.onlySelf) {
      this._parent?.updateValueAndValidity(opts);
      if (!opts.skipPristineCheck) {
        this._parent?._updatePristine({}, sourceControl);
      }
      this._parent?._updateTouched({}, sourceControl);
    }
  }
  setParent(parent) {
    this._parent = parent;
  }
  getRawValue() {
    return this.value;
  }
  updateValueAndValidity(opts = {}) {
    this._setInitialStatus();
    this._updateValue();
    if (this.enabled) {
      const shouldHaveEmitted = this._cancelExistingSubscription();
      this.errors = this._runValidator();
      this.status = this._calculateStatus();
      if (this.status === VALID || this.status === PENDING) {
        this._runAsyncValidator(shouldHaveEmitted, opts.emitEvent);
      }
    }
    const sourceControl = opts.sourceControl ?? this;
    if (opts.emitEvent !== false) {
      this._events.next(new ValueChangeEvent(this.value, sourceControl));
      this._events.next(new StatusChangeEvent(this.status, sourceControl));
      this.valueChanges.emit(this.value);
      this.statusChanges.emit(this.status);
    }
    if (!opts.onlySelf) {
      this._parent?.updateValueAndValidity(__spreadProps(__spreadValues({}, opts), {
        sourceControl
      }));
    }
  }
  _updateTreeValidity(opts = {
    emitEvent: true
  }) {
    this._forEachChild((ctrl) => ctrl._updateTreeValidity(opts));
    this.updateValueAndValidity({
      onlySelf: true,
      emitEvent: opts.emitEvent
    });
  }
  _setInitialStatus() {
    this.status = this._allControlsDisabled() ? DISABLED : VALID;
  }
  _runValidator() {
    return this.validator ? this.validator(this) : null;
  }
  _runAsyncValidator(shouldHaveEmitted, emitEvent) {
    if (this.asyncValidator) {
      this.status = PENDING;
      this._hasOwnPendingAsyncValidator = {
        emitEvent: emitEvent !== false,
        shouldHaveEmitted: shouldHaveEmitted !== false
      };
      const obs = toObservable(this.asyncValidator(this));
      this._asyncValidationSubscription = obs.subscribe((errors) => {
        this._hasOwnPendingAsyncValidator = null;
        this.setErrors(errors, {
          emitEvent,
          shouldHaveEmitted
        });
      });
    }
  }
  _cancelExistingSubscription() {
    if (this._asyncValidationSubscription) {
      this._asyncValidationSubscription.unsubscribe();
      const shouldHaveEmitted = (this._hasOwnPendingAsyncValidator?.emitEvent || this._hasOwnPendingAsyncValidator?.shouldHaveEmitted) ?? false;
      this._hasOwnPendingAsyncValidator = null;
      return shouldHaveEmitted;
    }
    return false;
  }
  setErrors(errors, opts = {}) {
    this.errors = errors;
    this._updateControlsErrors(opts.emitEvent !== false, this, opts.shouldHaveEmitted);
  }
  get(path) {
    let currPath = path;
    if (currPath == null) return null;
    if (!Array.isArray(currPath)) currPath = currPath.split(".");
    if (currPath.length === 0) return null;
    return currPath.reduce((control, name) => control && control._find(name), this);
  }
  getError(errorCode, path) {
    const control = path ? this.get(path) : this;
    return control?.errors ? control.errors[errorCode] : null;
  }
  hasError(errorCode, path) {
    return !!this.getError(errorCode, path);
  }
  get root() {
    let x = this;
    while (x._parent) {
      x = x._parent;
    }
    return x;
  }
  _updateControlsErrors(emitEvent, changedControl, shouldHaveEmitted) {
    this.status = this._calculateStatus();
    if (emitEvent) {
      this.statusChanges.emit(this.status);
    }
    if (emitEvent || shouldHaveEmitted) {
      this._events.next(new StatusChangeEvent(this.status, changedControl));
    }
    if (this._parent) {
      this._parent._updateControlsErrors(emitEvent, changedControl, shouldHaveEmitted);
    }
  }
  _initObservables() {
    this.valueChanges = new EventEmitter();
    this.statusChanges = new EventEmitter();
  }
  _calculateStatus() {
    if (this._allControlsDisabled()) return DISABLED;
    if (this.errors) return INVALID;
    if (this._hasOwnPendingAsyncValidator || this._anyControlsHaveStatus(PENDING)) return PENDING;
    if (this._anyControlsHaveStatus(INVALID)) return INVALID;
    return VALID;
  }
  _anyControlsHaveStatus(status) {
    return this._anyControls((control) => control.status === status);
  }
  _anyControlsDirty() {
    return this._anyControls((control) => control.dirty);
  }
  _anyControlsTouched() {
    return this._anyControls((control) => control.touched);
  }
  _updatePristine(opts, changedControl) {
    const newPristine = !this._anyControlsDirty();
    const changed = this.pristine !== newPristine;
    this.pristine = newPristine;
    if (!opts.onlySelf) {
      this._parent?._updatePristine(opts, changedControl);
    }
    if (changed) {
      this._events.next(new PristineChangeEvent(this.pristine, changedControl));
    }
  }
  _updateTouched(opts = {}, changedControl) {
    this.touched = this._anyControlsTouched();
    this._events.next(new TouchedChangeEvent(this.touched, changedControl));
    if (!opts.onlySelf) {
      this._parent?._updateTouched(opts, changedControl);
    }
  }
  _onDisabledChange = [];
  _registerOnCollectionChange(fn) {
    this._onCollectionChange = fn;
  }
  _setUpdateStrategy(opts) {
    if (isOptionsObj(opts) && opts.updateOn != null) {
      this._updateOn = opts.updateOn;
    }
  }
  _parentMarkedDirty(onlySelf) {
    return !onlySelf && !!this._parent?.dirty && !this._parent._anyControlsDirty();
  }
  _find(name) {
    return null;
  }
  _assignValidators(validators) {
    this._rawValidators = Array.isArray(validators) ? validators.slice() : validators;
    this._composedValidatorFn = coerceToValidator(this._rawValidators);
  }
  _assignAsyncValidators(validators) {
    this._rawAsyncValidators = Array.isArray(validators) ? validators.slice() : validators;
    this._composedAsyncValidatorFn = coerceToAsyncValidator(this._rawAsyncValidators);
  }
};
var FormGroup = class extends AbstractControl {
  constructor(controls, validatorOrOpts, asyncValidator) {
    super(pickValidators(validatorOrOpts), pickAsyncValidators(asyncValidator, validatorOrOpts));
    (typeof ngDevMode === "undefined" || ngDevMode) && validateFormGroupControls(controls);
    this.controls = controls;
    this._initObservables();
    this._setUpdateStrategy(validatorOrOpts);
    this._setUpControls();
    this.updateValueAndValidity({
      onlySelf: true,
      emitEvent: !!this.asyncValidator
    });
  }
  controls;
  registerControl(name, control) {
    if (this.controls[name]) return this.controls[name];
    this.controls[name] = control;
    control.setParent(this);
    control._registerOnCollectionChange(this._onCollectionChange);
    return control;
  }
  addControl(name, control, options = {}) {
    this.registerControl(name, control);
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
    this._onCollectionChange();
  }
  removeControl(name, options = {}) {
    if (this.controls[name]) this.controls[name]._registerOnCollectionChange(() => {
    });
    delete this.controls[name];
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
    this._onCollectionChange();
  }
  setControl(name, control, options = {}) {
    if (this.controls[name]) this.controls[name]._registerOnCollectionChange(() => {
    });
    delete this.controls[name];
    if (control) this.registerControl(name, control);
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
    this._onCollectionChange();
  }
  contains(controlName) {
    return this.controls.hasOwnProperty(controlName) && this.controls[controlName].enabled;
  }
  setValue(value, options = {}) {
    assertAllValuesPresent(this, true, value);
    Object.keys(value).forEach((name) => {
      assertControlPresent(this, true, name);
      this.controls[name].setValue(value[name], {
        onlySelf: true,
        emitEvent: options.emitEvent
      });
    });
    this.updateValueAndValidity(options);
  }
  patchValue(value, options = {}) {
    if (value == null) return;
    Object.keys(value).forEach((name) => {
      const control = this.controls[name];
      if (control) {
        control.patchValue(value[name], {
          onlySelf: true,
          emitEvent: options.emitEvent
        });
      }
    });
    this.updateValueAndValidity(options);
  }
  reset(value = {}, options = {}) {
    this._forEachChild((control, name) => {
      control.reset(value ? value[name] : null, __spreadProps(__spreadValues({}, options), {
        onlySelf: true
      }));
    });
    this._updatePristine(options, this);
    this._updateTouched(options, this);
    this.updateValueAndValidity(options);
    if (options?.emitEvent !== false) {
      this._events.next(new FormResetEvent(this));
    }
  }
  getRawValue() {
    return this._reduceChildren({}, (acc, control, name) => {
      acc[name] = control.getRawValue();
      return acc;
    });
  }
  _syncPendingControls() {
    let subtreeUpdated = this._reduceChildren(false, (updated, child) => {
      return child._syncPendingControls() ? true : updated;
    });
    if (subtreeUpdated) this.updateValueAndValidity({
      onlySelf: true
    });
    return subtreeUpdated;
  }
  _forEachChild(cb) {
    Object.keys(this.controls).forEach((key) => {
      const control = this.controls[key];
      control && cb(control, key);
    });
  }
  _setUpControls() {
    this._forEachChild((control) => {
      control.setParent(this);
      control._registerOnCollectionChange(this._onCollectionChange);
    });
  }
  _updateValue() {
    this.value = this._reduceValue();
  }
  _anyControls(condition) {
    for (const [controlName, control] of Object.entries(this.controls)) {
      if (this.contains(controlName) && condition(control)) {
        return true;
      }
    }
    return false;
  }
  _reduceValue() {
    let acc = {};
    return this._reduceChildren(acc, (acc2, control, name) => {
      if (control.enabled || this.disabled) {
        acc2[name] = control.value;
      }
      return acc2;
    });
  }
  _reduceChildren(initValue, fn) {
    let res = initValue;
    this._forEachChild((control, name) => {
      res = fn(res, control, name);
    });
    return res;
  }
  _allControlsDisabled() {
    for (const controlName of Object.keys(this.controls)) {
      if (this.controls[controlName].enabled) {
        return false;
      }
    }
    return Object.keys(this.controls).length > 0 || this.disabled;
  }
  _find(name) {
    return this.controls.hasOwnProperty(name) ? this.controls[name] : null;
  }
};
function validateFormGroupControls(controls) {
  const invalidKeys = Object.keys(controls).filter((key) => key.includes("."));
  if (invalidKeys.length > 0) {
    console.warn(`FormGroup keys cannot include \`.\`, please replace the keys for: ${invalidKeys.join(",")}.`);
  }
}
var FormRecord = class extends FormGroup {
};
var CALL_SET_DISABLED_STATE = new InjectionToken(typeof ngDevMode === "undefined" || ngDevMode ? "CallSetDisabledState" : "", {
  factory: () => setDisabledStateDefault
});
var setDisabledStateDefault = "always";
function controlPath(name, parent) {
  return [...parent.path, name];
}
function setUpControl(control, dir, callSetDisabledState = setDisabledStateDefault) {
  if (typeof ngDevMode === "undefined" || ngDevMode) {
    if (!control) _throwError(dir, "Cannot find control with");
    if (!dir.valueAccessor) _throwMissingValueAccessorError(dir);
  }
  setUpValidators(control, dir);
  dir.valueAccessor.writeValue(control.value);
  if (control.disabled || callSetDisabledState === "always") {
    dir.valueAccessor.setDisabledState?.(control.disabled);
  }
  setUpViewChangePipeline(control, dir);
  setUpModelChangePipeline(control, dir);
  setUpBlurPipeline(control, dir);
  setUpDisabledChangeHandler(control, dir);
}
function cleanUpControl(control, dir, validateControlPresenceOnChange = true) {
  const noop = () => {
    if (validateControlPresenceOnChange && (typeof ngDevMode === "undefined" || ngDevMode)) {
      _noControlError(dir);
    }
  };
  dir?.valueAccessor?.registerOnChange(noop);
  dir?.valueAccessor?.registerOnTouched(noop);
  cleanUpValidators(control, dir);
  if (control) {
    dir._invokeOnDestroyCallbacks();
    control._registerOnCollectionChange(() => {
    });
  }
}
function registerOnValidatorChange(validators, onChange) {
  validators.forEach((validator) => {
    if (validator.registerOnValidatorChange) validator.registerOnValidatorChange(onChange);
  });
}
function setUpDisabledChangeHandler(control, dir) {
  if (dir.valueAccessor.setDisabledState) {
    const onDisabledChange = (isDisabled) => {
      dir.valueAccessor.setDisabledState(isDisabled);
    };
    control.registerOnDisabledChange(onDisabledChange);
    dir._registerOnDestroy(() => {
      control._unregisterOnDisabledChange(onDisabledChange);
    });
  }
}
function setUpValidators(control, dir) {
  const validators = getControlValidators(control);
  if (dir.validator !== null) {
    control.setValidators(mergeValidators(validators, dir.validator));
  } else if (typeof validators === "function") {
    control.setValidators([validators]);
  }
  const asyncValidators = getControlAsyncValidators(control);
  if (dir.asyncValidator !== null) {
    control.setAsyncValidators(mergeValidators(asyncValidators, dir.asyncValidator));
  } else if (typeof asyncValidators === "function") {
    control.setAsyncValidators([asyncValidators]);
  }
  const onValidatorChange = () => control.updateValueAndValidity();
  registerOnValidatorChange(dir._rawValidators, onValidatorChange);
  registerOnValidatorChange(dir._rawAsyncValidators, onValidatorChange);
}
function cleanUpValidators(control, dir) {
  let isControlUpdated = false;
  if (control !== null) {
    if (dir.validator !== null) {
      const validators = getControlValidators(control);
      if (Array.isArray(validators) && validators.length > 0) {
        const updatedValidators = validators.filter((validator) => validator !== dir.validator);
        if (updatedValidators.length !== validators.length) {
          isControlUpdated = true;
          control.setValidators(updatedValidators);
        }
      }
    }
    if (dir.asyncValidator !== null) {
      const asyncValidators = getControlAsyncValidators(control);
      if (Array.isArray(asyncValidators) && asyncValidators.length > 0) {
        const updatedAsyncValidators = asyncValidators.filter((asyncValidator) => asyncValidator !== dir.asyncValidator);
        if (updatedAsyncValidators.length !== asyncValidators.length) {
          isControlUpdated = true;
          control.setAsyncValidators(updatedAsyncValidators);
        }
      }
    }
  }
  const noop = () => {
  };
  registerOnValidatorChange(dir._rawValidators, noop);
  registerOnValidatorChange(dir._rawAsyncValidators, noop);
  return isControlUpdated;
}
function setUpViewChangePipeline(control, dir) {
  dir.valueAccessor.registerOnChange((newValue) => {
    control._pendingValue = newValue;
    control._pendingChange = true;
    control._pendingDirty = true;
    if (control.updateOn === "change") updateControl(control, dir);
  });
}
function setUpBlurPipeline(control, dir) {
  dir.valueAccessor.registerOnTouched(() => {
    control._pendingTouched = true;
    if (control.updateOn === "blur" && control._pendingChange) updateControl(control, dir);
    if (control.updateOn !== "submit") control.markAsTouched();
  });
}
function updateControl(control, dir) {
  if (control._pendingDirty) control.markAsDirty();
  control.setValue(control._pendingValue, {
    emitModelToViewChange: false
  });
  dir.viewToModelUpdate(control._pendingValue);
  control._pendingChange = false;
}
function setUpModelChangePipeline(control, dir) {
  const onChange = (newValue, emitModelEvent) => {
    dir.valueAccessor.writeValue(newValue);
    if (emitModelEvent) dir.viewToModelUpdate(newValue);
  };
  control.registerOnChange(onChange);
  dir._registerOnDestroy(() => {
    control._unregisterOnChange(onChange);
  });
}
function setUpFormContainer(control, dir) {
  if (control == null && (typeof ngDevMode === "undefined" || ngDevMode)) _throwError(dir, "Cannot find control with");
  setUpValidators(control, dir);
}
function cleanUpFormContainer(control, dir) {
  return cleanUpValidators(control, dir);
}
function _noControlError(dir) {
  return _throwError(dir, "There is no FormControl instance attached to form control element with");
}
function _throwError(dir, message) {
  const messageEnd = _describeControlLocation(dir);
  throw new Error(`${message} ${messageEnd}`);
}
function _describeControlLocation(dir) {
  const path = dir.path;
  if (path && path.length > 1) return `path: '${path.join(" -> ")}'`;
  if (path?.[0]) return `name: '${path}'`;
  return "unspecified name attribute";
}
function _throwMissingValueAccessorError(dir) {
  const loc = _describeControlLocation(dir);
  throw new RuntimeError(-1203, `No value accessor for form control ${loc}.`);
}
function _throwInvalidValueAccessorError(dir) {
  const loc = _describeControlLocation(dir);
  throw new RuntimeError(1200, `Value accessor was not provided as an array for form control with ${loc}. Check that the \`NG_VALUE_ACCESSOR\` token is configured as a \`multi: true\` provider.`);
}
function isPropertyUpdated(changes, viewModel) {
  if (!changes.hasOwnProperty("model")) return false;
  const change = changes["model"];
  if (change.isFirstChange()) return true;
  return !Object.is(viewModel, change.currentValue);
}
function isBuiltInAccessor(valueAccessor) {
  return Object.getPrototypeOf(valueAccessor.constructor) === BuiltInControlValueAccessor;
}
function syncPendingControls(form, directives) {
  form._syncPendingControls();
  directives.forEach((dir) => {
    const control = dir.control;
    if (control.updateOn === "submit" && control._pendingChange) {
      dir.viewToModelUpdate(control._pendingValue);
      control._pendingChange = false;
    }
  });
}
function selectValueAccessor(dir, valueAccessors) {
  if (!valueAccessors) return null;
  if (!Array.isArray(valueAccessors) && (typeof ngDevMode === "undefined" || ngDevMode)) _throwInvalidValueAccessorError(dir);
  let defaultAccessor = void 0;
  let builtinAccessor = void 0;
  let customAccessor = void 0;
  valueAccessors.forEach((v) => {
    if (v.constructor === DefaultValueAccessor) {
      defaultAccessor = v;
    } else if (isBuiltInAccessor(v)) {
      if (builtinAccessor && (typeof ngDevMode === "undefined" || ngDevMode)) _throwError(dir, "More than one built-in value accessor matches form control with");
      builtinAccessor = v;
    } else {
      if (customAccessor && (typeof ngDevMode === "undefined" || ngDevMode)) _throwError(dir, "More than one custom value accessor matches form control with");
      customAccessor = v;
    }
  });
  if (customAccessor) return customAccessor;
  if (builtinAccessor) return builtinAccessor;
  if (defaultAccessor) return defaultAccessor;
  if (typeof ngDevMode === "undefined" || ngDevMode) {
    _throwError(dir, "No valid value accessor for form control with");
  }
  return null;
}
function removeListItem$1(list, el) {
  const index = list.indexOf(el);
  if (index > -1) list.splice(index, 1);
}
function _ngModelWarning(name, type, instance, warningConfig) {
  if (warningConfig === "never") return;
  if ((warningConfig === null || warningConfig === "once") && !type._ngModelWarningSentOnce || warningConfig === "always" && !instance._ngModelWarningSent) {
    console.warn(ngModelWarning(name));
    type._ngModelWarningSentOnce = true;
    instance._ngModelWarningSent = true;
  }
}
var formDirectiveProvider$2 = {
  provide: ControlContainer,
  useExisting: forwardRef(() => NgForm)
};
var resolvedPromise$1 = (() => Promise.resolve())();
var NgForm = class _NgForm extends ControlContainer {
  callSetDisabledState;
  get submitted() {
    return untracked(this.submittedReactive);
  }
  _submitted = computed(() => this.submittedReactive(), ...ngDevMode ? [{
    debugName: "_submitted"
  }] : []);
  submittedReactive = signal(false, ...ngDevMode ? [{
    debugName: "submittedReactive"
  }] : []);
  _directives = /* @__PURE__ */ new Set();
  form;
  ngSubmit = new EventEmitter();
  options;
  constructor(validators, asyncValidators, callSetDisabledState) {
    super();
    this.callSetDisabledState = callSetDisabledState;
    this.form = new FormGroup({}, composeValidators(validators), composeAsyncValidators(asyncValidators));
  }
  ngAfterViewInit() {
    this._setUpdateStrategy();
  }
  get formDirective() {
    return this;
  }
  get control() {
    return this.form;
  }
  get path() {
    return [];
  }
  get controls() {
    return this.form.controls;
  }
  addControl(dir) {
    resolvedPromise$1.then(() => {
      const container = this._findContainer(dir.path);
      dir.control = container.registerControl(dir.name, dir.control);
      setUpControl(dir.control, dir, this.callSetDisabledState);
      dir.control.updateValueAndValidity({
        emitEvent: false
      });
      this._directives.add(dir);
    });
  }
  getControl(dir) {
    return this.form.get(dir.path);
  }
  removeControl(dir) {
    resolvedPromise$1.then(() => {
      const container = this._findContainer(dir.path);
      container?.removeControl(dir.name);
      this._directives.delete(dir);
    });
  }
  addFormGroup(dir) {
    resolvedPromise$1.then(() => {
      const container = this._findContainer(dir.path);
      const group = new FormGroup({});
      setUpFormContainer(group, dir);
      container.registerControl(dir.name, group);
      group.updateValueAndValidity({
        emitEvent: false
      });
    });
  }
  removeFormGroup(dir) {
    resolvedPromise$1.then(() => {
      const container = this._findContainer(dir.path);
      container?.removeControl?.(dir.name);
    });
  }
  getFormGroup(dir) {
    return this.form.get(dir.path);
  }
  updateModel(dir, value) {
    resolvedPromise$1.then(() => {
      const ctrl = this.form.get(dir.path);
      ctrl.setValue(value);
    });
  }
  setValue(value) {
    this.control.setValue(value);
  }
  onSubmit($event) {
    this.submittedReactive.set(true);
    syncPendingControls(this.form, this._directives);
    this.ngSubmit.emit($event);
    this.form._events.next(new FormSubmittedEvent(this.control));
    return $event?.target?.method === "dialog";
  }
  onReset() {
    this.resetForm();
  }
  resetForm(value = void 0) {
    this.form.reset(value);
    this.submittedReactive.set(false);
  }
  _setUpdateStrategy() {
    if (this.options && this.options.updateOn != null) {
      this.form._updateOn = this.options.updateOn;
    }
  }
  _findContainer(path) {
    path.pop();
    return path.length ? this.form.get(path) : this.form;
  }
  static \u0275fac = function NgForm_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgForm)(\u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10), \u0275\u0275directiveInject(CALL_SET_DISABLED_STATE, 8));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _NgForm,
    selectors: [["form", 3, "ngNoForm", "", 3, "formGroup", "", 3, "formArray", ""], ["ng-form"], ["", "ngForm", ""]],
    hostBindings: function NgForm_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("submit", function NgForm_submit_HostBindingHandler($event) {
          return ctx.onSubmit($event);
        })("reset", function NgForm_reset_HostBindingHandler() {
          return ctx.onReset();
        });
      }
    },
    inputs: {
      options: [0, "ngFormOptions", "options"]
    },
    outputs: {
      ngSubmit: "ngSubmit"
    },
    exportAs: ["ngForm"],
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([formDirectiveProvider$2]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgForm, [{
    type: Directive,
    args: [{
      selector: "form:not([ngNoForm]):not([formGroup]):not([formArray]),ng-form,[ngForm]",
      providers: [formDirectiveProvider$2],
      host: {
        "(submit)": "onSubmit($event)",
        "(reset)": "onReset()"
      },
      outputs: ["ngSubmit"],
      exportAs: "ngForm",
      standalone: false
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [CALL_SET_DISABLED_STATE]
    }]
  }], {
    options: [{
      type: Input,
      args: ["ngFormOptions"]
    }]
  });
})();
function removeListItem(list, el) {
  const index = list.indexOf(el);
  if (index > -1) list.splice(index, 1);
}
function isFormControlState(formState) {
  return typeof formState === "object" && formState !== null && Object.keys(formState).length === 2 && "value" in formState && "disabled" in formState;
}
var FormControl = class FormControl2 extends AbstractControl {
  defaultValue = null;
  _onChange = [];
  _pendingValue;
  _pendingChange = false;
  constructor(formState = null, validatorOrOpts, asyncValidator) {
    super(pickValidators(validatorOrOpts), pickAsyncValidators(asyncValidator, validatorOrOpts));
    this._applyFormState(formState);
    this._setUpdateStrategy(validatorOrOpts);
    this._initObservables();
    this.updateValueAndValidity({
      onlySelf: true,
      emitEvent: !!this.asyncValidator
    });
    if (isOptionsObj(validatorOrOpts) && (validatorOrOpts.nonNullable || validatorOrOpts.initialValueIsDefault)) {
      if (isFormControlState(formState)) {
        this.defaultValue = formState.value;
      } else {
        this.defaultValue = formState;
      }
    }
  }
  setValue(value, options = {}) {
    this.value = this._pendingValue = value;
    if (this._onChange.length && options.emitModelToViewChange !== false) {
      this._onChange.forEach((changeFn) => changeFn(this.value, options.emitViewToModelChange !== false));
    }
    this.updateValueAndValidity(options);
  }
  patchValue(value, options = {}) {
    this.setValue(value, options);
  }
  reset(formState = this.defaultValue, options = {}) {
    this._applyFormState(formState);
    this.markAsPristine(options);
    this.markAsUntouched(options);
    this.setValue(this.value, options);
    if (options.overwriteDefaultValue) {
      this.defaultValue = this.value;
    }
    this._pendingChange = false;
    if (options?.emitEvent !== false) {
      this._events.next(new FormResetEvent(this));
    }
  }
  _updateValue() {
  }
  _anyControls(condition) {
    return false;
  }
  _allControlsDisabled() {
    return this.disabled;
  }
  registerOnChange(fn) {
    this._onChange.push(fn);
  }
  _unregisterOnChange(fn) {
    removeListItem(this._onChange, fn);
  }
  registerOnDisabledChange(fn) {
    this._onDisabledChange.push(fn);
  }
  _unregisterOnDisabledChange(fn) {
    removeListItem(this._onDisabledChange, fn);
  }
  _forEachChild(cb) {
  }
  _syncPendingControls() {
    if (this.updateOn === "submit") {
      if (this._pendingDirty) this.markAsDirty();
      if (this._pendingTouched) this.markAsTouched();
      if (this._pendingChange) {
        this.setValue(this._pendingValue, {
          onlySelf: true,
          emitModelToViewChange: false
        });
        return true;
      }
    }
    return false;
  }
  _applyFormState(formState) {
    if (isFormControlState(formState)) {
      this.value = this._pendingValue = formState.value;
      formState.disabled ? this.disable({
        onlySelf: true,
        emitEvent: false
      }) : this.enable({
        onlySelf: true,
        emitEvent: false
      });
    } else {
      this.value = this._pendingValue = formState;
    }
  }
};
var isFormControl = (control) => control instanceof FormControl;
var AbstractFormGroupDirective = class _AbstractFormGroupDirective extends ControlContainer {
  _parent;
  ngOnInit() {
    this._checkParentType();
    this.formDirective.addFormGroup(this);
  }
  ngOnDestroy() {
    this.formDirective?.removeFormGroup(this);
  }
  get control() {
    return this.formDirective.getFormGroup(this);
  }
  get path() {
    return controlPath(this.name == null ? this.name : this.name.toString(), this._parent);
  }
  get formDirective() {
    return this._parent ? this._parent.formDirective : null;
  }
  _checkParentType() {
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275AbstractFormGroupDirective_BaseFactory;
    return function AbstractFormGroupDirective_Factory(__ngFactoryType__) {
      return (\u0275AbstractFormGroupDirective_BaseFactory || (\u0275AbstractFormGroupDirective_BaseFactory = \u0275\u0275getInheritedFactory(_AbstractFormGroupDirective)))(__ngFactoryType__ || _AbstractFormGroupDirective);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _AbstractFormGroupDirective,
    standalone: false,
    features: [\u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AbstractFormGroupDirective, [{
    type: Directive,
    args: [{
      standalone: false
    }]
  }], null, null);
})();
function modelParentException() {
  return new RuntimeError(1350, `
    ngModel cannot be used to register form controls with a parent formGroup directive.  Try using
    formGroup's partner directive "formControlName" instead.  Example:

    ${formControlNameExample}

    Or, if you'd like to avoid registering this form control, indicate that it's standalone in ngModelOptions:

    Example:

    ${ngModelWithFormGroupExample}`);
}
function formGroupNameException() {
  return new RuntimeError(1351, `
    ngModel cannot be used to register form controls with a parent formGroupName or formArrayName directive.

    Option 1: Use formControlName instead of ngModel (reactive strategy):

    ${formGroupNameExample}

    Option 2:  Update ngModel's parent be ngModelGroup (template-driven strategy):

    ${ngModelGroupExample}`);
}
function missingNameException() {
  return new RuntimeError(1352, `If ngModel is used within a form tag, either the name attribute must be set or the form
    control must be defined as 'standalone' in ngModelOptions.

    Example 1: <input [(ngModel)]="person.firstName" name="first">
    Example 2: <input [(ngModel)]="person.firstName" [ngModelOptions]="{standalone: true}">`);
}
function modelGroupParentException() {
  return new RuntimeError(1353, `
    ngModelGroup cannot be used with a parent formGroup directive.

    Option 1: Use formGroupName instead of ngModelGroup (reactive strategy):

    ${formGroupNameExample}

    Option 2:  Use a regular form tag instead of the formGroup directive (template-driven strategy):

    ${ngModelGroupExample}`);
}
var modelGroupProvider = {
  provide: ControlContainer,
  useExisting: forwardRef(() => NgModelGroup)
};
var NgModelGroup = class _NgModelGroup extends AbstractFormGroupDirective {
  name = "";
  constructor(parent, validators, asyncValidators) {
    super();
    this._parent = parent;
    this._setValidators(validators);
    this._setAsyncValidators(asyncValidators);
  }
  _checkParentType() {
    if (!(this._parent instanceof _NgModelGroup) && !(this._parent instanceof NgForm) && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw modelGroupParentException();
    }
  }
  static \u0275fac = function NgModelGroup_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgModelGroup)(\u0275\u0275directiveInject(ControlContainer, 5), \u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _NgModelGroup,
    selectors: [["", "ngModelGroup", ""]],
    inputs: {
      name: [0, "ngModelGroup", "name"]
    },
    exportAs: ["ngModelGroup"],
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([modelGroupProvider]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgModelGroup, [{
    type: Directive,
    args: [{
      selector: "[ngModelGroup]",
      providers: [modelGroupProvider],
      exportAs: "ngModelGroup",
      standalone: false
    }]
  }], () => [{
    type: ControlContainer,
    decorators: [{
      type: Host
    }, {
      type: SkipSelf
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }], {
    name: [{
      type: Input,
      args: ["ngModelGroup"]
    }]
  });
})();
var formControlBinding$1 = {
  provide: NgControl,
  useExisting: forwardRef(() => NgModel)
};
var resolvedPromise = (() => Promise.resolve())();
var NgModel = class _NgModel extends NgControl {
  _changeDetectorRef;
  callSetDisabledState;
  control = new FormControl();
  static ngAcceptInputType_isDisabled;
  _registered = false;
  viewModel;
  name = "";
  isDisabled;
  model;
  options;
  update = new EventEmitter();
  constructor(parent, validators, asyncValidators, valueAccessors, _changeDetectorRef, callSetDisabledState) {
    super();
    this._changeDetectorRef = _changeDetectorRef;
    this.callSetDisabledState = callSetDisabledState;
    this._parent = parent;
    this._setValidators(validators);
    this._setAsyncValidators(asyncValidators);
    this.valueAccessor = selectValueAccessor(this, valueAccessors);
  }
  ngOnChanges(changes) {
    this._checkForErrors();
    if (!this._registered || "name" in changes) {
      if (this._registered) {
        this._checkName();
        if (this.formDirective) {
          const oldName = changes["name"].previousValue;
          this.formDirective.removeControl({
            name: oldName,
            path: this._getPath(oldName)
          });
        }
      }
      this._setUpControl();
    }
    if ("isDisabled" in changes) {
      this._updateDisabled(changes);
    }
    if (isPropertyUpdated(changes, this.viewModel)) {
      this._updateValue(this.model);
      this.viewModel = this.model;
    }
  }
  ngOnDestroy() {
    this.formDirective?.removeControl(this);
  }
  get path() {
    return this._getPath(this.name);
  }
  get formDirective() {
    return this._parent ? this._parent.formDirective : null;
  }
  viewToModelUpdate(newValue) {
    this.viewModel = newValue;
    this.update.emit(newValue);
  }
  _setUpControl() {
    this._setUpdateStrategy();
    this._isStandalone() ? this._setUpStandalone() : this.formDirective.addControl(this);
    this._registered = true;
  }
  _setUpdateStrategy() {
    if (this.options && this.options.updateOn != null) {
      this.control._updateOn = this.options.updateOn;
    }
  }
  _isStandalone() {
    return !this._parent || !!(this.options && this.options.standalone);
  }
  _setUpStandalone() {
    setUpControl(this.control, this, this.callSetDisabledState);
    this.control.updateValueAndValidity({
      emitEvent: false
    });
  }
  _checkForErrors() {
    if ((typeof ngDevMode === "undefined" || ngDevMode) && !this._isStandalone()) {
      checkParentType$1(this._parent);
    }
    this._checkName();
  }
  _checkName() {
    if (this.options && this.options.name) this.name = this.options.name;
    if (!this._isStandalone() && !this.name && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw missingNameException();
    }
  }
  _updateValue(value) {
    resolvedPromise.then(() => {
      this.control.setValue(value, {
        emitViewToModelChange: false
      });
      this._changeDetectorRef?.markForCheck();
    });
  }
  _updateDisabled(changes) {
    const disabledValue = changes["isDisabled"].currentValue;
    const isDisabled = disabledValue !== 0 && booleanAttribute(disabledValue);
    resolvedPromise.then(() => {
      if (isDisabled && !this.control.disabled) {
        this.control.disable();
      } else if (!isDisabled && this.control.disabled) {
        this.control.enable();
      }
      this._changeDetectorRef?.markForCheck();
    });
  }
  _getPath(controlName) {
    return this._parent ? controlPath(controlName, this._parent) : [controlName];
  }
  static \u0275fac = function NgModel_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgModel)(\u0275\u0275directiveInject(ControlContainer, 9), \u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10), \u0275\u0275directiveInject(NG_VALUE_ACCESSOR, 10), \u0275\u0275directiveInject(ChangeDetectorRef, 8), \u0275\u0275directiveInject(CALL_SET_DISABLED_STATE, 8));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _NgModel,
    selectors: [["", "ngModel", "", 3, "formControlName", "", 3, "formControl", ""]],
    inputs: {
      name: "name",
      isDisabled: [0, "disabled", "isDisabled"],
      model: [0, "ngModel", "model"],
      options: [0, "ngModelOptions", "options"]
    },
    outputs: {
      update: "ngModelChange"
    },
    exportAs: ["ngModel"],
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([formControlBinding$1]), \u0275\u0275InheritDefinitionFeature, \u0275\u0275NgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgModel, [{
    type: Directive,
    args: [{
      selector: "[ngModel]:not([formControlName]):not([formControl])",
      providers: [formControlBinding$1],
      exportAs: "ngModel",
      standalone: false
    }]
  }], () => [{
    type: ControlContainer,
    decorators: [{
      type: Optional
    }, {
      type: Host
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALUE_ACCESSOR]
    }]
  }, {
    type: ChangeDetectorRef,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [ChangeDetectorRef]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [CALL_SET_DISABLED_STATE]
    }]
  }], {
    name: [{
      type: Input
    }],
    isDisabled: [{
      type: Input,
      args: ["disabled"]
    }],
    model: [{
      type: Input,
      args: ["ngModel"]
    }],
    options: [{
      type: Input,
      args: ["ngModelOptions"]
    }],
    update: [{
      type: Output,
      args: ["ngModelChange"]
    }]
  });
})();
function checkParentType$1(parent) {
  if (!(parent instanceof NgModelGroup) && parent instanceof AbstractFormGroupDirective) {
    throw formGroupNameException();
  } else if (!(parent instanceof NgModelGroup) && !(parent instanceof NgForm)) {
    throw modelParentException();
  }
}
var \u0275NgNoValidate = class _\u0275NgNoValidate {
  static \u0275fac = function \u0275NgNoValidate_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _\u0275NgNoValidate)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _\u0275NgNoValidate,
    selectors: [["form", 3, "ngNoForm", "", 3, "ngNativeValidate", ""]],
    hostAttrs: ["novalidate", ""],
    standalone: false
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(\u0275NgNoValidate, [{
    type: Directive,
    args: [{
      selector: "form:not([ngNoForm]):not([ngNativeValidate])",
      host: {
        "novalidate": ""
      },
      standalone: false
    }]
  }], null, null);
})();
var NUMBER_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NumberValueAccessor),
  multi: true
};
var NumberValueAccessor = class _NumberValueAccessor extends BuiltInControlValueAccessor {
  writeValue(value) {
    const normalizedValue = value == null ? "" : value;
    this.setProperty("value", normalizedValue);
  }
  registerOnChange(fn) {
    this.onChange = (value) => {
      fn(value == "" ? null : parseFloat(value));
    };
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275NumberValueAccessor_BaseFactory;
    return function NumberValueAccessor_Factory(__ngFactoryType__) {
      return (\u0275NumberValueAccessor_BaseFactory || (\u0275NumberValueAccessor_BaseFactory = \u0275\u0275getInheritedFactory(_NumberValueAccessor)))(__ngFactoryType__ || _NumberValueAccessor);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _NumberValueAccessor,
    selectors: [["input", "type", "number", "formControlName", ""], ["input", "type", "number", "formControl", ""], ["input", "type", "number", "ngModel", ""]],
    hostBindings: function NumberValueAccessor_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("input", function NumberValueAccessor_input_HostBindingHandler($event) {
          return ctx.onChange($event.target.value);
        })("blur", function NumberValueAccessor_blur_HostBindingHandler() {
          return ctx.onTouched();
        });
      }
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([NUMBER_VALUE_ACCESSOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NumberValueAccessor, [{
    type: Directive,
    args: [{
      selector: "input[type=number][formControlName],input[type=number][formControl],input[type=number][ngModel]",
      host: {
        "(input)": "onChange($any($event.target).value)",
        "(blur)": "onTouched()"
      },
      providers: [NUMBER_VALUE_ACCESSOR],
      standalone: false
    }]
  }], null, null);
})();
var RADIO_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => RadioControlValueAccessor),
  multi: true
};
function throwNameError() {
  throw new RuntimeError(1202, `
      If you define both a name and a formControlName attribute on your radio button, their values
      must match. Ex: <input type="radio" formControlName="food" name="food">
    `);
}
var RadioControlRegistry = class _RadioControlRegistry {
  _accessors = [];
  add(control, accessor) {
    this._accessors.push([control, accessor]);
  }
  remove(accessor) {
    for (let i = this._accessors.length - 1; i >= 0; --i) {
      if (this._accessors[i][1] === accessor) {
        this._accessors.splice(i, 1);
        return;
      }
    }
  }
  select(accessor) {
    this._accessors.forEach((c) => {
      if (this._isSameGroup(c, accessor) && c[1] !== accessor) {
        c[1].fireUncheck(accessor.value);
      }
    });
  }
  _isSameGroup(controlPair, accessor) {
    if (!controlPair[0].control) return false;
    return controlPair[0]._parent === accessor._control._parent && controlPair[1].name === accessor.name;
  }
  static \u0275fac = function RadioControlRegistry_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RadioControlRegistry)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _RadioControlRegistry,
    factory: _RadioControlRegistry.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RadioControlRegistry, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var RadioControlValueAccessor = class _RadioControlValueAccessor extends BuiltInControlValueAccessor {
  _registry;
  _injector;
  _state;
  _control;
  _fn;
  setDisabledStateFired = false;
  onChange = () => {
  };
  name;
  formControlName;
  value;
  callSetDisabledState = inject(CALL_SET_DISABLED_STATE, {
    optional: true
  }) ?? setDisabledStateDefault;
  constructor(renderer, elementRef, _registry, _injector) {
    super(renderer, elementRef);
    this._registry = _registry;
    this._injector = _injector;
  }
  ngOnInit() {
    this._control = this._injector.get(NgControl);
    this._checkName();
    this._registry.add(this._control, this);
  }
  ngOnDestroy() {
    this._registry.remove(this);
  }
  writeValue(value) {
    this._state = value === this.value;
    this.setProperty("checked", this._state);
  }
  registerOnChange(fn) {
    this._fn = fn;
    this.onChange = () => {
      fn(this.value);
      this._registry.select(this);
    };
  }
  setDisabledState(isDisabled) {
    if (this.setDisabledStateFired || isDisabled || this.callSetDisabledState === "whenDisabledForLegacyCode") {
      this.setProperty("disabled", isDisabled);
    }
    this.setDisabledStateFired = true;
  }
  fireUncheck(value) {
    this.writeValue(value);
  }
  _checkName() {
    if (this.name && this.formControlName && this.name !== this.formControlName && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throwNameError();
    }
    if (!this.name && this.formControlName) this.name = this.formControlName;
  }
  static \u0275fac = function RadioControlValueAccessor_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RadioControlValueAccessor)(\u0275\u0275directiveInject(Renderer2), \u0275\u0275directiveInject(ElementRef), \u0275\u0275directiveInject(RadioControlRegistry), \u0275\u0275directiveInject(Injector));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _RadioControlValueAccessor,
    selectors: [["input", "type", "radio", "formControlName", ""], ["input", "type", "radio", "formControl", ""], ["input", "type", "radio", "ngModel", ""]],
    hostBindings: function RadioControlValueAccessor_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("change", function RadioControlValueAccessor_change_HostBindingHandler() {
          return ctx.onChange();
        })("blur", function RadioControlValueAccessor_blur_HostBindingHandler() {
          return ctx.onTouched();
        });
      }
    },
    inputs: {
      name: "name",
      formControlName: "formControlName",
      value: "value"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([RADIO_VALUE_ACCESSOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RadioControlValueAccessor, [{
    type: Directive,
    args: [{
      selector: "input[type=radio][formControlName],input[type=radio][formControl],input[type=radio][ngModel]",
      host: {
        "(change)": "onChange()",
        "(blur)": "onTouched()"
      },
      providers: [RADIO_VALUE_ACCESSOR],
      standalone: false
    }]
  }], () => [{
    type: Renderer2
  }, {
    type: ElementRef
  }, {
    type: RadioControlRegistry
  }, {
    type: Injector
  }], {
    name: [{
      type: Input
    }],
    formControlName: [{
      type: Input
    }],
    value: [{
      type: Input
    }]
  });
})();
var RANGE_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => RangeValueAccessor),
  multi: true
};
var RangeValueAccessor = class _RangeValueAccessor extends BuiltInControlValueAccessor {
  writeValue(value) {
    this.setProperty("value", parseFloat(value));
  }
  registerOnChange(fn) {
    this.onChange = (value) => {
      fn(value == "" ? null : parseFloat(value));
    };
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275RangeValueAccessor_BaseFactory;
    return function RangeValueAccessor_Factory(__ngFactoryType__) {
      return (\u0275RangeValueAccessor_BaseFactory || (\u0275RangeValueAccessor_BaseFactory = \u0275\u0275getInheritedFactory(_RangeValueAccessor)))(__ngFactoryType__ || _RangeValueAccessor);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _RangeValueAccessor,
    selectors: [["input", "type", "range", "formControlName", ""], ["input", "type", "range", "formControl", ""], ["input", "type", "range", "ngModel", ""]],
    hostBindings: function RangeValueAccessor_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("change", function RangeValueAccessor_change_HostBindingHandler($event) {
          return ctx.onChange($event.target.value);
        })("input", function RangeValueAccessor_input_HostBindingHandler($event) {
          return ctx.onChange($event.target.value);
        })("blur", function RangeValueAccessor_blur_HostBindingHandler() {
          return ctx.onTouched();
        });
      }
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([RANGE_VALUE_ACCESSOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RangeValueAccessor, [{
    type: Directive,
    args: [{
      selector: "input[type=range][formControlName],input[type=range][formControl],input[type=range][ngModel]",
      host: {
        "(change)": "onChange($any($event.target).value)",
        "(input)": "onChange($any($event.target).value)",
        "(blur)": "onTouched()"
      },
      providers: [RANGE_VALUE_ACCESSOR],
      standalone: false
    }]
  }], null, null);
})();
var FormArray = class extends AbstractControl {
  constructor(controls, validatorOrOpts, asyncValidator) {
    super(pickValidators(validatorOrOpts), pickAsyncValidators(asyncValidator, validatorOrOpts));
    this.controls = controls;
    this._initObservables();
    this._setUpdateStrategy(validatorOrOpts);
    this._setUpControls();
    this.updateValueAndValidity({
      onlySelf: true,
      emitEvent: !!this.asyncValidator
    });
  }
  controls;
  at(index) {
    return this.controls[this._adjustIndex(index)];
  }
  push(control, options = {}) {
    if (Array.isArray(control)) {
      control.forEach((ctrl) => {
        this.controls.push(ctrl);
        this._registerControl(ctrl);
      });
    } else {
      this.controls.push(control);
      this._registerControl(control);
    }
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
    this._onCollectionChange();
  }
  insert(index, control, options = {}) {
    this.controls.splice(index, 0, control);
    this._registerControl(control);
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
  }
  removeAt(index, options = {}) {
    let adjustedIndex = this._adjustIndex(index);
    if (adjustedIndex < 0) adjustedIndex = 0;
    if (this.controls[adjustedIndex]) this.controls[adjustedIndex]._registerOnCollectionChange(() => {
    });
    this.controls.splice(adjustedIndex, 1);
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
  }
  setControl(index, control, options = {}) {
    let adjustedIndex = this._adjustIndex(index);
    if (adjustedIndex < 0) adjustedIndex = 0;
    if (this.controls[adjustedIndex]) this.controls[adjustedIndex]._registerOnCollectionChange(() => {
    });
    this.controls.splice(adjustedIndex, 1);
    if (control) {
      this.controls.splice(adjustedIndex, 0, control);
      this._registerControl(control);
    }
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
    this._onCollectionChange();
  }
  get length() {
    return this.controls.length;
  }
  setValue(value, options = {}) {
    assertAllValuesPresent(this, false, value);
    value.forEach((newValue, index) => {
      assertControlPresent(this, false, index);
      this.at(index).setValue(newValue, {
        onlySelf: true,
        emitEvent: options.emitEvent
      });
    });
    this.updateValueAndValidity(options);
  }
  patchValue(value, options = {}) {
    if (value == null) return;
    value.forEach((newValue, index) => {
      if (this.at(index)) {
        this.at(index).patchValue(newValue, {
          onlySelf: true,
          emitEvent: options.emitEvent
        });
      }
    });
    this.updateValueAndValidity(options);
  }
  reset(value = [], options = {}) {
    this._forEachChild((control, index) => {
      control.reset(value[index], __spreadProps(__spreadValues({}, options), {
        onlySelf: true
      }));
    });
    this._updatePristine(options, this);
    this._updateTouched(options, this);
    this.updateValueAndValidity(options);
    if (options?.emitEvent !== false) {
      this._events.next(new FormResetEvent(this));
    }
  }
  getRawValue() {
    return this.controls.map((control) => control.getRawValue());
  }
  clear(options = {}) {
    if (this.controls.length < 1) return;
    this._forEachChild((control) => control._registerOnCollectionChange(() => {
    }));
    this.controls.splice(0);
    this.updateValueAndValidity({
      emitEvent: options.emitEvent
    });
  }
  _adjustIndex(index) {
    return index < 0 ? index + this.length : index;
  }
  _syncPendingControls() {
    let subtreeUpdated = this.controls.reduce((updated, child) => {
      return child._syncPendingControls() ? true : updated;
    }, false);
    if (subtreeUpdated) this.updateValueAndValidity({
      onlySelf: true
    });
    return subtreeUpdated;
  }
  _forEachChild(cb) {
    this.controls.forEach((control, index) => {
      cb(control, index);
    });
  }
  _updateValue() {
    this.value = this.controls.filter((control) => control.enabled || this.disabled).map((control) => control.value);
  }
  _anyControls(condition) {
    return this.controls.some((control) => control.enabled && condition(control));
  }
  _setUpControls() {
    this._forEachChild((control) => this._registerControl(control));
  }
  _allControlsDisabled() {
    for (const control of this.controls) {
      if (control.enabled) return false;
    }
    return this.controls.length > 0 || this.disabled;
  }
  _registerControl(control) {
    control.setParent(this);
    control._registerOnCollectionChange(this._onCollectionChange);
  }
  _find(name) {
    return this.at(name) ?? null;
  }
};
var AbstractFormDirective = class _AbstractFormDirective extends ControlContainer {
  callSetDisabledState;
  get submitted() {
    return untracked(this._submittedReactive);
  }
  set submitted(value) {
    this._submittedReactive.set(value);
  }
  _submitted = computed(() => this._submittedReactive(), ...ngDevMode ? [{
    debugName: "_submitted"
  }] : []);
  _submittedReactive = signal(false, ...ngDevMode ? [{
    debugName: "_submittedReactive"
  }] : []);
  _oldForm;
  _onCollectionChange = () => this._updateDomValue();
  directives = [];
  constructor(validators, asyncValidators, callSetDisabledState) {
    super();
    this.callSetDisabledState = callSetDisabledState;
    this._setValidators(validators);
    this._setAsyncValidators(asyncValidators);
  }
  ngOnChanges(changes) {
    this.onChanges(changes);
  }
  ngOnDestroy() {
    this.onDestroy();
  }
  onChanges(changes) {
    this._checkFormPresent();
    if (changes.hasOwnProperty("form")) {
      this._updateValidators();
      this._updateDomValue();
      this._updateRegistrations();
      this._oldForm = this.form;
    }
  }
  onDestroy() {
    if (this.form) {
      cleanUpValidators(this.form, this);
      if (this.form._onCollectionChange === this._onCollectionChange) {
        this.form._registerOnCollectionChange(() => {
        });
      }
    }
  }
  get formDirective() {
    return this;
  }
  get path() {
    return [];
  }
  addControl(dir) {
    const ctrl = this.form.get(dir.path);
    setUpControl(ctrl, dir, this.callSetDisabledState);
    ctrl.updateValueAndValidity({
      emitEvent: false
    });
    this.directives.push(dir);
    return ctrl;
  }
  getControl(dir) {
    return this.form.get(dir.path);
  }
  removeControl(dir) {
    cleanUpControl(dir.control || null, dir, false);
    removeListItem$1(this.directives, dir);
  }
  addFormGroup(dir) {
    this._setUpFormContainer(dir);
  }
  removeFormGroup(dir) {
    this._cleanUpFormContainer(dir);
  }
  getFormGroup(dir) {
    return this.form.get(dir.path);
  }
  getFormArray(dir) {
    return this.form.get(dir.path);
  }
  addFormArray(dir) {
    this._setUpFormContainer(dir);
  }
  removeFormArray(dir) {
    this._cleanUpFormContainer(dir);
  }
  updateModel(dir, value) {
    const ctrl = this.form.get(dir.path);
    ctrl.setValue(value);
  }
  onReset() {
    this.resetForm();
  }
  resetForm(value = void 0, options = {}) {
    this.form.reset(value, options);
    this._submittedReactive.set(false);
  }
  onSubmit($event) {
    this.submitted = true;
    syncPendingControls(this.form, this.directives);
    this.ngSubmit.emit($event);
    this.form._events.next(new FormSubmittedEvent(this.control));
    return $event?.target?.method === "dialog";
  }
  _updateDomValue() {
    this.directives.forEach((dir) => {
      const oldCtrl = dir.control;
      const newCtrl = this.form.get(dir.path);
      if (oldCtrl !== newCtrl) {
        cleanUpControl(oldCtrl || null, dir);
        if (isFormControl(newCtrl)) {
          setUpControl(newCtrl, dir, this.callSetDisabledState);
          dir.control = newCtrl;
        }
      }
    });
    this.form._updateTreeValidity({
      emitEvent: false
    });
  }
  _setUpFormContainer(dir) {
    const ctrl = this.form.get(dir.path);
    setUpFormContainer(ctrl, dir);
    ctrl.updateValueAndValidity({
      emitEvent: false
    });
  }
  _cleanUpFormContainer(dir) {
    const ctrl = this.form?.get(dir.path);
    if (ctrl) {
      const isControlUpdated = cleanUpFormContainer(ctrl, dir);
      if (isControlUpdated) {
        ctrl.updateValueAndValidity({
          emitEvent: false
        });
      }
    }
  }
  _updateRegistrations() {
    this.form._registerOnCollectionChange(this._onCollectionChange);
    this._oldForm?._registerOnCollectionChange(() => {
    });
  }
  _updateValidators() {
    setUpValidators(this.form, this);
    if (this._oldForm) {
      cleanUpValidators(this._oldForm, this);
    }
  }
  _checkFormPresent() {
    if (!this.form && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw missingFormException();
    }
  }
  static \u0275fac = function AbstractFormDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AbstractFormDirective)(\u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10), \u0275\u0275directiveInject(CALL_SET_DISABLED_STATE, 8));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _AbstractFormDirective,
    features: [\u0275\u0275InheritDefinitionFeature, \u0275\u0275NgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AbstractFormDirective, [{
    type: Directive
  }], () => [{
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [CALL_SET_DISABLED_STATE]
    }]
  }], null);
})();
var formDirectiveProvider$1 = {
  provide: ControlContainer,
  useExisting: forwardRef(() => FormArrayDirective)
};
var FormArrayDirective = class _FormArrayDirective extends AbstractFormDirective {
  form = null;
  ngSubmit = new EventEmitter();
  get control() {
    return this.form;
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275FormArrayDirective_BaseFactory;
    return function FormArrayDirective_Factory(__ngFactoryType__) {
      return (\u0275FormArrayDirective_BaseFactory || (\u0275FormArrayDirective_BaseFactory = \u0275\u0275getInheritedFactory(_FormArrayDirective)))(__ngFactoryType__ || _FormArrayDirective);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _FormArrayDirective,
    selectors: [["", "formArray", ""]],
    hostBindings: function FormArrayDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("submit", function FormArrayDirective_submit_HostBindingHandler($event) {
          return ctx.onSubmit($event);
        })("reset", function FormArrayDirective_reset_HostBindingHandler() {
          return ctx.onReset();
        });
      }
    },
    inputs: {
      form: [0, "formArray", "form"]
    },
    outputs: {
      ngSubmit: "ngSubmit"
    },
    exportAs: ["ngForm"],
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([formDirectiveProvider$1]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormArrayDirective, [{
    type: Directive,
    args: [{
      selector: "[formArray]",
      providers: [formDirectiveProvider$1],
      host: {
        "(submit)": "onSubmit($event)",
        "(reset)": "onReset()"
      },
      exportAs: "ngForm",
      standalone: false
    }]
  }], null, {
    form: [{
      type: Input,
      args: ["formArray"]
    }],
    ngSubmit: [{
      type: Output
    }]
  });
})();
var NG_MODEL_WITH_FORM_CONTROL_WARNING = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "NgModelWithFormControlWarning" : "");
var formControlBinding = {
  provide: NgControl,
  useExisting: forwardRef(() => FormControlDirective)
};
var FormControlDirective = class _FormControlDirective extends NgControl {
  _ngModelWarningConfig;
  callSetDisabledState;
  viewModel;
  form;
  set isDisabled(isDisabled) {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      console.warn(disabledAttrWarning);
    }
  }
  model;
  update = new EventEmitter();
  static _ngModelWarningSentOnce = false;
  _ngModelWarningSent = false;
  constructor(validators, asyncValidators, valueAccessors, _ngModelWarningConfig, callSetDisabledState) {
    super();
    this._ngModelWarningConfig = _ngModelWarningConfig;
    this.callSetDisabledState = callSetDisabledState;
    this._setValidators(validators);
    this._setAsyncValidators(asyncValidators);
    this.valueAccessor = selectValueAccessor(this, valueAccessors);
  }
  ngOnChanges(changes) {
    if (this._isControlChanged(changes)) {
      const previousForm = changes["form"].previousValue;
      if (previousForm) {
        cleanUpControl(previousForm, this, false);
      }
      setUpControl(this.form, this, this.callSetDisabledState);
      this.form.updateValueAndValidity({
        emitEvent: false
      });
    }
    if (isPropertyUpdated(changes, this.viewModel)) {
      if (typeof ngDevMode === "undefined" || ngDevMode) {
        _ngModelWarning("formControl", _FormControlDirective, this, this._ngModelWarningConfig);
      }
      this.form.setValue(this.model);
      this.viewModel = this.model;
    }
  }
  ngOnDestroy() {
    if (this.form) {
      cleanUpControl(this.form, this, false);
    }
  }
  get path() {
    return [];
  }
  get control() {
    return this.form;
  }
  viewToModelUpdate(newValue) {
    this.viewModel = newValue;
    this.update.emit(newValue);
  }
  _isControlChanged(changes) {
    return changes.hasOwnProperty("form");
  }
  static \u0275fac = function FormControlDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormControlDirective)(\u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10), \u0275\u0275directiveInject(NG_VALUE_ACCESSOR, 10), \u0275\u0275directiveInject(NG_MODEL_WITH_FORM_CONTROL_WARNING, 8), \u0275\u0275directiveInject(CALL_SET_DISABLED_STATE, 8));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _FormControlDirective,
    selectors: [["", "formControl", ""]],
    inputs: {
      form: [0, "formControl", "form"],
      isDisabled: [0, "disabled", "isDisabled"],
      model: [0, "ngModel", "model"]
    },
    outputs: {
      update: "ngModelChange"
    },
    exportAs: ["ngForm"],
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([formControlBinding]), \u0275\u0275InheritDefinitionFeature, \u0275\u0275NgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormControlDirective, [{
    type: Directive,
    args: [{
      selector: "[formControl]",
      providers: [formControlBinding],
      exportAs: "ngForm",
      standalone: false
    }]
  }], () => [{
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALUE_ACCESSOR]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [NG_MODEL_WITH_FORM_CONTROL_WARNING]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [CALL_SET_DISABLED_STATE]
    }]
  }], {
    form: [{
      type: Input,
      args: ["formControl"]
    }],
    isDisabled: [{
      type: Input,
      args: ["disabled"]
    }],
    model: [{
      type: Input,
      args: ["ngModel"]
    }],
    update: [{
      type: Output,
      args: ["ngModelChange"]
    }]
  });
})();
var formGroupNameProvider = {
  provide: ControlContainer,
  useExisting: forwardRef(() => FormGroupName)
};
var FormGroupName = class _FormGroupName extends AbstractFormGroupDirective {
  name = null;
  constructor(parent, validators, asyncValidators) {
    super();
    this._parent = parent;
    this._setValidators(validators);
    this._setAsyncValidators(asyncValidators);
  }
  _checkParentType() {
    if (hasInvalidParent(this._parent) && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw groupParentException();
    }
  }
  static \u0275fac = function FormGroupName_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormGroupName)(\u0275\u0275directiveInject(ControlContainer, 13), \u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _FormGroupName,
    selectors: [["", "formGroupName", ""]],
    inputs: {
      name: [0, "formGroupName", "name"]
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([formGroupNameProvider]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormGroupName, [{
    type: Directive,
    args: [{
      selector: "[formGroupName]",
      providers: [formGroupNameProvider],
      standalone: false
    }]
  }], () => [{
    type: ControlContainer,
    decorators: [{
      type: Optional
    }, {
      type: Host
    }, {
      type: SkipSelf
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }], {
    name: [{
      type: Input,
      args: ["formGroupName"]
    }]
  });
})();
var formArrayNameProvider = {
  provide: ControlContainer,
  useExisting: forwardRef(() => FormArrayName)
};
var FormArrayName = class _FormArrayName extends ControlContainer {
  _parent;
  name = null;
  constructor(parent, validators, asyncValidators) {
    super();
    this._parent = parent;
    this._setValidators(validators);
    this._setAsyncValidators(asyncValidators);
  }
  ngOnInit() {
    if (hasInvalidParent(this._parent) && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw arrayParentException();
    }
    this.formDirective.addFormArray(this);
  }
  ngOnDestroy() {
    this.formDirective?.removeFormArray(this);
  }
  get control() {
    return this.formDirective.getFormArray(this);
  }
  get formDirective() {
    return this._parent ? this._parent.formDirective : null;
  }
  get path() {
    return controlPath(this.name == null ? this.name : this.name.toString(), this._parent);
  }
  static \u0275fac = function FormArrayName_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormArrayName)(\u0275\u0275directiveInject(ControlContainer, 13), \u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _FormArrayName,
    selectors: [["", "formArrayName", ""]],
    inputs: {
      name: [0, "formArrayName", "name"]
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([formArrayNameProvider]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormArrayName, [{
    type: Directive,
    args: [{
      selector: "[formArrayName]",
      providers: [formArrayNameProvider],
      standalone: false
    }]
  }], () => [{
    type: ControlContainer,
    decorators: [{
      type: Optional
    }, {
      type: Host
    }, {
      type: SkipSelf
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }], {
    name: [{
      type: Input,
      args: ["formArrayName"]
    }]
  });
})();
function hasInvalidParent(parent) {
  return !(parent instanceof FormGroupName) && !(parent instanceof AbstractFormDirective) && !(parent instanceof FormArrayName);
}
var controlNameBinding = {
  provide: NgControl,
  useExisting: forwardRef(() => FormControlName)
};
var FormControlName = class _FormControlName extends NgControl {
  _ngModelWarningConfig;
  _added = false;
  viewModel;
  control;
  name = null;
  set isDisabled(isDisabled) {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      console.warn(disabledAttrWarning);
    }
  }
  model;
  update = new EventEmitter();
  static _ngModelWarningSentOnce = false;
  _ngModelWarningSent = false;
  constructor(parent, validators, asyncValidators, valueAccessors, _ngModelWarningConfig) {
    super();
    this._ngModelWarningConfig = _ngModelWarningConfig;
    this._parent = parent;
    this._setValidators(validators);
    this._setAsyncValidators(asyncValidators);
    this.valueAccessor = selectValueAccessor(this, valueAccessors);
  }
  ngOnChanges(changes) {
    if (!this._added) this._setUpControl();
    if (isPropertyUpdated(changes, this.viewModel)) {
      if (typeof ngDevMode === "undefined" || ngDevMode) {
        _ngModelWarning("formControlName", _FormControlName, this, this._ngModelWarningConfig);
      }
      this.viewModel = this.model;
      this.formDirective.updateModel(this, this.model);
    }
  }
  ngOnDestroy() {
    this.formDirective?.removeControl(this);
  }
  viewToModelUpdate(newValue) {
    this.viewModel = newValue;
    this.update.emit(newValue);
  }
  get path() {
    return controlPath(this.name == null ? this.name : this.name.toString(), this._parent);
  }
  get formDirective() {
    return this._parent ? this._parent.formDirective : null;
  }
  _setUpControl() {
    if (typeof ngDevMode === "undefined" || ngDevMode) {
      checkParentType(this._parent, this.name);
    }
    this.control = this.formDirective.addControl(this);
    this._added = true;
  }
  static \u0275fac = function FormControlName_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormControlName)(\u0275\u0275directiveInject(ControlContainer, 13), \u0275\u0275directiveInject(NG_VALIDATORS, 10), \u0275\u0275directiveInject(NG_ASYNC_VALIDATORS, 10), \u0275\u0275directiveInject(NG_VALUE_ACCESSOR, 10), \u0275\u0275directiveInject(NG_MODEL_WITH_FORM_CONTROL_WARNING, 8));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _FormControlName,
    selectors: [["", "formControlName", ""]],
    inputs: {
      name: [0, "formControlName", "name"],
      isDisabled: [0, "disabled", "isDisabled"],
      model: [0, "ngModel", "model"]
    },
    outputs: {
      update: "ngModelChange"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([controlNameBinding]), \u0275\u0275InheritDefinitionFeature, \u0275\u0275NgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormControlName, [{
    type: Directive,
    args: [{
      selector: "[formControlName]",
      providers: [controlNameBinding],
      standalone: false
    }]
  }], () => [{
    type: ControlContainer,
    decorators: [{
      type: Optional
    }, {
      type: Host
    }, {
      type: SkipSelf
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_ASYNC_VALIDATORS]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }, {
      type: Inject,
      args: [NG_VALUE_ACCESSOR]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Optional
    }, {
      type: Inject,
      args: [NG_MODEL_WITH_FORM_CONTROL_WARNING]
    }]
  }], {
    name: [{
      type: Input,
      args: ["formControlName"]
    }],
    isDisabled: [{
      type: Input,
      args: ["disabled"]
    }],
    model: [{
      type: Input,
      args: ["ngModel"]
    }],
    update: [{
      type: Output,
      args: ["ngModelChange"]
    }]
  });
})();
function checkParentType(parent, name) {
  if (!(parent instanceof FormGroupName) && parent instanceof AbstractFormGroupDirective) {
    throw ngModelGroupException();
  } else if (!(parent instanceof FormGroupName) && !(parent instanceof AbstractFormDirective) && !(parent instanceof FormArrayName)) {
    throw controlParentException(name);
  }
}
var formDirectiveProvider = {
  provide: ControlContainer,
  useExisting: forwardRef(() => FormGroupDirective)
};
var FormGroupDirective = class _FormGroupDirective extends AbstractFormDirective {
  form = null;
  ngSubmit = new EventEmitter();
  get control() {
    return this.form;
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275FormGroupDirective_BaseFactory;
    return function FormGroupDirective_Factory(__ngFactoryType__) {
      return (\u0275FormGroupDirective_BaseFactory || (\u0275FormGroupDirective_BaseFactory = \u0275\u0275getInheritedFactory(_FormGroupDirective)))(__ngFactoryType__ || _FormGroupDirective);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _FormGroupDirective,
    selectors: [["", "formGroup", ""]],
    hostBindings: function FormGroupDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("submit", function FormGroupDirective_submit_HostBindingHandler($event) {
          return ctx.onSubmit($event);
        })("reset", function FormGroupDirective_reset_HostBindingHandler() {
          return ctx.onReset();
        });
      }
    },
    inputs: {
      form: [0, "formGroup", "form"]
    },
    outputs: {
      ngSubmit: "ngSubmit"
    },
    exportAs: ["ngForm"],
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([formDirectiveProvider]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormGroupDirective, [{
    type: Directive,
    args: [{
      selector: "[formGroup]",
      providers: [formDirectiveProvider],
      host: {
        "(submit)": "onSubmit($event)",
        "(reset)": "onReset()"
      },
      exportAs: "ngForm",
      standalone: false
    }]
  }], null, {
    form: [{
      type: Input,
      args: ["formGroup"]
    }],
    ngSubmit: [{
      type: Output
    }]
  });
})();
var SELECT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectControlValueAccessor),
  multi: true
};
function _buildValueString$1(id, value) {
  if (id == null) return `${value}`;
  if (value && typeof value === "object") value = "Object";
  return `${id}: ${value}`.slice(0, 50);
}
function _extractId$1(valueString) {
  return valueString.split(":")[0];
}
var SelectControlValueAccessor = class _SelectControlValueAccessor extends BuiltInControlValueAccessor {
  value;
  _optionMap = /* @__PURE__ */ new Map();
  _idCounter = 0;
  set compareWith(fn) {
    if (typeof fn !== "function" && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw new RuntimeError(1201, `compareWith must be a function, but received ${JSON.stringify(fn)}`);
    }
    this._compareWith = fn;
  }
  _compareWith = Object.is;
  appRefInjector = inject(ApplicationRef).injector;
  destroyRef = inject(DestroyRef);
  cdr = inject(ChangeDetectorRef);
  _queuedWrite = false;
  _writeValueAfterRender() {
    if (this._queuedWrite || this.appRefInjector.destroyed) {
      return;
    }
    this._queuedWrite = true;
    afterNextRender({
      write: () => {
        if (this.destroyRef.destroyed) {
          return;
        }
        this._queuedWrite = false;
        this.writeValue(this.value);
      }
    }, {
      injector: this.appRefInjector
    });
  }
  writeValue(value) {
    this.cdr.markForCheck();
    this.value = value;
    const id = this._getOptionId(value);
    const valueString = _buildValueString$1(id, value);
    this.setProperty("value", valueString);
  }
  registerOnChange(fn) {
    this.onChange = (valueString) => {
      this.value = this._getOptionValue(valueString);
      fn(this.value);
    };
  }
  _registerOption() {
    return (this._idCounter++).toString();
  }
  _getOptionId(value) {
    for (const id of this._optionMap.keys()) {
      if (this._compareWith(this._optionMap.get(id), value)) return id;
    }
    return null;
  }
  _getOptionValue(valueString) {
    const id = _extractId$1(valueString);
    return this._optionMap.has(id) ? this._optionMap.get(id) : valueString;
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275SelectControlValueAccessor_BaseFactory;
    return function SelectControlValueAccessor_Factory(__ngFactoryType__) {
      return (\u0275SelectControlValueAccessor_BaseFactory || (\u0275SelectControlValueAccessor_BaseFactory = \u0275\u0275getInheritedFactory(_SelectControlValueAccessor)))(__ngFactoryType__ || _SelectControlValueAccessor);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _SelectControlValueAccessor,
    selectors: [["select", "formControlName", "", 3, "multiple", ""], ["select", "formControl", "", 3, "multiple", ""], ["select", "ngModel", "", 3, "multiple", ""]],
    hostBindings: function SelectControlValueAccessor_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("change", function SelectControlValueAccessor_change_HostBindingHandler($event) {
          return ctx.onChange($event.target.value);
        })("blur", function SelectControlValueAccessor_blur_HostBindingHandler() {
          return ctx.onTouched();
        });
      }
    },
    inputs: {
      compareWith: "compareWith"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([SELECT_VALUE_ACCESSOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SelectControlValueAccessor, [{
    type: Directive,
    args: [{
      selector: "select:not([multiple])[formControlName],select:not([multiple])[formControl],select:not([multiple])[ngModel]",
      host: {
        "(change)": "onChange($any($event.target).value)",
        "(blur)": "onTouched()"
      },
      providers: [SELECT_VALUE_ACCESSOR],
      standalone: false
    }]
  }], null, {
    compareWith: [{
      type: Input
    }]
  });
})();
var NgSelectOption = class _NgSelectOption {
  _element;
  _renderer;
  _select;
  id;
  constructor(_element, _renderer, _select) {
    this._element = _element;
    this._renderer = _renderer;
    this._select = _select;
    if (this._select) this.id = this._select._registerOption();
  }
  set ngValue(value) {
    if (this._select == null) return;
    this._select._optionMap.set(this.id, value);
    this._setElementValue(_buildValueString$1(this.id, value));
    this._select._writeValueAfterRender();
  }
  set value(value) {
    this._setElementValue(value);
    this._select?._writeValueAfterRender();
  }
  _setElementValue(value) {
    this._renderer.setProperty(this._element.nativeElement, "value", value);
  }
  ngOnDestroy() {
    this._select?._optionMap.delete(this.id);
    this._select?._writeValueAfterRender();
  }
  static \u0275fac = function NgSelectOption_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgSelectOption)(\u0275\u0275directiveInject(ElementRef), \u0275\u0275directiveInject(Renderer2), \u0275\u0275directiveInject(SelectControlValueAccessor, 9));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _NgSelectOption,
    selectors: [["option"]],
    inputs: {
      ngValue: "ngValue",
      value: "value"
    },
    standalone: false
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgSelectOption, [{
    type: Directive,
    args: [{
      selector: "option",
      standalone: false
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: Renderer2
  }, {
    type: SelectControlValueAccessor,
    decorators: [{
      type: Optional
    }, {
      type: Host
    }]
  }], {
    ngValue: [{
      type: Input,
      args: ["ngValue"]
    }],
    value: [{
      type: Input,
      args: ["value"]
    }]
  });
})();
var SELECT_MULTIPLE_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectMultipleControlValueAccessor),
  multi: true
};
function _buildValueString(id, value) {
  if (id == null) return `${value}`;
  if (typeof value === "string") value = `'${value}'`;
  if (value && typeof value === "object") value = "Object";
  return `${id}: ${value}`.slice(0, 50);
}
function _extractId(valueString) {
  return valueString.split(":")[0];
}
var SelectMultipleControlValueAccessor = class _SelectMultipleControlValueAccessor extends BuiltInControlValueAccessor {
  value;
  _optionMap = /* @__PURE__ */ new Map();
  _idCounter = 0;
  set compareWith(fn) {
    if (typeof fn !== "function" && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw new RuntimeError(1201, `compareWith must be a function, but received ${JSON.stringify(fn)}`);
    }
    this._compareWith = fn;
  }
  _compareWith = Object.is;
  writeValue(value) {
    this.value = value;
    let optionSelectedStateSetter;
    if (Array.isArray(value)) {
      const ids = value.map((v) => this._getOptionId(v));
      optionSelectedStateSetter = (opt, o) => {
        opt._setSelected(ids.indexOf(o.toString()) > -1);
      };
    } else {
      optionSelectedStateSetter = (opt, o) => {
        opt._setSelected(false);
      };
    }
    this._optionMap.forEach(optionSelectedStateSetter);
  }
  registerOnChange(fn) {
    this.onChange = (element) => {
      const selected = [];
      const selectedOptions = element.selectedOptions;
      if (selectedOptions !== void 0) {
        const options = selectedOptions;
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          const val = this._getOptionValue(opt.value);
          selected.push(val);
        }
      } else {
        const options = element.options;
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          if (opt.selected) {
            const val = this._getOptionValue(opt.value);
            selected.push(val);
          }
        }
      }
      this.value = selected;
      fn(selected);
    };
  }
  _registerOption(value) {
    const id = (this._idCounter++).toString();
    this._optionMap.set(id, value);
    return id;
  }
  _getOptionId(value) {
    for (const id of this._optionMap.keys()) {
      if (this._compareWith(this._optionMap.get(id)._value, value)) return id;
    }
    return null;
  }
  _getOptionValue(valueString) {
    const id = _extractId(valueString);
    return this._optionMap.has(id) ? this._optionMap.get(id)._value : valueString;
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275SelectMultipleControlValueAccessor_BaseFactory;
    return function SelectMultipleControlValueAccessor_Factory(__ngFactoryType__) {
      return (\u0275SelectMultipleControlValueAccessor_BaseFactory || (\u0275SelectMultipleControlValueAccessor_BaseFactory = \u0275\u0275getInheritedFactory(_SelectMultipleControlValueAccessor)))(__ngFactoryType__ || _SelectMultipleControlValueAccessor);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _SelectMultipleControlValueAccessor,
    selectors: [["select", "multiple", "", "formControlName", ""], ["select", "multiple", "", "formControl", ""], ["select", "multiple", "", "ngModel", ""]],
    hostBindings: function SelectMultipleControlValueAccessor_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("change", function SelectMultipleControlValueAccessor_change_HostBindingHandler($event) {
          return ctx.onChange($event.target);
        })("blur", function SelectMultipleControlValueAccessor_blur_HostBindingHandler() {
          return ctx.onTouched();
        });
      }
    },
    inputs: {
      compareWith: "compareWith"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([SELECT_MULTIPLE_VALUE_ACCESSOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SelectMultipleControlValueAccessor, [{
    type: Directive,
    args: [{
      selector: "select[multiple][formControlName],select[multiple][formControl],select[multiple][ngModel]",
      host: {
        "(change)": "onChange($event.target)",
        "(blur)": "onTouched()"
      },
      providers: [SELECT_MULTIPLE_VALUE_ACCESSOR],
      standalone: false
    }]
  }], null, {
    compareWith: [{
      type: Input
    }]
  });
})();
var \u0275NgSelectMultipleOption = class _\u0275NgSelectMultipleOption {
  _element;
  _renderer;
  _select;
  id;
  _value;
  constructor(_element, _renderer, _select) {
    this._element = _element;
    this._renderer = _renderer;
    this._select = _select;
    if (this._select) {
      this.id = this._select._registerOption(this);
    }
  }
  set ngValue(value) {
    if (this._select == null) return;
    this._value = value;
    this._setElementValue(_buildValueString(this.id, value));
    this._select.writeValue(this._select.value);
  }
  set value(value) {
    if (this._select) {
      this._value = value;
      this._setElementValue(_buildValueString(this.id, value));
      this._select.writeValue(this._select.value);
    } else {
      this._setElementValue(value);
    }
  }
  _setElementValue(value) {
    this._renderer.setProperty(this._element.nativeElement, "value", value);
  }
  _setSelected(selected) {
    this._renderer.setProperty(this._element.nativeElement, "selected", selected);
  }
  ngOnDestroy() {
    if (this._select) {
      this._select._optionMap.delete(this.id);
      this._select.writeValue(this._select.value);
    }
  }
  static \u0275fac = function \u0275NgSelectMultipleOption_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _\u0275NgSelectMultipleOption)(\u0275\u0275directiveInject(ElementRef), \u0275\u0275directiveInject(Renderer2), \u0275\u0275directiveInject(SelectMultipleControlValueAccessor, 9));
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _\u0275NgSelectMultipleOption,
    selectors: [["option"]],
    inputs: {
      ngValue: "ngValue",
      value: "value"
    },
    standalone: false
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(\u0275NgSelectMultipleOption, [{
    type: Directive,
    args: [{
      selector: "option",
      standalone: false
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: Renderer2
  }, {
    type: SelectMultipleControlValueAccessor,
    decorators: [{
      type: Optional
    }, {
      type: Host
    }]
  }], {
    ngValue: [{
      type: Input,
      args: ["ngValue"]
    }],
    value: [{
      type: Input,
      args: ["value"]
    }]
  });
})();
function toInteger(value) {
  return typeof value === "number" ? value : parseInt(value, 10);
}
function toFloat(value) {
  return typeof value === "number" ? value : parseFloat(value);
}
var AbstractValidatorDirective = class _AbstractValidatorDirective {
  _validator = nullValidator;
  _onChange;
  _enabled;
  ngOnChanges(changes) {
    if (this.inputName in changes) {
      const input = this.normalizeInput(changes[this.inputName].currentValue);
      this._enabled = this.enabled(input);
      this._validator = this._enabled ? this.createValidator(input) : nullValidator;
      this._onChange?.();
    }
  }
  validate(control) {
    return this._validator(control);
  }
  registerOnValidatorChange(fn) {
    this._onChange = fn;
  }
  enabled(input) {
    return input != null;
  }
  static \u0275fac = function AbstractValidatorDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AbstractValidatorDirective)();
  };
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _AbstractValidatorDirective,
    features: [\u0275\u0275NgOnChangesFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AbstractValidatorDirective, [{
    type: Directive
  }], null, null);
})();
var MAX_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MaxValidator),
  multi: true
};
var MaxValidator = class _MaxValidator extends AbstractValidatorDirective {
  max;
  inputName = "max";
  normalizeInput = (input) => toFloat(input);
  createValidator = (max) => maxValidator(max);
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275MaxValidator_BaseFactory;
    return function MaxValidator_Factory(__ngFactoryType__) {
      return (\u0275MaxValidator_BaseFactory || (\u0275MaxValidator_BaseFactory = \u0275\u0275getInheritedFactory(_MaxValidator)))(__ngFactoryType__ || _MaxValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _MaxValidator,
    selectors: [["input", "type", "number", "max", "", "formControlName", ""], ["input", "type", "number", "max", "", "formControl", ""], ["input", "type", "number", "max", "", "ngModel", ""]],
    hostVars: 1,
    hostBindings: function MaxValidator_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("max", ctx._enabled ? ctx.max : null);
      }
    },
    inputs: {
      max: "max"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([MAX_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MaxValidator, [{
    type: Directive,
    args: [{
      selector: "input[type=number][max][formControlName],input[type=number][max][formControl],input[type=number][max][ngModel]",
      providers: [MAX_VALIDATOR],
      host: {
        "[attr.max]": "_enabled ? max : null"
      },
      standalone: false
    }]
  }], null, {
    max: [{
      type: Input
    }]
  });
})();
var MIN_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MinValidator),
  multi: true
};
var MinValidator = class _MinValidator extends AbstractValidatorDirective {
  min;
  inputName = "min";
  normalizeInput = (input) => toFloat(input);
  createValidator = (min) => minValidator(min);
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275MinValidator_BaseFactory;
    return function MinValidator_Factory(__ngFactoryType__) {
      return (\u0275MinValidator_BaseFactory || (\u0275MinValidator_BaseFactory = \u0275\u0275getInheritedFactory(_MinValidator)))(__ngFactoryType__ || _MinValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _MinValidator,
    selectors: [["input", "type", "number", "min", "", "formControlName", ""], ["input", "type", "number", "min", "", "formControl", ""], ["input", "type", "number", "min", "", "ngModel", ""]],
    hostVars: 1,
    hostBindings: function MinValidator_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("min", ctx._enabled ? ctx.min : null);
      }
    },
    inputs: {
      min: "min"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([MIN_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MinValidator, [{
    type: Directive,
    args: [{
      selector: "input[type=number][min][formControlName],input[type=number][min][formControl],input[type=number][min][ngModel]",
      providers: [MIN_VALIDATOR],
      host: {
        "[attr.min]": "_enabled ? min : null"
      },
      standalone: false
    }]
  }], null, {
    min: [{
      type: Input
    }]
  });
})();
var REQUIRED_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => RequiredValidator),
  multi: true
};
var CHECKBOX_REQUIRED_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CheckboxRequiredValidator),
  multi: true
};
var RequiredValidator = class _RequiredValidator extends AbstractValidatorDirective {
  required;
  inputName = "required";
  normalizeInput = booleanAttribute;
  createValidator = (input) => requiredValidator;
  enabled(input) {
    return input;
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275RequiredValidator_BaseFactory;
    return function RequiredValidator_Factory(__ngFactoryType__) {
      return (\u0275RequiredValidator_BaseFactory || (\u0275RequiredValidator_BaseFactory = \u0275\u0275getInheritedFactory(_RequiredValidator)))(__ngFactoryType__ || _RequiredValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _RequiredValidator,
    selectors: [["", "required", "", "formControlName", "", 3, "type", "checkbox"], ["", "required", "", "formControl", "", 3, "type", "checkbox"], ["", "required", "", "ngModel", "", 3, "type", "checkbox"]],
    hostVars: 1,
    hostBindings: function RequiredValidator_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("required", ctx._enabled ? "" : null);
      }
    },
    inputs: {
      required: "required"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([REQUIRED_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RequiredValidator, [{
    type: Directive,
    args: [{
      selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]",
      providers: [REQUIRED_VALIDATOR],
      host: {
        "[attr.required]": '_enabled ? "" : null'
      },
      standalone: false
    }]
  }], null, {
    required: [{
      type: Input
    }]
  });
})();
var CheckboxRequiredValidator = class _CheckboxRequiredValidator extends RequiredValidator {
  createValidator = (input) => requiredTrueValidator;
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275CheckboxRequiredValidator_BaseFactory;
    return function CheckboxRequiredValidator_Factory(__ngFactoryType__) {
      return (\u0275CheckboxRequiredValidator_BaseFactory || (\u0275CheckboxRequiredValidator_BaseFactory = \u0275\u0275getInheritedFactory(_CheckboxRequiredValidator)))(__ngFactoryType__ || _CheckboxRequiredValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _CheckboxRequiredValidator,
    selectors: [["input", "type", "checkbox", "required", "", "formControlName", ""], ["input", "type", "checkbox", "required", "", "formControl", ""], ["input", "type", "checkbox", "required", "", "ngModel", ""]],
    hostVars: 1,
    hostBindings: function CheckboxRequiredValidator_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("required", ctx._enabled ? "" : null);
      }
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([CHECKBOX_REQUIRED_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CheckboxRequiredValidator, [{
    type: Directive,
    args: [{
      selector: "input[type=checkbox][required][formControlName],input[type=checkbox][required][formControl],input[type=checkbox][required][ngModel]",
      providers: [CHECKBOX_REQUIRED_VALIDATOR],
      host: {
        "[attr.required]": '_enabled ? "" : null'
      },
      standalone: false
    }]
  }], null, null);
})();
var EMAIL_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => EmailValidator),
  multi: true
};
var EmailValidator = class _EmailValidator extends AbstractValidatorDirective {
  email;
  inputName = "email";
  normalizeInput = booleanAttribute;
  createValidator = (input) => emailValidator;
  enabled(input) {
    return input;
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275EmailValidator_BaseFactory;
    return function EmailValidator_Factory(__ngFactoryType__) {
      return (\u0275EmailValidator_BaseFactory || (\u0275EmailValidator_BaseFactory = \u0275\u0275getInheritedFactory(_EmailValidator)))(__ngFactoryType__ || _EmailValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _EmailValidator,
    selectors: [["", "email", "", "formControlName", ""], ["", "email", "", "formControl", ""], ["", "email", "", "ngModel", ""]],
    inputs: {
      email: "email"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([EMAIL_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(EmailValidator, [{
    type: Directive,
    args: [{
      selector: "[email][formControlName],[email][formControl],[email][ngModel]",
      providers: [EMAIL_VALIDATOR],
      standalone: false
    }]
  }], null, {
    email: [{
      type: Input
    }]
  });
})();
var MIN_LENGTH_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MinLengthValidator),
  multi: true
};
var MinLengthValidator = class _MinLengthValidator extends AbstractValidatorDirective {
  minlength;
  inputName = "minlength";
  normalizeInput = (input) => toInteger(input);
  createValidator = (minlength) => minLengthValidator(minlength);
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275MinLengthValidator_BaseFactory;
    return function MinLengthValidator_Factory(__ngFactoryType__) {
      return (\u0275MinLengthValidator_BaseFactory || (\u0275MinLengthValidator_BaseFactory = \u0275\u0275getInheritedFactory(_MinLengthValidator)))(__ngFactoryType__ || _MinLengthValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _MinLengthValidator,
    selectors: [["", "minlength", "", "formControlName", ""], ["", "minlength", "", "formControl", ""], ["", "minlength", "", "ngModel", ""]],
    hostVars: 1,
    hostBindings: function MinLengthValidator_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("minlength", ctx._enabled ? ctx.minlength : null);
      }
    },
    inputs: {
      minlength: "minlength"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([MIN_LENGTH_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MinLengthValidator, [{
    type: Directive,
    args: [{
      selector: "[minlength][formControlName],[minlength][formControl],[minlength][ngModel]",
      providers: [MIN_LENGTH_VALIDATOR],
      host: {
        "[attr.minlength]": "_enabled ? minlength : null"
      },
      standalone: false
    }]
  }], null, {
    minlength: [{
      type: Input
    }]
  });
})();
var MAX_LENGTH_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MaxLengthValidator),
  multi: true
};
var MaxLengthValidator = class _MaxLengthValidator extends AbstractValidatorDirective {
  maxlength;
  inputName = "maxlength";
  normalizeInput = (input) => toInteger(input);
  createValidator = (maxlength) => maxLengthValidator(maxlength);
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275MaxLengthValidator_BaseFactory;
    return function MaxLengthValidator_Factory(__ngFactoryType__) {
      return (\u0275MaxLengthValidator_BaseFactory || (\u0275MaxLengthValidator_BaseFactory = \u0275\u0275getInheritedFactory(_MaxLengthValidator)))(__ngFactoryType__ || _MaxLengthValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _MaxLengthValidator,
    selectors: [["", "maxlength", "", "formControlName", ""], ["", "maxlength", "", "formControl", ""], ["", "maxlength", "", "ngModel", ""]],
    hostVars: 1,
    hostBindings: function MaxLengthValidator_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("maxlength", ctx._enabled ? ctx.maxlength : null);
      }
    },
    inputs: {
      maxlength: "maxlength"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([MAX_LENGTH_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MaxLengthValidator, [{
    type: Directive,
    args: [{
      selector: "[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]",
      providers: [MAX_LENGTH_VALIDATOR],
      host: {
        "[attr.maxlength]": "_enabled ? maxlength : null"
      },
      standalone: false
    }]
  }], null, {
    maxlength: [{
      type: Input
    }]
  });
})();
var PATTERN_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => PatternValidator),
  multi: true
};
var PatternValidator = class _PatternValidator extends AbstractValidatorDirective {
  pattern;
  inputName = "pattern";
  normalizeInput = (input) => input;
  createValidator = (input) => patternValidator(input);
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275PatternValidator_BaseFactory;
    return function PatternValidator_Factory(__ngFactoryType__) {
      return (\u0275PatternValidator_BaseFactory || (\u0275PatternValidator_BaseFactory = \u0275\u0275getInheritedFactory(_PatternValidator)))(__ngFactoryType__ || _PatternValidator);
    };
  })();
  static \u0275dir = /* @__PURE__ */ \u0275\u0275defineDirective({
    type: _PatternValidator,
    selectors: [["", "pattern", "", "formControlName", ""], ["", "pattern", "", "formControl", ""], ["", "pattern", "", "ngModel", ""]],
    hostVars: 1,
    hostBindings: function PatternValidator_HostBindings(rf, ctx) {
      if (rf & 2) {
        \u0275\u0275attribute("pattern", ctx._enabled ? ctx.pattern : null);
      }
    },
    inputs: {
      pattern: "pattern"
    },
    standalone: false,
    features: [\u0275\u0275ProvidersFeature([PATTERN_VALIDATOR]), \u0275\u0275InheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PatternValidator, [{
    type: Directive,
    args: [{
      selector: "[pattern][formControlName],[pattern][formControl],[pattern][ngModel]",
      providers: [PATTERN_VALIDATOR],
      host: {
        "[attr.pattern]": "_enabled ? pattern : null"
      },
      standalone: false
    }]
  }], null, {
    pattern: [{
      type: Input
    }]
  });
})();
var SHARED_FORM_DIRECTIVES = [\u0275NgNoValidate, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor, RangeValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, RadioControlValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, MinLengthValidator, MaxLengthValidator, PatternValidator, CheckboxRequiredValidator, EmailValidator, MinValidator, MaxValidator];
var TEMPLATE_DRIVEN_DIRECTIVES = [NgModel, NgModelGroup, NgForm];
var REACTIVE_DRIVEN_DIRECTIVES = [FormControlDirective, FormGroupDirective, FormArrayDirective, FormControlName, FormGroupName, FormArrayName];
var \u0275InternalFormsSharedModule = class _\u0275InternalFormsSharedModule {
  static \u0275fac = function \u0275InternalFormsSharedModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _\u0275InternalFormsSharedModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _\u0275InternalFormsSharedModule,
    declarations: [\u0275NgNoValidate, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor, RangeValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, RadioControlValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, MinLengthValidator, MaxLengthValidator, PatternValidator, CheckboxRequiredValidator, EmailValidator, MinValidator, MaxValidator],
    exports: [\u0275NgNoValidate, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, NumberValueAccessor, RangeValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, RadioControlValueAccessor, NgControlStatus, NgControlStatusGroup, RequiredValidator, MinLengthValidator, MaxLengthValidator, PatternValidator, CheckboxRequiredValidator, EmailValidator, MinValidator, MaxValidator]
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({});
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(\u0275InternalFormsSharedModule, [{
    type: NgModule,
    args: [{
      declarations: SHARED_FORM_DIRECTIVES,
      exports: SHARED_FORM_DIRECTIVES
    }]
  }], null, null);
})();
function isAbstractControlOptions(options) {
  return !!options && (options.asyncValidators !== void 0 || options.validators !== void 0 || options.updateOn !== void 0);
}
var FormBuilder = class _FormBuilder {
  useNonNullable = false;
  get nonNullable() {
    const nnfb = new _FormBuilder();
    nnfb.useNonNullable = true;
    return nnfb;
  }
  group(controls, options = null) {
    const reducedControls = this._reduceControls(controls);
    let newOptions = {};
    if (isAbstractControlOptions(options)) {
      newOptions = options;
    } else if (options !== null) {
      newOptions.validators = options.validator;
      newOptions.asyncValidators = options.asyncValidator;
    }
    return new FormGroup(reducedControls, newOptions);
  }
  record(controls, options = null) {
    const reducedControls = this._reduceControls(controls);
    return new FormRecord(reducedControls, options);
  }
  control(formState, validatorOrOpts, asyncValidator) {
    let newOptions = {};
    if (!this.useNonNullable) {
      return new FormControl(formState, validatorOrOpts, asyncValidator);
    }
    if (isAbstractControlOptions(validatorOrOpts)) {
      newOptions = validatorOrOpts;
    } else {
      newOptions.validators = validatorOrOpts;
      newOptions.asyncValidators = asyncValidator;
    }
    return new FormControl(formState, __spreadProps(__spreadValues({}, newOptions), {
      nonNullable: true
    }));
  }
  array(controls, validatorOrOpts, asyncValidator) {
    const createdControls = controls.map((c) => this._createControl(c));
    return new FormArray(createdControls, validatorOrOpts, asyncValidator);
  }
  _reduceControls(controls) {
    const createdControls = {};
    Object.keys(controls).forEach((controlName) => {
      createdControls[controlName] = this._createControl(controls[controlName]);
    });
    return createdControls;
  }
  _createControl(controls) {
    if (controls instanceof FormControl) {
      return controls;
    } else if (controls instanceof AbstractControl) {
      return controls;
    } else if (Array.isArray(controls)) {
      const value = controls[0];
      const validator = controls.length > 1 ? controls[1] : null;
      const asyncValidator = controls.length > 2 ? controls[2] : null;
      return this.control(value, validator, asyncValidator);
    } else {
      return this.control(controls);
    }
  }
  static \u0275fac = function FormBuilder_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormBuilder)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _FormBuilder,
    factory: _FormBuilder.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormBuilder, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var NonNullableFormBuilder = class _NonNullableFormBuilder {
  static \u0275fac = function NonNullableFormBuilder_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NonNullableFormBuilder)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _NonNullableFormBuilder,
    factory: () => (() => inject(FormBuilder).nonNullable)(),
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NonNullableFormBuilder, [{
    type: Injectable,
    args: [{
      providedIn: "root",
      useFactory: () => inject(FormBuilder).nonNullable
    }]
  }], null, null);
})();
var UntypedFormBuilder = class _UntypedFormBuilder extends FormBuilder {
  group(controlsConfig, options = null) {
    return super.group(controlsConfig, options);
  }
  control(formState, validatorOrOpts, asyncValidator) {
    return super.control(formState, validatorOrOpts, asyncValidator);
  }
  array(controlsConfig, validatorOrOpts, asyncValidator) {
    return super.array(controlsConfig, validatorOrOpts, asyncValidator);
  }
  static \u0275fac = /* @__PURE__ */ (() => {
    let \u0275UntypedFormBuilder_BaseFactory;
    return function UntypedFormBuilder_Factory(__ngFactoryType__) {
      return (\u0275UntypedFormBuilder_BaseFactory || (\u0275UntypedFormBuilder_BaseFactory = \u0275\u0275getInheritedFactory(_UntypedFormBuilder)))(__ngFactoryType__ || _UntypedFormBuilder);
    };
  })();
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
    token: _UntypedFormBuilder,
    factory: _UntypedFormBuilder.\u0275fac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UntypedFormBuilder, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var FormsModule = class _FormsModule {
  static withConfig(opts) {
    return {
      ngModule: _FormsModule,
      providers: [{
        provide: CALL_SET_DISABLED_STATE,
        useValue: opts.callSetDisabledState ?? setDisabledStateDefault
      }]
    };
  }
  static \u0275fac = function FormsModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FormsModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _FormsModule,
    declarations: [NgModel, NgModelGroup, NgForm],
    exports: [\u0275InternalFormsSharedModule, NgModel, NgModelGroup, NgForm]
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    imports: [\u0275InternalFormsSharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormsModule, [{
    type: NgModule,
    args: [{
      declarations: TEMPLATE_DRIVEN_DIRECTIVES,
      exports: [\u0275InternalFormsSharedModule, TEMPLATE_DRIVEN_DIRECTIVES]
    }]
  }], null, null);
})();
var ReactiveFormsModule = class _ReactiveFormsModule {
  static withConfig(opts) {
    return {
      ngModule: _ReactiveFormsModule,
      providers: [{
        provide: NG_MODEL_WITH_FORM_CONTROL_WARNING,
        useValue: opts.warnOnNgModelWithFormControl ?? "always"
      }, {
        provide: CALL_SET_DISABLED_STATE,
        useValue: opts.callSetDisabledState ?? setDisabledStateDefault
      }]
    };
  }
  static \u0275fac = function ReactiveFormsModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ReactiveFormsModule)();
  };
  static \u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
    type: _ReactiveFormsModule,
    declarations: [FormControlDirective, FormGroupDirective, FormArrayDirective, FormControlName, FormGroupName, FormArrayName],
    exports: [\u0275InternalFormsSharedModule, FormControlDirective, FormGroupDirective, FormArrayDirective, FormControlName, FormGroupName, FormArrayName]
  });
  static \u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({
    imports: [\u0275InternalFormsSharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ReactiveFormsModule, [{
    type: NgModule,
    args: [{
      declarations: [REACTIVE_DRIVEN_DIRECTIVES],
      exports: [\u0275InternalFormsSharedModule, REACTIVE_DRIVEN_DIRECTIVES]
    }]
  }], null, null);
})();

// src/app/features/rider/rider-onboarding.component.ts
function RiderOnboardingComponent_p_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 12);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.errorMessage);
  }
}
var RiderOnboardingComponent = class _RiderOnboardingComponent {
  riderApi;
  router;
  vehicleType = "Bike";
  licenseNumber = "";
  currentLocation = "";
  availability = true;
  loading = false;
  errorMessage = "";
  constructor(riderApi, router) {
    this.riderApi = riderApi;
    this.router = router;
  }
  submit() {
    this.errorMessage = "";
    if (!this.licenseNumber.trim()) {
      this.errorMessage = "License number is required.";
      return;
    }
    this.loading = true;
    this.riderApi.onboard({
      vehicleType: this.vehicleType,
      licenseNumber: this.licenseNumber.trim(),
      currentLocation: this.currentLocation.trim(),
      availability: this.availability
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl("/dashboard");
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.error ?? "Unable to complete onboarding right now.";
      }
    });
  }
  static \u0275fac = function RiderOnboardingComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderOnboardingComponent)(\u0275\u0275directiveInject(RiderApiService), \u0275\u0275directiveInject(Router));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RiderOnboardingComponent, selectors: [["app-rider-onboarding"]], decls: 37, vars: 7, consts: [[1, "onboarding-page"], [1, "onboarding-surface"], [1, "surface-header"], [1, "eyebrow"], [1, "onboarding-form", 3, "ngSubmit"], ["name", "vehicleType", 3, "ngModelChange", "ngModel"], ["type", "text", "name", "licenseNumber", "placeholder", "Enter government license number", 3, "ngModelChange", "ngModel"], ["type", "text", "name", "currentLocation", "placeholder", "Ex: Kondapur, Hyderabad", 3, "ngModelChange", "ngModel"], [1, "switch-line"], ["type", "checkbox", "name", "availability", 3, "ngModelChange", "ngModel"], ["class", "error", 4, "ngIf"], ["type", "submit", 3, "disabled"], [1, "error"]], template: function RiderOnboardingComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "section", 0)(1, "div", 1)(2, "header", 2)(3, "p", 3);
      \u0275\u0275text(4, "Rider Program");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(5, "h1");
      \u0275\u0275text(6, "Become a Rider");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(7, "p");
      \u0275\u0275text(8, " Convert your customer account into a rider profile in one step. You can update status and availability anytime from your dashboard. ");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(9, "form", 4);
      \u0275\u0275listener("ngSubmit", function RiderOnboardingComponent_Template_form_ngSubmit_9_listener() {
        return ctx.submit();
      });
      \u0275\u0275elementStart(10, "label")(11, "span");
      \u0275\u0275text(12, "Vehicle Type");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(13, "select", 5);
      \u0275\u0275twoWayListener("ngModelChange", function RiderOnboardingComponent_Template_select_ngModelChange_13_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.vehicleType, $event) || (ctx.vehicleType = $event);
        return $event;
      });
      \u0275\u0275elementStart(14, "option");
      \u0275\u0275text(15, "Bike");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(16, "option");
      \u0275\u0275text(17, "Scooter");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(18, "option");
      \u0275\u0275text(19, "Car");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(20, "option");
      \u0275\u0275text(21, "Van");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(22, "label")(23, "span");
      \u0275\u0275text(24, "License Number");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(25, "input", 6);
      \u0275\u0275twoWayListener("ngModelChange", function RiderOnboardingComponent_Template_input_ngModelChange_25_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.licenseNumber, $event) || (ctx.licenseNumber = $event);
        return $event;
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(26, "label")(27, "span");
      \u0275\u0275text(28, "Current Location");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(29, "input", 7);
      \u0275\u0275twoWayListener("ngModelChange", function RiderOnboardingComponent_Template_input_ngModelChange_29_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.currentLocation, $event) || (ctx.currentLocation = $event);
        return $event;
      });
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(30, "label", 8)(31, "input", 9);
      \u0275\u0275twoWayListener("ngModelChange", function RiderOnboardingComponent_Template_input_ngModelChange_31_listener($event) {
        \u0275\u0275twoWayBindingSet(ctx.availability, $event) || (ctx.availability = $event);
        return $event;
      });
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(32, "span");
      \u0275\u0275text(33, "Set me available for delivery assignments");
      \u0275\u0275elementEnd()();
      \u0275\u0275template(34, RiderOnboardingComponent_p_34_Template, 2, 1, "p", 10);
      \u0275\u0275elementStart(35, "button", 11);
      \u0275\u0275text(36);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(13);
      \u0275\u0275twoWayProperty("ngModel", ctx.vehicleType);
      \u0275\u0275advance(12);
      \u0275\u0275twoWayProperty("ngModel", ctx.licenseNumber);
      \u0275\u0275advance(4);
      \u0275\u0275twoWayProperty("ngModel", ctx.currentLocation);
      \u0275\u0275advance(2);
      \u0275\u0275twoWayProperty("ngModel", ctx.availability);
      \u0275\u0275advance(3);
      \u0275\u0275property("ngIf", ctx.errorMessage);
      \u0275\u0275advance();
      \u0275\u0275property("disabled", ctx.loading);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate(ctx.loading ? "Creating rider profile..." : "Become a Rider");
    }
  }, dependencies: [CommonModule, NgIf, FormsModule, \u0275NgNoValidate, NgSelectOption, \u0275NgSelectMultipleOption, DefaultValueAccessor, CheckboxControlValueAccessor, SelectControlValueAccessor, NgControlStatus, NgControlStatusGroup, NgModel, NgForm], styles: ["\n[_nghost-%COMP%] {\n  display: block;\n}\n.onboarding-page[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  padding: clamp(1rem, 4vw, 2rem);\n  display: grid;\n  place-items: center;\n  background:\n    radial-gradient(\n      circle at 8% 8%,\n      rgba(255, 182, 227, 0.65),\n      transparent 28%),\n    radial-gradient(\n      circle at 90% 15%,\n      rgba(199, 157, 255, 0.6),\n      transparent 24%),\n    linear-gradient(\n      140deg,\n      #341347 0%,\n      #5b1f74 48%,\n      #ea4aa8 100%);\n}\n.onboarding-surface[_ngcontent-%COMP%] {\n  width: min(760px, 100%);\n  border-radius: 28px;\n  padding: clamp(1.2rem, 3vw, 2rem);\n  background: rgba(255, 255, 255, 0.15);\n  -webkit-backdrop-filter: blur(15px);\n  backdrop-filter: blur(15px);\n  border: 1px solid rgba(255, 255, 255, 0.25);\n  color: #fff;\n  box-shadow: 0 24px 60px rgba(20, 6, 40, 0.38);\n  animation: _ngcontent-%COMP%_rise-in 420ms ease-out;\n}\n.surface-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  margin: 0.25rem 0 0.55rem;\n  font-size: clamp(1.7rem, 5vw, 2.5rem);\n}\n.surface-header[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n  line-height: 1.55;\n  color: rgba(255, 255, 255, 0.92);\n}\n.eyebrow[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  font-weight: 700;\n  font-size: 0.75rem;\n  color: #ffd6f2;\n}\n.onboarding-form[_ngcontent-%COMP%] {\n  margin-top: 1.25rem;\n  display: grid;\n  gap: 1rem;\n}\n.onboarding-form[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 0.42rem;\n}\n.onboarding-form[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  font-weight: 600;\n}\n.onboarding-form[_ngcontent-%COMP%]   input[_ngcontent-%COMP%], \n.onboarding-form[_ngcontent-%COMP%]   select[_ngcontent-%COMP%] {\n  border: 1px solid rgba(255, 255, 255, 0.35);\n  border-radius: 12px;\n  padding: 0.78rem 0.82rem;\n  background: rgba(255, 255, 255, 0.84);\n  color: #33154a;\n  font: inherit;\n}\n.switch-line[_ngcontent-%COMP%] {\n  grid-template-columns: auto 1fr;\n  align-items: center;\n  column-gap: 0.6rem;\n}\n.error[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #ffe3f0;\n  font-weight: 600;\n}\nbutton[_ngcontent-%COMP%] {\n  justify-self: start;\n  border: none;\n  border-radius: 999px;\n  padding: 0.78rem 1.2rem;\n  background:\n    linear-gradient(\n      140deg,\n      #ffe39d,\n      #ff96c8);\n  color: #2e0d46;\n  font-weight: 800;\n  cursor: pointer;\n}\nbutton[_ngcontent-%COMP%]:disabled {\n  opacity: 0.65;\n  cursor: not-allowed;\n}\n@keyframes _ngcontent-%COMP%_rise-in {\n  from {\n    opacity: 0;\n    transform: translateY(18px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-onboarding.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderOnboardingComponent, [{
    type: Component,
    args: [{ selector: "app-rider-onboarding", standalone: true, imports: [CommonModule, FormsModule], template: `<section class="onboarding-page">\r
  <div class="onboarding-surface">\r
    <header class="surface-header">\r
      <p class="eyebrow">Rider Program</p>\r
      <h1>Become a Rider</h1>\r
      <p>\r
        Convert your customer account into a rider profile in one step.\r
        You can update status and availability anytime from your dashboard.\r
      </p>\r
    </header>\r
\r
    <form class="onboarding-form" (ngSubmit)="submit()">\r
      <label>\r
        <span>Vehicle Type</span>\r
        <select [(ngModel)]="vehicleType" name="vehicleType">\r
          <option>Bike</option>\r
          <option>Scooter</option>\r
          <option>Car</option>\r
          <option>Van</option>\r
        </select>\r
      </label>\r
\r
      <label>\r
        <span>License Number</span>\r
        <input type="text" name="licenseNumber" [(ngModel)]="licenseNumber" placeholder="Enter government license number" />\r
      </label>\r
\r
      <label>\r
        <span>Current Location</span>\r
        <input type="text" name="currentLocation" [(ngModel)]="currentLocation" placeholder="Ex: Kondapur, Hyderabad" />\r
      </label>\r
\r
      <label class="switch-line">\r
        <input type="checkbox" name="availability" [(ngModel)]="availability" />\r
        <span>Set me available for delivery assignments</span>\r
      </label>\r
\r
      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>\r
\r
      <button type="submit" [disabled]="loading">{{ loading ? 'Creating rider profile...' : 'Become a Rider' }}</button>\r
    </form>\r
  </div>\r
</section>\r
`, styles: ["/* src/app/features/rider/rider-onboarding.component.css */\n:host {\n  display: block;\n}\n.onboarding-page {\n  min-height: 100vh;\n  padding: clamp(1rem, 4vw, 2rem);\n  display: grid;\n  place-items: center;\n  background:\n    radial-gradient(\n      circle at 8% 8%,\n      rgba(255, 182, 227, 0.65),\n      transparent 28%),\n    radial-gradient(\n      circle at 90% 15%,\n      rgba(199, 157, 255, 0.6),\n      transparent 24%),\n    linear-gradient(\n      140deg,\n      #341347 0%,\n      #5b1f74 48%,\n      #ea4aa8 100%);\n}\n.onboarding-surface {\n  width: min(760px, 100%);\n  border-radius: 28px;\n  padding: clamp(1.2rem, 3vw, 2rem);\n  background: rgba(255, 255, 255, 0.15);\n  -webkit-backdrop-filter: blur(15px);\n  backdrop-filter: blur(15px);\n  border: 1px solid rgba(255, 255, 255, 0.25);\n  color: #fff;\n  box-shadow: 0 24px 60px rgba(20, 6, 40, 0.38);\n  animation: rise-in 420ms ease-out;\n}\n.surface-header h1 {\n  margin: 0.25rem 0 0.55rem;\n  font-size: clamp(1.7rem, 5vw, 2.5rem);\n}\n.surface-header p {\n  margin: 0;\n  line-height: 1.55;\n  color: rgba(255, 255, 255, 0.92);\n}\n.eyebrow {\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  font-weight: 700;\n  font-size: 0.75rem;\n  color: #ffd6f2;\n}\n.onboarding-form {\n  margin-top: 1.25rem;\n  display: grid;\n  gap: 1rem;\n}\n.onboarding-form label {\n  display: grid;\n  gap: 0.42rem;\n}\n.onboarding-form span {\n  font-weight: 600;\n}\n.onboarding-form input,\n.onboarding-form select {\n  border: 1px solid rgba(255, 255, 255, 0.35);\n  border-radius: 12px;\n  padding: 0.78rem 0.82rem;\n  background: rgba(255, 255, 255, 0.84);\n  color: #33154a;\n  font: inherit;\n}\n.switch-line {\n  grid-template-columns: auto 1fr;\n  align-items: center;\n  column-gap: 0.6rem;\n}\n.error {\n  margin: 0;\n  color: #ffe3f0;\n  font-weight: 600;\n}\nbutton {\n  justify-self: start;\n  border: none;\n  border-radius: 999px;\n  padding: 0.78rem 1.2rem;\n  background:\n    linear-gradient(\n      140deg,\n      #ffe39d,\n      #ff96c8);\n  color: #2e0d46;\n  font-weight: 800;\n  cursor: pointer;\n}\nbutton:disabled {\n  opacity: 0.65;\n  cursor: not-allowed;\n}\n@keyframes rise-in {\n  from {\n    opacity: 0;\n    transform: translateY(18px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-onboarding.component.css.map */\n"] }]
  }], () => [{ type: RiderApiService }, { type: Router }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RiderOnboardingComponent, { className: "RiderOnboardingComponent", filePath: "app/features/rider/rider-onboarding.component.ts", lineNumber: 20 });
})();

// src/app/features/rider/rider-order-details.component.ts
function RiderOrderDetailsComponent_section_0_header_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "header", 7)(1, "div")(2, "p", 8);
    \u0275\u0275text(3, "Order Header");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "h1");
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 9);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "div", 10)(9, "span", 11);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "button", 12);
    \u0275\u0275listener("click", function RiderOrderDetailsComponent_section_0_header_1_Template_button_click_11_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.goBackToDashboard());
    });
    \u0275\u0275text(12, "Back to Dashboard");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const details_r3 = ctx.ngIf;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("Order #", details_r3.customOrderNumber || details_r3.orderId);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Assigned delivery id: ", details_r3.deliveryOrderId);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", ctx_r1.getStatusClass(details_r3.deliveryStatus));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", details_r3.deliveryStatus, " ");
  }
}
function RiderOrderDetailsComponent_section_0_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 13)(1, "p");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "button", 14);
    \u0275\u0275listener("click", function RiderOrderDetailsComponent_section_0_div_2_Template_button_click_3_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.retry());
    });
    \u0275\u0275text(4, "Retry");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.errorMessage);
  }
}
function RiderOrderDetailsComponent_section_0_main_3_button_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 32);
    \u0275\u0275listener("click", function RiderOrderDetailsComponent_section_0_main_3_button_8_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.togglePhoneMask());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.showFullPhone ? "Hide Number" : "Show Number", " ");
  }
}
function RiderOrderDetailsComponent_section_0_main_3_p_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 31);
    \u0275\u0275text(1, "No delivery address available.");
    \u0275\u0275elementEnd();
  }
}
function RiderOrderDetailsComponent_section_0_main_3_p_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 33);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const line_r7 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(line_r7);
  }
}
function RiderOrderDetailsComponent_section_0_main_3_div_21_tr_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275pipe(7, "number");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "td");
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "number");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const item_r8 = ctx.$implicit;
    const details_r9 = \u0275\u0275nextContext(2).ngIf;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r8.itemName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r8.quantity);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("", ctx_r1.getCurrencySymbol(details_r9.currencyCode), " ", \u0275\u0275pipeBind2(7, 6, item_r8.unitPrice, "1.2-2"));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", ctx_r1.getCurrencySymbol(details_r9.currencyCode), " ", \u0275\u0275pipeBind2(10, 9, ctx_r1.getLineTotal(item_r8), "1.2-2"));
  }
}
function RiderOrderDetailsComponent_section_0_main_3_div_21_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 34)(1, "table", 35)(2, "thead")(3, "tr")(4, "th");
    \u0275\u0275text(5, "Item Name");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "th");
    \u0275\u0275text(7, "Quantity");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "th");
    \u0275\u0275text(9, "Price");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "th");
    \u0275\u0275text(11, "Total Amount");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(12, "tbody");
    \u0275\u0275template(13, RiderOrderDetailsComponent_section_0_main_3_div_21_tr_13_Template, 11, 12, "tr", 36);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const details_r9 = \u0275\u0275nextContext().ngIf;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(13);
    \u0275\u0275property("ngForOf", details_r9.items)("ngForTrackBy", ctx_r1.trackByProductId);
  }
}
function RiderOrderDetailsComponent_section_0_main_3_p_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 31);
    \u0275\u0275text(1, "No delivery notes provided by customer.");
    \u0275\u0275elementEnd();
  }
}
function RiderOrderDetailsComponent_section_0_main_3_p_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 37);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const details_r9 = \u0275\u0275nextContext().ngIf;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(details_r9.deliveryInstructions);
  }
}
function RiderOrderDetailsComponent_section_0_main_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "main", 15)(1, "article", 16)(2, "h2");
    \u0275\u0275text(3, "Customer Information");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 17);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 18);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275template(8, RiderOrderDetailsComponent_section_0_main_3_button_8_Template, 2, 1, "button", 19);
    \u0275\u0275elementStart(9, "p", 20);
    \u0275\u0275text(10, "Masking defaults to only showing the last 4 digits.");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "article", 16)(12, "h2");
    \u0275\u0275text(13, "Delivery Address");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "p", 21);
    \u0275\u0275text(15, "Readable address card");
    \u0275\u0275elementEnd();
    \u0275\u0275template(16, RiderOrderDetailsComponent_section_0_main_3_p_16_Template, 2, 0, "p", 22)(17, RiderOrderDetailsComponent_section_0_main_3_p_17_Template, 2, 1, "p", 23);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "article", 24)(19, "h2");
    \u0275\u0275text(20, "Order Items Summary");
    \u0275\u0275elementEnd();
    \u0275\u0275template(21, RiderOrderDetailsComponent_section_0_main_3_div_21_Template, 14, 2, "div", 25);
    \u0275\u0275elementStart(22, "p", 26);
    \u0275\u0275text(23);
    \u0275\u0275pipe(24, "number");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(25, "div", 27)(26, "article", 28)(27, "h2");
    \u0275\u0275text(28, "Delivery Instructions");
    \u0275\u0275elementEnd();
    \u0275\u0275template(29, RiderOrderDetailsComponent_section_0_main_3_p_29_Template, 2, 0, "p", 22)(30, RiderOrderDetailsComponent_section_0_main_3_p_30_Template, 2, 1, "p", 29);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(31, "article", 28)(32, "h2");
    \u0275\u0275text(33, "Map Navigation");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(34, "button", 30);
    \u0275\u0275listener("click", function RiderOrderDetailsComponent_section_0_main_3_Template_button_click_34_listener() {
      \u0275\u0275restoreView(_r5);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.openMapNavigation());
    });
    \u0275\u0275text(35, "Open in Google Maps");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(36, "p", 31);
    \u0275\u0275text(37, "Coordinates are used when available, otherwise full address is used.");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(38, "article", 28)(39, "h2");
    \u0275\u0275text(40, "Current Order Status");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(41, "p")(42, "span", 11);
    \u0275\u0275text(43);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(44, "p", 31);
    \u0275\u0275text(45);
    \u0275\u0275pipe(46, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(47, "p", 31);
    \u0275\u0275text(48);
    \u0275\u0275pipe(49, "date");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const details_r9 = ctx.ngIf;
    const ctx_r1 = \u0275\u0275nextContext(2);
    const noItemsTpl_r10 = \u0275\u0275reference(4);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.getCustomerDisplayName(details_r9));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Phone: ", ctx_r1.getContactPhone());
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", details_r9.deliveryAddress.phoneNumber);
    \u0275\u0275advance(8);
    \u0275\u0275property("ngIf", ctx_r1.getAddressLines(details_r9.deliveryAddress).length === 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r1.getAddressLines(details_r9.deliveryAddress));
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", details_r9.items.length > 0)("ngIfElse", noItemsTpl_r10);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("Order Total: ", ctx_r1.getCurrencySymbol(details_r9.currencyCode), " ", \u0275\u0275pipeBind2(24, 15, details_r9.orderTotal, "1.2-2"));
    \u0275\u0275advance(6);
    \u0275\u0275property("ngIf", !details_r9.deliveryInstructions);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", details_r9.deliveryInstructions);
    \u0275\u0275advance(12);
    \u0275\u0275property("ngClass", ctx_r1.getStatusClass(details_r9.deliveryStatus));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(details_r9.deliveryStatus);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Created: ", details_r9.createdOnUtc ? \u0275\u0275pipeBind2(46, 18, details_r9.createdOnUtc, "medium") : "N/A");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Assigned: ", details_r9.assignedAtUtc ? \u0275\u0275pipeBind2(49, 21, details_r9.assignedAtUtc, "medium") : "N/A");
  }
}
function RiderOrderDetailsComponent_section_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 3);
    \u0275\u0275template(1, RiderOrderDetailsComponent_section_0_header_1_Template, 13, 4, "header", 4)(2, RiderOrderDetailsComponent_section_0_div_2_Template, 5, 1, "div", 5)(3, RiderOrderDetailsComponent_section_0_main_3_Template, 50, 24, "main", 6);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.orderDetails);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.errorMessage);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.orderDetails);
  }
}
function RiderOrderDetailsComponent_ng_template_1_button_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 41);
    \u0275\u0275listener("click", function RiderOrderDetailsComponent_ng_template_1_button_4_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.retry());
    });
    \u0275\u0275text(1, "Retry");
    \u0275\u0275elementEnd();
  }
}
function RiderOrderDetailsComponent_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 38)(1, "div", 39)(2, "p");
    \u0275\u0275text(3, "Loading rider order details...");
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, RiderOrderDetailsComponent_ng_template_1_button_4_Template, 2, 0, "button", 40);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(4);
    \u0275\u0275property("ngIf", ctx_r1.errorMessage);
  }
}
function RiderOrderDetailsComponent_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 31);
    \u0275\u0275text(1, "No order items available.");
    \u0275\u0275elementEnd();
  }
}
var RiderOrderDetailsComponent = class _RiderOrderDetailsComponent {
  route;
  riderApi;
  loadingState = signal(true, ...ngDevMode ? [{ debugName: "loadingState" }] : (
    /* istanbul ignore next */
    []
  ));
  orderDetailsState = signal(null, ...ngDevMode ? [{ debugName: "orderDetailsState" }] : (
    /* istanbul ignore next */
    []
  ));
  errorMessageState = signal("", ...ngDevMode ? [{ debugName: "errorMessageState" }] : (
    /* istanbul ignore next */
    []
  ));
  showFullPhoneState = signal(false, ...ngDevMode ? [{ debugName: "showFullPhoneState" }] : (
    /* istanbul ignore next */
    []
  ));
  currentOrderId = 0;
  get loading() {
    return this.loadingState();
  }
  get orderDetails() {
    return this.orderDetailsState();
  }
  get errorMessage() {
    return this.errorMessageState();
  }
  get showFullPhone() {
    return this.showFullPhoneState();
  }
  constructor(route, riderApi) {
    this.route = route;
    this.riderApi = riderApi;
  }
  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      const orderId = Number(paramMap.get("orderId"));
      if (!Number.isInteger(orderId) || orderId <= 0) {
        this.loadingState.set(false);
        this.errorMessageState.set("Invalid order id.");
        return;
      }
      this.currentOrderId = orderId;
      this.fetchOrderDetails(orderId);
    });
  }
  retry() {
    if (this.currentOrderId > 0) {
      this.fetchOrderDetails(this.currentOrderId);
    }
  }
  goBackToDashboard() {
    window.location.href = "/rider/dashboard";
  }
  togglePhoneMask() {
    this.showFullPhoneState.set(!this.showFullPhoneState());
  }
  openMapNavigation() {
    const details = this.orderDetailsState();
    if (!details) {
      return;
    }
    const address = details.deliveryAddress;
    const latitude = address.latitude;
    const longitude = address.longitude;
    const hasCoordinates = typeof latitude === "number" && Number.isFinite(latitude) && typeof longitude === "number" && Number.isFinite(longitude);
    const mapUrl = hasCoordinates ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.getSingleLineAddress(address))}`;
    window.open(mapUrl, "_blank", "noopener,noreferrer");
  }
  getAddressLines(address) {
    const lines = [
      this.safe(address.address1),
      this.safe(address.address2),
      [this.safe(address.city), this.safe(address.stateProvince), this.safe(address.zipPostalCode)].filter(Boolean).join(", "),
      this.safe(address.country)
    ];
    return lines.filter((line) => line.length > 0);
  }
  getCustomerDisplayName(details) {
    if (details.customer.customerName) {
      return details.customer.customerName;
    }
    const fullName = [details.deliveryAddress.firstName, details.deliveryAddress.lastName].filter(Boolean).join(" ").trim();
    return fullName || "Customer";
  }
  getContactPhone() {
    const phone = this.orderDetailsState()?.deliveryAddress.phoneNumber;
    if (!phone) {
      return "Phone not available";
    }
    if (this.showFullPhoneState()) {
      return phone;
    }
    return this.maskPhone(phone);
  }
  getStatusClass(status) {
    const normalized = status.toLowerCase();
    if (normalized === "pending") {
      return "status-pending";
    }
    if (normalized === "assigned") {
      return "status-assigned";
    }
    if (normalized === "out for delivery") {
      return "status-out";
    }
    if (normalized === "delivered") {
      return "status-delivered";
    }
    return "status-default";
  }
  getLineTotal(item) {
    if (item.totalPrice > 0) {
      return item.totalPrice;
    }
    return item.unitPrice * item.quantity;
  }
  getCurrencySymbol(currencyCode) {
    if (!currencyCode || currencyCode.toUpperCase() === "INR") {
      return "Rs";
    }
    return currencyCode.toUpperCase();
  }
  trackByProductId(index, item) {
    return item.productId || index;
  }
  fetchOrderDetails(orderId) {
    this.loadingState.set(true);
    this.errorMessageState.set("");
    this.showFullPhoneState.set(false);
    this.riderApi.getOrderDetails(orderId).subscribe({
      next: (result) => {
        this.orderDetailsState.set(this.normalizeOrderDetails(result));
        this.loadingState.set(false);
      },
      error: (error) => {
        this.loadingState.set(false);
        this.orderDetailsState.set(null);
        this.errorMessageState.set(error?.error?.error ?? "Unable to load order details. Please try again.");
      }
    });
  }
  normalizeOrderDetails(raw) {
    const customerRaw = this.getObject(raw, "customer", "Customer");
    const addressRaw = this.getObject(raw, "deliveryAddress", "DeliveryAddress");
    const itemsRaw = this.getArray(raw, "items", "Items");
    return {
      orderId: this.getNumber(raw, "orderId", "OrderId", 0),
      deliveryOrderId: this.getNumber(raw, "deliveryOrderId", "DeliveryOrderId", 0),
      customOrderNumber: this.getString(raw, "customOrderNumber", "CustomOrderNumber", ""),
      orderTotal: this.getNumber(raw, "orderTotal", "OrderTotal", 0),
      currencyCode: this.getString(raw, "currencyCode", "CurrencyCode", "INR"),
      deliveryStatus: this.getString(raw, "deliveryStatus", "DeliveryStatus", "Pending"),
      assignedAtUtc: this.getString(raw, "assignedAtUtc", "AssignedAtUtc", ""),
      createdOnUtc: this.getString(raw, "createdOnUtc", "CreatedOnUtc", ""),
      deliveryInstructions: this.getString(raw, "deliveryInstructions", "DeliveryInstructions", ""),
      customer: {
        customerId: this.getNumber(customerRaw, "customerId", "CustomerId", 0),
        customerName: this.getString(customerRaw, "customerName", "CustomerName", ""),
        email: this.getString(customerRaw, "email", "Email", "")
      },
      deliveryAddress: {
        firstName: this.getString(addressRaw, "firstName", "FirstName", ""),
        lastName: this.getString(addressRaw, "lastName", "LastName", ""),
        company: this.getString(addressRaw, "company", "Company", ""),
        address1: this.getString(addressRaw, "address1", "Address1", ""),
        address2: this.getString(addressRaw, "address2", "Address2", ""),
        city: this.getString(addressRaw, "city", "City", ""),
        stateProvince: this.getString(addressRaw, "stateProvince", "StateProvince", ""),
        country: this.getString(addressRaw, "country", "Country", ""),
        zipPostalCode: this.getString(addressRaw, "zipPostalCode", "ZipPostalCode", ""),
        phoneNumber: this.getString(addressRaw, "phoneNumber", "PhoneNumber", ""),
        latitude: this.getNullableNumber(addressRaw, "latitude", "Latitude"),
        longitude: this.getNullableNumber(addressRaw, "longitude", "Longitude")
      },
      items: itemsRaw.map((itemRaw) => ({
        productId: this.getNumber(itemRaw, "productId", "ProductId", 0),
        itemName: this.getString(itemRaw, "itemName", "ItemName", "Item"),
        quantity: this.getNumber(itemRaw, "quantity", "Quantity", 0),
        unitPrice: this.getNumber(itemRaw, "unitPrice", "UnitPrice", 0),
        totalPrice: this.getNumber(itemRaw, "totalPrice", "TotalPrice", 0)
      }))
    };
  }
  getObject(raw, camel, pascal) {
    const value = raw[camel] ?? raw[pascal];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
    return {};
  }
  getArray(raw, camel, pascal) {
    const value = raw[camel] ?? raw[pascal];
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item) => item && typeof item === "object");
  }
  getString(raw, camel, pascal, fallback) {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "string") {
      return value;
    }
    return fallback;
  }
  getNumber(raw, camel, pascal, fallback) {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }
  getNullableNumber(raw, camel, pascal) {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return null;
  }
  maskPhone(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 4) {
      return phone;
    }
    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }
  getSingleLineAddress(address) {
    const fullAddress = [
      this.safe(address.address1),
      this.safe(address.address2),
      this.safe(address.city),
      this.safe(address.stateProvince),
      this.safe(address.zipPostalCode),
      this.safe(address.country)
    ].filter(Boolean).join(", ").trim();
    return fullAddress || "delivery destination";
  }
  safe(value) {
    return (value ?? "").trim();
  }
  static \u0275fac = function RiderOrderDetailsComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderOrderDetailsComponent)(\u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(RiderApiService));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RiderOrderDetailsComponent, selectors: [["app-rider-order-details"]], decls: 5, vars: 2, consts: [["loadingTpl", ""], ["noItemsTpl", ""], ["class", "order-page", 4, "ngIf", "ngIfElse"], [1, "order-page"], ["class", "order-header card", 4, "ngIf"], ["class", "error-message", 4, "ngIf"], ["class", "content-grid", 4, "ngIf"], [1, "order-header", "card"], [1, "eyebrow"], [1, "meta"], [1, "status-wrap"], [1, "status-badge", 3, "ngClass"], ["type", "button", "aria-label", "Back to rider dashboard", 1, "secondary-btn", 3, "click"], [1, "error-message"], ["type", "button", "aria-label", "Retry loading order details", 1, "secondary-btn", 3, "click"], [1, "content-grid"], [1, "card"], [1, "value-strong", "customer-name"], [1, "customer-phone"], ["type", "button", "class", "secondary-btn", "aria-label", "Toggle customer phone visibility", 3, "click", 4, "ngIf"], [1, "muted", "customer-note"], [1, "value-strong"], ["class", "muted", 4, "ngIf"], ["class", "address-line", 4, "ngFor", "ngForOf"], [1, "card", "card-wide"], ["class", "table-wrap", 4, "ngIf", "ngIfElse"], [1, "order-total"], [1, "post-items-row", "card-wide"], [1, "card", "compact-card"], ["class", "note", 4, "ngIf"], ["type", "button", "aria-label", "Open delivery location in Google Maps", 1, "map-btn", 3, "click"], [1, "muted"], ["type", "button", "aria-label", "Toggle customer phone visibility", 1, "secondary-btn", 3, "click"], [1, "address-line"], [1, "table-wrap"], [1, "items-table"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "note"], [1, "loading-page"], [1, "loading-card"], ["type", "button", "class", "secondary-btn", 3, "click", 4, "ngIf"], ["type", "button", 1, "secondary-btn", 3, "click"]], template: function RiderOrderDetailsComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, RiderOrderDetailsComponent_section_0_Template, 4, 3, "section", 2)(1, RiderOrderDetailsComponent_ng_template_1_Template, 5, 1, "ng-template", null, 0, \u0275\u0275templateRefExtractor)(3, RiderOrderDetailsComponent_ng_template_3_Template, 2, 0, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
    }
    if (rf & 2) {
      const loadingTpl_r12 = \u0275\u0275reference(2);
      \u0275\u0275property("ngIf", !ctx.loading)("ngIfElse", loadingTpl_r12);
    }
  }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, DecimalPipe, DatePipe], styles: ['\n[_nghost-%COMP%] {\n  --bg-1: #3f0f5f;\n  --bg-2: #6f1b8a;\n  --bg-3: #ff4ca5;\n  --glass-bg: rgba(255, 255, 255, 0.16);\n  --glass-border: rgba(255, 255, 255, 0.28);\n  --text-1: #fff;\n  --text-2: rgba(255, 255, 255, 0.88);\n  --surface-1: rgba(255, 255, 255, 0.13);\n  --surface-2: rgba(255, 255, 255, 0.08);\n  --border: rgba(255, 255, 255, 0.28);\n  --text-main: #fff;\n  --text-muted: rgba(255, 255, 255, 0.72);\n  --accent: #e879f9;\n  --accent-2: #ff4ca5;\n  --danger: #ff6b8a;\n  --status-pending: #f5a623;\n  --status-assigned: #60a5fa;\n  --status-out: #c084fc;\n  --status-delivered: #4ade80;\n  --font-main:\n    "Poppins",\n    "Segoe UI",\n    sans-serif;\n  display: block;\n}\n.order-page[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  font-family: var(--font-main);\n  color: var(--text-main);\n  text-transform: capitalize;\n  background:\n    radial-gradient(\n      circle at 15% 5%,\n      rgba(255, 204, 232, 0.45),\n      transparent 25%),\n    radial-gradient(\n      circle at 95% 12%,\n      rgba(226, 161, 255, 0.4),\n      transparent 30%),\n    linear-gradient(\n      145deg,\n      var(--bg-1) 0%,\n      var(--bg-2) 44%,\n      var(--bg-3) 100%);\n  padding: clamp(1rem, 3vw, 2.2rem);\n}\n.order-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 1rem;\n  margin-bottom: 1rem;\n}\n.card[_ngcontent-%COMP%] {\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  border-radius: 18px;\n  padding: 1.15rem;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n.eyebrow[_ngcontent-%COMP%] {\n  margin: 0;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  font-size: 0.75rem;\n  color: var(--text-muted);\n}\nh1[_ngcontent-%COMP%] {\n  margin: 0.35rem 0;\n  font-size: clamp(1.55rem, 3.6vw, 2.2rem);\n}\nh2[_ngcontent-%COMP%] {\n  margin: 0 0 0.65rem;\n  font-size: 1.2rem;\n  font-weight: 800;\n}\n.meta[_ngcontent-%COMP%], \n.muted[_ngcontent-%COMP%] {\n  margin: 0;\n  color: var(--text-muted);\n  line-height: 1.55;\n}\n.value-strong[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.2rem;\n  font-weight: 700;\n}\n.customer-name[_ngcontent-%COMP%] {\n  margin-bottom: 0.35rem;\n}\n.customer-phone[_ngcontent-%COMP%] {\n  margin: 0 0 0.5rem;\n  font-size: 1rem;\n  font-weight: 600;\n  color: #e5f6ff;\n}\n.customer-note[_ngcontent-%COMP%] {\n  margin-top: 0.45rem;\n  font-size: 0.86rem;\n}\n.address-line[_ngcontent-%COMP%], \n.note[_ngcontent-%COMP%] {\n  margin: 0;\n  line-height: 1.55;\n}\n.status-wrap[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 0.7rem;\n  justify-items: end;\n}\n.status-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 999px;\n  padding: 0.45rem 0.9rem;\n  font-weight: 700;\n  font-size: 0.9rem;\n  color: #fff;\n  background: #4f6477;\n}\n.status-pending[_ngcontent-%COMP%] {\n  background: var(--status-pending);\n}\n.status-assigned[_ngcontent-%COMP%] {\n  background: var(--status-assigned);\n}\n.status-out[_ngcontent-%COMP%] {\n  background: var(--status-out);\n}\n.status-delivered[_ngcontent-%COMP%] {\n  background: var(--status-delivered);\n}\n.status-default[_ngcontent-%COMP%] {\n  background: #4f6477;\n}\n.content-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 1rem;\n}\n.card-wide[_ngcontent-%COMP%] {\n  grid-column: 1 / -1;\n}\n.post-items-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 1rem;\n}\n.compact-card[_ngcontent-%COMP%] {\n  min-height: 165px;\n}\n.items-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  min-width: 580px;\n}\n.items-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.items-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.75rem;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.12);\n  text-align: left;\n  font-size: 0.96rem;\n}\n.items-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  color: var(--text-muted);\n  background: rgba(255, 255, 255, 0.08);\n  font-weight: 700;\n}\n.order-total[_ngcontent-%COMP%] {\n  margin: 0.8rem 0 0;\n  font-size: 1.15rem;\n  font-weight: 800;\n}\n.table-wrap[_ngcontent-%COMP%] {\n  overflow-x: auto;\n}\n.secondary-btn[_ngcontent-%COMP%], \n.map-btn[_ngcontent-%COMP%] {\n  border: 1px solid rgba(255, 255, 255, 0.35);\n  border-radius: 999px;\n  background: rgba(255, 255, 255, 0.12);\n  color: #fff;\n  padding: 0.58rem 1.1rem;\n  font-weight: 700;\n  cursor: pointer;\n}\n.map-btn[_ngcontent-%COMP%] {\n  border: none;\n  color: #fff;\n  background:\n    linear-gradient(\n      120deg,\n      var(--accent),\n      var(--accent-2));\n  border-radius: 999px;\n}\n.secondary-btn[_ngcontent-%COMP%]:hover, \n.map-btn[_ngcontent-%COMP%]:hover {\n  transform: translateY(-1px);\n}\n.error-message[_ngcontent-%COMP%] {\n  margin: 0 0 1rem;\n  background: rgba(255, 107, 138, 0.18);\n  border: 1px solid rgba(255, 107, 138, 0.4);\n  color: var(--danger);\n  padding: 0.9rem;\n  border-radius: 12px;\n  font-weight: 700;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.8rem;\n}\n.error-message[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n}\n.loading-page[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    linear-gradient(\n      180deg,\n      #f3f9ff 0%,\n      #e8f3fb 100%);\n}\n.loading-card[_ngcontent-%COMP%] {\n  border-radius: 18px;\n  border: 1px solid var(--border);\n  background: #fff;\n  padding: 1.2rem 1.4rem;\n  display: grid;\n  gap: 0.7rem;\n}\n@media (max-width: 960px) {\n  .content-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n  .post-items-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n  .order-header[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n  .status-wrap[_ngcontent-%COMP%] {\n    justify-items: start;\n  }\n}\n@media (max-width: 640px) {\n  .order-page[_ngcontent-%COMP%] {\n    padding: 0.8rem;\n  }\n  .card[_ngcontent-%COMP%] {\n    padding: 1rem;\n  }\n  .items-table[_ngcontent-%COMP%] {\n    min-width: 460px;\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-order-details.component.css.map */'], changeDetection: 0 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderOrderDetailsComponent, [{
    type: Component,
    args: [{ selector: "app-rider-order-details", standalone: true, imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush, template: `<section class="order-page" *ngIf="!loading; else loadingTpl">\r
  <header class="order-header card" *ngIf="orderDetails as details">\r
    <div>\r
      <p class="eyebrow">Order Header</p>\r
      <h1>Order #{{ details.customOrderNumber || details.orderId }}</h1>\r
      <p class="meta">Assigned delivery id: {{ details.deliveryOrderId }}</p>\r
    </div>\r
\r
    <div class="status-wrap">\r
      <span class="status-badge" [ngClass]="getStatusClass(details.deliveryStatus)">\r
        {{ details.deliveryStatus }}\r
      </span>\r
      <button type="button" class="secondary-btn" (click)="goBackToDashboard()" aria-label="Back to rider dashboard">Back to Dashboard</button>\r
    </div>\r
  </header>\r
\r
  <div class="error-message" *ngIf="errorMessage">\r
    <p>{{ errorMessage }}</p>\r
    <button type="button" class="secondary-btn" (click)="retry()" aria-label="Retry loading order details">Retry</button>\r
  </div>\r
\r
  <main class="content-grid" *ngIf="orderDetails as details">\r
    <article class="card">\r
      <h2>Customer Information</h2>\r
      <p class="value-strong customer-name">{{ getCustomerDisplayName(details) }}</p>\r
      <p class="customer-phone">Phone: {{ getContactPhone() }}</p>\r
      <button type="button" class="secondary-btn" *ngIf="details.deliveryAddress.phoneNumber" (click)="togglePhoneMask()" aria-label="Toggle customer phone visibility">\r
        {{ showFullPhone ? 'Hide Number' : 'Show Number' }}\r
      </button>\r
      <p class="muted customer-note">Masking defaults to only showing the last 4 digits.</p>\r
    </article>\r
\r
    <article class="card">\r
      <h2>Delivery Address</h2>\r
      <p class="value-strong">Readable address card</p>\r
      <p class="muted" *ngIf="getAddressLines(details.deliveryAddress).length === 0">No delivery address available.</p>\r
      <p class="address-line" *ngFor="let line of getAddressLines(details.deliveryAddress)">{{ line }}</p>\r
    </article>\r
\r
    <article class="card card-wide">\r
      <h2>Order Items Summary</h2>\r
      <div class="table-wrap" *ngIf="details.items.length > 0; else noItemsTpl">\r
        <table class="items-table">\r
          <thead>\r
            <tr>\r
              <th>Item Name</th>\r
              <th>Quantity</th>\r
              <th>Price</th>\r
              <th>Total Amount</th>\r
            </tr>\r
          </thead>\r
          <tbody>\r
            <tr *ngFor="let item of details.items; trackBy: trackByProductId">\r
              <td>{{ item.itemName }}</td>\r
              <td>{{ item.quantity }}</td>\r
              <td>{{ getCurrencySymbol(details.currencyCode) }} {{ item.unitPrice | number : '1.2-2' }}</td>\r
              <td>{{ getCurrencySymbol(details.currencyCode) }} {{ getLineTotal(item) | number : '1.2-2' }}</td>\r
            </tr>\r
          </tbody>\r
        </table>\r
      </div>\r
      <p class="order-total">Order Total: {{ getCurrencySymbol(details.currencyCode) }} {{ details.orderTotal | number : '1.2-2' }}</p>\r
    </article>\r
\r
    <div class="post-items-row card-wide">\r
      <article class="card compact-card">\r
        <h2>Delivery Instructions</h2>\r
        <p class="muted" *ngIf="!details.deliveryInstructions">No delivery notes provided by customer.</p>\r
        <p class="note" *ngIf="details.deliveryInstructions">{{ details.deliveryInstructions }}</p>\r
      </article>\r
\r
      <article class="card compact-card">\r
        <h2>Map Navigation</h2>\r
        <button type="button" class="map-btn" (click)="openMapNavigation()" aria-label="Open delivery location in Google Maps">Open in Google Maps</button>\r
        <p class="muted">Coordinates are used when available, otherwise full address is used.</p>\r
      </article>\r
\r
      <article class="card compact-card">\r
        <h2>Current Order Status</h2>\r
        <p>\r
          <span class="status-badge" [ngClass]="getStatusClass(details.deliveryStatus)">{{ details.deliveryStatus }}</span>\r
        </p>\r
        <p class="muted">Created: {{ details.createdOnUtc ? (details.createdOnUtc | date : 'medium') : 'N/A' }}</p>\r
        <p class="muted">Assigned: {{ details.assignedAtUtc ? (details.assignedAtUtc | date : 'medium') : 'N/A' }}</p>\r
      </article>\r
    </div>\r
  </main>\r
</section>\r
\r
<ng-template #loadingTpl>\r
  <section class="loading-page">\r
    <div class="loading-card">\r
      <p>Loading rider order details...</p>\r
      <button type="button" class="secondary-btn" *ngIf="errorMessage" (click)="retry()">Retry</button>\r
    </div>\r
  </section>\r
</ng-template>\r
\r
<ng-template #noItemsTpl>\r
  <p class="muted">No order items available.</p>\r
</ng-template>\r
`, styles: ['/* src/app/features/rider/rider-order-details.component.css */\n:host {\n  --bg-1: #3f0f5f;\n  --bg-2: #6f1b8a;\n  --bg-3: #ff4ca5;\n  --glass-bg: rgba(255, 255, 255, 0.16);\n  --glass-border: rgba(255, 255, 255, 0.28);\n  --text-1: #fff;\n  --text-2: rgba(255, 255, 255, 0.88);\n  --surface-1: rgba(255, 255, 255, 0.13);\n  --surface-2: rgba(255, 255, 255, 0.08);\n  --border: rgba(255, 255, 255, 0.28);\n  --text-main: #fff;\n  --text-muted: rgba(255, 255, 255, 0.72);\n  --accent: #e879f9;\n  --accent-2: #ff4ca5;\n  --danger: #ff6b8a;\n  --status-pending: #f5a623;\n  --status-assigned: #60a5fa;\n  --status-out: #c084fc;\n  --status-delivered: #4ade80;\n  --font-main:\n    "Poppins",\n    "Segoe UI",\n    sans-serif;\n  display: block;\n}\n.order-page {\n  min-height: 100vh;\n  font-family: var(--font-main);\n  color: var(--text-main);\n  text-transform: capitalize;\n  background:\n    radial-gradient(\n      circle at 15% 5%,\n      rgba(255, 204, 232, 0.45),\n      transparent 25%),\n    radial-gradient(\n      circle at 95% 12%,\n      rgba(226, 161, 255, 0.4),\n      transparent 30%),\n    linear-gradient(\n      145deg,\n      var(--bg-1) 0%,\n      var(--bg-2) 44%,\n      var(--bg-3) 100%);\n  padding: clamp(1rem, 3vw, 2.2rem);\n}\n.order-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 1rem;\n  margin-bottom: 1rem;\n}\n.card {\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  border-radius: 18px;\n  padding: 1.15rem;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n.eyebrow {\n  margin: 0;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  font-size: 0.75rem;\n  color: var(--text-muted);\n}\nh1 {\n  margin: 0.35rem 0;\n  font-size: clamp(1.55rem, 3.6vw, 2.2rem);\n}\nh2 {\n  margin: 0 0 0.65rem;\n  font-size: 1.2rem;\n  font-weight: 800;\n}\n.meta,\n.muted {\n  margin: 0;\n  color: var(--text-muted);\n  line-height: 1.55;\n}\n.value-strong {\n  margin: 0;\n  font-size: 1.2rem;\n  font-weight: 700;\n}\n.customer-name {\n  margin-bottom: 0.35rem;\n}\n.customer-phone {\n  margin: 0 0 0.5rem;\n  font-size: 1rem;\n  font-weight: 600;\n  color: #e5f6ff;\n}\n.customer-note {\n  margin-top: 0.45rem;\n  font-size: 0.86rem;\n}\n.address-line,\n.note {\n  margin: 0;\n  line-height: 1.55;\n}\n.status-wrap {\n  display: grid;\n  gap: 0.7rem;\n  justify-items: end;\n}\n.status-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 999px;\n  padding: 0.45rem 0.9rem;\n  font-weight: 700;\n  font-size: 0.9rem;\n  color: #fff;\n  background: #4f6477;\n}\n.status-pending {\n  background: var(--status-pending);\n}\n.status-assigned {\n  background: var(--status-assigned);\n}\n.status-out {\n  background: var(--status-out);\n}\n.status-delivered {\n  background: var(--status-delivered);\n}\n.status-default {\n  background: #4f6477;\n}\n.content-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 1rem;\n}\n.card-wide {\n  grid-column: 1 / -1;\n}\n.post-items-row {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 1rem;\n}\n.compact-card {\n  min-height: 165px;\n}\n.items-table {\n  width: 100%;\n  border-collapse: collapse;\n  min-width: 580px;\n}\n.items-table th,\n.items-table td {\n  padding: 0.75rem;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.12);\n  text-align: left;\n  font-size: 0.96rem;\n}\n.items-table th {\n  color: var(--text-muted);\n  background: rgba(255, 255, 255, 0.08);\n  font-weight: 700;\n}\n.order-total {\n  margin: 0.8rem 0 0;\n  font-size: 1.15rem;\n  font-weight: 800;\n}\n.table-wrap {\n  overflow-x: auto;\n}\n.secondary-btn,\n.map-btn {\n  border: 1px solid rgba(255, 255, 255, 0.35);\n  border-radius: 999px;\n  background: rgba(255, 255, 255, 0.12);\n  color: #fff;\n  padding: 0.58rem 1.1rem;\n  font-weight: 700;\n  cursor: pointer;\n}\n.map-btn {\n  border: none;\n  color: #fff;\n  background:\n    linear-gradient(\n      120deg,\n      var(--accent),\n      var(--accent-2));\n  border-radius: 999px;\n}\n.secondary-btn:hover,\n.map-btn:hover {\n  transform: translateY(-1px);\n}\n.error-message {\n  margin: 0 0 1rem;\n  background: rgba(255, 107, 138, 0.18);\n  border: 1px solid rgba(255, 107, 138, 0.4);\n  color: var(--danger);\n  padding: 0.9rem;\n  border-radius: 12px;\n  font-weight: 700;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.8rem;\n}\n.error-message p {\n  margin: 0;\n}\n.loading-page {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    linear-gradient(\n      180deg,\n      #f3f9ff 0%,\n      #e8f3fb 100%);\n}\n.loading-card {\n  border-radius: 18px;\n  border: 1px solid var(--border);\n  background: #fff;\n  padding: 1.2rem 1.4rem;\n  display: grid;\n  gap: 0.7rem;\n}\n@media (max-width: 960px) {\n  .content-grid {\n    grid-template-columns: 1fr;\n  }\n  .post-items-row {\n    grid-template-columns: 1fr;\n  }\n  .order-header {\n    flex-direction: column;\n  }\n  .status-wrap {\n    justify-items: start;\n  }\n}\n@media (max-width: 640px) {\n  .order-page {\n    padding: 0.8rem;\n  }\n  .card {\n    padding: 1rem;\n  }\n  .items-table {\n    min-width: 460px;\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-order-details.component.css.map */\n'] }]
  }], () => [{ type: ActivatedRoute }, { type: RiderApiService }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RiderOrderDetailsComponent, { className: "RiderOrderDetailsComponent", filePath: "app/features/rider/rider-order-details.component.ts", lineNumber: 15 });
})();

// src/app/features/rider/rider-accepted-orders.component.ts
function RiderAcceptedOrdersComponent_section_0_main_1_article_11_div_6_div_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 22);
    \u0275\u0275text(1, "Currently selected for Active Delivery");
    \u0275\u0275elementEnd();
  }
}
function RiderAcceptedOrdersComponent_section_0_main_1_article_11_div_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 16)(2, "div", 17);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, RiderAcceptedOrdersComponent_section_0_main_1_article_11_div_6_div_4_Template, 2, 0, "div", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 19)(6, "button", 20);
    \u0275\u0275listener("click", function RiderAcceptedOrdersComponent_section_0_main_1_article_11_div_6_Template_button_click_6_listener() {
      const orderId_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.chooseOrder(orderId_r4));
    });
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "button", 21);
    \u0275\u0275listener("click", function RiderAcceptedOrdersComponent_section_0_main_1_article_11_div_6_Template_button_click_8_listener() {
      const orderId_r4 = \u0275\u0275restoreView(_r3).$implicit;
      const ctx_r1 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r1.openOrderDetails(orderId_r4));
    });
    \u0275\u0275text(9, "Open Details");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const orderId_r4 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Order #", orderId_r4);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", orderId_r4 === ctx_r1.selectedOrderId);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("selected", orderId_r4 === ctx_r1.selectedOrderId);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", orderId_r4 === ctx_r1.selectedOrderId ? "Selected" : "Choose Order For Delivery", " ");
  }
}
function RiderAcceptedOrdersComponent_section_0_main_1_article_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "article", 11)(1, "h2");
    \u0275\u0275text(2, "Orders Accepted By Rider");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 12);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 13);
    \u0275\u0275template(6, RiderAcceptedOrdersComponent_section_0_main_1_article_11_div_6_Template, 10, 5, "div", 14);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const data_r5 = \u0275\u0275nextContext().ngIf;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1("Total accepted active orders: ", data_r5.activeOrderIds.length);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngForOf", data_r5.activeOrderIds);
  }
}
function RiderAcceptedOrdersComponent_section_0_main_1_article_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "article", 11)(1, "h2");
    \u0275\u0275text(2, "No Accepted Orders");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 12);
    \u0275\u0275text(4, "No active accepted orders are available right now.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "button", 8);
    \u0275\u0275listener("click", function RiderAcceptedOrdersComponent_section_0_main_1_article_12_Template_button_click_5_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r1 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r1.backToDashboard());
    });
    \u0275\u0275text(6, "Return To Dashboard");
    \u0275\u0275elementEnd()();
  }
}
function RiderAcceptedOrdersComponent_section_0_main_1_p_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 23);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.errorMessage);
  }
}
function RiderAcceptedOrdersComponent_section_0_main_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "main", 4)(1, "header", 5)(2, "div")(3, "p", 6);
    \u0275\u0275text(4, "Accepted Orders");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h1");
    \u0275\u0275text(6, "Your Accepted Deliveries");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "p", 7);
    \u0275\u0275text(8, "Choose one order for active delivery access.");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(9, "button", 8);
    \u0275\u0275listener("click", function RiderAcceptedOrdersComponent_section_0_main_1_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r1.backToDashboard());
    });
    \u0275\u0275text(10, "Back To Dashboard");
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, RiderAcceptedOrdersComponent_section_0_main_1_article_11_Template, 7, 2, "article", 9)(12, RiderAcceptedOrdersComponent_section_0_main_1_article_12_Template, 7, 0, "article", 9)(13, RiderAcceptedOrdersComponent_section_0_main_1_p_13_Template, 2, 1, "p", 10);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const data_r5 = ctx.ngIf;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(11);
    \u0275\u0275property("ngIf", data_r5.activeOrderIds.length > 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", data_r5.activeOrderIds.length === 0);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.errorMessage);
  }
}
function RiderAcceptedOrdersComponent_section_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 2);
    \u0275\u0275template(1, RiderAcceptedOrdersComponent_section_0_main_1_Template, 14, 3, "main", 3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r1.dashboard);
  }
}
function RiderAcceptedOrdersComponent_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "section", 24)(1, "div", 25);
    \u0275\u0275text(2, "Loading accepted orders...");
    \u0275\u0275elementEnd()();
  }
}
var RiderAcceptedOrdersComponent = class _RiderAcceptedOrdersComponent {
  riderApi;
  static selectedOrderStorageKey = "rider_selected_active_order_id";
  dashboardState = signal(null, ...ngDevMode ? [{ debugName: "dashboardState" }] : (
    /* istanbul ignore next */
    []
  ));
  loadingState = signal(true, ...ngDevMode ? [{ debugName: "loadingState" }] : (
    /* istanbul ignore next */
    []
  ));
  errorState = signal("", ...ngDevMode ? [{ debugName: "errorState" }] : (
    /* istanbul ignore next */
    []
  ));
  selectedOrderIdState = signal(0, ...ngDevMode ? [{ debugName: "selectedOrderIdState" }] : (
    /* istanbul ignore next */
    []
  ));
  get dashboard() {
    return this.dashboardState();
  }
  get loading() {
    return this.loadingState();
  }
  get errorMessage() {
    return this.errorState();
  }
  get selectedOrderId() {
    return this.selectedOrderIdState();
  }
  constructor(riderApi) {
    this.riderApi = riderApi;
  }
  ngOnInit() {
    this.load();
  }
  load() {
    this.loadingState.set(true);
    this.errorState.set("");
    this.riderApi.getDashboard().subscribe({
      next: (result) => {
        const normalized = this.normalizeDashboard(result);
        this.dashboardState.set(normalized);
        this.syncSelection(normalized.activeOrderIds, normalized.activeOrderId);
        this.loadingState.set(false);
      },
      error: (error) => {
        this.loadingState.set(false);
        this.errorState.set(error?.error?.error ?? "Unable to load accepted orders.");
      }
    });
  }
  chooseOrder(orderId) {
    this.selectedOrderIdState.set(orderId);
    this.setStoredSelectedOrderId(orderId);
    window.location.href = "/rider/dashboard";
  }
  openOrderDetails(orderId) {
    window.location.href = `/rider/orders/${orderId}`;
  }
  backToDashboard() {
    window.location.href = "/rider/dashboard";
  }
  syncSelection(activeOrderIds, fallbackOrderId) {
    if (activeOrderIds.length === 0) {
      this.selectedOrderIdState.set(0);
      this.setStoredSelectedOrderId(0);
      return;
    }
    const stored = this.getStoredSelectedOrderId();
    if (stored > 0 && activeOrderIds.includes(stored)) {
      this.selectedOrderIdState.set(stored);
      return;
    }
    const fallback = fallbackOrderId > 0 ? fallbackOrderId : activeOrderIds[0];
    this.selectedOrderIdState.set(fallback);
    this.setStoredSelectedOrderId(fallback);
  }
  getStoredSelectedOrderId() {
    const raw = window.localStorage.getItem(_RiderAcceptedOrdersComponent.selectedOrderStorageKey);
    if (!raw) {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }
  setStoredSelectedOrderId(orderId) {
    if (orderId <= 0) {
      window.localStorage.removeItem(_RiderAcceptedOrdersComponent.selectedOrderStorageKey);
      return;
    }
    window.localStorage.setItem(_RiderAcceptedOrdersComponent.selectedOrderStorageKey, String(orderId));
  }
  getNumberArrayProp(raw, camel, pascal) {
    const value = raw[camel] ?? raw[pascal];
    if (Array.isArray(value)) {
      return value.filter((v) => typeof v === "number");
    }
    return [];
  }
  getNumberProp(raw, camel, pascal, fallback) {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }
  normalizeDashboard(raw) {
    return {
      riderId: this.getNumberProp(raw, "riderId", "RiderId", 0),
      riderName: "",
      riderStatus: "",
      availability: false,
      isApproved: false,
      vehicleType: "",
      currentLocation: "",
      activeDeliveries: this.getNumberProp(raw, "activeDeliveries", "ActiveDeliveries", 0),
      activeOrderId: this.getNumberProp(raw, "activeOrderId", "ActiveOrderId", 0),
      activeOrderIds: this.getNumberArrayProp(raw, "activeOrderIds", "ActiveOrderIds"),
      availableOrders: this.getNumberProp(raw, "availableOrders", "AvailableOrders", 0),
      deliveredCount: this.getNumberProp(raw, "deliveredCount", "DeliveredCount", 0),
      earnings: this.getNumberProp(raw, "earnings", "Earnings", 0)
    };
  }
  static \u0275fac = function RiderAcceptedOrdersComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RiderAcceptedOrdersComponent)(\u0275\u0275directiveInject(RiderApiService));
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RiderAcceptedOrdersComponent, selectors: [["app-rider-accepted-orders"]], decls: 3, vars: 2, consts: [["loadingTpl", ""], ["class", "accepted-page", 4, "ngIf", "ngIfElse"], [1, "accepted-page"], ["class", "accepted-main", 4, "ngIf"], [1, "accepted-main"], [1, "glass", "accepted-header"], [1, "eyebrow"], [1, "sub"], [1, "ghost-btn", 3, "click"], ["class", "glass panel", 4, "ngIf"], ["class", "error", 4, "ngIf"], [1, "glass", "panel"], [1, "muted"], [1, "order-list"], ["class", "order-row", 4, "ngFor", "ngForOf"], [1, "order-row"], [1, "order-info"], [1, "order-title"], ["class", "order-state", 4, "ngIf"], [1, "order-actions"], [1, "choose-btn", 3, "click"], [1, "view-btn", 3, "click"], [1, "order-state"], [1, "error"], [1, "accepted-loading"], [1, "loader-card"]], template: function RiderAcceptedOrdersComponent_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275template(0, RiderAcceptedOrdersComponent_section_0_Template, 2, 1, "section", 1)(1, RiderAcceptedOrdersComponent_ng_template_1_Template, 3, 0, "ng-template", null, 0, \u0275\u0275templateRefExtractor);
    }
    if (rf & 2) {
      const loadingTpl_r7 = \u0275\u0275reference(2);
      \u0275\u0275property("ngIf", !ctx.loading)("ngIfElse", loadingTpl_r7);
    }
  }, dependencies: [CommonModule, NgForOf, NgIf], styles: ['\n[_nghost-%COMP%] {\n  --bg-1: #3f0f5f;\n  --bg-2: #6f1b8a;\n  --bg-3: #ff4ca5;\n  --glass-bg: rgba(255, 255, 255, 0.16);\n  --glass-border: rgba(255, 255, 255, 0.28);\n  --text-1: #fff;\n  --text-2: rgba(255, 255, 255, 0.88);\n  --font-main:\n    "Poppins",\n    "Segoe UI",\n    sans-serif;\n  display: block;\n}\n.accepted-page[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  text-transform: capitalize;\n  background:\n    radial-gradient(\n      circle at 15% 5%,\n      rgba(255, 204, 232, 0.45),\n      transparent 25%),\n    radial-gradient(\n      circle at 95% 12%,\n      rgba(226, 161, 255, 0.4),\n      transparent 30%),\n    linear-gradient(\n      145deg,\n      var(--bg-1) 0%,\n      var(--bg-2) 44%,\n      var(--bg-3) 100%);\n  color: var(--text-1);\n  font-family: var(--font-main);\n  padding: clamp(1rem, 2.4vw, 1.8rem);\n}\n.accepted-main[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 1rem;\n}\n.glass[_ngcontent-%COMP%] {\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  border-radius: 20px;\n  -webkit-backdrop-filter: blur(15px);\n  backdrop-filter: blur(15px);\n  box-shadow: 0 18px 45px rgba(27, 9, 45, 0.25);\n}\n.accepted-header[_ngcontent-%COMP%] {\n  padding: 1rem 1.1rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 1rem;\n}\n.eyebrow[_ngcontent-%COMP%] {\n  margin: 0;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #ffd5ec;\n  font-size: 0.7rem;\n}\nh1[_ngcontent-%COMP%] {\n  margin: 0.25rem 0;\n  font-size: clamp(1.35rem, 3.6vw, 2.2rem);\n}\n.sub[_ngcontent-%COMP%], \n.muted[_ngcontent-%COMP%] {\n  margin: 0;\n  color: var(--text-2);\n}\n.panel[_ngcontent-%COMP%] {\n  padding: 1rem 1.1rem;\n}\n.panel[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0 0 0.4rem;\n}\n.order-list[_ngcontent-%COMP%] {\n  margin-top: 0.75rem;\n  display: grid;\n  gap: 0.65rem;\n}\n.order-row[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.09);\n  border: 1px solid rgba(255, 255, 255, 0.24);\n  border-radius: 14px;\n  padding: 0.75rem;\n  display: flex;\n  justify-content: space-between;\n  gap: 0.8rem;\n  align-items: center;\n}\n.order-title[_ngcontent-%COMP%] {\n  font-weight: 800;\n}\n.order-state[_ngcontent-%COMP%] {\n  color: #9be7ff;\n  font-size: 0.86rem;\n  margin-top: 0.2rem;\n}\n.order-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.45rem;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n}\n.ghost-btn[_ngcontent-%COMP%], \n.choose-btn[_ngcontent-%COMP%], \n.view-btn[_ngcontent-%COMP%] {\n  border: none;\n  border-radius: 999px;\n  padding: 0.5rem 1rem;\n  font-weight: 700;\n  cursor: pointer;\n}\n.ghost-btn[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.18);\n  color: #fff;\n}\n.choose-btn[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      120deg,\n      #9be7ff,\n      #ffd5ec);\n  color: #3b1852;\n}\n.choose-btn.selected[_ngcontent-%COMP%] {\n  background:\n    linear-gradient(\n      120deg,\n      #6cf0b8,\n      #9be7ff);\n}\n.view-btn[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.12);\n  color: #fff;\n  border: 1px solid rgba(255, 255, 255, 0.35);\n}\n.error[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #ffe4ef;\n  font-weight: 700;\n}\n.accepted-loading[_ngcontent-%COMP%] {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    linear-gradient(\n      140deg,\n      #360f53 0%,\n      #6c1f8f 55%,\n      #ef4aa8 100%);\n}\n.loader-card[_ngcontent-%COMP%] {\n  color: #fff;\n  border-radius: 16px;\n  padding: 1.2rem 1.4rem;\n  background: rgba(255, 255, 255, 0.14);\n  border: 1px solid rgba(255, 255, 255, 0.3);\n}\n@media (max-width: 768px) {\n  .accepted-header[_ngcontent-%COMP%] {\n    flex-direction: column;\n    align-items: flex-start;\n  }\n  .order-row[_ngcontent-%COMP%] {\n    flex-direction: column;\n    align-items: flex-start;\n  }\n  .order-actions[_ngcontent-%COMP%] {\n    width: 100%;\n    justify-content: flex-start;\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-accepted-orders.component.css.map */'] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RiderAcceptedOrdersComponent, [{
    type: Component,
    args: [{ selector: "app-rider-accepted-orders", standalone: true, imports: [CommonModule], template: `<section class="accepted-page" *ngIf="!loading; else loadingTpl">\r
  <main class="accepted-main" *ngIf="dashboard as data">\r
    <header class="glass accepted-header">\r
      <div>\r
        <p class="eyebrow">Accepted Orders</p>\r
        <h1>Your Accepted Deliveries</h1>\r
        <p class="sub">Choose one order for active delivery access.</p>\r
      </div>\r
      <button class="ghost-btn" (click)="backToDashboard()">Back To Dashboard</button>\r
    </header>\r
\r
    <article class="glass panel" *ngIf="data.activeOrderIds.length > 0">\r
      <h2>Orders Accepted By Rider</h2>\r
      <p class="muted">Total accepted active orders: {{ data.activeOrderIds.length }}</p>\r
      <div class="order-list">\r
        <div class="order-row" *ngFor="let orderId of data.activeOrderIds">\r
          <div class="order-info">\r
            <div class="order-title">Order #{{ orderId }}</div>\r
            <div class="order-state" *ngIf="orderId === selectedOrderId">Currently selected for Active Delivery</div>\r
          </div>\r
          <div class="order-actions">\r
            <button class="choose-btn" [class.selected]="orderId === selectedOrderId" (click)="chooseOrder(orderId)">\r
              {{ orderId === selectedOrderId ? 'Selected' : 'Choose Order For Delivery' }}\r
            </button>\r
            <button class="view-btn" (click)="openOrderDetails(orderId)">Open Details</button>\r
          </div>\r
        </div>\r
      </div>\r
    </article>\r
\r
    <article class="glass panel" *ngIf="data.activeOrderIds.length === 0">\r
      <h2>No Accepted Orders</h2>\r
      <p class="muted">No active accepted orders are available right now.</p>\r
      <button class="ghost-btn" (click)="backToDashboard()">Return To Dashboard</button>\r
    </article>\r
\r
    <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>\r
  </main>\r
</section>\r
\r
<ng-template #loadingTpl>\r
  <section class="accepted-loading">\r
    <div class="loader-card">Loading accepted orders...</div>\r
  </section>\r
</ng-template>\r
`, styles: ['/* src/app/features/rider/rider-accepted-orders.component.css */\n:host {\n  --bg-1: #3f0f5f;\n  --bg-2: #6f1b8a;\n  --bg-3: #ff4ca5;\n  --glass-bg: rgba(255, 255, 255, 0.16);\n  --glass-border: rgba(255, 255, 255, 0.28);\n  --text-1: #fff;\n  --text-2: rgba(255, 255, 255, 0.88);\n  --font-main:\n    "Poppins",\n    "Segoe UI",\n    sans-serif;\n  display: block;\n}\n.accepted-page {\n  min-height: 100vh;\n  text-transform: capitalize;\n  background:\n    radial-gradient(\n      circle at 15% 5%,\n      rgba(255, 204, 232, 0.45),\n      transparent 25%),\n    radial-gradient(\n      circle at 95% 12%,\n      rgba(226, 161, 255, 0.4),\n      transparent 30%),\n    linear-gradient(\n      145deg,\n      var(--bg-1) 0%,\n      var(--bg-2) 44%,\n      var(--bg-3) 100%);\n  color: var(--text-1);\n  font-family: var(--font-main);\n  padding: clamp(1rem, 2.4vw, 1.8rem);\n}\n.accepted-main {\n  display: grid;\n  gap: 1rem;\n}\n.glass {\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  border-radius: 20px;\n  -webkit-backdrop-filter: blur(15px);\n  backdrop-filter: blur(15px);\n  box-shadow: 0 18px 45px rgba(27, 9, 45, 0.25);\n}\n.accepted-header {\n  padding: 1rem 1.1rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 1rem;\n}\n.eyebrow {\n  margin: 0;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #ffd5ec;\n  font-size: 0.7rem;\n}\nh1 {\n  margin: 0.25rem 0;\n  font-size: clamp(1.35rem, 3.6vw, 2.2rem);\n}\n.sub,\n.muted {\n  margin: 0;\n  color: var(--text-2);\n}\n.panel {\n  padding: 1rem 1.1rem;\n}\n.panel h2 {\n  margin: 0 0 0.4rem;\n}\n.order-list {\n  margin-top: 0.75rem;\n  display: grid;\n  gap: 0.65rem;\n}\n.order-row {\n  background: rgba(255, 255, 255, 0.09);\n  border: 1px solid rgba(255, 255, 255, 0.24);\n  border-radius: 14px;\n  padding: 0.75rem;\n  display: flex;\n  justify-content: space-between;\n  gap: 0.8rem;\n  align-items: center;\n}\n.order-title {\n  font-weight: 800;\n}\n.order-state {\n  color: #9be7ff;\n  font-size: 0.86rem;\n  margin-top: 0.2rem;\n}\n.order-actions {\n  display: flex;\n  gap: 0.45rem;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n}\n.ghost-btn,\n.choose-btn,\n.view-btn {\n  border: none;\n  border-radius: 999px;\n  padding: 0.5rem 1rem;\n  font-weight: 700;\n  cursor: pointer;\n}\n.ghost-btn {\n  background: rgba(255, 255, 255, 0.18);\n  color: #fff;\n}\n.choose-btn {\n  background:\n    linear-gradient(\n      120deg,\n      #9be7ff,\n      #ffd5ec);\n  color: #3b1852;\n}\n.choose-btn.selected {\n  background:\n    linear-gradient(\n      120deg,\n      #6cf0b8,\n      #9be7ff);\n}\n.view-btn {\n  background: rgba(255, 255, 255, 0.12);\n  color: #fff;\n  border: 1px solid rgba(255, 255, 255, 0.35);\n}\n.error {\n  margin: 0;\n  color: #ffe4ef;\n  font-weight: 700;\n}\n.accepted-loading {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background:\n    linear-gradient(\n      140deg,\n      #360f53 0%,\n      #6c1f8f 55%,\n      #ef4aa8 100%);\n}\n.loader-card {\n  color: #fff;\n  border-radius: 16px;\n  padding: 1.2rem 1.4rem;\n  background: rgba(255, 255, 255, 0.14);\n  border: 1px solid rgba(255, 255, 255, 0.3);\n}\n@media (max-width: 768px) {\n  .accepted-header {\n    flex-direction: column;\n    align-items: flex-start;\n  }\n  .order-row {\n    flex-direction: column;\n    align-items: flex-start;\n  }\n  .order-actions {\n    width: 100%;\n    justify-content: flex-start;\n  }\n}\n/*# sourceMappingURL=/rider/browser/rider-accepted-orders.component.css.map */\n'] }]
  }], () => [{ type: RiderApiService }], null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RiderAcceptedOrdersComponent, { className: "RiderAcceptedOrdersComponent", filePath: "app/features/rider/rider-accepted-orders.component.ts", lineNumber: 13 });
})();

// src/app/features/rider/rider.routes.ts
var RIDER_ROUTES = [
  {
    path: "",
    component: RiderEntryComponent
  },
  {
    path: "onboarding",
    component: RiderOnboardingComponent,
    canActivate: [customerAuthGuard, nonRiderGuard]
  },
  {
    path: "dashboard",
    component: RiderDashboardComponent,
    canActivate: [customerAuthGuard, riderOnlyGuard]
  },
  {
    path: "accepted-orders",
    component: RiderAcceptedOrdersComponent,
    canActivate: [customerAuthGuard, riderOnlyGuard]
  },
  {
    path: "orders/:orderId",
    component: RiderOrderDetailsComponent,
    canActivate: [customerAuthGuard, riderOnlyGuard]
  }
];
export {
  RIDER_ROUTES
};
//# sourceMappingURL=chunk-VGDJNSJS.js.map
