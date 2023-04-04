const { Client } = require("pg");
const s3 = require("../s3/image.s3")
const fs = require("fs")
const sharp = require("sharp") 
// function to encode file data to base64 encoded string
function base64_encode(file) {
    var data = fs.readFileSync(file);
    return new Buffer.from(data).toString('base64');
}
// Function to upload your data to S3.
// This function operates asynchronously. It returns a promise which over resolve or reject operates further.
// let buf = base64_encode('/home/ichigo/mhe-equipments-500x500.jpg')
// let params = {
//     Bucket :"hacksboard",
//     Key: "save/inside/thissfdfsf.jpeg",
//     Body:buf,
//     ContentEncoding:"base64",
//     ContentType:'image/jpeg'
// }

function getTimestamp(input) {
  let timestamp = input.split("_").pop().split(".")[0];
  return timestamp;
}

async function uploadData(params){
    try{
    let val = await s3.upload(params)
    console.log("dfdfd",val)
    return val
    }catch(err){
        console.error("fjdfdnf",err)
    }
}
// // run(params)
// let params2 ={
//     Bucket:"hacksboard",
//     CopySource:"/save/inside/thissfdfsf.jpeg",
//     Key :"/save2/inside2/thi.jpeg"
// }
async function copyFile(params2){
   console.log("Inside copyFile",params2)
   let val = await s3.copyObject(params2)
   return val
}
function getSignedUrl(url){
    return s3.getSignedUrl(url)

}
// let val = run2(params2)
// console.log(val)

// console.log(process.env.DATAFOLDER)
// let params2 ={
//     Bucket:"hacksboard",
//     Prefix:"/inside",
//     Delimiter:("/this")
// }
async function listObjectsV2(params2){
   let val = await s3.listObjectsV2(params2)
//    console.log("This is val",val)
    let filteredPaths=val.filter((pt)=>{
        return pt.includes(params2.Prefix)
    })
    let res=[]
    for(let i=0;i<filteredPaths.length;i++){
        let str=filteredPaths[i];
        const startIndex = str.indexOf(params2.Prefix);
        if (startIndex === -1) {
            return '';
        }
        const endIndex = str.indexOf(params2.Delimiter, startIndex + params2.Prefix.length);
        if (endIndex === -1) {
            return '';
        }
        res.push(str.substring(startIndex + params2.Prefix.length, endIndex));
    }
   return res
}
// run2(params2)

// async function uploadData(params) {
// let stored = await s3.upload(params).promise();
// return stored;
// }
//Funtion copies image from one location to another.
//Used for copying image from raw to feedback folder in s3.
// function copyFile(params) {
// return s3.copyObject(params).promise();
// }

function get_str_converted(res) {
console.log("I am called");
let str = "(";
let arr = [];
for (let key in res.rows) {
    arr.push(res.rows[key]["key_id"]);
}
console.log("**********************" + arr + "***********");
str += arr.join();
str += ")";
return str;
}

async function get_things_data(id, startTs, endTs, key, val, client) {
let keyIdForKey = `Select key_id from ts_kv_dictionary where key='${key}'`;
const res = await client.query(keyIdForKey);
let key_id = res.rows[0]["key_id"];
//console.log("key",key_id)
//console.log(id)
let getDataQuery = `Select ${val} as ${key} from ts_kv where entity_id='${id}' and key =${key_id} and ts>=${startTs} and ts<=${endTs}`;
//console.log(getDataQuery)
let res2 = await client.query(getDataQuery);

return res2.rows;
}

function get_res(res1, res2) {
let final = res1.map((item, i) => Object.assign({}, item, res2[i]));
return final;
}

function sortarr(arr) {
let val = arr.sort(function (x, y) {
    return x.ts - y.ts;
});
return val;
}

function get_count(arr, val, key) {
let count = 0;
for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] == val) {
    count++;
    }
}
return count;
}

function get_count_obj(arr, key) {
let count_obj = {};
if (key == "state") {
    for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] == "machine is on") {
        if (count_obj.hasOwnProperty(arr[i]["ename"])) {
        count_obj[arr[i]["ename"]] = count_obj[arr[i]["ename"]] + 1;
        } else {
        count_obj[arr[i]["ename"]] = 1;
        }
    }
    }
}
if (key == "voilation") {
    for (let i = 0; i < arr.length; i++) {
    let voil = arr[i]["voilation"];
    let enm = arr[i]["ename"];
    if (count_obj.hasOwnProperty(arr[i]["ename"])) {
        count_obj[enm][voil] = count_obj[enm][voil] + 1;
    } else {
        let temp = new Object();
        temp["ACS_A"] = 0;
        temp["ACS_E"] = 0;
        temp["CAS_A"] = 0;
        temp["CAS_E"] = 0;
        temp["shock"] = 0;
        temp["crash"] = 0;
        temp["os"] = 0;
        temp[voil] = 1;
        count_obj[enm] = temp;
    }
    }
}
return count_obj;
}

async function get_postgres_client(query) {
const client = new Client({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USR,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});
await client.connect((err) => {
    if (err) {
    console.error("connection error", err.stack);
    } else {
    console.log("connected");
    }
});
console.log(query);
let res = await client.query(query);
await client.end();
return res;
}


function getImageSize(base64EncodedImage) {
  const binaryImage = Buffer.from(base64EncodedImage, "base64");
  const buffer = Buffer.from(binaryImage);
  return sharp(buffer)
    .metadata()
    .then((metadata) => {
      return { width: metadata.width, height: metadata.height };
    })
    .catch((error) => {
      console.error(error);
    });
}


async function compressAndResizeImage(
  base64EncodedImage,
  resizeByInt,
  compressImageByInt
) {
  const { width, height } = await getImageSize(base64EncodedImage)
    .then((size) => {
      return {
        width: parseInt(size.width / resizeByInt),
        height: parseInt(size.height / resizeByInt),
      };
    })
    .catch((error) => {
      console.error(error);
    });

  const binaryImage = Buffer.from(base64EncodedImage, "base64");
  const buffer = Buffer.from(binaryImage);
  return (
    sharp(buffer)
      .resize(width, height)
      .jpeg({ quality: compressImageByInt })
      //uncomment this line and comment toBuffer() to save the image to disk but cant use both toFile and toBuffer
      // .toFile("test1.jpeg")
      .toBuffer() //convert the image to a buffer
      .then((buffer) => {
        const base64EncodedResizedImage = buffer.toString("base64");
        return base64EncodedResizedImage;
      })
      .catch((error) => {
        console.error(error);
      })
  );
}  
  module.exports = {
    uploadData,
    copyFile,
    get_str_converted,
    get_things_data,
    get_res,
    sortarr,
    get_count,
    get_count_obj,
    get_postgres_client,
    listObjectsV2,
    getSignedUrl,
    getTimestamp,
    compressAndResizeImage
  };
  
