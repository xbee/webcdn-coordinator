/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var WebSocketServer = require('websocket').server;
var http = require('http');


/**
 * Expose `Messenger`.
 */

module.exports = Messenger;

/**
 * Initialize `Messenger
 * @api private
 */
var Messenger = function() {
    this.sockets = {};
    this.name = '';

    this.sock_unix = null; // my listening socket
    this.sock_tcp = null;
};

/**
 * @api private
 */

Messenger.prototype.__proto__ = EventEmitter.prototype;

/**
 * @api private
 */

Messenger.prototype.loadConfig = function(name, config) {
    if (!name) throw new Error("Messenger name must be set.");
    //  var oldUmask = process.umask(0000);
    this.name = name;
    var self = this;
    for (var i = 0; i < config.length; i++) {
        var m = config[i];
        self.initSocket(m);
        /*
        if (m.name == name) { // config myself
            var onconnect = function(sock) {
                self.initSocket(sock);
                var buf = self.encodeMsg(self.name);
                self._send(sock, buf);
            };
            this.sock_unix = Net.createServer(onconnect);
            this.sock_tcp = Net.createServer(onconnect);
            this.sock_unix.listen(m.path);
            this.sock_tcp.listen(m.port);
            break;
        } else {
            this.connectServer(m);
        }
        */
    }
};

/**
 * @api private
 */

Messenger.prototype.connectServer = function(server) {};

/**
 * @api private
 */

Messenger.prototype.initSocket = function(sock) {
    if (sock) {
        var self = this;
        var server = http.createServer(function(request, response) {});
        server.listen(sock.port, function() {
            console.log((new Date()) + " server is listening on port " + sock.port);
        });
        var wsServer = new WebSocketServer({
            httpServer: server
        });

        self.wsServer = wsServer;

        // This callback function is called every time someone
        // tries to connect to the WebSocket server
        wsServer.on('request', function(request) {
            console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
            var connection = request.accept(null, request.origin);

            var peer_id = "";
            if (request.resourceURL && request.resourceURL.query && request.resourceURL.query.id) {
                peer_id = request.resourceURL.query.id;
            }

            self.sockets[peer_id] = connection;

            connection.on('message', function(message) {
                connection.peerid = peer_id;
                self.onmessage(connection, message);
            });

            connection.on('close', function(reasonCode, description) {
                // close user connection
                console.log((new Date()) + " Peer disconnected.");
                var connectionDeleted = false;
                for (var key in self.sockets) {
                    if (self.sockets[key] === connection) {
                        delete self.sockets[key];
                        connectionDeleted = true;
                    }
                }
                if (!connectionDeleted) {
                    console.log("Delete disconnected peer fail");
                }
                console.log("connected peers: ", Object.keys(self.sockets).length);
                self.onclose(connection, reasonCode, description);
            });

            connection.on("error", function(error) {
                console.log("connection.error: ", error);
                //self.onerror(connection, error);
            });

        });
    }
};

/**
 * @api private
 */

Messenger.prototype.onerror = function(sender, error) {
    this.emit("error", sender, error);
};

/**
 * @api private
 */

Messenger.prototype.onclose = function(sender, reasonCode, description) {
    this.emit("close", sender, reasonCode, description);
};

/**
 * @api private
 */

Messenger.prototype.ondata = function(sender, data) {};

/**
 * @api private
 */

Messenger.prototype.onmessage = function(sender, message) {
    if (message.type === 'utf8') {
        // process WebSocket message
        this.emit("message", sender, message);
    }
};

/**
 * @api private
 */

Messenger.prototype._readbuf = function(data, dataptr, buff, ptr) {};

/**
 * @api private
 */

Messenger.prototype._readmsg = function(sender, msg) {};

/**
 * @api private
 */

Messenger.prototype.encodeMsg = function(msg) {};

/**
 * @api private
 */

Messenger.prototype._send = function(sock, buf) {};

/**
 * @api private
 */

Messenger.prototype.broadcast = function(msg) {};

/**
 * @api private
 */

Messenger.prototype.send = function(peerid, msg) {
    var sock = this.sockets[peerid];
    if (sock) {
        sock.send(JSON.stringify(msg));
    }
};

Messenger.prototype.clear = function() {
    for (var key in this.sockets) {
        delete this.sockets[key];
    }
};

module.exports = Messenger;