const Twitter = require('twitter');
const events = require('events');
const emitter = new events.EventEmitter();

module.exports = function bot(config, action, params, callback) {
    const T = new Twitter(config);
    var result = {};
    var tweetNum = 0;

    T.get('search/tweets', params, (err, data, response) => {
        const tweetsId = data.statuses
        .map(tweet => ({ id: tweet.id_str }));

        const tweetstatuses = data.statuses
        .map(tweetstatus => ({ status: tweetstatus.text }));

        if(action == 'retweet'){
            tweetsId.map(tweetId => {
                T.post('statuses/retweet', tweetId, (err, response) => {
                    tweetNum += 1;
                    if(err){
                        emitter.emit(action+'fail');
                        result[`tweet${tweetNum}`] = JSON.parse(`{ "tweetID": "${tweetId.id}", "action": "${action}", "status": "${err[0].message}" }`);
                    }
                    else{
                        emitter.emit(action);
                        const username = response.user.screen_name;
                        const retwittedTweetId = response.id_str;
                        result[`tweet${tweetNum}`] = JSON.parse(`{ "tweetID": "${tweetId.id}", "action": "${action}", "status": "Success", "actor_user": "${username}", "retweetID":"${retwittedTweetId}" }`);
                    }
                });
              });
        }
        else if(action == 'favorite' || action == 'favourite'){
            tweetsId.map(tweetId => {
                T.post('favorites/create', tweetId, (err, response) => {
                    tweetNum += 1;
                    if(err){
                        emitter.emit(action+'fail');
                        result[`tweet${tweetNum}`] = JSON.parse(`{ "tweetID": "${tweetId.id}", "action": "${action}", "status": "${err[0].message}" }`);
                    }
                    else{
                        emitter.emit(action);
                        const username = response.user.screen_name;
                        const favoritedTweetId = response.id_str;
                        result[`tweet${tweetNum}`] = JSON.parse(`{ "tweetID": "${tweetId.id}", "action": "${action}", "status": "Success", "actor_user": "${username}", "favouritedtweetID":"${favoritedTweetId}" }`);
                    }
                });
              });
        }
        else if(action == 'follow'){
                // const popularUsers = data.statuses.filter(user => {
                // return user.followers_count > 1000;
                // });

                // Loop through the returned tweets
                for(let i = 0; i < data.statuses.length; i++){
                    tweetNum += 1;
                // Get the screen_name from the returned data
                // let screen_name = popularUsers[i].user.screen_name;
                let screen_name = data.statuses[i].user.screen_name; //will follow all users, with no filter/discrimination within them
                // THE FOLLOWING MAGIC GOES HERE
                T.post('friendships/create', {screen_name}, function(err, response){
                  if(err){
                    emitter.emit(action+'fail');
                    result[`tweet${tweetNum}`] = JSON.parse(`{ "tweetID": "${data.statuses[i].id_str}", "action": "${action}", "status": "${err[0].message}", "actor_user": "", "followedUser":"" }`);
                  } else {
                    emitter.emit(action);
                    result[`tweet${tweetNum}`] = JSON.parse(`{ "tweetID": "${data.statuses[i].id_str}", "action": "${action}", "status": "Success", "actor_user": "${response.screen_name}", "followedUser":"${screen_name}" }`);
                  }
                });
              };
        }
        else if(action == 'tweet'){

            // Loop n times where n stands for the number of times you want to repeat the same tweet
            for(let i = 0; i < params.count; i++){
                tweetNum += 1;
                let tweetStatus = {
                    "status": ""
                };
                tweetStatus.status = params.q + ` ${i}`;
                // THE BULK-TWEET MAGIC GOES HERE
                T.post('statuses/update', tweetStatus, function(err, response){
                if(err){
                    emitter.emit(action+'fail');
                    result[`tweet${tweetNum}`] = JSON.parse(`{ "action": "${action}", "status": "Failed", "actor_user": "", "tweetText":"${tweetStatus}" }`);
                } else {
                    emitter.emit(action);
                    result[`tweet${tweetNum}`] = JSON.parse(`{ "tweetID": "${response.id_str}", "action": "${action}", "status": "Success", "actor_user": "${response.screen_name}", "tweetText":"${tweetStatus}" }`);
                }
            });
          };
        }
        else if(action == 'copytweet'){
            tweetstatuses.map(tweet => {
                T.post('statuses/update', tweet, (err, response) => {
                    tweetNum += 1;
                    if(err){
                        emitter.emit(action+'fail');
                        result[`tweet${tweetNum}`] = JSON.parse(`{ "action": "${action}", "status": "${err[0].message}" }`);
                    }
                    else{
                        emitter.emit(action);
                        const username = response.user.screen_name;
                        const retwittedTweetId = response.id_str;
                        result[`tweet${tweetNum}`] = JSON.parse(`{ "action": "${action}", "status": "Success" }`);
                    }
                });
            })
        }
        else{
            emitter.emit('notsupported');
            return new Error(`Specified action not supported!`);
        }
        if(tweetNum == tweetsId.length){
            callback(result);
        }
    });
}