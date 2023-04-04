const {
    uploadData,
    copyFile,
    listObjectsV2,
    get_things_data,
    getTimestamp
  } = require("../../utils/image.utils");
  const { Client } = require("pg");
  const path = require("path");
const { getSignedUrl } = require("../../s3/image.s3");
  //const { s3 } = require("../../config/aws-s3.config");
  
  //This end point save images from alert__image type devices.
  //This takes base64 image (original and tagged).
  //Saves tagged image to Alert Images directory and raw image to raw image directory in s3 bucket.
  //We save original image for further training the model over feedback.
  
  const postAlertImageData = async (req, res) => {
    try {
      // console.log(req)
      const { raw_img, detection_img, cam_id, bbox, system_detection_time, client_name, chat_id,check_for } =
        req.body;
      console.group(
        "Date and Time : ",
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      console.time("Process Timing");
      console.log("************HEAD************");
      console.log("Client Name: ", client_name);
      console.log("Camera Id: ", cam_id);
      console.log("Check For: ", check_for);
      console.log("***********BODY************");
      console.log("Buffer Saved");
      let indiaTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      let today = new Date(indiaTime).toISOString().split("T")[0];
      let loc = `AlertImages/${client_name}/${cam_id}/${today}`;
      let loc2 = "RawImages/";
      let buf = new Buffer.from(detection_img, "base64");
      let params1 = {
        Bucket: "hacksboard",
        Key: loc + "/TrakrCam_AlrtImg_" + Date.now() + ".jpeg",
        Body: buf,
        ContentEncoding: "base64",
        ContentType: `image/jpeg`,
      };
      let buf2 = new Buffer.from(raw_img, "base64");
      let params2 = {
        Bucket: "hacksboard",
        Key: loc2 + "TrakrCam_RAW_" + Date.now() + ".jpeg",
        Body: buf2,
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      };
      const base64Thumbnail = await compressAndResizeImage(raw_img, 10, 80);
      const bufThumb = new Buffer.from(base64Thumbnail, "base64");
      const locationOfThumbnailImage = `ThumbnailImages/${client_name}/${cam_id}/${today}`;
      let paramsOfThumbnailImage = {
         Bucket: "hacksboard",
        Key:
         locationOfThumbnailImage + "/TrakrCam_ThmbImg_" + Date.now() + ".png",
         Body: bufThumb,
         ContentEncoding: "base64",
         ContentType: `image/jpeg`,
      };
      let tagged_loc = await uploadData(params1);
      console.log("tagg",tagged_loc)
      let raw_data = await uploadData(params2);
      console.log("raw",raw_data)
      let thumbnail_data=await uploadData(paramsOfThumbnailImage);
      let ans = {
      "raw_img": raw_data.NKey,
      "detection_img":tagged_loc.NKey,
      "thumbnail_img":thumbnail_data.NKey,
      "cam_id":cam_id,
      "bbox":bbox,
      "system_detection_time":system_detection_time,
      "client_name":client_name,
      "chat_id":chat_id,
      "check_for":check_for
      };
      console.log("RESPONSE", ans);
      console.timeEnd("Process Timing");
      console.log("**************END************");
      console.groupEnd();
      res.send(ans);
    } catch (error) {
      console.log(error);
      res.send({
        status: "Server responding with error",
        msg: error,
      });
    }
  };
  
  //This takes training images for creating datasets to train AI model
  
  const postTrainImageData = async (req, res) => {
    console.log("Hello There");
    const { raw_img, client_name, cam_id} = req.body;
    let buf = new Buffer.from(raw_img, "base64");
    let indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    let today = new Date(indiaTime).toISOString().split("T")[0];
    let loc = `TrainImages/${client_name}/${cam_id}/${today}`;
    let params = {
      Bucket: "hacksboard",
      Key: loc + "/TrakrCam_TrainImg_" + Date.now() + ".jpeg",
      Body: buf,
      ContentEncoding: "base64",
      ContentType: `image/jpeg`,
    };
  
    try {
      let data = await uploadData(params);
      console.log(data)
      let ans = {
        key : data.NKey
      }
      res.send(ans)
    } catch (error) {
      console.log(error)
      res.send({
        status: "Server responding with error",
        msg: error,
      });
    }
  };
  
  //This returns the cameras in customer premise.
  
  const getCameras = async (req, res) => {
    let isTenant = req.query.tenant;
    if (isTenant === "True") {
      var params = {
        Bucket: "hacksboard",
        Prefix: "AlertImages/",
        Delimiter: "/20",
      };
      let data = await listObjectsV2(params)
      res.send({"cameras":data})
    } else {
      let customer = req.query.customer;
      let customer_details = JSON.parse(customer);
      var params = {
        Bucket: "hacksboard",
        Prefix: "AlertImages/" + customer_details[0]["name"],
        Delimiter: "/20",
      };
        let data = await listObjectsV2(params)
        res.send({ "cameras": data });
    }
  };
  
  //Fetches image link from s3 to display in our web pages.
  //Returns a signedUrl.
  //This link expires after 120 seconds .
  
  const getImage = async (req, res) => {
    let key = req.query.path;
    console.log(key);
    const data = getSignedUrl(key)
    console.log(data);
    res.send({ img: data });
  };
  
  //Saves feedback from customers to S3 separate bucket
  
  const postFeedbackData = async (req, res) => {
    console.log("YE WALA",req.body)
    let {raw_img,bbox,client_name,cam_id} = req.body;
    let indiaTime = parseInt(getTimestamp(raw_img))
    console.log(typeof(indiaTime))
    console.log("first",new Date(indiaTime))
    let convertedindiaTime = new Date(indiaTime).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
   
    let today = new Date(convertedindiaTime).toISOString().split("T")[0];
    let loc = `FEEDBACK/${client_name}/${cam_id}/${today}`
    let newName=raw_img.split("/")[1];
    newName = `${newName}_${indiaTime}.jpeg`
    const params = {
      Bucket: "hacksboard",
      CopySource:raw_img,
      Key: `${loc}/${newName}`
    };
    await copyFile(params).then((r) => {
      console.log("Copied to location")
    });
    let labelContent =""
    for(let i=0;i<bbox.length;i++){
       labelContent = labelContent + bbox[i]["label"]+" ";
       labelContent = labelContent + bbox[i]["xyxy"].join(" ")+"\n";
    }
    let textFileName= newName.split(".")[0]+`.txt`
    console.log("This is the file name",textFileName)
    const params2 ={
     Bucket : "hacksboard",
     Key : loc +`/${textFileName}`,
     Body : labelContent
    }
    try {
      let res = await uploadData(params2)
      let ans = {
        key : res.NKey
      }
      res.send(ans)
    } catch (error) {
      res.send({
        status: "Server responding with error",
        msg: error,
      });
    }
  
    
  };
  
  const getThumb = async (req, res) => {
    let date, id_obj;
    if (req.query.date) {
      date =JSON.parse(req.query.date);
    } else {
      res.send({
        msg: "Date not provided",
        status: 400,
      });
    }
    if (req.query.entityId) {
      id_obj = JSON.parse(req.query.entityId);
    } else {
      res.send({
        msg: "No ids found",
        status: 400,
      });
    }
    const client = new Client({
      host: process.env.DBHOST,
      port: process.env.DBPORT,
      user: process.env.DBUSR,
      password: process.env.DBPASSWORD,
      database: process.env.DATABASE,
    });
    console.log(client)
    await client.connect((err) => {
      if (err) {
        console.error("Connection error ", err.stack);
      } else {
        console.log("Connected to database");
      }
    });
    let final_arr = [];
    for (let ent in id_obj) {
      //  console.log("ent",id_obj[ent])
      voilation_data = await get_things_data(
        id_obj[ent]["entityId"],
        date,
        date + 86400000,
        "voilation_data",
        "ts,json_v",client)
      // console.log(voilation_data)
      //let sem = get_res(path, detect);
      //let fnl = get_res(sem, cam_id);
      for (let val in voilation_data) {
        final_arr.push(voilation_data[val]);
      }
      
    }
    await client.end();
    //console.log("finale",final_arr)
    res.send({ result: final_arr });
  };
  
  const getAnotationData = async(req,res)=>{
    let val;
    let final_data;
    //console.log(req.query.raw_img)
    console.log("hello")
    if(req.query.raw_img){
      val=req.query.raw_img
      console.log(val)
    }else{
      res.status(301).send({
       msg:"Image Not Provided"
    })
    }
    const client = new Client({
      host: process.env.DBHOST,
      port: process.env.DBPORT,
      user: process.env.DBUSR,
      password: process.env.DBPASSWORD,
      database: process.env.DATABASE,
    });
  
    await client.connect((err) => {
      if (err) {
        console.error("Connection error ", err.stack);
      } else {
        console.log("Connected to database");
      }
    });
  let query1=`Select * from ts_kv where str_v='${val}';`
   const query1_res= await client.query(query1);
   if(query1_res.rows.length != 0){
       let entity_id = query1_res.rows[0]["entity_id"];
       let ts= query1_res.rows[0]["ts"]
       let ans = await get_things_data(entity_id,ts,ts,'voilation_data','ts,json_v',client)
       await client.end()
      final_data = ans[0]
      final_data["deviceId"]=entity_id;
      console.log("*******************")
      console.log(final_data)
      console.log("*******************")
      res.send(final_data)
     }else{
    //  console.log("HEELLO AGAIN")
       await client.end()
      res.status(500).send("Something Broke")
  }
  //console.log(final_data)
  //res.send(final_data)
  }
  
  module.exports = {
    postAlertImageData,
    postTrainImageData,
    getCameras,
    getImage,
    postFeedbackData,
    getThumb,
    getAnotationData
  };
  
