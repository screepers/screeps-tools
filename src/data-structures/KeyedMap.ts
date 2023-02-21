interface KV<K, V> {
  key: K,
  value: V
}

export class KeyedMap<K, V> {
  private data = new Map<string | number, KV<K, V>>();

  public constructor(public extractKeyKey: (key: K) => string | number) {
  }

  public has(key: K) {
    const k = this.extractKeyKey(key);
    return this.data.has(k);
  }

  public set(key: K, value: V) {
    const k = this.extractKeyKey(key);
    this.data.set(k, {key, value});
  }

  public get(key: K): V | undefined {
    const k = this.extractKeyKey(key);
    return this.data.get(k)?.value;
  }

  public defaults(key: K, value: V): V {
    const k = this.extractKeyKey(key);
    const kv = this.data.get(k);
    if (kv === undefined) {
      this.data.set(k, {key, value});
      return value;
    } else {
      return kv.value;
    }
  }

  public delete(key: K): boolean {
    const k = this.extractKeyKey(key);
    return this.data.delete(k);
  }

  public keysAndValues(): KV<K, V>[] {
    return [...this.data.values()];
  }

  public forEach(f: (k: K, v: V) => void) {
    this.data.forEach(({key, value}) => {
      f(key, value);
    });
  }

  public size(): number {
    return this.data.size;
  }
}
