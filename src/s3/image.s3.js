const fs = require("fs");
const path = require("path")

async function upload(paramobj){
    return new Promise((resolve,reject)=>{
        try{
            const {Bucket,Key,Body,ContentEncoding,ContentType} = paramobj;
            const NKey = Bucket+"/"+Key
            const dir = path.dirname(NKey);
            // Check if the directory exists, and create it if it doesn't
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFile(NKey,Body,{encoding:ContentEncoding},(err)=>{
                console.log()
                if(err){
                    reject(err)
                }
                resolve({Bucket,NKey,ContentType});
            })
        } catch(error){
            reject(error);
        }
    })
}
function listObjects(params){
    return new Promise((resolve, reject) => {
        try {
            const {Bucket,Delimiter,Prefix} = params
            const directoryPath = path.join(process.env.DATAFOLDER,Bucket)
            let val  = getAllPathsInDirectory(directoryPath)
            let ans = val.filter(data=>{
               return data.includes(Prefix) 
            })
            resolve(ans)
        } catch (error) {
            reject(error);
        }
    });
}
function copyObject(params){
    return new Promise((resolve,reject)=>{
        try{
            const {Bucket,CopySource,Key} = params;
            let src = CopySource;
            let dest = Bucket+"/"+Key;
            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.copyFile(src,dest,(err)=>{
                if(err){
                    reject(err)
                }
                resolve("File copied to ",dest);
            });
        } catch(err){
            console.error(err)
        }
    });
}

function getAllPathsInDirectory(dir){
    const paths = [];
    let files = fs.readdirSync(dir);
    // console.log("FIlejd",files);
    for(const file of files){
        const filePath =path.join(dir,file)
        const stat = fs.statSync(filePath)
        if (stat.isFile()) {
            paths.push(filePath);
            } else if (stat.isDirectory()) {
            paths.push(...getAllPathsInDirectory(filePath));
            }
    }
    return paths;
}

function listObjectsV2(params){
    return new Promise((resolve, reject) => {
        try {
            const {Bucket,Delimiter,Prefix} = params
            const directoryPath = path.join(process.env.DATAFOLDER,Bucket)
            let val  = getAllPathsInDirectory(directoryPath)
            resolve(val)
            // console.log("paths",paths)
        } catch (error) {
            reject(error);
        }
    });
}

function getSignedUrl(filePath) {
    const fileName = path.basename(filePath);
    filePath =path.join(process.env.DATAFOLDER,filePath) 
    // const link = `file://${filePath}`;
    if(!fs.existsSync(filePath)){
    	filePath = "/home/trakr_client_hapi/No_image_available.svg.webp"
    }
    let data  = fs.readFileSync(filePath)
    const encodedString ="data:image/jpeg;base64,"+ Buffer.from(data).toString('base64');
    return encodedString;
}




// console.log(upload(params))

module.exports={
    upload,
    copyObject,
    listObjectsV2,
    getSignedUrl,
    listObjects
}
