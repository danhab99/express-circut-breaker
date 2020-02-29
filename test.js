var assert = require('assert')
const request = require('supertest')
var breaker = require('./index')

describe('express-circuit-breaker', function() {
  var app = require('express')()
  var forceReset = false

  app.get('/unprotected', (req, res) => res.sendStatus(200))

  app.get('/reset', (req, res) => {
    forceReset = true
    res.sendStatus(200)
  })

  var CB = breaker({
    catchError: e => 'trip',
    handleBlockedRequest: (req, res) => {
      if (forceReset) {
        req.resetBreaker()
        res.sendStatus(200)
      }
      else {
        res.sendStatus(500)
      }
    }
  })

  app.get('/protected', CB, (req, res) => {
    res.sendStatus(200)
  })

  app.get('/protected/crash', CB, (req, res) => {
    throw 1
  })

  it('can hit an endpoint', function() {
    request(app)
      .get('/unprotected')
      .expect(200)
      .end((err, res) => {
        assert.ok(res)
      })
  })

  it('can hit a protected endpoint', function() {
    request(app)
      .get('/protected')
      .expect(200)
      .end((err, res) => {
        assert.ok(res)
      })
  })

  it('can trip the circuit breaker', function() {
    request(app)
      .get('/protected/crash')
      .expect(500)
      .end((err, res) => {
        assert.ok(res)
      })
  })

  it('will be stopped by a tripped circuit breaker', function() {
    request(app)
      .get('/protected')
      .expect(500)
      .end((err, res) => {
        assert.ok(res)
      })
  })

  it('will reset the circuit breaker', function() {
    request(app)
      .get('/reset')
      .expect(200)
      .end((err, res) => {
        assert.ok(res)
      })
  })

  it('can hit a protected endpoint again', function() {
    request(app)
      .get('/protected')
      .expect(200)
      .end((err, res) => {
        assert.ok(res)
      })
  })
})