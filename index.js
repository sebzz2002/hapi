const express = require("express");
const PORT = 8090;
const HOST = '0.0.0.0'
// const HOST = '127.0.0.1'
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");
const bodyParser = require("body-parser");
require("dotenv").config();
const routes = require("./src/routes");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(routes);
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.listen(PORT,HOST, (error) => {
  if(!error){
	  console.log("Changing the variable",process.env)
        console.log("Server is Successfully Running,  and App is listening on port "+ HOST+":"+PORT)
  }else{ 
        console.log("Error occurred, server can't start", error);
    }
});
