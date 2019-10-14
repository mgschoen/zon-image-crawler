const loki = require('lokijs')

const colorMappingByGroup = require('./color-mapping')
let colorMapping = {}
for (let colorGroup in colorMappingByGroup) {
    for (let color of colorMappingByGroup[colorGroup]) {
        colorMapping[color] = colorGroup
    }
}

function getColorDistribution (image) {
    let colorPrediction = image.predictions.colors
    let colorDistribution = {}
    try {
        for (let color of colorPrediction) {
            let colorGroup = colorMapping[color.w3c.name.toLowerCase()]
            if (colorGroup === undefined) {
                console.log(color.w3c.name + ' - ' + color.w3c.hex)
            }
            if (colorDistribution[colorGroup]) {
                colorDistribution[colorGroup] += color.value
            } else {
                colorDistribution[colorGroup] = color.value
            }
        }
        let colorDistributionArray = []
        for (let colorGroup in colorDistribution) {
            colorDistributionArray.push({ name: colorGroup, value: colorDistribution[colorGroup] })
        }
        colorDistributionArray.sort((a,b) => {
            return b.value - a.value
        })
        return colorDistributionArray
    } catch (error) {
        return []
    }
}

function calculateAverageColorDistribution (colorDistributionList) {

    let colorDistributionSum = {
        'black': 0, 'grey': 0, 'brown': 0, 'white': 0, 'red': 0, 
        'purple': 0, 'green': 0, 'yellow': 0, 'blue': 0 },
        colorDistributionAverage = {
            'black': 0, 'grey': 0, 'brown': 0, 'white': 0, 'red': 0, 
            'purple': 0, 'green': 0, 'yellow': 0, 'blue': 0 }
    for (let distribution of colorDistributionList) {
        for (let colorGroup of distribution) {
            colorDistributionSum[colorGroup.name] += colorGroup.value
        }
    }
    for (let colorGroup in colorDistributionSum) {
        let sum = colorDistributionSum[colorGroup]
        colorDistributionAverage[colorGroup] = sum / colorDistributionList.length
    }
    let colorDistributionAverageArray = []
    for (let colorGroup in colorDistributionAverage) {
        let average = colorDistributionAverage[colorGroup]
        colorDistributionAverageArray.push({name: colorGroup, average: average})
    }
    colorDistributionAverageArray.sort((a,b) => (b.average - a.average))
    return colorDistributionAverageArray
}

let lokiDB = new loki('./db/aufmacher.json', {
    autoload: true,
    autoloadCallback: dbLoaded
})

function dbLoaded () {

    let imagesCollection = lokiDB.getCollection('image')
    let imagesWithArticle = imagesCollection.find({used_in_article: true})

    let imageData = []
    
    for (let index in imagesWithArticle) {
        let image = imagesWithArticle[index]
        let colorDistribution = getColorDistribution(image)
        imageData.push(colorDistribution)
    }
    
    let colorDistributionAverage = calculateAverageColorDistribution(imageData)
    for (let colorGroup of colorDistributionAverage) {
        console.log(`${colorGroup.name}: ${Math.round(colorGroup.average * 10000) / 100} %`)
    }
}