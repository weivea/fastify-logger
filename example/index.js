const path = require('path')

const logOpt = {
    file: path.join(__dirname, 'logs/fastify.log')
}

const { opt, hook } = require('../lib/logger')(logOpt);
const fastify = require('fastify')({
    logger: opt
})

hook(fastify);
// Declare a route

fastify.get('/', function (request, reply) {
    request.log.info('123412342234', 'wwwwwwwwwwwww', { as: 23 })
    request.log.warn('123412342234', 'warn', { as: 23 })
    reply.send({ hello: 'world' })
})
// Run the server!
fastify.listen(3000, '0.0.0.0', function (err) {
    if (err) throw err
    console.log(
        `server listening on http://${fastify.server.address().address}:${
        fastify.server.address().port
        }`
    )
})