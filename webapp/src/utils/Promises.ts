export class Promises<T> {
  constructor(private promises: Array<Promise<T>>) {}

  map<U>(callbackFn: (value: T) => U | Promise<U>): Promises<U> {
    return new Promises(this.promises.map((p) => p.then(callbackFn)));
  }

  all() {
    return Promise.all(this.promises);
  }
}
