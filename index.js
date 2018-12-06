const Handlebars = require('handlebars')
const fs = require('fs')

const { loadDatabaseContent } = require('./util.js')

const IMAGE_DERIVATIVE = 'cinema__980x420'

const MAIN_TEMPLATE_STRING = fs.readFileSync('./templates/index.hbs').toString()
const mainTemplate = Handlebars.compile(MAIN_TEMPLATE_STRING)

loadDatabaseContent('./db/aufmacher.db').then(dbContent => {

    let firstTen = dbContent.aufmacher.slice(0,200)
    let articleData = []
    for (let article of firstTen) {
        let imageId = article.image_id
        let image = dbContent.image.filter(image => image.id === imageId)[0]

        articleData.push({
            title: article.title,
            superTitle: article.supertitle,
            imageUrl: image ? image.unique_id + IMAGE_DERIVATIVE : '',
            articleUrl: article.unique_id.replace('http://xml', 'https://www')
        })
    }

    let data = { articles: articleData }
    let result = mainTemplate(data)
    fs.writeFileSync('./dist/index.html', result)

    process.exit()

}).catch(err => {

})