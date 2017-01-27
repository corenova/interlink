# interlink

Build borderless dataflow pipelines across IoT and serverless
infrastructures.


```javascript
require('interlink').io(module)

// define AWS Lambda as usual (or Azure, Google, etc.)
module.exports = (event, context, callback) => {
  // your code
}
```

And... that's it. *After* your function gets executed, it will message
`interlink.io` with it's presence data along with the response so that
you can create additional triggers to drive the end-to-end workflow.

It also runs in the background (for as long as the module is
running). This allows you to do interesting things *beyond* the intent
of the primary function.




## Advanced Flows

```javascript
let flow = module.exports.flow
flow
  .io('some/topic','some/new/topic')
  .bind((obj, next) => {
    this.push
    next()
  })
  .io('some/new/topic','some/other/topic')
  .bind((obj) => {

	cb(null,obj)
  })
  .out(flow)
```
