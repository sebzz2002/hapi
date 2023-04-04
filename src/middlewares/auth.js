//const jwt = require("jsonwebtoken")
//// The signing key is base64 encoded although it seems like a general string make sure to decode it before verifying your token
//const dotenv = require("dotenv")
//dotenv.config()
//const verifyOptions={
//    algorithms:process.env.ALGORITHM	
//}
//function verifyToken(req, res, next) {
//    try{
//        const token = req.headers.authorization.split(' ')[1];
//	console.log(token);
//	console.log(verifyOptions)
//        if(!token){
//            throw new Error('Authentication Failed!');
//        }
//	console.log(process.env.SECRET_KEY)
//        let key = new Buffer.from(process.env.SECRET_KEY,'base64')
//        console.log(key)
//        const verified = jwt.verify(token,key,verifyOptions);
//	console.log("Verified:",verified)
//        req.user=verified;
//        next();
//    }catch(err){
//        console.log(req.headers)
//        console.log(err)
//        res.status(400).send("Invalid Token !");
//    }
//    
//}
//module.exports={verifyToken}
const jwt = require("jsonwebtoken");
const atob = require('atob');
const dotenv =require("dotenv");
dotenv.config();

const algorithm = process.env.ALGORITHM || ["HS256"];
const secretKey = process.env.SECRET_KEY;
function verifyToken(req,res,next){
 try{
   const token = req.headers.authorization?.split(" ")[1];
   if(!token) throw new Error("Authentication Failed - no token provided");
   //const [header, payload, signature]= token.split('.');
   const decoded = jwt.verify(token,Buffer.from(secretKey,"base64"),{
	   algorithms:algorithm,
	  });
   req.user=decoded;
   //console.log(decoded);
   next();
 } catch(err){
  console.error(err);
  res.status(401).json({error:"Invalid Token"});
 }
}

module.exports={verifyToken}
