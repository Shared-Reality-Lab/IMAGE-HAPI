# IMAGE-HAPI

This repository contains both the JS/TS version of the [hAPI](https://2diy.haply.co) (Haply's API)

It also contains some examples.

## How to use it:

The Typescript version of the code is available under `src`.
To build the Javascript version to `dist`, run the following commands:

```
npm ci
npx tsc
```

Note that both the JS and TS versions rely on the [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API), and therefore will only work in Chromium-based browser environments.
