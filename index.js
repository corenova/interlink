'use strict';

const INTERLINK = process.env.INTERLINK || 'ws://interlink.io'

//
// use kinetic object stream (http://github.com/corenova/kos)
//
var kos = require('kos')

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

  // setup the kinetic object stream state machine
  // 
  // refer to main README for more information
  var kinetic = kos(opts.url || INTERLINK, opts)
  kinetic
    .in('trigger').out('trigger/aws-lambda','trigger/azure-func','trigger/gce-cloudf').bind(detect)
    .in('action','event','trigger/aws-lambda').out('request','response','error').bind(AwsLambda.invoke)
    .in('action','event','trigger/azure-func').out('request','response','error').bind(AzureFunc.invoke)
    .in('action','event','trigger/gce-cloudf').out('request','response','error').bind(GceCloudF.invoke)
    .in('ping','trigger/aws-lambda').out('presence').bind(AwsLambda.notify)
    .in('ping','trigger/azure-func').out('presence').bind(AzureFunc.notify)
    .in('ping','trigger/gce-cloudf').out('presence').bind(GceCloudF.notify)
    .provide('presence')

  // return a new function wrapping original fn
  // when the new function is called, it will initiate the kinetic dataflow
  wrapper = => {
	kinetic
	  .feed('action', fn.bind(this))
	  .feed('trigger', arguments)
  }
  wrapper.kinetic = kinetic
  return wrapper
}

// Detect serverless environment
function detect(key, val) {
  if (AwsLambda.detect.call(this, key, val)) return
  if (AzureFunc.detect.call(this, key, val)) return
  if (GceCloudF.detect.call(this, key, val)) return
}

// Common utility for wrapping callback functions
function wrapCallback(callback) {
  if (typeof this.push !== 'function')
	throw new Error('cannot wrap callback outside scope of KineticFlow handler')

  let ctx = this
  return (err, res) => {
	callback.apply(this, arguments)
	if (!err) ctx.push('response', res)
	else ctx.push('error', err)
  }
}

//
// 

const AwsLambda = {
  detect: (key, val) => {
	if (val.length >= 3 && typeof val[2] === 'function' && typeof val[1].invokedFunctionArn === 'string') {
	  this.push('trigger/aws-lambda', val)
	  return true
	}
  },
  invoke: (key, val) => {
	if (key === 'action' || !this.has('action','trigger/aws-lambda')) return
	let func = this.get('action')
	let args = this.get('trigger/aws-lambda')
	if (key === 'event') args[0] = val
	else args[2] = wrapCallback.call(this, args[2])
	func.apply(null, args) // execute the intended function
	this.push('request', args[0])
  },
  notify: (key, val) => {
	if (!this.has('trigger/aws-lambda')) return
	let [ event, context ] = this.get('trigger/aws-lambda')
	this.push('presence', {
	  platform: 'aws-lambda',
	  id: context.invokedFunctionArn,
	  name: context.functionName,
	  window: context.getRemainingTimeInMilis(),
	  requestor: context.awsRequestID
	})
  }
}

const AzureFunc = {
  detect: (key, val) => {
	if (val.length >= 1 && typeof val[0].done === 'function') {
	  this.push('trigger/azure-func', val)
	  return true
	}
  },
  invoke: (key, val) => {
	if (key === 'action' || !this.has('action','trigger/azure-func')) return
	let func = this.get('action')
	let args = this.get('trigger/azure-func')
	let [ context ] = args
	context.done = wrapCallback.call(this, context.done)
	func.apply(null, args) // execute the intended function
	this.push('request', context.bindings)
  },
  notify: (key, val) => {
	// TBD
  }
}

const GceCloudF = {
  detect: (args) => { 
	return false // TBD
  },
  invoke: (key, val) => {
	// TBD
  },
  notify: (key, val) => {
	// TBD
  }
}
