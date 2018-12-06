const loki = require('lokijs')

let lokiDB = new loki('./db/aufmacher.json', {
    autoload: true,
    autoloadCallback: dbLoaded
})

function dbLoaded () {

    let articlesCollection = lokiDB.getCollection('aufmacher')
    let imagesCollection = lokiDB.getCollection('image')
    
    let articlesImageAvailable = articlesCollection.find({image_available: true})

    for (let article of articlesImageAvailable) {
        let image = imagesCollection.findOne({id: article.image_id})
        image.used_in_article = true
    }

    let allImages = imagesCollection.find()
    for (let image of allImages) {
        if (!image.used_in_article) {
            image.used_in_article = false
        }
    }

    let imagesWithArticle = imagesCollection.find({used_in_article: true})
    let imagesWithoutArticle = imagesCollection.find({used_in_article: false})

    lokiDB.saveDatabase()

    console.log(imagesWithArticle.length)

}