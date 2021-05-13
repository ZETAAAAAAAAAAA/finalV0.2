//引入express
var express = require('express')
var bodyParser = require('body-parser')

var app =express()
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended:false })

process.env.PORT = 2000;
//引入Mongoose
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/test')

mongoose.connection.once("open",function(){
  console.log("connection successful")
})

//配置数据库
var Schema = mongoose.Schema

var userSchema = new Schema({
    username:String,
    userpassword:String,
    userRank:Number,
    userIns:String
})

var UserModel = mongoose.model("user",userSchema)

var itemSchema=new Schema({
    itemName:String,
    itemNumber:String,
    itemContent:String,
    itemBasis:String,
    itemCondtion:String,
    itemMaterials:String,
    itemTimelimit:String,
    itemHotline:Number,
/*  1：一级审核员待审核
    2：一级审核员通过，二级审核员待审核
    3：二级审核员通过
    4：拒绝 */
    itemState:Number,
    itemReason1:String,
    itemReason2:String,
    itemFile:String
})

var ItemModel = mongoose.model("item",itemSchema)

var fileSchema = new Schema({
  fileName:String,
  username:String,
  userRank:String,
  item_id:String,
  itemState_beforeOperate:String,
  operationTime:String,
  operationType:String,
})

var FileModel= mongoose.model("file",fileSchema)


//配置Express
//测试
app.get('/',function(req,res){
  var responseObject={
    name:"lsj"
  }
  res.send(responseObject)
})

//注册
app.post('/api/register',jsonParser,function(req,res){
  UserModel.findOne({username:req.body.username},function(err,doc){
    if(err) {return handleError(err)} 
       if(doc==null){

        UserModel.create({
          username:req.body.username,
          userpassword:req.body.userpassword,
          userRank:req.body.userRank
         },function(err){
          if(!err){
              res.send('registered successfully')
          }
        })
         
       }else{
         res.send("username exists")
       }
  })

})

//登录
app.post('/api/login',jsonParser,function(req,res){

  UserModel.findOne({username:req.body.username},function(err,doc){

    if(err) {return handleError(err)} 

    if(doc==null){res.send([{state:1}])}
    else{

      if(doc.userpassword==req.body.userpassword){
      const resdoc=[{
        state:0
      },doc]
      res.send(resdoc)
      }else{
      res.send([{state:1}])
      }

    }
  })
})

//修改个人信息
app.post('/api/setUser',jsonParser,function(req,res){
  UserModel.updateOne({username:req.body.username},{$set:{userIns:req.body.userIns}},function(err){
    if(err) {return handleError(err)}
    res.send("success") 
  })
})
//获得个人信息
app.post('/api/reqUser',jsonParser,function(req,res){
  UserModel.findOne({username:req.body.username},function(err,doc){
    if(err) {return handleError(err)}
    res.send(doc) 
  })
})


//添加item
app.post('/api/add',jsonParser,function(req,res){
  ItemModel.create({
    itemName:req.body.itemName,
    itemNumber:req.body.itemNumber,
    itemContent:req.body.itemContent,
    itemBasis:req.body.itemBasis,
    itemCondtion:req.body.itemCondtion,
    itemMaterials:req.body.itemMaterials,
    itemTimelimit:req.body.itemTimelimit,
    itemHotline:req.body.itemHotline,
    itemState:1
  },function(err){
    if(!err){
      console.log("success");
      res.send('registered successfully')
    }
  })
})

//刷新item
app.post('/api/reqitem',jsonParser,function(req,res){
  ItemModel.find({itemState:req.body.itemState},function(err,docs){
    if(err) {return handleError(err)}
    res.send(docs) 
  })
})

/* //通过事项
app.post('/passitem',jsonParser,function(req,res){
  if (req.body.userRank==1){
    ItemModel.updateOne({_id:req.body._id},{$set:{itemState:2}},function(err){
      if(err) {return handleError(err)}
      res.send("success，2")
    })
  }else{
    ItemModel.updateOne({_id:req.body._id},{$set:{itemState:3}},function(err){
      if(err) {return handleError(err)}
      res.send("success，3")
    })
  }
})

//拒绝事项
app.post('/rejectitem',jsonParser,function(req,res){
  ItemModel.updateOne({_id:req.body._id},{$set:{itemState:4,itemReason:req.body.itemReason}},
    function(err){
      if(err) {return handleError(err)}
      res.send('success')
    })
}) */

//请求所有事项
app.post('/api/reqall',jsonParser,function(req,res){
  ItemModel.find({},function(err,docs){
    if(err) {return handleError(err)}
    res.send(docs) 
  })
})
//审核

function writeCurrentDate() {
  var now = new Date();
  var year = now.getFullYear(); //得到年份
  var month = now.getMonth();//得到月份
  var date = now.getDate();//得到日期
  var day = now.getDay();//得到周几
  var hour = now.getHours();//得到小时
  var minu = now.getMinutes();//得到分钟
  var sec = now.getSeconds();//得到秒
  var week;
  month = month + 1;
  if (month < 10) month = "0" + month;
  if (date < 10) date = "0" + date;
  if (hour < 10) hour = "0" + hour;
  if (minu < 10) minu = "0" + minu;
  if (sec < 10) sec = "0" + sec;
  var time = "";
  time = year + "-" + month + "-" + date  + " " + hour + ":" + minu + ":" + sec + " " ;
  return time
}

