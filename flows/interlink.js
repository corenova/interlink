const kos = require('kos')

const ServerLessFlow = require('./serverless')

module.exports = kos.flow
  .label('kos-interlink')
  .use('kos-flow-mqtt')
  .use('kos-flow-http')
  .use(ServerLessFlow)
  .in('interlink').out('mqtt/connect').bind(connect)
  .in('serverless/presence').out('mqtt/subscribe','mqtt/message').bind()
  .in('serverless/return').out('mqtt/message').bind()
  .in('ping').out('serverless/ping').bind()

function connect({ value }) {
  let { url, key } = value
  this.send('mqtt/connect', value)
}

