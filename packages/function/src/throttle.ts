type Scheduler = {
  setTimeout(callback: () => void, delay: number): unknown
}

const scheduler: Scheduler = {
  setTimeout(callback, delay) {
    return setTimeout(callback, delay)
  }
}

const throttle =
  (wait: number, f: () => void, schedule: Scheduler = scheduler) => {
    let n = 0
    const g =
      () => {
        if (n++ === 0) {
          schedule.setTimeout(() => {
            if (--n > 0) {
              n = 0
              g()
            }
          }, wait)
          f()
        }
      }
    return g
  }

export default throttle
