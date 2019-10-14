const loki = require('lokijs')

let lokiDB = new loki('./db/aufmacher.json', {
    autoload: true,
    autoloadCallback: dbLoaded
})

function extractFaceData (face) {
    // coords
    let boundingBox = face.region_info.bounding_box

    // gender
    let gender = face.data.face.gender_appearance
    let maleConfidence, femaleConfidence
    for (let concept of gender.concepts) {
        if (concept.name === 'masculine') 
            maleConfidence = concept.value
        if (concept.name === 'feminine')
            femaleConfidence = concept.value
    }
    let sex = (maleConfidence > femaleConfidence) ? 'male' : 'female'

    // age
    let ageConcepts = face.data.face.age_appearance.concepts
    let age = ageConcepts.reduce((acc, current) => {
        if (acc && current.value > acc.value)
            return current
        return acc
    }, {name: 'unknown', value: 0})

    return {
        coords: {
            x1: boundingBox.left_col,
            y1: boundingBox.top_row,
            x2: boundingBox.right_col,
            y2: boundingBox.bottom_row
        },
        gender: sex,
        age: age.name === 'unknown' ? age.name : parseInt(age.name)
    }
}

function dbLoaded () {

    let imagesCollection = lokiDB.getCollection('image')
    let imagesWithArticle = imagesCollection.find({used_in_article: true})

    let imageData = []
    
    for (let index in imagesWithArticle) {

        extractedData = { faces: [] }

        let image = imagesWithArticle[index]
        let demographics = image.predictions.demographics
        
        if (demographics.regions) {
            let faces = demographics.regions
            extractedData.numFaces = faces.length
            for (let faceIndex in faces) {
                let face = faces[faceIndex]
                let faceData = extractFaceData(face)
                extractedData.faces.push(faceData)
            }
        } else {
            extractedData.numFaces = 0
            extractedData.faces = []
        }

        imageData.push(extractedData)

    }
    
    // persons - no persons
    let imagesWithPersons = imageData.filter(image => (image.numFaces > 0))
    let imagesWithoutPersons = imageData.filter(image => (image.numFaces === 0))

    console.log(``)
    console.log(``)

    console.log(`Images total:           ${imageData.length}`)
    console.log(`Images with persons:    ${imagesWithPersons.length}`)
    console.log(`Images without persons: ${imagesWithoutPersons.length}`)
    
    console.log(``)
    console.log(``)

    // gender
    let faces = [],
        males = [], 
        females = [], 
        imagesWithMoreMales = [],
        imagesWithOnlyMales = [],
        imagesWithMoreFemales = [], 
        imagesWithOnlyFemales = [],
        imagesWithEqualDistribution = []
    for (let image of imagesWithPersons) {
        let malesInThisImage = image.faces.filter(face => face.gender === 'male')
        let femalesInThisImage = image.faces.filter(face => face.gender === 'female')
        faces = [...faces, ...image.faces]
        males = [...males, ...malesInThisImage]
        females = [...females, ...femalesInThisImage]
        if (malesInThisImage.length > femalesInThisImage.length) {
            imagesWithMoreMales.push(image)
        }
        if (malesInThisImage.length < femalesInThisImage.length) {
            imagesWithMoreFemales.push(image)
        }
        if (malesInThisImage.length === femalesInThisImage.length) {
            imagesWithEqualDistribution.push(image)
        }
        if (femalesInThisImage.length === 0 && malesInThisImage.length > 0) {
            imagesWithOnlyMales.push(image)
        }
        if (malesInThisImage.length === 0 && femalesInThisImage.length > 0) {
            imagesWithOnlyFemales.push(image)
        }
    }

    console.log(`Male faces total: ${males.length}`)
    console.log(`Female faces total: ${females.length}`)
    console.log(``)
    console.log(`♂`)
    console.log(`Images with more males: ${imagesWithMoreMales.length}`)
    console.log(`Images with _only_ males: ${imagesWithOnlyMales.length}`)
    console.log(``)
    console.log(`♀`)
    console.log(`Images with more females: ${imagesWithMoreFemales.length}`)
    console.log(`Images with _only_ females: ${imagesWithOnlyFemales.length}`)
    console.log(``)
    console.log(`=`)
    console.log(`Images with equal distribution: ${imagesWithEqualDistribution.length}`)
    
    console.log(``)
    console.log(``)

    // age
    let reducer = (acc, current) => { 
        if (current.age === 'unknown')
            return acc
        return acc + current.age
    }
    let averageAge = faces.reduce(reducer, 0) / faces.length
    let averageAgeMale = males.reduce(reducer, 0) / males.length
    let averageAgeFemale = females.reduce(reducer, 0) / females.length

    console.log(`Average age: ${averageAge}`)
    console.log(`Average age male: ${averageAgeMale}`)
    console.log(`Average age female: ${averageAgeFemale}`)

    console.log(``)

    let numUnder30 = faces.filter(face => face.age >= 20 && face.age < 30).length
    let numUnder40 = faces.filter(face => face.age >= 30 && face.age < 40).length
    let numUnder50 = faces.filter(face => face.age >= 40 && face.age < 50).length
    let numUnder60 = faces.filter(face => face.age >= 50 && face.age < 60).length
    let numUnder70 = faces.filter(face => face.age >= 60 && face.age < 70).length
    let numUnder80 = faces.filter(face => face.age >= 70 && face.age < 80).length
    let numUnder90 = faces.filter(face => face.age >= 80 && face.age < 90).length
    let numUnder100 = faces.filter(face => face.age >= 90 && face.age < 100).length

    console.log(`   < 30: ${numUnder30}`)
    console.log(`30 - 39: ${numUnder40}`)
    console.log(`40 - 49: ${numUnder50}`)
    console.log(`50 - 59: ${numUnder60}`)
    console.log(`60 - 69: ${numUnder70}`)
    console.log(`70 - 79: ${numUnder80}`)
    console.log(`80 - 89: ${numUnder90}`)
    console.log(`90 - 99: ${numUnder100}`)

    console.log(``)
    console.log(``)
}