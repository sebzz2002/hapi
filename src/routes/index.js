const {Router} = require("express");
const imageRoutes = require("./image.routes");
const mheRoutes = require("./mhe.routes");
const annotationRoutes = require("./annotation.routes");

const router = Router();

router.use("/hapi/image",imageRoutes);
router.use("/hapi/v1",mheRoutes);
router.use("/hapi/annotation",annotationRoutes);

module.exports = router
