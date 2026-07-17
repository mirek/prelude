# WaitGroup module

# Usage

```bash
npm i -E @prelude/wait-group
```

```ts
import WaitGroup from '@prelude/wait-group'

const group = new WaitGroup(2)
const complete = group.wait()

group.done()
group.done()

await complete
```

## Counter and settlement contract

- The constructor, `add(delta)`, and `done(delta)` accept non-negative safe integers only. Invalid arguments throw without changing a healthy group.
- Reaching zero resolves every current waiter. Repeated waits at zero resolve immediately.
- A group that reaches zero can be reused by calling `add()` again.
- Counter underflow and overflow fail atomically: the prior counter is retained, all current waiters reject, and the group enters a terminal failed state.
- `reject(error)` also enters the terminal failed state. The first failure is preserved.
- Future `wait()` calls reject with the original failure, while future `add()` and `done()` calls throw it synchronously.

# License

```
MIT License

Copyright 2022 Mirek Rusin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
