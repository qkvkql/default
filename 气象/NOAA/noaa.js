//导入必要的包
let fs = require('fs');
let readMultipleFiles = require('read-multiple-files');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//从html页面获取并操作数据
const app = express(); //使用express module创建新的app
app.set('view engine', 'ejs'); //决定使用ejs渲染模板
app.set("views", __dirname); //设置.ejs html模板文件存放在哪个目录
app.use(bodyParser.urlencoded({extended: true})); //准备工作
//从哪个html页面获取
app.get("/",function(req, res){res.sendFile(__dirname + "/index.html");});
//获取什么，然后怎么操作
app.post("/",
    function(req, res){
        let num1 = Number(req.body.num1);
        let num2 = Number(req.body.num2);
        let result = num1 + num2;
        res.render('template', { addition: result });
    });
app.listen(3000, function(){console.log("server is running on port 3000");})

let config = {
    stationNumber: '51542', //站号n1，后面还有n2,n3
    sortFirst: 'low', //最低、最高
    target: 'min', //夜温、均温、昼温
    showNumber: 50, //显示多少个结果
    n2: '0',
    n3: '99999',
    noaaLocation: 'D:/NOAA Data/', //NOAA csv文件根目录
    yearStart: '1929', //起始年份，默认1929
    yearEnd: '2025' //结束年份
}

//目标信息：站号、起止年份(最早开始年份：1929)
let n1 = config.stationNumber; //data type: string
let n2 = config.n2;
let n3 = config.n3;
let n = n1 + n2 + n3;
let y1 = config.yearStart;
let date = new Date().toISOString();
let dateAndTimeArr = date.split('T');
let dateArr = dateAndTimeArr[0].split('-');
let y2 = dateArr[0];

//收集所有目标csv文件地址到数组paths
let prePaths = [];
let p1 = config.noaaLocation;
let p3 = '/';
let p5 = '.csv';
for(let i = Number(y1); i <= Number(y2); i++){
    let path = '';
    path = p1 + i.toString() + p3 + n + p5;
    prePaths.push(path);
}
let paths = [];
prePaths.forEach((v) => {
    if(fs.existsSync(v)){
        paths.push(v);
    }
});

//批量异步依次读取csv文件内容
let sourceStr = '';
readMultipleFiles(new Set(paths), 'utf8').subscribe({
    next(result) {
        sourceStr += result.contents;
    },
    complete() {
        let result = new Result();
        //result.showLowestList();
    }
});

//显示结果
function Result(){
    //极端低温
    function showLowestList(){
        let ins = new Csv(sourceStr);
        let arrOfCsv = ins.getArrOfCsv();

        let obj0 = arrOfCsv[0];
        let station0 = obj0.STATION;
        let name0 = obj0.NAME;
        let elevation0 = obj0.ELEVATION;
        let latitude0 = obj0.LATITUDE;
        let longitude0 = obj0.LONGITUDE;
        console.log('站名: ' + name0 + ';\n站号: ' + station0 + '\n海拔：' + elevation0 + '\n纬度：' + latitude0 + '\n经度：' + longitude0 + '\n');

        for(let i = 0; i < config.showNumber; i++){
            let tempObj = arrOfCsv[i];
            let date = tempObj.DATE;
            let avg = TFC(tempObj.TEMP);
            let min = TFC(tempObj.MIN);
            let max = TFC(tempObj.MAX);
            console.log(FN(i+1) + '\t' + date + '\tmin:' + min + ';\tavg:' + avg + ';\tmax:' + max);
        }
    }
    this.showLowestList = showLowestList;
}

//将读取的多个文件内容sourceStr放入数组sourceArr中
//CSV String to Array
function Csv(str){
    let arrOfCsv = [];
    let rowArr = str.split('\n');
    let regExp = /(\"\,\")|(^\")|(\"$)/g;

    //标题行
    //获取csv列标题
    function getArrOfTitles(){
        let titleStr = rowArr[0].trim(); //标题在文件第一行
        let titleArr = [];
        //把titleStr转换成标题数组
        let tempArrOfTitles = titleStr.replace(regExp, '\t').split('\t');
        tempArrOfTitles.forEach((v) => {
            if(v.length > 0){
                titleArr.push(v.trim());
            }
        });

        return titleArr;
    }

    //非标题行
    //获取csv行
    function getArrOfCsv(){
        rowArr.forEach((v) => {
            let strOfRowCells = v.trim();
            let arrayOfRowCells = [];
            let tempArrOfRowCells = strOfRowCells.replace(regExp, '\t').split('\t');
            tempArrOfRowCells.forEach((v) => {
                if(v.length > 0){
                    arrayOfRowCells.push(v.trim());
                }
            });
            //如果不是某个csv文件的标题行
            if(arrayOfRowCells[0] !== 'STATION'){
                let tempObj = {};
                for(let i = 0; i < arrayOfRowCells.length; i++){
                    tempObj[getArrOfTitles()[i]] = arrayOfRowCells[i];
                }
                arrOfCsv.push(tempObj);
            }
        });

        //根据config设置决定排序方式
        let ct = config.target;
        let cs = config.sortFirst;
        if(ct === 'min'){
            if(cs === 'low'){
                arrOfCsv.sort((a, b) => a.MIN - b.MIN);
            }else if(cs === 'high'){
                arrOfCsv.sort((a, b) => b.MIN - a.MIN);
            }
        }else if(ct === 'avg'){
            if(cs === 'low'){
                arrOfCsv.sort((a, b) => a.TEMP - b.TEMP);
            }else if(cs === 'high'){
                arrOfCsv.sort((a, b) => b.TEMP - a.TEMP);
            }
        }else if(ct === 'max'){
            if(cs === 'low'){
                arrOfCsv.sort((a, b) => a.MAX - b.MAX);
            }else if(cs === 'high'){
                arrOfCsv.sort((a, b) => b.MAX - a.MAX);
            }
        }
        return arrOfCsv;
    }

    //定义私有方法等号右边函数后面没有括号！
    this.getArrOfTitles = getArrOfTitles;
    this.getArrOfCsv = getArrOfCsv;
}

//气温单位华氏度转摄氏度
function TFC(fv){
    let cv = ((fv - 32) * (5/9)).toFixed(1);
    return cv;
}
//序号位数不够时前面补零
function FN(n){
    let showNumber = config.showNumber;
    let result = '';
    let preStr = '';
    let zeroStr = '0';
    let numberMax = Math.pow(10, showNumber.toString().length);
    let w1 = n.toString().length;
    let w2 = numberMax.toString().length;
    if(w1 < w2){
        let diff = w2 - w1;
        for(let i = 0; i < diff; i++){
            preStr += zeroStr;
        }
        result = preStr + n.toString();
    }else{
        result = n.toString();
    }
    return result;
}