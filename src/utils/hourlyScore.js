import { buildAdvice } from './adviceRules'

/**
 * 시간대별로 그 일을 하기에 괜찮은지 점수를 매긴다.
 *
 * 판정 규칙(adviceRules)을 그대로 재사용한다.
 * 'stop' 이 하나라도 걸리면 하지 말아야 할 시간, 'warn' 은 조심할 시간으로 본다.
 * 규칙을 고치면 시간대 판정도 같이 따라오게 하려고 별도 기준을 만들지 않았다.
 */
export const scoreHour = (row, mode) => {
  // 판정 함수는 하루 단위 값(minTemp, condition)도 함께 보므로 시간대 값으로 채워 넣는다
  const advices = buildAdvice(
    { ...row, minTemp: row.temp, condition: row.rainProb >= 60 ? 'Rain' : 'Clear' },
    mode,
  )

  if (advices.some((a) => a.level === 'stop')) return 'stop'
  if (advices.some((a) => a.level === 'warn')) return 'warn'
  return 'good'
}

/**
 * 연속된 'good' 구간 중 가장 긴 것을 찾아 추천 시간대로 쓴다.
 *
 * 시각(hour)뿐 아니라 몇 번째 칸인지(index)도 함께 돌려준다.
 * 시간축 위에 이 구간을 띠로 그리려면 자리를 알아야 하는데,
 * 시각으로는 자리를 알 수 없다. 자정을 넘으면 23 다음이 0 이라
 * 시각의 차이가 칸의 거리와 어긋난다.
 */
export const findBestWindow = (rows, mode) => {
  let best = null
  let cur = null

  const close = () => {
    if (cur && (!best || cur.length > best.length)) best = cur
    cur = null
  }

  rows.forEach((row, i) => {
    if (scoreHour(row, mode) === 'good') {
      cur = cur ?? { from: row.hour, to: row.hour, fromIndex: i, toIndex: i, length: 0 }
      cur.to = row.hour
      cur.toIndex = i
      cur.length += 1
    } else {
      close()
    }
  })
  close()

  return best
}
