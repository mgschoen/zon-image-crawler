const sqlite = require('sqlite3')

function loadDatabaseContent (dbFilename) {
    return new Promise((resolve, reject) => {
        let db = new sqlite.Database(dbFilename, sqlite.OPEN_READONLY, async err => {
            if (err) {
                reject(new Error('Error opening database file: ' + err.message))
                return
            }
        
            console.log('Connected to database')        
            let result = {
                aufmacher: null,
                image: null
            }
            db.all('SELECT * FROM aufmacher', (err, aufmacherRows) => {
                if (err) {
                    reject(err)
                    return
                }
                result.aufmacher = aufmacherRows
                db.all('SELECT * FROM image', (err, imageRows) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    result.image = imageRows
                    resolve(result)
                })
            })
        })
    })
}

function getGenericImageUrl (image) {
    if (image) {
        return image.unique_id.replace('http://xml', 'https://img') + 'cinema__980x420'
    }
    return ''
}

function getImageUrlFromArticle (article, imageCollection) {
    let image = imageCollection.findOne({id: article.image_id})
    return getGenericImageUrl(image)
}

module.exports = { 
    getGenericImageUrl,
    getImageUrlFromArticle,
    loadDatabaseContent
}