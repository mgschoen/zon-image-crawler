const loki = require('lokijs')

let lokiDB = new loki('./db/aufmacher.json', {
    autoload: true,
    autoloadCallback: dbLoaded
})

function dbLoaded () {

    let articlesCollection = lokiDB.getCollection('aufmacher')
    let imagesCollection = lokiDB.getCollection('image')

    let numArticles = articlesCollection.count()
    let numArticlesImageAvailable = articlesCollection.count({image_available: true})

    console.log()
    console.log(`Articles total: ${numArticles}`)
    console.log(`W/ image available: ${numArticlesImageAvailable}`)
    console.log()

}