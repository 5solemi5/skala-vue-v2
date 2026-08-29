/*
 * 씨앗 하나로 늘 같은 수를 내는 난수.
 *
 * 무대는 새로 고쳐도 같은 풍경이어야 한다. 그래서 Math.random 을 쓰지
 * 않고 씨앗에서 뽑는다. 무대 그림(StageScene)과 불꽃 두 판이 같이 쓴다.
 */
export const rng = (seed) => {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x >>>= 0
    x ^= x >> 17
    x ^= x << 5
    x >>>= 0
    return x / 4294967296
  }
}
