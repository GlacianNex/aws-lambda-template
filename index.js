'use strict';

const setNodeEnv = (arn) => {
    let env = !arn ? 'dev' : arn;
    env = ['prod', 'dev'].indexOf(env) > -1 ? env : 'staging';
    process.env.NODE_ENV = env;
};

const initLogger = (logConfig) => {
    const winston = require('winston');
    if (logConfig.loggly && !winston.transports.Loggly) {
        require('winston-loggly');
        winston.add(winston.transports.Loggly, logConfig.loggly);
    }

    winston.level = logConfig.level;
};

exports.handler = (event, context, callback) => {
    setNodeEnv(event.context.stage);

    const config = require('config');
    initLogger(config.get('log'));


    // Start you code here //

    callback(null, '<<Output Goes Here>>');
};