var CronJob = require('cron').CronJob;
var exec = require('child_process').exec;
var log4js = require('log4js');
var logger = log4js.getLogger('CRON');
logger.setLevel('INFO');

logger.info('CRON Scheduler initialized');

//Runs the api-request to prep the decision tree algorithm Tue - Fri (2-5) [every day (0-6)] at 8:45PM (LA Time)
var arJob = new CronJob('00 45 20 * * 2-5', function() {

        var child = exec('node api-request.js', {maxBuffer: 1024 * 500}, function(error, stdout, stderr) {
            logger.info('STDOUT: ' + stdout);

            if (stderr) {
                logger.error('STDERR: ' + stderr);
            }

            if (error) {
                logger.error('EXEC ERROR: ' + error);
            }
        });

    }, function() {
        /* This function is executed when the job stops */
        logger.info('API Request Job has Stopped');
    },
    true,
    'America/Los_Angeles'
);

//Runs the decision-tree algorithm  Tue - Fri (2-5) [every day (0-6)] at 9:15PM (LA Time)
var dtJob = new CronJob('00 15 21 * * 2-5', function() {

        var child = exec('node decision-tree.js', {maxBuffer: 1024 * 500}, function(error, stdout, stderr) {
            logger.info('STDOUT: ' + stdout);

            if (stderr) {
                logger.error('STDERR: ' + stderr);
            }

            if (error) {
                logger.error('EXEC ERROR: ' + error);
            }
        });

    }, function() {
        /* This function is executed when the job stops */
        logger.info('Decision Tree Job has Stopped');
    },
    true,
    'America/Los_Angeles'
);
