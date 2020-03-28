var request = require('sync-request');
const fs = require('fs');

fs.readdir('./', (err, files) => {
    files.forEach(file => {
        console.log(file);
        if (file.lastIndexOf(".json") > 0) {
            console.log("processing " + file);
            var obj = JSON.parse(fs.readFileSync(file, 'utf8'));
            sendInterestSync(obj);
        }
    });
});

function sendInterestSync(json) {
    var res = request('POST', 'http://localhost:3000/async', {
        json
    });
    console.log(res.getBody('utf8'));
}