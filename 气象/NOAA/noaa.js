//导入必要的包
let fs = require('fs');
let readMultipleFiles = require('read-multiple-files');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

/*
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
*/

const config = {
    stationNumber: '51076', //站号n1，后面还有n2,n3

    yearStart: '1929', //起始年份，默认1929
    yearEnd: '', //结束年份，为空则是当前年份
    month: 0, //0 = 全年, 1 = 一月, ... , 12 = 十二月
    
    order: 'asc', //asc(从小到大、从低到高，从早到晚), desc
    item: 'min', //date, min, avg, max
    showNumber: 10, //显示多少个结果
    
    consoleAll: 0, //是否console所有筛选过、纳入考察的数组。0 = 否，1 = 是

    n2: '0',
    n3: '99999',
    noaaLocation: 'D:/NOAA Data/', //NOAA csv文件根目录

    options: [ //选择要考察哪些列，忽略其他不需要的列
        'STATION',
        'DATE',
        'LATITUDE',
        'LONGITUDE',
        'ELEVATION',
        'NAME',
        'TEMP',
        'TEMP_ATTRIBUTES',
        'MAX',
        'MIN'
    ]
}

//目标信息：站号、起止年份(最早开始年份：1929)
let n1 = config.stationNumber; //data type: string
let n2 = config.n2;
let n3 = config.n3;
let n = n1 + n2 + n3;
//起始年份
let y1 = config.yearStart;
//结束年份
let date = new Date().toISOString();
let dateAndTimeArr = date.split('T');
let dateArr = dateAndTimeArr[0].split('-');
let y2 = config.yearEnd.length === 4 ? config.yearEnd : dateArr[0];

//初始化工具对象
let tools = new Tools();

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
let fileCount = 0;
let arrOfRecordedYears = [];
prePaths.forEach((v) => {
    if(fs.existsSync(v)){
        let tempArr = v.split('/');
        arrOfRecordedYears.push(tempArr[2]);
        fileCount += 1;
        paths.push(v);
    }
});

//批量异步依次读取csv文件内容
let sourceStr = '';
readMultipleFiles(new Set(paths), 'utf8').subscribe({
    next(result){
        sourceStr += result.contents;
    },
    complete(){
        let result = new Result();
        result.consoleResult();
    }
});

//显示结果
function Result(){
    this.consoleResult = consoleResult;
    //极端低温
    function consoleResult(){
        let csv = new Csv(sourceStr);
        let startArr = csv.getSortedArrOfCsv().arr; //getArrOfSelectedColumns(csv.getSortedArrOfCsv().arr);

        let obj0 = startArr[0];
        //let station0 = obj0.STATION;
        let name = obj0['NAME'];
        let elev = obj0['ELEVATION'];
        let lat = obj0['LATITUDE'];
        let lon = obj0['LONGITUDE'];
        
        //这里整理一下年份console格式，都是简单细活，没啥技术含量
        console.log('\n(' + y1 + '-' + y2 + ') | 共 ' + fileCount + ' 年、(筛)' + startArr.length + '/(总)' + csv.getSortedArrOfCsv().totalDaysBeforeSort + ' 天');
        let strA = ''; //输出年，多行str
        let cnt = 0; //计数
        arrOfRecordedYears.forEach((v) => {
            if(cnt < 9){ //这里必须比目标数小1，一行10个，这里必须是 <9
                strA += v + ' ';
                cnt += 1;
            }else{
                strA += v + '\n';
                cnt = 0;
            }
        });
        console.log(strA);
        console.log('\n站号 ' + config.stationNumber + ' | 站名 ' + name);
        console.log('海拔 ' + elev + '(m) | 坐标 (' + lat + ', ' + lon + ')\n');

        for(let i = 0; i < config.showNumber; i++){
            let tempObj = startArr[i];
            let date = tempObj.DATE;
            let min = tempObj['MIN'] === undefined ? undefined : (tempObj['MIN']);
            let avg = tempObj['TEMP'] === undefined ? undefined : (tempObj['TEMP']);
            let max = tempObj['MAX'] === undefined ? undefined : (tempObj['MAX']);
            let avgAttr = tempObj['TEMP_ATTRIBUTES'] === undefined ? undefined : tempObj['TEMP_ATTRIBUTES'];
            console.log(tools.FN(i+1, config.showNumber) + '\t' + date + '\tmin: ' + min + '\tavg: ' + avg + '\tmax: ' + max + '\t\t avg = sum / ' + avgAttr);
        }
        
        if(config.consoleAll){
            console.table(startArr);
        }
    }
}

//选择需要的列比如气温相关列，舍弃不需要的列比如风速、降水等
/* function getArrOfSelectedColumns(arr){
    let newArr = [];
    arr.forEach((v) => {
        let obj = {};
        config.options.forEach((vo) => {
            obj[vo] = v[vo];
        });

        newArr.push(obj);
    });
    return newArr;
} */

