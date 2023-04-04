const fs = require("fs")
const s3 = require("../../s3/image.s3")
const getAllAnnotations = async (req, res) => {
    function concatValues(arr) {
        return arr.map((obj) => obj.label).join(":");
    }
    var params = {
        Bucket: "hacksboard",
        Delimiter: "/",
        Prefix: "annotation_id/",
    };
    const data = await s3.listObjects(params);
    if (data) {
        if (data.length === 1) {
            const fileData = JSON.parse(fs.readFileSync(data[0], {
                encoding: "utf-8",
                flag: "r"
            }))
            res.send({
                annotations: fileData.annotations,
                labelString: concatValues(fileData.annotations),
                status: "success",
              });
        } else {
            res.send({
                annotations: {},
                status: "success",
            });
        }
    } else {
        res.send({
            annotations: {},
            status: "success",
            messsage: "check if the bucket or folder exists",
        });
    }
};
const postAnnotation = async (req, res) => {
    const annoObj = req.body;
    var params = {
        Bucket: "hacksboard",
        Delimiter: "/",
        Prefix: "annotation_id/",
    };
    const data = await s3.listObjects(params);
    if (data) {
        if (data.length !== 1) {
            fs.writeFileSync(process.env.DATAFOLDER+"hacksboard/annotation_id/annotations.json",JSON.stringify(annoObj));
            res.send({
                status: "success",
            });
        } else {
            const obj = JSON.parse(fs.readFileSync(data[0], {
                encoding: "utf-8",
                flag: "r"
            }))
            if(obj.annotations){
                const annotations = concatAndRemoveDuplicates(
                    obj.annotations,
                    annoObj.annotations
                );
                fs.writeFileSync(data[0],JSON.stringify({annotations}));
                res.send({
                    status: "success",
                });
            }else{
                fs.writeFileSync(data[0],JSON.stringify(annoObj));
                res.send({
                    status: "success",
                });
            }
        }
        function concatAndRemoveDuplicates(array2, array1) {
            let result = array1.concat(array2);
            let labels = {};
            return result.filter(function (obj) {
                if (!labels[obj.label]) {
                    labels[obj.label] = true;
                    return true;
                } else {
                    return false;
                }
            });
        }
    }
};

module.exports = {
    getAllAnnotations,
    postAnnotation
};
