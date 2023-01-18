export interface ViewEngineOptions {
  rootPath: string;
  viewPath: string;
  partialPath: string;
  layoutPath: string;
  extName: string;
  layout: string;
}

export interface ViewEngineSetup {
  fetch?: ViewEngineFetch;
  partials?: string[];
  helpers?: Record<string, (...args: unknown[]) => void>;
}

export type ViewEngineFetch = (
  input: string | Request | URL,
  init?: RequestInit | undefined,
) => Promise<Response>;

// deno-lint-ignore no-explicit-any
export abstract class ViewEngine<Engine = any> {
  options: ViewEngineOptions;

  fetch!: ViewEngineFetch;

  constructor(
    readonly engine: Engine,
    options: Partial<ViewEngineOptions> = {},
  ) {
    this.options = {
      rootPath: ".",
      viewPath: "views",
      partialPath: "partials",
      layoutPath: "layouts",
      extName: ".hbs",
      layout: "main",
      ...options,
    };
  }

  getViewPath(options?: Partial<ViewEngineOptions>) {
    const rootPath = options?.rootPath || this.options.rootPath;
    const viewPath = options?.viewPath || this.options.viewPath;
    return `${rootPath}/${viewPath}`;
  }

  getPartialPath(options?: Partial<ViewEngineOptions>) {
    const partialPath = options?.partialPath || this.options.partialPath;
    return `${this.getViewPath(options)}/${partialPath}`;
  }

  getLayoutPath(options?: Partial<ViewEngineOptions>) {
    const layoutPath = options?.layoutPath || this.options.layoutPath;
    return `${this.getViewPath(options)}/${layoutPath}`;
  }

  async install(setup: ViewEngineSetup) {
    if (setup.fetch) {
      this.fetch = setup.fetch;
    } else {
      this.fetch = fetch;
    }

    const promises: Promise<void>[] = [];
    for (const value of Object.values(setup.partials)) {
      promises.push(this.registerPartial(value));
    }
    await Promise.all(promises);
  }

  abstract registerPartial(partial: string): Promise<void>;
  abstract registerHelper(name: string, fn: (...args: unknown[]) => void): void;

  abstract view(
    template: string,
    data: Record<string, unknown>,
    options?: Partial<ViewEngineOptions>,
  ): Promise<string>;
  abstract partial(
    template: string,
    data: Record<string, unknown>,
    options?: Partial<ViewEngineOptions>,
  ): Promise<string>;

  protected async getTemplate(
    path: string,
    template: string,
    options?: Partial<ViewEngineOptions>,
  ) {
    const extName = options?.extName || this.options.extName;
    const res = await this.fetch(`${path}/${template + extName}`);
    const content = await res.text();
    return content;
  }

  protected async getViewTemplate(
    template: string,
    options?: Partial<ViewEngineOptions>,
  ) {
    const path = this.getViewPath(options);
    const content = await this.getTemplate(path, template, options);
    return content;
  }

  protected async getPartialTemplate(
    template: string,
    options?: Partial<ViewEngineOptions>,
  ) {
    const path = this.getPartialPath(options);
    const content = await this.getTemplate(path, template, options);
    return content;
  }

  protected async getLayoutTemplate(
    template: string,
    options?: Partial<ViewEngineOptions>,
  ) {
    const path = this.getLayoutPath(options);
    const content = await this.getTemplate(path, template, options);
    return content;
  }
}
