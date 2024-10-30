import { Ayamari } from '@daisugi/ayamari';
import { urandom } from '@daisugi/kintsugi';

const { errFn } = new Ayamari();

type ClassConstructor = new (...args: any) => any;
type Callback<R> = (...args: any) => R;

type MappedArray<T extends unknown[], U> = {
  [K in keyof T]: KadoManifestItem<T[K]> | U;
};

export type KadoToken = string | symbol | number;
export type KadoScope = 'Transient' | 'Singleton';
interface KadoBaseManifestItem {
  token?: KadoToken;
  scope?: KadoScope;
  meta?: Record<string, unknown>;
}
type KadoManifestItemType = ClassConstructor | unknown;
interface KadoClassManifestItem<C extends ClassConstructor>
  extends KadoBaseManifestItem {
  useClass: C;
  params: MappedArray<ConstructorParameters<C>, KadoToken>;
}
interface KadoFunctionManifestItem<
  V,
  C extends Callback<V> = Callback<V>,
> extends KadoBaseManifestItem {
  useFn: C;
  params: MappedArray<Parameters<C>, KadoToken>;
}
interface KadoFunctionByContainerManifestItem<V>
  extends KadoBaseManifestItem {
  useFnByContainer: (container: KadoContainer<V>) => V;
  params: MappedArray<[KadoContainer<V>], KadoToken>;
}
interface KadoValueManifestItem<V>
  extends KadoBaseManifestItem {
  useValue: V;
}
type KadoManifestItem<
  V extends ClassConstructor | unknown,
> = V extends ClassConstructor
  ? KadoClassManifestItem<V>
  :
      | KadoFunctionManifestItem<V>
      | KadoFunctionByContainerManifestItem<V>
      | KadoValueManifestItem<V>;

export type KadoParam<V> = KadoManifestItem<V>;
interface KadoContainerItem<V> {
  manifestItem: KadoManifestItem<V>;
  checkedForCircularDep: boolean;
  instance: any;
}
type KadoTokenToContainerItem<V> = Map<
  KadoToken,
  KadoContainerItem<V>
>;
export type KadoContainer<V> = Container<V>;

/**
 * @example
 * type W = WrappedManifestEntries<[typeof A, typeof B]>
 * // returns [ManifestEntry<typeof A>, ManifestEntry<typeof B>] */
type WrappedManifestEntries<
  C extends KadoManifestItemType[],
> = {
  [K in keyof C]: KadoManifestItem<C[K]>;
};

export class Container<V> {
  #tokenToContainerItem: KadoTokenToContainerItem<V>;

  constructor() {
    this.#tokenToContainerItem = new Map();
  }

