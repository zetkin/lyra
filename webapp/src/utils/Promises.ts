export class Promises<T> {
  private constructor(private array: Array<Promise<T>>) {}

  static of<T>(array: Array<Promise<T>>) {
    return new Promises(array);
  }

  map<U>(callbackFn: (value: T) => U | Promise<U>): Promises<U> {
    return new Promises(this.array.map((p) => p.then(callbackFn)));
  }

  all() {
    return Promise.all(this.array);
  }
}
