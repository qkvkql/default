//导入必要的包
let fs = require('fs');
let readMultipleFiles = require('read-multiple-files');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//配置对象，用于设置筛选条件
const config = {
    stationNumber: '31338', //站号n1，后面还有n2,n3

    dateStart: '1961-01-01',
    dateEnd: '1990-12-31',
    //yearStart: '1929', //起始年份，默认1929
    //yearEnd: '', //结束年份，为空则是当前年份
    month: 1, //0 = 全年, 1 = 一月, ... , 12 = 十二月
    
    order: 'asc', //asc(从小到大、从低到高，从早到晚), desc
    item: 'min', //date, min, avg, max
    showNumber: 10, //显示多少个结果

    monthValidCount: 20, //某个月的avg/min/max至少有20个正常记录，才算一个有效avg/min/max月,才会计算有参考价值的月度均值
    consec: { 
        direction: 0, //连续记录考察方向，0代表小于等于临界值，1代表大于等于临界值
        temperature: '-30' //连续记录临界值
    },
    
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

//初始化工具对象
let tools = new Tools();

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

//目标信息：站号、起止年份(最早开始年份：1929)
let n1 = config.stationNumber; //data type: string
let n2 = config.n2;
let n3 = config.n3;
let n = n1 + n2 + n3;
//起始日期
let y1 = config.dateStart.split('-')[0];
let d1 = config.dateStart;
//let y1 = config.yearStart;
//结束日期
let y2 = config.dateEnd.split('-')[0].length === 4 ? config.dateEnd.split('-')[0] : tools.getCurrentDate().YEAR;
let d2 = config.dateEnd.length === 10 ? config.dateEnd : tools.getCurrentDate().YMD;

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
    //console打印结果
    function consoleResult(){
        let csv = new Csv(sourceStr);
        let startObj = csv.getSortedArrOfCsv();

        let obj0 = startObj.arr[0];
        //let station0 = obj0.STATION;
        let name = obj0['NAME'];
        let elev = obj0['ELEVATION'];
        let lat = obj0['LATITUDE'];
        let lon = obj0['LONGITUDE'];
        
        //这里整理一下年份console格式，都是简单细活，没啥技术含量
        console.log('\nDATE RANGE: [ ' + d1 + ', ' + d2 + ' ]');
        console.log('YEAR(S) INVOLVED: ' + + fileCount);
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
        console.log('DAY(S) RECORDED: ' + startObj.totalDaysBeforeSort);
        console.log('DAY(S) SELECTED: ' + startObj.arr.length);
        //站点信息
        console.log('\n' + config.stationNumber + ' | ' + name);
        console.log(elev + '(m) | ( ' + lat + ', ' + lon + ' )\n');

        for(let i = 0; i < config.showNumber; i++){
            if(!startObj.arr[i]){ break; }//如果筛选出的天数小于预定展示天数，直接结束循环
            let tempObj = startObj.arr[i];
            let date = tempObj.DATE;
            let min = tempObj['MIN'] === undefined ? undefined : (tempObj['MIN']);
            let avg = tempObj['TEMP'] === undefined ? undefined : (tempObj['TEMP']);
            let max = tempObj['MAX'] === undefined ? undefined : (tempObj['MAX']);
            let avgAttr = tempObj['TEMP_ATTRIBUTES'] === undefined ? undefined : tempObj['TEMP_ATTRIBUTES'];
            console.log(tools.FN(i+1, config.showNumber) + '\t' + date + '\tmin: ' + min + '\tavg: ' + avg + '\tmax: ' + max + '\t\t avg = sum / ' + avgAttr);
        }
        
        if(config.consoleAll){
            console.table(startObj.arr);
        }
    }
}

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
        
        //以下统计功能的对象详细格式参考.txt文档，这些对象总计100多个细分属性
        let stat_YM = {}; //某年某月，比如'1960-01'
        
        let stat_M = {}; //某个月份，比如'01'
        let arrOfMonthStr = []; //月份字符数组，12个元素
        for(let i=1; i<=12; i++){ arrOfMonthStr.push(tools.FN(i, 12)); }
        arrOfMonthStr.forEach((v) => {
            stat_M[v] = {};
        });

        let stat_Y = {}; //某年，比如'1969'
        let stat_MD = {}; //某月某日，比如'01-20'
        let stat_Consec = {}; //连续记录

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
            let monthRegExp = new RegExp('-' + strOfMonthNumber + '-', 'i');
            
            //如果不是某个csv文件的标题行，达到了剔除标题行的目的
            if(arrayOfRowCells[0] !== 'STATION'){
                totalDays += 1;
                let lenOfRowArr = arrayOfRowCells.length;
                let tempObj = {};
                if(config.month !== 0){//0 = 全年，非0则是筛选到单月
                    if(monthRegExp.test( arrayOfRowCells[1] )){
                        for(let i=0; i<lenOfRowArr; i++){
                            tempObj[getArrOfTitles()[i]] = arrayOfRowCells[i];
                        }
                        arrOfCsv.push(tempObj);
                    }
                }else{ //全年
                    let tc1 = Date.parse(arrayOfRowCells[1]) >= Date.parse(d1);
                    let tc2 = Date.parse(arrayOfRowCells[1]) <= Date.parse(d2);
                    
                    //如果日期不在设置范围内，则忽略本次循环，forEach函数忽略本次循环不用continue，用return
                    if(!tc1 || !tc2){ return; }
                    //如果日期在设置范围内，则正常执行本次循环内容
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


        /************************ START START ************************/
        /************************ 超复杂统计部分 ************************/
        /************************ START START ************************/
        /************************ START START ************************/
        //临时存储对象
        let vObj_YM = {}; //某年某月
        let vObj_M = {}; //某个月份
        let vObj_Y = {}; //某年
        let vObj_MD = {}; //某月某日
        let vObj_consec = {}; //连续记录
        let consec_count = 0;
        let consec_isNewConsec = true;
        let consec_dateStart = '';
        let consec_dateEnd = '';

        newArr.forEach((v) => {
            let temp_YMD_Arr = v['DATE'].split('-');
            
            //日期片段
            let temp_YM_Str = temp_YMD_Arr[0] + '-' + temp_YMD_Arr[1];
            let temp_M_Str = temp_YMD_Arr[1];
            let temp_Y_Str = temp_YMD_Arr[0];
            let temp_MD_Str = temp_YMD_Arr[1] + '-' + temp_YMD_Arr[2];
            
            //某年某月
            if(!stat_YM.hasOwnProperty(temp_YM_Str)){
                vObj_YM = {};
                vObj_YM.dayCount = 0;
                vObj_YM.dayCountForMin = 0;
                vObj_YM.dayCountForAvg = 0;
                vObj_YM.dayCountForMax = 0;
                vObj_YM.minArr = [];
                vObj_YM.avgArr = [];
                vObj_YM.maxArr = [];
                vObj_YM.valid = {
                    'avgForMin': undefined,
                    'avg': undefined,
                    'avgForMax': undefined
                }
            }
            vObj_YM.dayCount += 1; //无论是否有undefined，日数都加1

            if(v['MIN'] !== undefined){
                vObj_YM.minArr.push( Number(v['MIN']) );
                vObj_YM.dayCountForMin += 1;
                vObj_YM.min = Math.min(...vObj_YM.minArr);
                vObj_YM.avgForMin = tools.getAvgForNumberArr(vObj_YM.minArr);
                vObj_YM.maxForMin = Math.max(...vObj_YM.minArr);
                if(vObj_YM.minArr.length >= config.monthValidCount){vObj_YM.valid.avgForMin = tools.getAvgForNumberArr(vObj_YM.minArr)}
            }
            if(v['TEMP'] !== undefined){
                vObj_YM.avgArr.push( Number(v['TEMP']) );
                vObj_YM.dayCountForAvg += 1;
                vObj_YM.minForAvg = Math.min(...vObj_YM.avgArr);
                vObj_YM.avg = tools.getAvgForNumberArr(vObj_YM.avgArr);
                vObj_YM.maxForAvg = Math.max(...vObj_YM.avgArr);
                if(vObj_YM.avgArr.length >= config.monthValidCount){vObj_YM.valid.avg = tools.getAvgForNumberArr(vObj_YM.avgArr)}
            }
            if(v['MAX'] !== undefined){
                vObj_YM.maxArr.push( Number(v['MAX']) );
                vObj_YM.dayCountForMax += 1;
                vObj_YM.minForMax = Math.min(...vObj_YM.maxArr);
                vObj_YM.avgForMax = tools.getAvgForNumberArr(vObj_YM.maxArr);
                vObj_YM.max = Math.max(...vObj_YM.maxArr);
                if(vObj_YM.maxArr.length >= config.monthValidCount){vObj_YM.valid.avgForMax = tools.getAvgForNumberArr(vObj_YM.maxArr)}
            }
            stat_YM[temp_YM_Str] = vObj_YM; //完成一个键值对

            //某个月份
            if(!stat_M.hasOwnProperty(temp_M_Str)){ stat_M[temp_M_Str] = {}; }
            
            //某年
            if(!stat_Y.hasOwnProperty(temp_Y_Str)){ stat_Y[temp_Y_Str] = {}; }
            
            //某月某日
            if(!stat_MD.hasOwnProperty(temp_MD_Str)){ stat_MD[temp_MD_Str] = {}; }
            
            //连续记录
        });
        /************************ END END END ************************/
        /************************ END END END ************************/
        /************************ 超复杂统计部分 ************************/
        /************************ END END END ************************/


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

        console.log(stat_YM);
        /* let x = Object.keys(stat_YM);
        x.sort((a, b) => {
            return Date.parse(b) - Date.parse(a);
        });
        console.log(x); */
        /************************ 这个return返回所有数据，量超大 ************************/
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
    //求均值
    function getAvgForNumberArr(arr){
        let sum = 0;
        let len = arr.length;
        arr.forEach((v) => {
            sum += v;
        });
        return len > 0 ? (sum/len).toFixed(1) : undefined;
    }
    //获取2个日期相隔多少天
    function getDateDiff(dateStr1, dateStr2){
        let date1 = new Date(dateStr1);
        let date2 = new Date(dateStr2);
        let diffOfMilliSeconds = date2.getTime() - date1.getTime();
        return Math.round(diffOfMilliSeconds/(1000 * 3600 * 24));
    }
    //获取当前日期YMD
    function getCurrentDate(){
        let date = new Date().toISOString();
        let dateAndTimeArr = date.split('T');
        let dateArr = dateAndTimeArr[0].split('-');
        return {
            'YEAR': dateArr[0],
            'YMD': dateAndTimeArr
        }
    }
    //在对象数组中，把包含undefined值的对象排到后面
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

    this.getAvgForNumberArr = getAvgForNumberArr;
    this.getDateDiff = getDateDiff;
    this.getCurrentDate = getCurrentDate;
    this.sortUndefinedObj = sortUndefinedObj;
    this.isValidTempF = isValidTempF;
    this.FN = FN;
    this.TFC = TFC;
}