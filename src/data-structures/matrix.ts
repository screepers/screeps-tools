import { ROOM_SIZE } from '../screeps/constants';
import {assert} from '../js-utils';

export interface ReadableMatrix {
  get: (x: number, y: number) => number;
}

interface HasReduce<T> {
  reduce(callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: T) => number, initialValue?: number): number;
  reduce<U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: T) => U, initialValue: U): U;
}

export interface RWMatrix extends ReadableMatrix {
  height: number,
  width: number,
  set: (x: number, y: number, v: number) => void;
}

export class Matrix implements ReadableMatrix {
  private readonly matrix: Uint8Array | Uint16Array | Uint32Array;
  public readonly width: number;
  public readonly height: number;

  public constructor(cons?: Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor, width?: number, height?: number,
                     matrix?: Uint8Array | Uint16Array | Uint32Array) {
    this.width = width ?? ROOM_SIZE;
    this.height = height ?? ROOM_SIZE;
    assert(this.width > 0);
    assert(this.height > 0);

    if (matrix !== undefined) {
      this.matrix = matrix;
    } else {
      cons = cons ?? Uint8Array;
      this.matrix = new cons(this.height * this.width);
    }
  }

  public get(x: number, y: number): number {
    assert(0 <= y && y < this.height);
    assert(0 <= x && x < this.width);
    return this.matrix[y * this.width + x]!;
  }

  public set(x: number, y: number, value: number) {
    assert(0 <= y && y < this.height);
    assert(0 <= x && x < this.width);
    this.matrix[y * this.width + x] = value;
  }

  public has(value: number): boolean {
    return this.matrix.some((v) => v === value);
  }

  public fill(value: number) {
    for (let i = this.width * this.height; i >= 0; --i) {
      this.matrix[i] = value;
    }
  }

  public count(value: number): number {
    const m: HasReduce<Uint8Array | Uint16Array | Uint32Array> = this.matrix;
    return m.reduce((acc: number, v: number) => acc + (v === value ? 1 : 0), 0);
  }

  public positiveXY(): XY[] {
    const result: XY[] = [];
    this.matrix.forEach((v, i) => {
      if (v !== 0) {
        result.push({
          x: i % this.width,
          y: Math.floor(i / this.width)
        });
      }
    });
    return result;
  }

  public toArray(): number[][] {
    const result: number[][] = [];
    for (let y = 0; y < this.height; ++y) {
      const row: number[] = [];
      for (let x = 0; x < this.width; ++x) {
        row.push(this.matrix[y * this.width + x]!);
      }
      result.push(row);
    }
    return result;
  }

  public static fromArray(arr: number[][], cons?: Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor): Matrix {
    cons = cons ?? Uint8Array;
    const width = arr[0]!.length;
    const height = arr.length;
    const matrix = new cons(width * height);
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        matrix[y * width + x] = arr[y]![x]!;
      }
    }
    return new Matrix(undefined, width, height, matrix);
  }

  public static matrixFromFunction(f: (x: number, y: number) => number, width?: number, height?: number,
                                   cons?: Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor): Matrix {
    const matrix = new Matrix(cons, width, height);
    for (let y = 0; y < matrix.height; ++y) {
      for (let x = 0; x < matrix.width; ++x) {
        matrix.set(x, y, f(x, y));
      }
    }
    return matrix;
  }

  public static binaryMatrixFromXY(arr: XY[], fill?: number, width?: number, height?: number,
                                   cons?: Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor): Matrix {
    const c = fill ?? 1;
    const matrix = new Matrix(cons, width, height);
    arr.forEach(({ x, y }) => {
      matrix.set(x, y, c);
    });
    return matrix;
  }

  public clone() {
    return new Matrix(undefined, this.width, this.height, this.matrix.slice());
  }
}
