export class Promises<T> {
  constructor(private promises: Array<Promise<T>>) {}

  map<U>(callbackfn: (value: T) => U | Promise<U>): Promises<U> {
    return new Promises(this.promises.map((p) => p.then(callbackfn)));
  }

  all() {
    return Promise.all(this.promises);
  }
}
