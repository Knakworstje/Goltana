const PORT = process.env.PORT || 5999;

const fs = require('fs');
const express = require('express');
const app = express();
const cors = require('cors');
const { scryptSync, timingSafeEqual } = require('crypto');

app.use(express.json());
app.use(cors({
    origin: '*', // Toestaan voor alle origin (gebruik in ontwikkeling)
}));

const backupInterval = 0.01; //Backup interval in hours

class HermesDB {
  constructor() {
    this.db = new Map();  // In-memory store
    this.loadBackup();     // Load backup on startup
    this.startBackupProcess();
  }

  // Load the backup file into memory
  loadBackup() {
    const backupFile = './backup.json';
    if (fs.existsSync(backupFile)) {
      const backupData = fs.readFileSync(backupFile);
      this.db = new Map(Object.entries(JSON.parse(backupData)));
      console.log("Backup loaded.");
    } else {
      console.log("No backup found, starting fresh.");
    }
  }

  // Save the in-memory data to a backup file every 24 hours
  startBackupProcess() {
    setInterval(() => {
      this.backupData();
    }, backupInterval * 60 * 60 * 1000);
  }

  // Backup data to a file
  backupData() {
    const backupFile = './backup.json';
    const dataToBackup = JSON.stringify(Object.fromEntries(this.db), null, 2);
    fs.writeFileSync(backupFile, dataToBackup);
    console.log("Data backed up.");
  }

  // Add or update a key-value pair
  set(key, value) {
    if (value !== null && value !== undefined && value !== "") {
        this.db.set(key, value);
    }
  }

  // Get a value by key
  get(key) {
    return this.db.get(key);
  }

  // Delete a key-value pair
  delete(key) {
    this.db.delete(key);
  }

  // Get all data
  getAll() {
    return Object.fromEntries(this.db);
  }
}

const myDB = new HermesDB();

app.get('/getAll/:id/:apiKey', (req, res) => {
    if (req.params.id !== undefined && req.params.apiKey !== undefined) {
        fs.readFile('./keys.json', (err, data) => {
            if (err) {
                console.log('ERROR: ' + err);
            } else {
                let keys = JSON.parse(data.toString());

                let apiKey = keys.find(v => v.id === Number(req.params.id));

                const [salt, key] = apiKey.key.split(':');
                const hashedBuffer = scryptSync(req.params.apiKey, salt, 64);
                
                const keyBuffer = Buffer.from(key, 'hex');
                const match = timingSafeEqual(hashedBuffer, keyBuffer);

                if (match) {
                    if (apiKey.enabled) {
                        if (apiKey.expirationDate < Date.now()) {
                            if (apiKey.permissions[0] === 'R' || apiKey.permissions[1] === 'R' || apiKey.permissions[2] === 'R') {
                                res.send(Object.fromEntries(myDB.db));
                            } else {
                                res.sendStatus(403);
                            }
                        } else {
                            res.sendStatus(403);
                        }
                    } else {
                        res.sendStatus(403);
                    }
                } else {
                    res.sendStatus(403);
                }
            }
        })
    }
})

app.get('/getAllFromTime/:timestamp/:id/:apiKey', (req, res) => {
    if (req.params.id !== undefined && req.params.apiKey !== undefined && req.params.timestamp !== undefined) {
        fs.readFile('./keys.json', (err, data) => {
            if (err) {
                console.log('ERROR: ' + err);
            } else {
                let keys = JSON.parse(data.toString());

                let apiKey = keys.find(v => v.id === Number(req.params.id));

                const [salt, key] = apiKey.key.split(':');
                const hashedBuffer = scryptSync(req.params.apiKey, salt, 64);
                
                const keyBuffer = Buffer.from(key, 'hex');
                const match = timingSafeEqual(hashedBuffer, keyBuffer);

                if (match) {
                    if (apiKey.enabled) {
                        if (apiKey.expirationDate < Date.now()) {
                            if (apiKey.permissions[0] === 'R' || apiKey.permissions[1] === 'R' || apiKey.permissions[2] === 'R') {
                                let objToSend = Object.fromEntries(
                                        Array.from(myDB.db)
                                            .filter(([key, value]) => {
                                                const splitKey = key.split('-');
                                                return parseInt(splitKey[2]) > parseInt(req.params.timestamp);  // Compare the third part of the key with the timestamp
                                            })
                                    );
                                
                                res.send(objToSend);
                            } else {
                                res.sendStatus(403);
                            }
                        } else {
                            res.sendStatus(403);
                        }
                    } else {
                        res.sendStatus(403);
                    }
                } else {
                    res.sendStatus(403);
                }
            }
        })
    }
})

