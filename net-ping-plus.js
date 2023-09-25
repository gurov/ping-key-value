/*
    Extend functionality of the net-ping library
*/

const ping = require ("net-ping");
const raw = require ("raw-socket");


const run = () => {

  
    ping.Session.prototype.pingHost = function (target, key, payload, callback) {
        var id = key || this._generateId ();
        if (! id) {
            callback (new Error ("Too many requests outstanding"), target);
            return this;
        }
    
        var req = {
            id: id,
            retries: this.retries,
            timeout: this.timeout,
            callback: callback,
            target: target
        };
    
        this.reqQueue (req, payload);
    
        return this;
    };
    
    ping.Session.prototype.reqQueue = function (req, payload) {
        req.buffer = this.toBuffer (req, payload);
    
        if (this._debug)
            this._debugRequest (req.target, req);
    
        this.reqs[req.id] = req;
        this.reqsPending++;
        this.send (req);
        
        return this;
    }
    
    ping.Session.prototype.toBuffer = function (req, payload) {
        
        var buffer = Buffer.alloc(8 + payload.length);
        
        var type = this.addressFamily == raw.AddressFamily.IPv6 ? 128 : 8;
    
        buffer.writeUInt8 (type, 0);
        buffer.writeUInt8 (0, 1);
        buffer.writeUInt16BE (0, 2);
        buffer.writeUInt16BE (this.sessionId, 4);
        buffer.writeUInt16BE (req.id, 6);
    
        // Вставляем payload в буфер с использованием Buffer.from
        Buffer.from(payload).copy(buffer, 8);
    
        raw.writeChecksum (buffer, 2, raw.createChecksum (buffer));
    
        return buffer;
    };
    
    ping.Session.prototype.onSocketMessage = function (buffer, source) {
        if (this._debug)
            this._debugResponse (source, buffer);
    
        var req = this.fromBuffer (buffer);
        if (req) {
            /**
             ** If we ping'd ourself (i.e. 127.0.0.1 or ::1) then it is likely we
             ** will receive the echo request in addition to any corresponding echo
             ** responses.  We discard the request packets here so that we don't
             ** delete the request from the from the request queue since we haven't
             ** actually received a response yet.
             **/
            if (this.addressFamily == raw.AddressFamily.IPv6) {
                if (req.type == 128)
                    return;
            } else {
                if (req.type == 8)
                    return;
            }
            
            this.reqRemove (req.id);
            
            if (this.addressFamily == raw.AddressFamily.IPv6) {
                if (req.type == 1) {
                    req.callback (new DestinationUnreachableError (source), req.target,
                            req.sent, new Date ());
                } else if (req.type == 2) {
                    req.callback (new PacketTooBigError (source), req.target,
                            req.sent, new Date ());
                } else if (req.type == 3) {
                    req.callback (new TimeExceededError (source), req.target,
                            req.sent, new Date ());
                } else if (req.type == 4) {
                    req.callback (new ParameterProblemError (source), req.target,
                            req.sent, new Date ());
                } else if (req.type == 129) {
                    req.callback (null, req.target,
                            req.sent, new Date ());
                } else {
                    req.callback (new Error ("Unknown response type '" + req.type
                            + "' (source=" + source + ")"), req.target,
                            req.sent, new Date ());
                }
            } else {
                if (req.type == 0) {
                    
                    console.log('!req', req.id, req.buffer.slice(8).toString ());
                    req.callback (null, req.target,
                            req.sent, new Date (), req.id, req.buffer.slice(8).toString());
                } else if (req.type == 3) {
                    req.callback (new DestinationUnreachableError (source), req.target,
                            req.sent, new Date ());
                } else if (req.type == 4) {
                    req.callback (new SourceQuenchError (source), req.target,
                            req.sent, new Date ());
                } else if (req.type == 5) {
                    req.callback (new RedirectReceivedError (source), req.target,
                            req.sent, new Date ());
                } else if (req.type == 11) {
                    req.callback (new TimeExceededError (source), req.target,
                            req.sent, new Date ());
                } else {
                    req.callback (new Error ("Unknown response type '" + req.type
                            + "' (source=" + source + ")"), req.target,
                            req.sent, new Date ());
                }
            }
        }
    };
    


};

module.exports = {
    run,
};

