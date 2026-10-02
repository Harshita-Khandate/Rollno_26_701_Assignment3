const express=require("express")
const app=express()
const multer=require("multer")
const path=require("path")
const {check,validationResult}=require("express-validator")
app.set("view engine","ejs");
app.use("/upload", express.static("upload"));
app.use(express.urlencoded({extended:true}))

app.get("/",(req,res)=>{
    res.render("form",{
        errors:[]
    })
   // res.render("form")
})
var storage=multer.diskStorage({
  destination:(req,file,cb)=>{
    if(file.mimetype!=="image/png")
    {
        return cb("Invalid type")
    }
    cb(null,"./upload")
  },
  filename :(req,file,cb)=>{
    console.log(file)
    cb(null,Date.now()+path.extname(file.originalname))
  }
})

var upload=multer({storage : storage})
app.post("/ragiform",upload.fields([
    { name: "profilepic", maxCount: 1 },
    { name: "otherpics", maxCount: 3 }
]),
     [
    check("username")
        .notEmpty()
        .withMessage("enter username"),

    check("password")
        .notEmpty()
        .withMessage("enter password"),

    check("cpassword")
        .notEmpty()
        .withMessage("enter confirm password"),

    check("email")
        .notEmpty()
        .withMessage("enter email"),

    check("gender")
        .notEmpty()
        .withMessage("enter gender"),

    check("hobbies")
        .notEmpty()
        .withMessage("enter hobbies"),

],
 (req, res) => {

    const errors = validationResult(req);
  console.log(req.body);
        console.log(req.files);

    if (!errors.isEmpty()) {
        return res.render("form", {
            errors: errors.array()
        });
    }

    res.render("res",{
        data:req.body,
        files:req.files
    })
});
app.get("/download/:filename", (req, res) => {
    res.download("./upload/" + req.params.filename);
});
app.listen(3000,()=>{
    console.log("listening on port 3000");
})