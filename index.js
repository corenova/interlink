'use strict';

const INTERLINK_URL = process.env.INTERLINK_URL || 'ws://interlink.io'
const INTERLINK_KEY = process.env.INTERLINK_KEY

const InterLinkFlow  = require('./flows/interlink')

//
// expose interlink
//
module.exports = interlink['default'] = interlink.interlink = interlink

//
// interlink.io()
// --------------
// wraps module.exports and dynamically applies interlink() to assigned function(s)
//
// supports first-level module.exports function assignments:
//
// module.exports = function() {} (OK)
// module.exports.hello = function() {} (OK)
// module.exports.hello.world = function() {} (IGNORE)
//
interlink.io = function(m, opts={}) {
  var me = m.exports;
  Object.defineProperty m, 'exports', {
	set: (obj) => { me = obj; },
    get: () => { 
	  if (typeof me !== 'object') return interlink(me, opts)
	  var o = {}
	  for (k in me) { o[k] = interlink(me[k], opts) }
	  return o
	}
  }
  return interlink
}

function interlink(fn, opts={}) {
  if (typeof fn !== 'function' || fn.kinetic instanceof kos) return fn

  opts.url = opts.url || INTERLINK_URL
  opts.key = opts.key || INTERLINK_KEY

  // setup the kinetic object stream state machine
  // 
  // refer to main README for more information
  let flow = new InterLinkFlow

  // return a new function wrapping original fn
  // when the new function is called, it will initiate the kinetic dataflow
  wrapper = => {
	flow
	  .feed('function', fn)
	  .feed('caller', this)
	  .feed('serverless', arguments)
	  .feed('interlink', opts)
  }
  wrapper.flow = flow
  return wrapper
}
