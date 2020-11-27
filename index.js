const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const axios = require('axios').default;
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const cookieJar = new tough.CookieJar();
var x = require('x-ray')()
axiosCookieJarSupport(axios);
const chowdown = require('chowdown');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const app = express();
app.use(bodyParser.json());
var qs = require('qs');

app.use('/images', express.static(path.join(__dirname, 'images')))

// app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));

app.use((request,response,next) => {
    response.setHeader("Access-Control-Allow-Origin",'*');
    response.setHeader("Access-Control-Allow-Methods","POST,GET,PUT,PATCH,DELETE");
     response.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");
    next();
}) 
// app.use("/images",express.static(path.join(__dirname,'images')))
app.use("/auth",authRoutes);
app.use("/user",userRoutes);
app.use("/chat",chatRoutes);
app.use("/test",(request,response,next) => {
    /* var stream = x('https://parivahan.gov.in/rcdlstatus/', '#form_rcdl:j_idt59').stream()
    stream.pipe(response) */
    axios.get("https://parivahan.gov.in/rcdlstatus/",{
        withCredentials:true,
        jar:cookieJar
    }).then(response => {
        //console.log(cookieJar.store.idx["parivahan.gov.in"]['/rcdlstatus'].JSESSIONID);
       // console.log();
        const c = response.headers["set-cookie"][0];
        console.log(response.headers["set-cookie"])
        const dom = new JSDOM(response.data);
        const viewState=dom.window.document.getElementById("j_id1:javax.faces.ViewState:0").value;
       console.log(viewState)
       var data = qs.stringify({
            'javax.faces.partial.ajax\n': 'true',
            'javax.faces.source: form_rcdl\n': 'j_idt44',
            'javax.faces.partial.execute': '@all',
            'javax.faces.partial.render': 'form_rcdl:pnl_show form_rcdl:pg_show form_rcdl:rcdl_pnl',
            'form_rcdl:j_idt44': 'form_rcdl:j_idt44',
            'form_rcdl': 'form_rcdl',
            'form_rcdl:tf_reg_no1': 'MP09UA',
            'form_rcdl:tf_reg_no2': '8761',
            'javax.faces.ViewState': viewState
        });
        var config = {
            method: 'post',
            url: 'https://parivahan.gov.in/rcdlstatus/vahan/rcDlHome.xhtml',
            headers: { 
              'Origin': 'https://parivahan.gov.in', 
              'Referer': 'https://parivahan.gov.in/rcdlstatus/vahan/rcDlHome.xhtml', 
              'Accept': 'application/xml, text/xml, */*; q=0.01', 
              'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,la;q=0.6,fr;q=0.5,ru;q=0.4', 
              'Faces-Request': 'partial/ajax', 
              'Cookie': c, 
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data : data
        };
        axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log(error);
        });
    })
})

app.use("/",(req,res,next) => {
    res.status(404).send("404")
})

app.use((error,request,response,next) => {
    console.log("from error",error);
    const status = error.statusCode || 500;
    delete error.statusCode;
    const message = error.message || null;
    // const errors = error.errors || null;
    response.status(status).json({message:message,error});
})
mongoose.connect("mongodb+srv://yash_personal:mongodb@cluster0.br2z6.mongodb.net/electron_chat?retryWrites=true&w=majority")
.then(response => {
    const PORT = process.env.port || 8000;
    const server=app.listen(PORT); 
    const io = require('./socket.js').init(server);
    io.on("connection",socket => {
        //console.log("socket Connected",socket)
    })

}).catch(error => {
    console.log(error);
})  