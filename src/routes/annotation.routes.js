const { Router} = require("express");
const {verifyToken} = require("../middlewares/auth");
const {
    getAnnotations,
    postAnnotation,
} = require("../controllers/image/annotation.controller");

const router = Router();
router.get("/", verifyToken, getAllAnnotations);
router.post("/", verifyToken, postAnnotation);

module.exports = router;
