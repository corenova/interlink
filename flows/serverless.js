//
// use kinetic object stream (http://github.com/corenova/kos)
//
const kos = require('kos')
const FunctionFlow = require('kos/flows/function')

module.exports = kos.flow
  .label('kos-serverless')
  .use(FunctionFlow)
  .in('serverless').out('env/aws-lambda','serverless/event').bind(detectAwsLambda)
  .in('serverless').out('env/azure-func','serverless/event').bind(detectAzureFunc)
  .in('serverless').out('env/gce-cloudf','serverless/event').bind(detectGceCloudF)

  .in('serverless/event').require('env/aws-lambda')
  .out('arguments','serverless/return')
  .bind(invokeAwsLambda)

  .in('serverless/event').require('env/azure-func')
  .out('arguments','serverless/return')
  .bind(invokeAzureFunc)

  .in('serverless/event').require('env/gce-cloud')
  .out('arguments','serverless/return')
  .bind(invokeGceCloudF)

  .in('serverless/ping','env/aws-lambda')
  .out('serverless/presence')
  .bind(notifyAwsLambda)

  .in('serverless/ping','env/azure-func')
  .out('serverless/presence')
  .bind(notifyAzureFunc)

  .in('serverless/ping','env/gce-cloudf')
  .out('serverless/presence')
  .bind(notifyGceCloudF)

// AWS Lambda
function detectAwsLambda({ value }) {
  let args = value
  if (args.length >= 3 && 
      typeof args[2] === 'function' && 
      typeof args[1].invokedFunctionArn === 'string') {
	this.send('env/aws-lambda', args)
    this.send('event', args[0])
  }
}

function invokeAwsLambda({ value }) {
  let [ event, ctx, callback ] = this.pull('env/aws-lambda')
  let self = this
  let wrapper = function (err, res) {
    callback.call(this, err, res) // call original callback
    if (err) self.throw(err)
    else self.send('serverless/return', res)
  }
  if (event !== value) event = value
  this.send('arguments', [ event, ctx, wrapper ])
}

function notifyAwsLambda({ value }) {
  let env = this.pull('env/aws-lambda')
  this.send('serverless/presence', {
	platform: 'aws-lambda',
	id: env.invokedFunctionArn,
	name: env.functionName,
	window: env.getRemainingTimeInMilis(),
	requestor: env.awsRequestID
  })
}

// Azure Functions
function detectAzureFunc({ value }) {
  let args = value
  if (args.length >= 1 && typeof args[0].done === 'function') {
	this.send('env/azure-func', args)
	return true
  }
}

function invokeAzureFunc({ value }) {
  let [ context ] = this.pull('env/azure-func')
  let { done } = context
  let self = this
  let wrapper = function (err, res) {
    done.call(this, err, res) // call original callback
    if (err) self.throw(err)
    else self.send('serverless/return', res)
  }
  let event = Object.assign({}, context)
  event.done = wrapper
  this.send('arguments', [ event ])
}

function notifyAzureFunc() { 
  // TBD 
}

// Google Cloud Functions
function detectGceCloudF() {
  // TBD
}

function invokeGceCloudF() {
  // TBD
}

function notifyGceCloudF() {
  // TBD
}
