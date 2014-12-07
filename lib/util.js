'use strict';

var Hash = require('./hash.js');

var dumb_kdf = function (input, n_passes) {
    var ctx = Hash.init();
    var hash = new Buffer(32);

    ctx.update(input);
    ctx.finish(hash);

    n_passes--;

    while(n_passes--) {
        ctx.reset();
        ctx.update32(hash);
        ctx.finish(hash);
    }

    return new Buffer(hash);
};

var pbkdf = function (input, salt, iters) {
    if (typeof input === 'string') {
        input = new Buffer(input, 'binary');
    }
    var hash = new Buffer(32),
        key = new Buffer(32),
        pw_pad36 = new Buffer(32),
        pw_pad5C = new Buffer(32);

    var ctx = Hash.init();

    var ins = new Buffer(4);
    ins[0] = 0; ins[1] = 0; ins[2] = 0; ins[3] = 1;

    var k;
    for (k=0; k < 32; k++) {
        pw_pad36[k] = 0x36;
        pw_pad5C[k] = 0x5C;
    }
    for(k=0; k < input.length; k++) {
        pw_pad36[k] ^= input[k];
    }
    k = 0;
    for(k=0; k < input.length; k++) {
        pw_pad5C[k] ^= input[k];
    }

    ctx.update32(pw_pad36);
    ctx.update(salt);
    ctx.update(ins);
    ctx.finish(hash);

    ctx.reset();

    ctx.update32(pw_pad5C);
    ctx.update32(hash);
    ctx.finish(hash);

    iters --;

    for(k = 0; k < 32; k++) {
        key[k] = hash[k];
    }

    while (iters-- > 0)  {
        ctx.reset();
        ctx.update32(pw_pad36);
        ctx.update32(hash);
        ctx.finish(hash);

        ctx.reset();
        ctx.update32(pw_pad5C);
        ctx.update32(hash);
        ctx.finish(hash);

        for(k = 0; k < 32; k++) {
            key[k] ^= hash[k];
        }
    }

    return new Buffer(key);
};

module.exports = {
    dumb_kdf: dumb_kdf,
    pbkdf: pbkdf,
};
