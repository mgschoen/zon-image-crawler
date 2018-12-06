const loki = require('lokijs')
const request = require('request')

const IMAGE_DERIVATIVE = 'cinema__980x420'

let lokiDB, 
    imagesCollection

lokiDB = new loki('./db/aufmacher.json', {
    autoload: true,
    autoloadCallback: dbLoaded
})

function getImageStatus (article) {
    return new Promise((resolve, reject) => {
        let imageID = article.image_id
        let image = imagesCollection.findOne({id: imageID})
        console.log(`article ${article.id}: image ${imageID}`)
        if (image) {
            let imageURL = image.unique_id.replace('http://xml', 'https://img') + IMAGE_DERIVATIVE
            request(imageURL, (err, response, body) => {
                let imageAvailable = response.statusCode === 200
                console.log(`${imageURL} - ${imageAvailable ? 'available' : 'not available'}`)
                resolve(response.statusCode === 200)
            })
        } else {
            resolve(false)
        }
    })
}

function requestLoop (articles, index, finishedCallback) {

    let nextTick = () => {
        let nextIndex = index + 1
        if (nextIndex < articles.length) {
            requestLoop(articles, nextIndex, finishedCallback)
        } else {
            finishedCallback()
        }
    }

    console.log()
    console.log(`Article ${index+1} / ${articles.length}`)
    let article = articles[index]
    getImageStatus(article)
        .then(available => {
            article.image_available = available
            lokiDB.saveDatabase()
            console.log(`value "${available}" stored`)
        })
        .catch(err => {
            console.error(err.mesage)
        })
        .then(nextTick)

}

function dbLoaded () {
    
    articlesCollection = lokiDB.getCollection('aufmacher')
    imagesCollection = lokiDB.getCollection('image')

    let articles = lokiDB.getCollection('aufmacher').find()

    requestLoop(articles, 1166, () => {
        console.log()
        console.log('Done with this')
    })

}