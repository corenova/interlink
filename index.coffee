kos = require 'kos'
co = require 'co'

handler = co.wrap (i, o, opts) ->
  { ts, f } = opts
  kos.push yield Promise.resolve(o)
  ts.d = new Date

execute = ->
    ts.i = new Date
    i = intercept(arguments)
    o = x.apply i
    ts.o = new Date
  
        process.nextTick -> handler i, o, { ts: ts, f: x }

# figure out serverless
intercept = -> switch
  when arguments.length is 3 and typeof arguments[2] is 'function'
    # AWS lambda
  when 

interlink = (m) ->
  Object.defineProperty m, 'exports',
    set: @consume, get: @provide
    
interlink.consume = (f) ->
  @_ = new Date
  @f = f

interlink.provide = ->
  return @f unless typeof @f is 'function'
  execute.bind(this)

module.exports = interlink['default'] = interlink
