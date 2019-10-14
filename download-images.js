Date.prototype.yyyymmdd = function() {
    let mm = this.getMonth() + 1
    let dd = this.getDate()
    let sep = '-'

    return [this.getFullYear(), sep,
        (mm>9 ? '' : '0') + mm, sep,
        (dd>9 ? '' : '0') + dd
        ].join('')
};

Date.prototype.hhmm = function() {
    let hh = this.getHours()
    let mm = this.getMinutes()
    let sep = '-'

    return [(hh>9 ? '' : '0') + hh, sep,
        (mm>9 ? '' : '0') + mm
        ].join('')
};

Date.prototype.yyyymmddhhmm = function() {
    return [this.yyyymmdd(), '__', this.hhmm()].join('')
}
  

const loki = require('lokijs')
const ImageDownloader = require('image-downloader')

let lokiDB = new loki('./db/aufmacher.json', {
    autoload: true,
    autoloadCallback: dbLoaded
})

function downloadImage (url, filename) {
    return new Promise((resolve, reject) => {
        ImageDownloader.image({
            url: url, 
            dest: `./dist/images/${filename}.jpg`
        }).then(() => {
            resolve()
        }).catch(e => {
            reject(e)
        })
    })
}

function downloadLoop (images, index, finishedCallback) {

    function nextTick () {
        let nextIndex = index + 1
        if (nextIndex < images.length) {
            downloadLoop(images, nextIndex, finishedCallback)
        } else {
            finishedCallback()
        }
    }

    console.log(`Downloading image ${index+1} / ${images.length}...`)
    let { url, releaseDate, description } = images[index]
    let filename = `${releaseDate.yyyymmddhhmm()}__${description}`
    downloadImage(url, filename)
        .then(() => {
            console.log(`Stored image ${filename}`)
        })
        .catch(e => {
            console.error(`Error storing image: ${e.message}`)
        })
        .then(nextTick)

}

function dbLoaded () {

    let articlesCollection = lokiDB.getCollection('aufmacher')
    let imagesCollection = lokiDB.getCollection('image')

    let articles = articlesCollection.find().slice(646+731)
    let images = []

    for (let article of articles) {
        let releaseDate = new Date(article.first_released)
        let supertitle = article.supertitle
        let image = imagesCollection.findOne({id: article.image_id})
        if (image) {
            images.push({
                url: image.unique_id + 'cinema__980x420',
                releaseDate: releaseDate,
                description: supertitle.replace(/\s/g, '_')
            })
        }
    }

    downloadLoop(images, 0, () => {
        console.log('Done')
    })

}
