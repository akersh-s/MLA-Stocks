var CronJob = require('cron').CronJob;
var exec = require('child_process').exec;

//Runs the api-request to prep the decision tree algorithm every day (0-6) at 11:45PM (LA Time)
var arJob = new CronJob('00 45 23 * * 0-6', function() {

        var child = exec('node api-request.js', function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);

            if (stderr !== null) {
                console.log('stderr: ' + stderr);
            }

            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });

    }, function() {
        /* This function is executed when the job stops */
        console.log('CRON STOP API REQUEST');
    },
    true,
    'America/Los_Angeles'
);

//Runs the decision-tree algorithm every day (0-6) at 11:59PM (LA Time)
var dtJob = new CronJob('00 59 23 * * 0-6', function() {

        var child = exec('node decision-tree.js', function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);

            if (stderr !== null) {
                console.log('stderr: ' + stderr);
            }

            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });

    }, function() {
        /* This function is executed when the job stops */
        console.log('CRON STOP DECISION TREE');
    },
    true,
    'America/Los_Angeles'
);