app.get('/get/:key/:id/:apiKey', (req, res) => {
    if (req.params.key !== undefined && req.params.id !== undefined && req.params.apiKey !== undefined) {
        fs.readFile('./keys.json', (err, data) => {
            if (err) {
                console.log('ERROR: ' + err);
            } else {
                let keys = JSON.parse(data.toString());
                
                let apiKey = keys.find(v => v.id === Number(req.params.id));

                const [salt, key] = apiKey.key.split(':');
                const hashedBuffer = scryptSync(req.params.apiKey, salt, 64);
            
                const keyBuffer = Buffer.from(key, 'hex');
                const match = timingSafeEqual(hashedBuffer, keyBuffer);

                if (match) {
                    if (apiKey.enabled) {
                        if (apiKey.expirationDate < Date.now()) {
                            if (apiKey.permissions[0] === 'R' || apiKey.permissions[1] === 'R' || apiKey.permissions[2] === 'R') {
                                res.send(myDB.get(req.params.key));
                            } else {
                                res.sendStatus(403);
                            }
                        } else {
                            res.sendStatus(403);
                        }
                    } else {
                        res.sendStatus(403);
                    }
                } else {
                    res.sendStatus(403);
                }
            }
        })
    }
})

app.post('/set', (req, res) => {
    if (req.body.key !== undefined && req.body.id !== undefined && req.body.value !== undefined && req.body.apiKey !== undefined) {
        fs.readFile('./keys.json', (err, data) => {
            if (err) {
                console.log('ERROR' + err);
            } else {
                let keys = JSON.parse(data.toString());

                let apiKey = keys.find(v => v.id === req.body.id);

                const [salt, key] = apiKey.key.split(':');
                const hashedBuffer = scryptSync(req.body.apiKey, salt, 64);
            
                const keyBuffer = Buffer.from(key, 'hex');
                const match = timingSafeEqual(hashedBuffer, keyBuffer);

                if (match) {
                    if (apiKey.enabled) {
                        if (apiKey.expirationDate < Date.now()) {
                            if (apiKey.permissions[0] === 'W' || apiKey.permissions[1] === 'W' || apiKey.permissions[2] === 'W') {
                                myDB.set(req.body.key, req.body.value);
                                res.sendStatus(200);
                            } else {
                                res.sendStatus(403);
                            }
                        } else {
                            res.sendStatus(403);
                        }
                    } else {
                        res.sendStatus(403);
                    }
                } else {
                    res.sendStatus(403);
                }
            }
        })
    }
})

app.post('/backup', (req, res) => {
    if (req.body.id !== undefined && req.body.apiKey !== undefined) {
        fs.readFile('./keys.json', (err, data) => {
            if (err) {
                console.log('ERROR' + err);
            } else {
                let keys = JSON.parse(data.toString());

                let apiKey = keys.find(v => v.id === req.body.id);

                const [salt, key] = apiKey.key.split(':');
                const hashedBuffer = scryptSync(req.body.apiKey, salt, 64);
            
                const keyBuffer = Buffer.from(key, 'hex');
                const match = timingSafeEqual(hashedBuffer, keyBuffer);

                if (match) {
                    if (apiKey.enabled) {
                        if (apiKey.expirationDate < Date.now()) {
                            if (apiKey.permissions[0] === 'B' || apiKey.permissions[1] === 'B' || apiKey.permissions[2] === 'B') {
                                myDB.backupData();
                                res.sendStatus(200);
                            } else {
                                res.sendStatus(403);
                            }
                        } else {
                            res.sendStatus(403);
                        }
                    } else {
                        res.sendStatus(403);
                    }
                } else {
                    res.sendStatus(403);
                }
            }
        })
    }
})

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});