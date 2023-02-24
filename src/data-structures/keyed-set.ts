export class KeyedSet<T> {
  private data = new Map<string | number, T>();

  public constructor(public extractKey: (x: T) => string | number) {
  }

  public has(x: T) {
    const k = this.extractKey(x);
    return this.data.has(k);
  }

  public getByKey(k: string | number): T | undefined {
    return this.data.get(k);
  }

  public add(x: T) {
    const k = this.extractKey(x);
    this.data.set(k, x);
  }

  public peek(): T | undefined {
    const [res] = this.data.values();
    return res;
  }

  public pop(): T | undefined {
    const [res] = this.data.values();
    if (res) {
      this.delete(res);
      return res;
    } else {
      return undefined;
    }
  }

  public delete(x: T): boolean {
    const k = this.extractKey(x);
    return this.data.delete(k);
  }

  public clone(): KeyedSet<T> {
    const result = new KeyedSet<T>(this.extractKey);
    for (const [k, x] of this.data.entries()) {
      result.data.set(k, x);
    }
    return result;
  }

  public difference(xs: T[]): KeyedSet<T> {
    const result = this.clone();
    xs.map((x) => this.extractKey(x)).forEach((k) => {
      result.data.delete(k);
    });
    return result;
  }

  public values(): T[] {
    return [...this.data.values()];
  }

  public forEach(f: (x: T) => void) {
    this.data.forEach(f);
  }

  public size(): number {
    return this.data.size;
  }

}
