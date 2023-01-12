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
  partials: string[];
}

export type ViewEngineFetch = (
  input: string | Request | URL,
  init?: RequestInit | undefined,
) => Promise<Response>;

// deno-lint-ignore no-explicit-any
export abstract class ViewEngine<Engine = any> {
  options: ViewEngineOptions;

  fetch!: ViewEngineFetch;

  get viewPath(): string {
    return `${this.options.rootPath}/${this.options.viewPath}`;
  }

  get partialPath(): string {
    return `${this.viewPath}/${this.options.partialPath}`;
  }

  get layoutPath(): string {
    return `${this.viewPath}/${this.options.layoutPath}`;
  }

  constructor(readonly engine: Engine, options: Partial<ViewEngineOptions>) {
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
}
