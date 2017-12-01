'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
var stream = require('stream');

// Create a server with a host and port
const server = Hapi.server({ 
    host: '192.168.50.4',
    port: 2101,
    load: { 
        sampleInterval: 1,
        maxEventLoopDelay: 2, 
    } 
});

server.route({
    method: 'GET',
    path: '/',
    handler: function(req, h) {
      return "hello";
    }
});

// Add the route
server.route({
    method: 'POST',
    path:'/get-timeout', 
    handler: function (req, h) {
        const error = Boom.gatewayTimeout();//Boom.badRequest('Cannot feed after midnight');
        //error.output.statusCode = 504;    // Assign a custom error code
        //error.reformat();
        console.log(req.info.remoteAddress, 'gatewayTimeout', req.payload);
        return error;
        //throw error;
    }
});

server.route({
    method: 'POST',
    path:'/get-fail',
    handler: function(req, h){
        const error = Boom.tooManyRequests();
        //error.output.statusCode = 500;
        //error.reformat();
        console.log(req.info.remoteAddress, 'tooManyRequests', req.payload);
        return error;
        //throw error;
    }
});

server.route({
    method: 'POST',
    path:'/slow',
    handler: async function(req,h){

    console.log("start...");
    var channel = new stream.PassThrough;

    var i=0;
    
    var interval = setInterval(function() {
      channel.write("data: abcdef\n\n");
      if (i < 100){
          channel.write("data: abcdef\n\n");
          console.log("write data...");
      } else {
         channel.end();
         console.log("end...");
         clearInterval(interval);
      }
      i++;
      //console.log("write data...");
    }, 1000);

    req.raw.req.on("close", function() {
      console.error("oops listener closed");
      clearInterval(interval);
    });
        
      return channel;
        //return 'pong';
    }
});

server.route({
    method: 'POST',
    path: '/input',
    handler: function (req, h){
       console.log(req.info.remoteAddress, req.query, req.payload);
       var a = "Success, "+JSON.stringify(req.query);
       return a;
    }
});

// Start the server
async function start() {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();
