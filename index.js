
module.exports = (opts) => {
  var tripped = false
  var handle = true

  let keys = Object.keys(opts)
  let has = x => keys.includes(x)

  if (!has('catchError')) {
    throw new Error('Requires catchError')
  }

  if (has('handleLater') && !opts.handleLater) {
    handle = false
  }

  if (has('handleLater') && opts.handleLater && !has('handleBlockedRequest')) {
    throw new Error('Requires handleBlockedRequest')
  }

  return (req, res, next) => {
    try {
      if (!tripped || opts.handleLater) {
        req.breakerTripped = tripped
        next()
      }
      else {
        if (handle) {
          req.resetBreaker = () => tripped = false
          opts.handleBlockedRequest(req, res, next)
        }
      }
    }
    catch (e) {
      Promise.resolve(opts.catchError(e)).then(act => {
        if (typeof(act) != 'string') {
          throw new Error('catchError must resolve/return a string')
        }
  
        if (act == 'trip') {
          tripped = true
          return
        }

        if (act == 'reset') {
          tripped = false
          return
        }
      })
    }
  }
}
