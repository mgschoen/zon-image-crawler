const loki = require('lokijs')

const { loadDatabaseContent } = require('./util.js')

loadDatabaseContent('./db/aufmacher.db').then(dbContent => {

    console.log(dbContent)
    let lokiDB = new loki('./db/aufmacher.json')
    for (let key in dbContent) {
        let collection = lokiDB.addCollection(key)
        for (let item of dbContent[key]) {
            collection.insert(item)
        }
    }

    lokiDB.saveDatabase()

}).catch(err => {
    console.log(err.message)
    process.exit(1)
})