  async resolve<V>(token: KadoToken): Promise<V> {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem === undefined) {
      throw errFn.NotFound(
        `Attempted to resolve unregistered dependency token: "${token.toString()}".`,
      );
    }
    const manifestItem = containerItem.manifestItem;
    if (
      'useValue' in manifestItem &&
      manifestItem.useValue !== undefined
    ) {
      return manifestItem.useValue as V;
    }
    if (containerItem.instance) {
      return containerItem.instance;
    }
    let resolve = null;
    if (manifestItem.scope !== Kado.scope.Transient) {
      containerItem.instance = new Promise((_resolve) => {
        resolve = _resolve;
      });
    }
    let paramsInstances = null;
    if ('params' in manifestItem && manifestItem.params) {
      this.#checkForCircularDep(containerItem);
      paramsInstances = await Promise.all(
        manifestItem.params.map(
          this.#resolveParam.bind(this),
        ),
      );
    }
    let instance;
    if ('useFn' in manifestItem && manifestItem.useFn) {
      instance = paramsInstances
        ? manifestItem.useFn(...paramsInstances)
        : manifestItem.useFn();
    } else if (
      'useFnByContainer' in manifestItem &&
      manifestItem.useFnByContainer
    ) {
      instance = manifestItem.useFnByContainer(this);
    } else if (
      'useClass' in manifestItem &&
      manifestItem.useClass
    ) {
      instance = paramsInstances
        ? new manifestItem.useClass(...paramsInstances)
        : new manifestItem.useClass();
    }
    if (manifestItem.scope === Kado.scope.Transient) {
      return instance;
    }
    resolve!(instance);
    return containerItem.instance;
  }

  async #resolveParam(param: KadoParam<V>) {
    const token =
      typeof param === 'object'
        ? this.#registerItem(param)
        : param;
    return this.resolve<V>(token);
  }

  register(manifestItems: KadoManifestItem<V>[]) {
    for (const manifestItem of manifestItems) {
      this.#registerItem(manifestItem);
    }
  }

  #registerItem(
    manifestItem: KadoManifestItem<V>,
  ): KadoToken {
    const token = manifestItem.token || urandom();
    this.#tokenToContainerItem.set(token, {
      manifestItem: Object.assign(manifestItem, { token }),
      checkedForCircularDep: false,
      instance: null,
    });
    return token;
  }

  list(): KadoManifestItem<V>[] {
    return Array.from(
      this.#tokenToContainerItem.values(),
    ).map((containerItem) => containerItem.manifestItem);
  }

  get(token: KadoToken): KadoManifestItem<V> {
    const containerItem =
      this.#tokenToContainerItem.get(token);
    if (containerItem === undefined) {
      throw errFn.NotFound(
        `Attempted to get unregistered dependency token: "${token.toString()}".`,
      );
    }
    return containerItem.manifestItem;
  }

  #checkForCircularDep(
    containerItem: KadoContainerItem<V>,
    tokens: KadoToken[] = [],
  ) {
    if (containerItem.checkedForCircularDep) {
      return;
    }
    const token = containerItem.manifestItem.token;
    if (!token) {
      return;
    }
    if (tokens.includes(token)) {
      const chainOfTokens = tokens
        .map((token) => `"${token.toString()}"`)
        .join(' ➡️ ');
      throw errFn.CircularDependencyDetected(
        `Attempted to resolve circular dependency: ${chainOfTokens} 🔄 "${token.toString()}".`,
      );
    }
    if (
      'params' in containerItem.manifestItem &&
      containerItem.manifestItem.params
    ) {
      for (const param of containerItem.manifestItem
        .params) {
        if (typeof param === 'object') {
          continue;
        }
        const paramContainerItem =
          this.#tokenToContainerItem.get(param);
        if (!paramContainerItem) {
          continue;
        }
        this.#checkForCircularDep(paramContainerItem, [
          ...tokens,
          token,
        ]);
        paramContainerItem.checkedForCircularDep = true;
      }
    }
  }
}

export class Kado<V> {
  static scope: Record<KadoScope, KadoScope> = {
    Transient: 'Transient',
    Singleton: 'Singleton',
  };
  container: KadoContainer<V>;

  constructor() {
    this.container = new Container();
  }

  static value<V>(value: V): KadoValueManifestItem<V> {
    return { useValue: value };
  }

  static map<P extends unknown[]>(
    params: { [K in keyof P]: KadoParam<P[K]> },
  ): KadoFunctionManifestItem<P> {
    return Kado.useFn({
      useFn(...args: P) {
        return args;
      },
      params,
    });
  }

  static flatMap<P extends unknown[]>(
    params: { [K in keyof P]: KadoParam<P[K]> },
  ): KadoFunctionManifestItem<P> {
    return Kado.useFn({
      useFn(...args: P) {
        return args.flat() as P;
      },
      params,
    });
  }

  /** Type-checks a manifest item array. */
  static manifest<C extends KadoManifestItemType[]>(
    entries: WrappedManifestEntries<C>,
  ) {
    return entries;
  }

  /** Type-checks a manifest item. */
  static manifestItem<C extends ClassConstructor>(
    entry: KadoManifestItem<C>,
  ) {
    return entry;
  }

  /** Type-checks a function manifest item. */
  static useFn<V, C extends Callback<V>>(
    entry: KadoFunctionManifestItem<V, C>,
  ) {
    return entry;
  }
}
