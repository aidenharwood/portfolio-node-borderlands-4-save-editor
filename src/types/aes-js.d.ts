declare module 'aes-js' {
  namespace ModeOfOperation {
    class ecb {
      constructor(key: ArrayLike<number>)
      encrypt(data: ArrayLike<number>): Uint8Array
      decrypt(data: ArrayLike<number>): Uint8Array
    }
  }
}
