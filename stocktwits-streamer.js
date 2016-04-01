var http = require('http');
var request = require('request');

var requestLoop = setInterval(function(){
  request({
      url: "https://api.stocktwits.com/api/2/streams/all.json?access_token=ccb597316f73655b16a105e9006330bd37272b81",
      method: "GET",
      timeout: 10000,
      followRedirect: true,
      maxRedirects: 10
  },function(error, response, body){
      if(!error && response.statusCode == 200){
          console.log('sucess!');
          console.log(response.body);
      }else{
          console.log('error' + response.statusCode);
      }
  });
}, 10000);


requestLoop;
