// A file for various functions used to work on pure JS objects.

/**
 * Throws an exception if condition is false.
 * @param condition The condition that is supposed to evaluate to a true value.
 * @returns The function's argument.
 */
export function assert<T>(condition: T): asserts condition {
    if (!condition) {
        throw new Error('Assertion failed');
    }
}

/**
 * A more type safe way to iterate over an object with keys from a union type.
 */
export function forIn<K extends string, V, R>(obj: Partial<{ [key in K]: V }> | Record<K, V>, f: (key: K, value: V) => R) {
    for (const key in obj) {
        if (f(key, obj[key]!) === false) {
            return;
        }
    }
}