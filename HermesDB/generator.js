const { v4: uuidv4 } = require('uuid');
const {scryptSync, randomBytes} = require('crypto');
const fs = require('fs');

if (process.argv[2] == '-help' || process.argv[2] == '-?') {
    console.log('-help or -?: Provides you with information about the available parameters.');
    console.log('-flag: you can use it to permissions, you can use R (read), W (write) or B (backup) or a combination of them in any sequence.');
    console.log('-test: gives back the permission of a given apiKey id');
} else if (process.argv[2] == '-flag') {
    if (process.argv[3] !== undefined) {
        const apiKey = uuidv4();

        console.log(apiKey);

        const salt = randomBytes(16).toString('hex');
        const hashedPassword = scryptSync(apiKey, salt, 64).toString('hex');  
        
        fs.readFile('./keys.json', (err, data) => {
            if (err) {
                console.log('ERROR: ' + err);
            } else {
                let apiDB = JSON.parse(data.toString());

                let id = apiDB.length;

                apiDB.push({id: id, key: `${salt}:${hashedPassword}`, permissions: process.argv[3], expirationDate: Date.now() + 365.25 * 24 * 60 * 60, enabled: true});

                fs.writeFileSync('./keys.json', JSON.stringify(apiDB, null, 3));
            }
        })
    } else {
        console.log('A parameter is required to use this program or you are missing parameter information. Please try again with a valid parameter.');
    }
} else if (process.argv[2] == '-test') {
    fs.readFile('./keys.json', (err, data) => {
        if (err) {
            console.log('ERROR: ' + err);
        } else {
            let keys = JSON.parse(data.toString());
            let apiKey = keys.find(v => v.id === process.argv[3]);
            console.log('API KEY:');
            console.log(apiKey);
        }
    })
} else if (process.argv[2] !== undefined) {
    console.log('Parameter ' + process.argv[2] + ' does not exist');
} else {
    console.log('A parameter is required to use this program or you are missing parameter information. Please try again with a valid parameter.');
}