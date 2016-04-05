var CronJob = require('cron').CronJob;
var exec = require('child_process').exec;


//Runs every day (0-6) at 11:30PM
var timeZone = 'America/Los_Angeles';
var range = '00 30 23 * * 0-6';

var job = new CronJob('* * * * * *', function() {

        var child = exec('node test.js',
            function(error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    console.log('exec error: ' + error);
                }
            });

    }, function() {
        /* This function is executed when the job stops */
        console.log('CRON STOP');
    },
    true,
    timeZone
);
