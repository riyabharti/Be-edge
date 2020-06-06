const Cloud = require('@google-cloud/storage')
const path = require('path')
const serviceKey = path.join(__dirname, 'keysP.json')

const { Storage } = Cloud
const storage = new Storage({
    keyFilename: serviceKey,
    projectId: process.env.GCP_PROJECT_ID,
})

module.exports = storage.bucket(process.env.GCP_STORAGE_BUCKET);