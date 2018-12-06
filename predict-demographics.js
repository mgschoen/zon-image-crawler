const loki = require('lokijs')
const Clarifai = require('clarifai')

const { 
    getGenericImageUrl, 
    getImageUrlFromArticle 
} = require('./util.js')

let lokiDB
let clarifai = new Clarifai.App({
    apiKey: process.env.CLARIFAI_API_KEY
})

lokiDB = new loki('./db/aufmacher.json', {
    autoload: true,
    autoloadCallback: dbLoaded
})

function dbLoaded () {

    let imagesCollection = lokiDB.getCollection('image')

    let imagesWithArticle = imagesCollection.find({used_in_article: true})

    predictLoop(imagesWithArticle, 0, () => {
        console.log()
        console.log('Done with this.')
    })

}

function getPrediction (image) {
    return new Promise((resolve, reject) => {
        let imageUrl = getGenericImageUrl(image)
        clarifai.models.predict(Clarifai.DEMOGRAPHICS_MODEL, imageUrl)
            .then(response => {
                resolve(response.outputs[0].data)
            })
            .catch(error => {
                reject(error)
            })
    })
}

function predictLoop (images, index, finishedCallback) {

    let nextTick = () => {
        let nextIndex = index + 1
        if (nextIndex < images.length) {
            predictLoop(images, nextIndex, finishedCallback)
        } else {
            finishedCallback()
        }
    }

    let image = images[index]
    console.log()
    console.log(`Image ${index+1} / ${images.length} - ID: ${image.id}`)
    getPrediction(image)
        .then(prediction => {
            if (!image.predictions) {
                image.predictions = {}
            }
            image.predictions.demographics = prediction
            lokiDB.saveDatabase()
            console.log('Prediction received and stored')
        })
        .catch(error => {
            console.error(error.message)
        })
        .then(nextTick)

}