app.post('/api/checkItem',jsonParser,function(req,res){

  //事项状态
  if(req.body.checkOperation==2){
    ItemModel.updateOne({_id:req.body.item_id},{$set:{itemState:4}},function(err){
      if(err) {return handleError(err)}
    })
  }else{
    let newitemState=req.body.itemState+1
    ItemModel.updateOne({_id:req.body.item_id},{$set:{itemState:newitemState}},function(err){
      if(err) {return handleError(err)}
    })
  }

  //审核意见
  if(req.body.userRank==1){
    ItemModel.updateOne({_id:req.body.item_id},{$set:{itemReason1:req.body.checkReason}},function(err){
      if(err) {return handleError(err)}
    })
  }else{
    ItemModel.updateOne({_id:req.body.item_id},{$set:{itemReason2:req.body.checkReason}},function(err){
      if(err) {return handleError(err)}
    })
  } 
//修改file
  FileModel.updateOne({item_id:req.body.item_id,itemState_beforeOperate:req.body.itemState},
    {$set:{username:req.body.username,
           operationType:req.body.checkOperation,
           operationTime:writeCurrentDate(),
           userRank:req.body.userRank}},function (err) {
      if(err) {return handleError(err)}
      res.send('success')
    })
    console.log(req.body)
})

app.post('/api/reqDetailTable',jsonParser,function(req,res){
  FileModel.find({item_id:req.body.item_id},function(err,docs){
    if(err) {return handleError(err)}
    res.send(docs)
    console.log(req.body) 
  })
})

//搜索事项
app.post('/api/searchitem',jsonParser,function(req,res){

  var searchContent=req.body.searchContent
  var searchState=req.body.searchState

  if(req.body.searchState==""||req.body.searchState==0){

    if(req.body.searchClass=="itemNumber"){
     ItemModel.find({itemNumber:{$regex:searchContent}},function(err,docs){
      if(err) {return handleError(err)}
      res.send(docs)
    })}

    if(req.body.searchClass=="itemName"){
      ItemModel.find({itemName:{$regex:searchContent}},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
    if(req.body.searchClass=="itemContent"){
      ItemModel.find({itemContent:{$regex:searchContent}},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
    if(req.body.searchClass=="itemBasis"){
      ItemModel.find({itemBasis:{$regex:searchContent}},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
    if(req.body.searchClass==""){
      ItemModel.find({},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
  
  }else{
    if(req.body.searchClass=="itemNumber"){
      ItemModel.find({itemNumber:{$regex:searchContent},itemState:searchState},function(err,docs){
       if(err) {return handleError(err)}
       res.send(docs)
     })}

     if(req.body.searchClass=="itemName"){
      ItemModel.find({itemName:{$regex:searchContent},itemState:searchState},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
    if(req.body.searchClass=="itemContent"){
      ItemModel.find({itemContent:{$regex:searchContent},itemState:searchState},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
    if(req.body.searchClass=="itemBasis"){
      ItemModel.find({itemBasis:{$regex:searchContent},itemState:searchState},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
    if(req.body.searchClass==""){
      ItemModel.find({itemState:searchState},function(err,docs){
        if(err) {return handleError(err)}
        res.send(docs)
    })}
  }
  
})

//上传文件
/* function getNowFormatDate() {
  var date = new Date();
  var seperator1 = "-";
  var month = date.getMonth() + 1;
  var strDate = date.getDate();
  if (month >= 1 && month <= 9) {
      month = "0" + month;
  }
  if (strDate >= 0 && strDate <= 9) {
      strDate = "0" + strDate;
  }
  var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;
  return currentdate.toString();
} */
var path = 'public/file/'
//将图片放到服务器
var multer = require('multer')
var storage = multer.diskStorage({
  // 如果你提供的 destination 是一个函数，你需要负责创建文件夹
  destination: path,
  //给上传文件重命名，获取添加后缀名
  filename: function (req, file, cb) {
      cb(null, Math.round(Math.random() * 1E9)+'-'+file.originalname);
   }
}); 
var upload = multer({
  storage: storage
});

app.post('/api/upload',upload.single('file'),function(req,res,next){
  console.log(req.file)//req.file文件的具体信息
  FileModel.findOne({item_id:req.body.item_id,itemState_beforeOperate:req.body.itemState},function(err,doc){
    if(err) {return handleError(err)}
    if(doc==null){
        FileModel.create({
          fileName:req.file.filename,
          item_id:req.body.item_id,
          itemState_beforeOperate:req.body.itemState
        },function(err){
          if(!err){
            console.log(req.body);
          }
        })
      res.send('create')
    }else{
      FileModel.updateOne({item_id:req.body.item_id,itemState_beforeOperate:req.body.itemState},
        {$set:{fileName:req.file.filename}},function (err) {
          if(err) {return handleError(err)}
        })
      res.send('update')
      console.log(req.body)
    }
  })

})

//下载
app.use(express.static('public'))



app.listen(2000)
console.log('listen')