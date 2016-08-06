/* eslint-disable no-console */
'use strict';

process.env.NODE_ENV = 'dev';
const config = require('config');
const AWS = require('aws-sdk');

module.exports = (grunt) => {
    const profile = config.get('aws.profile');
    const iam = new AWS.IAM({
        credentials: new AWS.SharedIniFileCredentials({
            profile
        })
    });

    const region = config.get('aws.region');
    const lambdaName = config.get('aws.name');
    const gruntConfig = {
        mochaTest: {
            all: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            },
            single: {
                options: {
                    reporter: 'spec'
                },
                src: null
            }
        },
        lambda_invoke: {
            default: {
                options: {
                    handler: 'handler',
                    file_name: `${__dirname}/index.js`
                }
            }
        },
        lambda_package: {
            default: {
                dist_folder: 'dist'
            }
        },
        lambda_deploy: {
            default: {
                options: {
                    region,
                    timeout: config.get('aws.timeout'),
                    memory: config.get('aws.memory'),
                    handler: 'index.handler'
                }
            }
        }
    };

    grunt.initConfig(gruntConfig);

    grunt.loadNpmTasks('grunt-aws-lambda');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('deploy', 'Deploys lambda to AWS', function deploy() {
        grunt.task.run('lambda_package:default');
        const done = this.async();
        iam.getUser((err, data) => {
            if (!err) {
                const accountId = data.User.Arn.split(':')[4];
                const lambdaArn = `arn:aws:lambda:${region}:${accountId}:function:${lambdaName}`;
                gruntConfig.lambda_deploy.default.arn = lambdaArn;
                grunt.task.run('lambda_deploy:default');
            }
            done(err);
        });
    });

    grunt.registerTask('run', 'Run event test', (name) => {
        if (name) {
            gruntConfig.lambda_invoke.default.options.event = `${__dirname}/test/events/${name}.json`;
            grunt.task.run('lambda_invoke:default');
        } else {
            console.log('Event name is required');
        }
    });

    grunt.registerTask('aws', 'AWS Account Info', function aws() {
        const done = this.async();
        iam.getUser((err, data) => {
            if (!err) {
                const accountId = data.User.Arn.split(':')[4];
                console.log(`Username: ${data.User.UserName}, AccountId: ${accountId}`);
            }
            done(err);
        });
    });

    grunt.registerTask('test', 'Run mocha test', (name) => {
        if (name) {
            const testPath = `test/**/test_${name}.js`;
            gruntConfig.mochaTest.single.src = [testPath];
            grunt.task.run('mochaTest:single');
        } else {
            grunt.task.run('mochaTest:all');
        }
    });

    grunt.registerTask('default', () => {
        console.log('Grunt Help\n----------');
        console.log('Following commands will use \'dev\' config. ' +
            'If you want to change that set \'NODE_ENV\' property accordingly.\n');
        console.log('run:<name> - run lambda event, event config folder is in test folder');
        console.log('deploy - deploy lambda');
        console.log('test - run all tests');
        console.log('test:<name> - run test that has test_<name> notation in test folder');
    });
};