const {Router} = require("express");

const { verifyToken } = require("../middlewares/auth");

const {
     getSafProd
}=require("../controllers/MHE/mhe.controller");

const router = Router()

router.get("/safProd",verifyToken,getSafProd);

module.exports = router;
