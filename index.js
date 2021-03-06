const mqemitter = require('mqemitter-redis')
const mongoPersistence = require('aedes-persistence-mongodb')

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1/aedes-clusters'
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = '6379'

const port = process.env.PORT || 1883

const aedes = require('aedes')({
  id: 'BROKER_' + process.env.HOSTNAME,
  mq: mqemitter({
    port: REDIS_PORT,
    host: REDIS_HOST,
    db: 4
  }),
  persistence: mongoPersistence({
    url: MONGO_URL,
    // Optional ttl settings
    ttl: {
      packets: 300, // Number of seconds
      subscriptions: 300
    }
  })
})

const server = require('net').createServer(aedes.handle)

server.listen(port, function () {
  console.log('Aedes listening on port:', port)
  aedes.publish({ topic: 'aedes/hello', payload: "I'm broker " + aedes.id })
})

aedes.on('subscribe', function (subscriptions, client) {
  console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
          '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', aedes.id)
})

aedes.on('unsubscribe', function (subscriptions, client) {
  console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
          '\x1b[0m unsubscribed to topics: ' + subscriptions.join('\n'), 'from broker', aedes.id)
})

// fired when a client connects
aedes.on('client', function (client) {
  console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
})

// fired when a client disconnects
aedes.on('clientDisconnect', function (client) {
  console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
})

// fired when a message is published
aedes.on('publish', async function (packet, client) {
  console.log('Client \x1b[31m' + (client ? client.id : aedes.id) + '\x1b[0m has published', packet.payload.toString(), 'on', packet.topic, 'to broker', aedes.id)
})
