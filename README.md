# Express Circuit Breaker

[![npm](https://img.shields.io/npm/dm/express-circuit-breaker.svg?style=flat-square)](https://www.npmjs.org/package/express-circuit-breaker)
[![npm](https://img.shields.io/npm/v/express-circuit-breaker.svg?style=flat-square)](https://www.npmjs.org/package/express-circuit-breaker)

Provides error protection within an express route

- [Express Circuit Breaker](#express-circuit-breaker)
  - [Installation](#installation)
  - [Usage](#usage)
    - [API](#api)
        - [opts.catchError(e)](#optscatcherrore)
        - [opts.handleLater = false](#optshandlelater--false)
        - [opts.handleBlockedRequest(req, res)](#optshandleblockedrequestreq-res)
    - [Workflow](#workflow)
  - [Example implementation](#example-implementation)

## Installation

```bash
npm i express-circuit-breaker
```

```javascript
var breaker = require('express-circuit-breaker')
```

## Usage

`express-circuit-breaker` produces a middleware that will block requests if an error was thrown from a previous use.

### API

For `breaker(opts)`

##### opts.catchError(e)

Called when a child node throws an error. Must return `trip` or `reset`.

- `return 'trip'`: Trips the breaker and blocks future requests
- `return 'reset'`: Resets the breaker to it's untripped state and allows future requests

##### opts.handleLater = false

Does not block request, instead allows request to be handled by next middleware. Breaker status is communicated in the `req.breakerTripped`. If `true`, breaker will not run `handleBlockedRequest`.

##### opts.handleBlockedRequest(req, res)

A middleware for handling incoming requests that were blocked by the breaker

### Workflow

```
request(/protected) -> server -> breaker(open) -> endpoint

      |
      V

request(receives error 500) <- server <- breaker(tripped) <- endpoint(throws error)

Then later...

request(/protected) -> server <- breaker(tripped, sends back 500) -- endpoint(never touched)
```

## Example implementation

```javascript
var app = require('express')()
var breaker = require('express-circuit-breaker')

var CB = breaker({
  catchError: e => 'trip',
  handleBlockedRequest: (req, res) => res.sendStatus(500)
})

app.get('/unprotected', (req, res) => res.sendStatus(200))

app.get('/protected', CB, (req, res) => res.sendStatus(200))
```