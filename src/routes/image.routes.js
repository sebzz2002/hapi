const {Router} = require("express")

const {verifyToken} = require("../middlewares/auth");

const {
    postAlertImageData,
    postTrainImageData,
    getCameras,
    getImage,
    getThumb,
    postFeedbackData,
    getAnotationData
} = require("../controllers/Image/image.controller");

const router = Router();
router.post("/AlertImageData",postAlertImageData);
router.post("/TrainImageData",postTrainImageData);
router.post("/SubmitFeedback",postFeedbackData);
router.get("/getAnotationData",verifyToken,getAnotationData);

router.get("/getCameras",verifyToken,getCameras);
router.get("/getImage",verifyToken,getImage);
router.get("/getThumb",getThumb);


module.exports = router;