//获取原始数组。将读取的多个文件内容sourceStr放入数组sourceArr中
//CSV String to Array
function Csv(str){
    let arrOfCsv = [];
    let tempRowArr = str.split('\n');
    let rowArr = [];
    let regRowStr = /[\d\w]+/i; //行字符串必须有内容，不能只有引号
    tempRowArr.forEach((v) => {
        if(regRowStr.test(v)){
            rowArr.push(v);
        }
    });
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

    //获取非标题行内容，忽略多行重复的标题str
    //获取csv行，尽兴以下处理：检查异常值(空、错误值等)、转换温度单位(华氏转摄氏)、限制数值小数点后位数、还有最复杂的排序(根据设置)
    function getSortedArrOfCsv(){
        let totalDays = 0;
        rowArr.forEach((v) => {
            let strOfRows = v.trim();
            let arrayOfRowCells = [];
            let tempArrOfRowCells = strOfRows.replace(regExp, '\t').split('\t');
            tempArrOfRowCells.forEach((v1) => {
                if(v1.length > 0){
                    arrayOfRowCells.push(v1.trim());
                }
            });

            let strOfMonthNumber = tools.FN(config.month, 12);
            let tempRegExp = new RegExp('-' + strOfMonthNumber + '-', 'i');
            
            //如果不是某个csv文件的标题行，达到了剔除标题行的目的
            if(arrayOfRowCells[0] !== 'STATION'){
                totalDays += 1;
                let lenOfRowArr = arrayOfRowCells.length;
                let tempObj = {};
                if(config.month !== 0){//0 = 全年，非0则是筛选到单月
                    if(tempRegExp.test( arrayOfRowCells[1] )){
                        for(let i=0; i<lenOfRowArr; i++){
                            tempObj[getArrOfTitles()[i]] = arrayOfRowCells[i];
                        }
                        arrOfCsv.push(tempObj);
                    }
                }else{ //全年
                    for(let i=0; i<lenOfRowArr; i++){
                        tempObj[getArrOfTitles()[i]] = arrayOfRowCells[i];
                    }
                    arrOfCsv.push(tempObj);
                }
            }
        });

        //剔除不需要的列，保留需要的列，缩小对象数组体积，提高效率
        let newArr = [];
        arrOfCsv.forEach((v) => {
            let obj = {};
            config.options.forEach((vo) => {
                obj[vo] = v[vo];
            });
            newArr.push(obj);
        });
        
        //检查气温相关项的值，是否为空、是否正常，并转换温度单位
        newArr.forEach((v) => {
            v['MIN'] = tools.isValidTempF(v['MIN']) ? tools.TFC(v['MIN']).toFixed(1) : undefined;
            v['TEMP'] = tools.isValidTempF(v['TEMP']) ? tools.TFC(v['TEMP']).toFixed(1) : undefined;
            v['MAX'] = tools.isValidTempF(v['MAX']) ? tools.TFC(v['MAX']).toFixed(1) : undefined;
        });

        //根据config决定排序方式
        let ci = config.item;
        let co = config.order;
        let sortElements = [
            { 'condition': ci === 'min', 'attrName': 'MIN' },
            { 'condition': ci === 'avg', 'attrName': 'TEMP' },
            { 'condition': ci === 'max', 'attrName': 'MAX' }
        ];
        //按气温相关列(低温、均温、高温)的值排序，正序或倒序
        sortElements.forEach((vs, is) => {
            if(vs['condition']){
                newArr.sort((a, b) => {
                    return tools.sortUndefinedObj( a[`${sortElements[is]['attrName']}`], b[`${sortElements[is]['attrName']}`], config.order);
                });    
            }
        });
        //按记录日期顺序排序，需要先将日期转化为毫秒，再排序
        if(ci === 'date'){
            if(co === 'asc'){
                newArr.sort((a, b) => Date.parse(a.DATE) - Date.parse(b.DATE));
            }else if(co === 'desc'){
                newArr.sort((a, b) => Date.parse(b.DATE) - Date.parse(a.DATE));
            }
        }
        return {
            'arr': newArr,
            'totalDaysBeforeSort': totalDays
        };
    }

    //定义私有方法等号右边函数后面没有括号！
    this.getArrOfTitles = getArrOfTitles;
    this.getSortedArrOfCsv = getSortedArrOfCsv;
}

//所有需要的各类简单工具函数
function Tools(){
    function sortUndefinedObj(a, b, order){
        if(a === undefined && b === undefined){
            return 0;
        }else if(a === undefined){
            return 1;
        }else if(b === undefined){
            return -1;
        }else{
            return order === 'asc' ? a - b : b - a;
        }
    }

    //判断气温记录是否在正常范围，正常范围：华氏度-166 ~ 158，也就是摄氏度-110 ~ 70
    //判断华氏度str输入，华氏度正常气温范围：-166 ~ 158
    function isValidTempF(fvStr){
        let fv = Number(fvStr);
        if(fv < -166 || fv > 158){
            return false;
        }else{
            return true;
        }
    }

    //判断两个yyyy-mm-dd格式的日期是否相邻，统计连续天数的时候有用！

    //序号位数不够时前面补零
    function FN(n, maxNumber){
        let result = '';
        let preStr = '';
        let zeroStr = '0';
        let numberMax = Math.pow(10, maxNumber.toString().length);
        let w1 = n.toString().length;
        let w2 = numberMax.toString().length;
        if(w1 < w2){
            let diff = w2 - w1;
            for(let i = 1; i < diff; i++){
                preStr += zeroStr;
            }
            result = preStr + n.toString();
        }else{
            result = n.toString();
        }
        return result;
    }

    //气温单位华氏度转摄氏度
    function TFC(fvStr){
        let cv = ((Number(fvStr) - 32) * (5/9));
        return cv;
    }

    this.sortUndefinedObj = sortUndefinedObj;
    this.isValidTempF = isValidTempF;
    this.FN = FN;
    this.TFC = TFC;
}