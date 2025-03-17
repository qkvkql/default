//导入必要的包
let fs = require('fs');
let readMultipleFiles = require('read-multiple-files');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//配置对象，用于设置筛选条件
const config = {
    stationObj: {
        USAF: '24477',
        //留空则默认为99999，长度小于5则前面自动补0
        WBAN: '99999'
    },

    dateStart: '1929-01-01',
    dateEnd: '2025-12-31',
    month: 0, //0 = 全年, 1 = 一月, ... , 12 = 十二月。这个月份不能填错，不然报错都找不到错误
    
    order: 'asc', //asc(从小到大、从低到高，从早到晚), desc
    item: 'min', //date, min, avg, max
    consecValue: '-50', //连续记录的临界值
    showNumber: 20, //显示多少个结果
    console: { //设置console打印哪些
        station: 0,
        overview: 0,
        M: 0,
        YM: 0,
        consec: 0,
        list: 0,
        yearRange: 0,
        allRecords: 0
    },

    //获取邻站信息
    showMultipleStation: 1, //是否切换到打印邻近站点模式
    arrOfNoOfWeatherStationNearBy: [{"USAF":"999999","WBAN":"14918","DISTANCE":"10.2"},{"USAF":"727470","WBAN":"14918","DISTANCE":"10.5"},{"USAF":"727473","WBAN":"94977","DISTANCE":"82.0"},{"USAF":"727473","WBAN":"99999","DISTANCE":"82.0"},{"USAF":"726544","WBAN":"04958","DISTANCE":"82.4"},{"USAF":"726544","WBAN":"99999","DISTANCE":"82.5"},{"USAF":"727476","WBAN":"94961","DISTANCE":"87.0"},{"USAF":"727486","WBAN":"04983","DISTANCE":"97.2"},{"USAF":"727486","WBAN":"99999","DISTANCE":"97.4"},{"USAF":"727468","WBAN":"04928","DISTANCE":"97.7"},{"USAF":"727468","WBAN":"99999","DISTANCE":"97.7"},{"USAF":"726549","WBAN":"54905","DISTANCE":"107.3"},{"USAF":"726549","WBAN":"99999","DISTANCE":"108.0"},{"USAF":"727467","WBAN":"99999","DISTANCE":"130.2"},{"USAF":"727467","WBAN":"04926","DISTANCE":"130.5"},{"USAF":"726548","WBAN":"99999","DISTANCE":"142.7"},{"USAF":"727560","WBAN":"99999","DISTANCE":"143.9"},{"USAF":"726548","WBAN":"04971","DISTANCE":"144.0"},{"USAF":"727564","WBAN":"99999","DISTANCE":"144.0"},{"USAF":"999999","WBAN":"94931","DISTANCE":"147.3"},{"USAF":"727455","WBAN":"94931","DISTANCE":"148.1"},{"USAF":"727459","WBAN":"94964","DISTANCE":"150.4"},{"USAF":"727459","WBAN":"99999","DISTANCE":"150.4"},{"USAF":"727474","WBAN":"99999","DISTANCE":"152.9"},{"USAF":"727474","WBAN":"04923","DISTANCE":"153.0"},{"USAF":"727458","WBAN":"99999","DISTANCE":"159.5"},{"USAF":"727458","WBAN":"94919","DISTANCE":"160.1"},{"USAF":"727477","WBAN":"04970","DISTANCE":"167.5"},{"USAF":"727477","WBAN":"99999","DISTANCE":"167.7"},{"USAF":"727550","WBAN":"14958","DISTANCE":"169.6"},{"USAF":"727550","WBAN":"99999","DISTANCE":"169.6"},{"USAF":"999999","WBAN":"04994","DISTANCE":"183.9"},{"USAF":"727497","WBAN":"04984","DISTANCE":"193.3"},{"USAF":"727497","WBAN":"99999","DISTANCE":"194.0"},{"USAF":"727505","WBAN":"99999","DISTANCE":"208.9"},{"USAF":"727505","WBAN":"04929","DISTANCE":"209.8"},{"USAF":"727446","WBAN":"99999","DISTANCE":"213.2"},{"USAF":"727555","WBAN":"94956","DISTANCE":"213.3"},{"USAF":"727555","WBAN":"99999","DISTANCE":"213.4"},{"USAF":"727556","WBAN":"99999","DISTANCE":"216.3"},{"USAF":"727556","WBAN":"04905","DISTANCE":"216.4"},{"USAF":"727444","WBAN":"99999","DISTANCE":"217.8"},{"USAF":"727444","WBAN":"04979","DISTANCE":"218.1"},{"USAF":"727450","WBAN":"14913","DISTANCE":"221.4"},{"USAF":"997737","WBAN":"99999","DISTANCE":"221.8"},{"USAF":"999999","WBAN":"14913","DISTANCE":"222.2"},{"USAF":"727508","WBAN":"54915","DISTANCE":"225.5"},{"USAF":"720258","WBAN":"04997","DISTANCE":"226.0"},{"USAF":"720258","WBAN":"99999","DISTANCE":"226.2"},{"USAF":"727508","WBAN":"99999","DISTANCE":"226.4"},{"USAF":"726558","WBAN":"04914","DISTANCE":"227.4"},{"USAF":"726558","WBAN":"99999","DISTANCE":"227.8"},{"USAF":"727453","WBAN":"94967","DISTANCE":"229.7"},{"USAF":"997269","WBAN":"99999","DISTANCE":"230.9"},{"USAF":"727504","WBAN":"99999","DISTANCE":"234.3"},{"USAF":"727504","WBAN":"94999","DISTANCE":"234.4"},{"USAF":"727500","WBAN":"99999","DISTANCE":"237.4"},{"USAF":"727456","WBAN":"04919","DISTANCE":"238.3"},{"USAF":"727456","WBAN":"99999","DISTANCE":"238.3"},{"USAF":"726427","WBAN":"54908","DISTANCE":"240.0"},{"USAF":"726427","WBAN":"99999","DISTANCE":"240.4"},{"USAF":"727454","WBAN":"04911","DISTANCE":"243.2"},{"USAF":"727454","WBAN":"99999","DISTANCE":"243.4"},{"USAF":"727469","WBAN":"99999","DISTANCE":"243.4"},{"USAF":"727469","WBAN":"94992","DISTANCE":"249.9"},{"USAF":"727554","WBAN":"99999","DISTANCE":"250.1"},{"USAF":"997259","WBAN":"99999","DISTANCE":"250.1"},{"USAF":"727452","WBAN":"99999","DISTANCE":"252.0"},{"USAF":"727449","WBAN":"04954","DISTANCE":"252.5"},{"USAF":"727452","WBAN":"04912","DISTANCE":"252.6"},{"USAF":"727449","WBAN":"99999","DISTANCE":"252.8"},{"USAF":"726555","WBAN":"94938","DISTANCE":"255.3"},{"USAF":"726555","WBAN":"99999","DISTANCE":"255.6"},{"USAF":"727478","WBAN":"04934","DISTANCE":"257.8"},{"USAF":"997803","WBAN":"99999","DISTANCE":"258.1"},{"USAF":"727478","WBAN":"99999","DISTANCE":"258.3"},{"USAF":"727416","WBAN":"99999","DISTANCE":"266.7"},{"USAF":"994190","WBAN":"99999","DISTANCE":"266.9"},{"USAF":"727514","WBAN":"99999","DISTANCE":"272.2"},{"USAF":"727514","WBAN":"54910","DISTANCE":"272.5"},{"USAF":"727457","WBAN":"94962","DISTANCE":"272.7"},{"USAF":"727457","WBAN":"99999","DISTANCE":"273.5"},{"USAF":"726561","WBAN":"99999","DISTANCE":"278.9"},{"USAF":"726561","WBAN":"94997","DISTANCE":"279.0"},{"USAF":"999999","WBAN":"14924","DISTANCE":"280.5"},{"USAF":"999999","WBAN":"54932","DISTANCE":"283.9"},{"USAF":"727570","WBAN":"99999","DISTANCE":"287.5"},{"USAF":"720835","WBAN":"99999","DISTANCE":"287.8"},{"USAF":"727570","WBAN":"14916","DISTANCE":"288.3"},{"USAF":"727576","WBAN":"14916","DISTANCE":"288.4"},{"USAF":"999999","WBAN":"14916","DISTANCE":"288.4"},{"USAF":"720865","WBAN":"00291","DISTANCE":"291.2"},{"USAF":"744667","WBAN":"99999","DISTANCE":"293.0"},{"USAF":"720657","WBAN":"99999","DISTANCE":"294.9"},{"USAF":"726419","WBAN":"99999","DISTANCE":"300.2"},{"USAF":"726419","WBAN":"94929","DISTANCE":"300.4"},{"USAF":"727575","WBAN":"94925","DISTANCE":"303.0"},{"USAF":"999999","WBAN":"94925","DISTANCE":"303.0"},{"USAF":"727575","WBAN":"99999","DISTANCE":"303.5"},{"USAF":"992130","WBAN":"99999","DISTANCE":"304.5"},{"USAF":"727475","WBAN":"04940","DISTANCE":"307.6"},{"USAF":"727475","WBAN":"99999","DISTANCE":"307.6"},{"USAF":"726578","WBAN":"04944","DISTANCE":"308.1"},{"USAF":"726578","WBAN":"99999","DISTANCE":"308.1"},{"USAF":"720855","WBAN":"00283","DISTANCE":"308.4"},{"USAF":"722129","WBAN":"04939","DISTANCE":"314.4"},{"USAF":"722129","WBAN":"99999","DISTANCE":"314.5"},{"USAF":"727577","WBAN":"99999","DISTANCE":"315.1"},{"USAF":"999999","WBAN":"14914","DISTANCE":"316.9"},{"USAF":"994130","WBAN":"99999","DISTANCE":"317.0"},{"USAF":"727530","WBAN":"14914","DISTANCE":"317.1"},{"USAF":"997738","WBAN":"99999","DISTANCE":"322.7"},{"USAF":"722183","WBAN":"04972","DISTANCE":"324.4"},{"USAF":"720582","WBAN":"99999","DISTANCE":"324.6"},{"USAF":"722183","WBAN":"99999","DISTANCE":"325.1"},{"USAF":"999999","WBAN":"14995","DISTANCE":"325.8"},{"USAF":"726508","WBAN":"99999","DISTANCE":"327.1"},{"USAF":"726508","WBAN":"94973","DISTANCE":"327.6"},{"USAF":"722857","WBAN":"00368","DISTANCE":"329.0"},{"USAF":"726679","WBAN":"99999","DISTANCE":"330.0"},{"USAF":"726679","WBAN":"04969","DISTANCE":"330.2"},{"USAF":"726560","WBAN":"94966","DISTANCE":"333.1"},{"USAF":"726572","WBAN":"94966","DISTANCE":"333.1"},{"USAF":"727445","WBAN":"94926","DISTANCE":"341.5"},{"USAF":"727445","WBAN":"99999","DISTANCE":"342.1"},{"USAF":"726557","WBAN":"14910","DISTANCE":"342.9"},{"USAF":"999999","WBAN":"14910","DISTANCE":"342.9"},{"USAF":"726682","WBAN":"54914","DISTANCE":"343.8"},{"USAF":"726682","WBAN":"99999","DISTANCE":"343.8"},{"USAF":"727503","WBAN":"04909","DISTANCE":"343.9"},{"USAF":"727503","WBAN":"99999","DISTANCE":"344.9"},{"USAF":"720658","WBAN":"99999","DISTANCE":"346.3"},{"USAF":"726550","WBAN":"14926","DISTANCE":"348.5"},{"USAF":"999999","WBAN":"14926","DISTANCE":"348.6"},{"USAF":"720585","WBAN":"99999","DISTANCE":"353.4"},{"USAF":"A07357","WBAN":"00182","DISTANCE":"353.4"},{"USAF":"722004","WBAN":"99999","DISTANCE":"357.6"},{"USAF":"722004","WBAN":"54922","DISTANCE":"358.5"},{"USAF":"726547","WBAN":"99999","DISTANCE":"362.7"},{"USAF":"726547","WBAN":"04931","DISTANCE":"363.4"},{"USAF":"720862","WBAN":"99999","DISTANCE":"364.1"},{"USAF":"726543","WBAN":"99999","DISTANCE":"364.6"},{"USAF":"997795","WBAN":"99999","DISTANCE":"364.9"},{"USAF":"720929","WBAN":"00316","DISTANCE":"366.5"},{"USAF":"720947","WBAN":"99999","DISTANCE":"373.2"},{"USAF":"A07141","WBAN":"00327","DISTANCE":"373.2"},{"USAF":"726418","WBAN":"99999","DISTANCE":"374.8"},{"USAF":"727410","WBAN":"99999","DISTANCE":"375.8"},{"USAF":"726418","WBAN":"54912","DISTANCE":"375.9"},{"USAF":"994090","WBAN":"99999","DISTANCE":"376.7"},{"USAF":"720367","WBAN":"54927","DISTANCE":"377.8"},{"USAF":"720367","WBAN":"99999","DISTANCE":"377.9"},{"USAF":"726467","WBAN":"54909","DISTANCE":"380.6"},{"USAF":"726467","WBAN":"99999","DISTANCE":"381.0"},{"USAF":"722144","WBAN":"99999","DISTANCE":"381.5"},{"USAF":"722144","WBAN":"04945","DISTANCE":"381.9"},{"USAF":"720887","WBAN":"00297","DISTANCE":"388.2"},{"USAF":"722114","WBAN":"99999","DISTANCE":"388.5"},{"USAF":"722114","WBAN":"54901","DISTANCE":"389.4"},{"USAF":"726577","WBAN":"94974","DISTANCE":"389.5"},{"USAF":"726577","WBAN":"99999","DISTANCE":"389.5"},{"USAF":"727448","WBAN":"99999","DISTANCE":"391.0"},{"USAF":"720911","WBAN":"00301","DISTANCE":"391.5"},{"USAF":"726565","WBAN":"99999","DISTANCE":"392.8"},{"USAF":"726565","WBAN":"04948","DISTANCE":"392.9"},{"USAF":"722179","WBAN":"04968","DISTANCE":"395.1"},{"USAF":"722179","WBAN":"99999","DISTANCE":"395.1"},{"USAF":"723758","WBAN":"99999","DISTANCE":"395.7"},{"USAF":"997732","WBAN":"99999","DISTANCE":"395.9"},{"USAF":"723758","WBAN":"54928","DISTANCE":"396.0"},{"USAF":"727533","WBAN":"99999","DISTANCE":"396.2"},{"USAF":"727533","WBAN":"04922","DISTANCE":"396.3"},{"USAF":"726583","WBAN":"04941","DISTANCE":"398.0"},{"USAF":"727534","WBAN":"99999","DISTANCE":"398.3"},{"USAF":"726468","WBAN":"99999","DISTANCE":"398.6"},{"USAF":"726575","WBAN":"94960","DISTANCE":"399.0"},{"USAF":"726575","WBAN":"99999","DISTANCE":"399.0"},{"USAF":"726468","WBAN":"54913","DISTANCE":"399.2"},{"USAF":"726583","WBAN":"99999","DISTANCE":"403.0"},{"USAF":"999999","WBAN":"14858","DISTANCE":"403.5"},{"USAF":"727440","WBAN":"14858","DISTANCE":"404.2"},{"USAF":"727507","WBAN":"99999","DISTANCE":"405.3"},{"USAF":"727507","WBAN":"54904","DISTANCE":"405.4"},{"USAF":"727580","WBAN":"99999","DISTANCE":"406.1"},{"USAF":"727572","WBAN":"99999","DISTANCE":"408.0"},{"USAF":"727573","WBAN":"94928","DISTANCE":"408.0"},{"USAF":"720583","WBAN":"99999","DISTANCE":"408.6"},{"USAF":"727573","WBAN":"99999","DISTANCE":"408.7"},{"USAF":"726404","WBAN":"99999","DISTANCE":"411.2"},{"USAF":"726404","WBAN":"04865","DISTANCE":"411.7"},{"USAF":"726576","WBAN":"14928","DISTANCE":"412.4"},{"USAF":"999999","WBAN":"14928","DISTANCE":"412.4"},{"USAF":"727447","WBAN":"99999","DISTANCE":"412.5"},{"USAF":"726576","WBAN":"99999","DISTANCE":"412.6"},{"USAF":"720386","WBAN":"00125","DISTANCE":"413.5"},{"USAF":"720386","WBAN":"99999","DISTANCE":"413.5"},{"USAF":"726584","WBAN":"99999","DISTANCE":"414.3"},{"USAF":"726584","WBAN":"14927","DISTANCE":"414.4"},{"USAF":"999999","WBAN":"14927","DISTANCE":"414.4"},{"USAF":"720491","WBAN":"00150","DISTANCE":"415.8"},{"USAF":"720491","WBAN":"99999","DISTANCE":"416.2"},{"USAF":"726580","WBAN":"14922","DISTANCE":"418.9"},{"USAF":"999999","WBAN":"14922","DISTANCE":"419.2"},{"USAF":"999999","WBAN":"14947","DISTANCE":"419.2"},{"USAF":"998176","WBAN":"99999","DISTANCE":"420.3"},{"USAF":"723123","WBAN":"14886","DISTANCE":"421.7"},{"USAF":"723123","WBAN":"99999","DISTANCE":"421.7"},{"USAF":"992090","WBAN":"99999","DISTANCE":"422.5"},{"USAF":"726603","WBAN":"04974","DISTANCE":"422.9"},{"USAF":"726603","WBAN":"99999","DISTANCE":"423.6"},{"USAF":"726579","WBAN":"94963","DISTANCE":"424.6"},{"USAF":"726579","WBAN":"99999","DISTANCE":"426.2"},{"USAF":"726519","WBAN":"94993","DISTANCE":"426.8"},{"USAF":"726569","WBAN":"99999","DISTANCE":"426.8"},{"USAF":"720858","WBAN":"00285","DISTANCE":"427.3"},{"USAF":"726466","WBAN":"99999","DISTANCE":"427.3"},{"USAF":"726519","WBAN":"99999","DISTANCE":"427.4"},{"USAF":"726466","WBAN":"54917","DISTANCE":"427.7"},{"USAF":"726569","WBAN":"04933","DISTANCE":"427.7"},{"USAF":"725387","WBAN":"99999","DISTANCE":"432.8"},{"USAF":"725387","WBAN":"94899","DISTANCE":"433.4"},{"USAF":"720327","WBAN":"04995","DISTANCE":"434.5"},{"USAF":"720327","WBAN":"99999","DISTANCE":"435.5"},{"USAF":"727515","WBAN":"04982","DISTANCE":"435.5"},{"USAF":"999999","WBAN":"14919","DISTANCE":"435.5"},{"USAF":"727535","WBAN":"14919","DISTANCE":"435.6"},{"USAF":"726504","WBAN":"54838","DISTANCE":"435.7"},{"USAF":"726504","WBAN":"99999","DISTANCE":"435.7"},{"USAF":"727515","WBAN":"99999","DISTANCE":"435.8"},{"USAF":"727517","WBAN":"04932","DISTANCE":"435.8"},{"USAF":"727517","WBAN":"99999","DISTANCE":"436.5"},{"USAF":"726553","WBAN":"04951","DISTANCE":"444.4"},{"USAF":"726553","WBAN":"99999","DISTANCE":"444.6"},{"USAF":"720939","WBAN":"99999","DISTANCE":"445.0"},{"USAF":"720737","WBAN":"00266","DISTANCE":"445.3"},{"USAF":"726435","WBAN":"14991","DISTANCE":"445.9"},{"USAF":"999999","WBAN":"14991","DISTANCE":"445.9"},{"USAF":"722168","WBAN":"99999","DISTANCE":"446.9"},{"USAF":"726573","WBAN":"99999","DISTANCE":"446.9"},{"USAF":"722168","WBAN":"04960","DISTANCE":"447.4"},{"USAF":"726562","WBAN":"99999","DISTANCE":"447.4"},{"USAF":"726562","WBAN":"04943","DISTANCE":"447.5"},{"USAF":"722332","WBAN":"54953","DISTANCE":"447.8"},{"USAF":"722332","WBAN":"99999","DISTANCE":"447.8"},{"USAF":"727415","WBAN":"04803","DISTANCE":"449.3"},{"USAF":"727415","WBAN":"99999","DISTANCE":"449.9"},{"USAF":"720511","WBAN":"99999","DISTANCE":"452.9"},{"USAF":"727466","WBAN":"04918","DISTANCE":"453.2"},{"USAF":"720853","WBAN":"00281","DISTANCE":"454.1"},{"USAF":"727439","WBAN":"99999","DISTANCE":"455.9"},{"USAF":"726564","WBAN":"04967","DISTANCE":"457.3"},{"USAF":"727466","WBAN":"99999","DISTANCE":"457.8"},{"USAF":"726564","WBAN":"99999","DISTANCE":"458.0"},{"USAF":"726417","WBAN":"54911","DISTANCE":"460.7"},{"USAF":"726417","WBAN":"99999","DISTANCE":"460.7"},{"USAF":"722033","WBAN":"04999","DISTANCE":"462.5"},{"USAF":"722033","WBAN":"99999","DISTANCE":"462.7"},{"USAF":"722003","WBAN":"99999","DISTANCE":"464.4"},{"USAF":"722003","WBAN":"54930","DISTANCE":"465.2"},{"USAF":"726556","WBAN":"99999","DISTANCE":"473.0"},{"USAF":"726556","WBAN":"14992","DISTANCE":"473.1"},{"USAF":"997988","WBAN":"99999","DISTANCE":"473.4"},{"USAF":"726449","WBAN":"99999","DISTANCE":"476.1"},{"USAF":"726449","WBAN":"04891","DISTANCE":"476.5"},{"USAF":"726563","WBAN":"94969","DISTANCE":"480.1"},{"USAF":"726563","WBAN":"99999","DISTANCE":"481.0"},{"USAF":"720867","WBAN":"00293","DISTANCE":"486.1"},{"USAF":"720867","WBAN":"99999","DISTANCE":"486.1"},{"USAF":"722252","WBAN":"54923","DISTANCE":"486.5"},{"USAF":"726567","WBAN":"04980","DISTANCE":"488.5"},{"USAF":"726567","WBAN":"99999","DISTANCE":"488.7"},{"USAF":"994200","WBAN":"99999","DISTANCE":"490.3"},{"USAF":"720941","WBAN":"99999","DISTANCE":"490.7"},{"USAF":"726585","WBAN":"99999","DISTANCE":"493.7"},{"USAF":"726585","WBAN":"14954","DISTANCE":"494.3"},{"USAF":"999999","WBAN":"54937","DISTANCE":"498.1"},{"USAF":"727431","WBAN":"99999","DISTANCE":"498.7"},{"USAF":"727430","WBAN":"99999","DISTANCE":"499.9"},{"USAF":"727430","WBAN":"94850","DISTANCE":"500.0"}],

    M: {
        showValid: 0 //0 not show, 1 show valid
    },
    monthValidCount: 25, //某个月的avg/min/max至少有20个正常记录，才算一个有效avg/min/max月,才会计算有参考价值的月度均值

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

//统计邻站准备工作
let countForWeatherStationNearby = 0;

//确定站号
if(config.showMultipleStation > 0){
    //定义用于异步循环的Promise对象(第一个Promise对象)
    let promise0 = new Promise((resolve) => { resolve(); })
    //异步循环
    getInfoOfWeatherStationNearby(promise0, config.arrOfNoOfWeatherStationNearBy.length);
    function getInfoOfWeatherStationNearby(pro, len){
        console.log(); //console一次换行
        for(let i=0; i<len; i++){
            pro = pro.then(() => {
                return new Promise((resolve) => {
                    stationObj = config.arrOfNoOfWeatherStationNearBy[i];
                    getAllOfWeatherStation(stationObj);
                    resolve(); //resolve放在最后
                })
            });
        }
        pro.then(() => {
            return new Promise((resolve) => {
                console.log('ALL FINISHED!');
                resolve();
            })
            //consoleMultiple();
        });
    }
    function consoleMultiple(){
        console.log('TOTAL EXPECTED STATION: ' + config.arrOfNoOfWeatherStationNearBy + 'TOTAL RECORDED STATION: ' + countForWeatherStationNearby)
    }
}else{
    getAllOfWeatherStation(config.stationObj);
}

//关于单站的代码全在这个大函数里，除了Tools都在这个函数里！！！
function getAllOfWeatherStation(stationObj){

//let stationObj = config.stationObj;
let csvFileName = tools.getStationNumber(stationObj).csvFileName;
let stationNumberToPrint = tools.getStationNumber(stationObj).stationNumberToPrint;

//起始日期
let y1 = config.dateStart.split('-')[0];
let d1 = config.dateStart;
//结束日期
let y2 = config.dateEnd.split('-')[0].length === 4 ? config.dateEnd.split('-')[0] : tools.getCurrentDate().YEAR;
let d2 = config.dateEnd.length === 10 ? config.dateEnd : tools.getCurrentDate().YMD;

//收集所有目标csv文件地址到数组paths
function getPaths(){
    let prePaths = [];
    let p1 = config.noaaLocation;
    let p3 = '/';
    let p5 = '.csv';
    for(let i = Number(y1); i <= Number(y2); i++){
        let path = '';
        path = p1 + i.toString() + p3 + csvFileName + p5;
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
    return {
        paths: paths,
        fileCount: fileCount,
        arrOfRecordedYears: arrOfRecordedYears
    }
}

/****** 以下部分在连续stat和排序中会用到 ******/
//根据config决定关注哪一项
let co = config.order;
let ci = config.item;
let itemsAttrRefer = [
    { 'condition': ci.toLowerCase() === 'min'.toLowerCase(), 'attrName': 'MIN' },
    { 'condition': ci.toLowerCase() === 'avg'.toLowerCase(), 'attrName': 'TEMP' },
    { 'condition': ci.toLowerCase() === 'max'.toLowerCase(), 'attrName': 'MAX' }
];
//确定需要关注的那个属性MIN,TEMP或MAX
let focusedAttr = 'MIN'; //如果config.item是date(日期),设置默认ATTR
itemsAttrRefer.forEach((v) => { if(v.condition){ focusedAttr = v.attrName; } });
let sortOrderRefer = [
    {'order': 'asc'.toLowerCase(), 'symbol': '<='},
    {'order': 'desc'.toLowerCase(), 'symbol': '>='}
]
let focusedOrderSymbolStr = '<=';
sortOrderRefer.forEach((v) => { if( v.order === config.order.toLowerCase() ){ focusedOrderSymbolStr = v.symbol; } } );
/****** 以上部分在连续stat和排序中会用到 ******/

//批量异步依次读取csv文件内容
let sourceStr = '';
readMultipleFiles(new Set(getPaths().paths), 'utf8').subscribe({
    next(result){
        sourceStr += result.contents;
    },
    complete(){
        if(sourceStr.trim().length < 1){
            console.log('File Not Found!');
            return;
        }
        consoleResult();
    }
});

function consoleResult(){
    let result = consoleDetails();
    if(config.console.station > 0){ result.station(); }
    if(config.console.overview > 0){ result.overview(); }
    if(config.console.M > 0){ result.M(); }
    if(config.console.YM > 0){ result.YM(); }
    if(config.console.consec > 0){ result.consec(); }
    if(config.console.list > 0){ result.list(); }
    if(config.console.yearRange > 0){ result.yearRange(); } //这个适合放在最后面，年份字太多了，影响观看
    if(config.console.allRecords > 0){ result.allRecords(); }
    if(config.showMultipleStation > 0){ result.multipleStation(); }
}

//console结果
function consoleDetails(){
    let csv = new Csv(sourceStr);
    let startObj = csv.getSortedArrOfCsv();
    let overview = startObj.overview;
    let stat_YM = startObj.stat_YM;
    let stat_M = startObj.stat_M;
    let stat_CONSEC = startObj.stat_CONSEC;
    let totalThreshholdDays = startObj.totalThreshholdDays;
    
    //站点信息
    let obj0 = startObj.arr[0];
    //let station0 = obj0.STATION;
    let name = obj0['NAME'];
    let elev = obj0['ELEVATION'];
    let lat = obj0['LATITUDE'];
    let lon = obj0['LONGITUDE'];
    
    //console站点信息
    function consoleStation(){
        console.log('\n' + stationNumberToPrint + ' | ' + name);
        console.log(elev + '(m) | ( ' + lat + ', ' + lon + ' )\n');
    }

    //console overview概述
    function consoleOverview(){
        let monthText = '';
        if(typeof(config.month) === 'number' && config.month > 0 && config.month <= 12){ monthText = 'MONTH = ' + tools.FN(config.month, 12); }
        console.log(monthText);
        console.table(overview); console.log('\n')
    }

    //console年份、日数
    function consoleRange(){
        console.log('DATE RANGE: [ ' + d1 + ', ' + d2 + ' ]');
        console.log('YEARS RECORDED: ' + + getPaths().fileCount);
        let strA = ''; //输出年，多行str
        let cnt = 0; //计数
        getPaths().arrOfRecordedYears.forEach((v) => {
            if(cnt < 9){ //这里必须比目标数小1，一行10个，这里必须是 <9
                strA += v + ' ';
                cnt += 1;
            }else{
                strA += v + '\n';
                cnt = 0;
            }
        });
        console.log(strA);
        console.log('DAYS RECORDED: ' + startObj.totalDaysBeforeSort);
        console.log('DAYS SELECTED: ' + startObj.arr.length + '\n');
    }

    //console月均温相关项
    function consoleM(){
        if(config.month > 0){
            let ms = tools.FN(config.month, 12);
            console.log('MONTHLY AVG OF CLIMATE:');
            console.log('MONTH = ' + ms);
            if(config.M.showValid > 0){ console.log('FOR ALL RECORDS:'); }
            console.log(
                'avgOfMin:  ' + stat_M[ms].avgForMin  + ' (Y' + stat_M[ms].yearCountForMin + '|sum/' + stat_M[ms].dayCountForMin + ')  ',
                'avg: ' + stat_M[ms].avg  + ' (Y' + stat_M[ms].yearCountForAvg + '|sum/' + stat_M[ms].dayCountForAvg + ')  ',
                'avgOfMax: ' + stat_M[ms].avgForMax + ' (Y' + stat_M[ms].yearCountForMax + '|sum/' + stat_M[ms].dayCountForMax + ')'
            );
            if(config.M.showValid > 0){
                console.log(
                    'FOR MONTHLY DAYS >= ' + config.monthValidCount + ':\navgOfMin:  ' + stat_M[ms].valid.avgForMin  + ' (Y' + stat_M[ms].valid.yearCountForMin + '|sum/' + stat_M[ms].valid.dayCountForMin + ')  ',
                    'avg: ' + stat_M[ms].valid.avg  + ' (Y' + stat_M[ms].valid.yearCountForAvg + '|sum/' + stat_M[ms].valid.dayCountForAvg + ')  ',
                    'avgOfMax: ' + stat_M[ms].valid.avgForMax + ' (Y' + stat_M[ms].valid.yearCountForMax + '|sum/' + stat_M[ms].valid.dayCountForMax + ')'
                );
            }
        }else{
            console.log('MONTHLY AVG OF CLIMATE:');
            tools.getArrOfNumberMonthBegin(11).forEach((vm1) => {
                let ms = tools.FN(vm1, 12);
                console.log('MONTH = ' + ms);
                if(config.M.showValid > 0){ console.log('FOR ALL RECORDS:'); }
                console.log(
                    'avgOfMin:  ' + stat_M[ms].avgForMin  + ' (Y' + stat_M[ms].yearCountForMin + '|sum/' + stat_M[ms].dayCountForMin + ')  ',
                    'avg: ' + stat_M[ms].avg  + ' (Y' + stat_M[ms].yearCountForAvg + '|sum/' + stat_M[ms].dayCountForAvg + ')  ',
                    'avgOfMax: ' + stat_M[ms].avgForMax + ' (Y' + stat_M[ms].yearCountForMax + '|sum/' + stat_M[ms].dayCountForMax + ')'
                );
                if(config.M.showValid > 0){
                    console.log(
                        'FOR MONTHLY DAYS >= ' + config.monthValidCount + ':\navgOfMin:  ' + stat_M[ms].valid.avgForMin  + ' (Y' + stat_M[ms].valid.yearCountForMin + '|sum/' + stat_M[ms].valid.dayCountForMin + ')  ',
                        'avg: ' + stat_M[ms].valid.avg  + ' (Y' + stat_M[ms].valid.yearCountForAvg + '|sum/' + stat_M[ms].valid.dayCountForAvg + ')  ',
                        'avgOfMax: ' + stat_M[ms].valid.avgForMax + ' (Y' + stat_M[ms].valid.yearCountForMax + '|sum/' + stat_M[ms].valid.dayCountForMax + ')'
                    );
                }
            });
            console.log('\n');
        }
    }
    //console AVG BY YM
    function consoleYM(){
        let tempYMArr = Object.keys(stat_YM);
        tempYMArr.sort((a, b) => {
            return stat_YM[a]['avg'] - stat_YM[b]['avg'];
        });
        console.log('EVERY MONTH:');
        for(let index=0; index<tempYMArr.length; index++){
            let vym1 = tempYMArr[index];
            if(index === config.showNumber){
                break;
            }
            console.log(
                tools.FN(index + 1, tempYMArr.length) + '   '
                + vym1 + '  ' + stat_YM[vym1].avgForMin + ' (sum/' + stat_YM[vym1].dayCountForMin + ')  '
                + stat_YM[vym1].avg + ' (sum/' + stat_YM[vym1].dayCountForAvg + ')  '
                + stat_YM[vym1].avgForMax + ' (sum/' + stat_YM[vym1].dayCountForMax + ')'
            );
        }
        console.log('\n');
    }

    //console连续记录
    function consoleConsec(){
        //把TEMP文本改成AVG
        let tempFocusedAttr = focusedAttr; if(focusedAttr === 'TEMP'){ tempFocusedAttr = 'AVG' }
        console.log('LONGEST CONSECUTIVE DAYS FOR ' + tempFocusedAttr + ' ' + focusedOrderSymbolStr + ' ' + config.consecValue + ':');
        console.log('Total: ' + totalThreshholdDays);
        for(let i=0; i<stat_CONSEC.length; i++){
            if(i === config.showNumber){ break; } //限制console记录个数
            console.log(
                tools.FN(i+1, stat_CONSEC.length) + '  ( ' + stat_CONSEC[i].startDate + ' - '
                + stat_CONSEC[i].endDate + ' )  CONSECUTIVE DAYS: ' + stat_CONSEC[i].consecDays
            );
        }
        console.log('\n');
    }

    //逐日列出
    function consoleList(){
        console.log('DAILY LIST, SORT BY ' + config.item.toUpperCase() + ', ' + config.order.toUpperCase() + ':');
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
        console.log('\n');
    }

    //console对象数组内的所有元素
    //纠结了以下，这里还是应该按日期排序
    function consoleAllRecords(){
        startObj.arr.sort((a, b) => {
            return Date.parse(a['DATE']) - Date.parse(b['DATE']);
        });
        console.table(startObj.arr);
    }

    //仅用于查询多站信息
    function consoleMutipleStation(){
        let tempRegExp = /[a-zA-Z]/i;
        if(tempRegExp.test(lon.toString())){
            console.log(stationNumberToPrint + ' | ' + 'FAILED TO PARSE FILE');
        }else{
            countForWeatherStationNearby += 1;
            console.log(overview.MAX.min + ' || ' + stationNumberToPrint + ' | ' + overview.MAX.minDate + ' | ' + elev + '(m) | ( ' + lat + ', ' + lon + ' ) | ' + name);
        }
        
        /* console.log('MIN OF ALL TIME: ' + overview['MIN'].min);
        console.log('MAX OF ALL TIME: ' + overview.MAX.max);
        console.log('MIN OF MAX: ' + overview.MAX.min);
        console.log('MAX OF MIN: ' + overview.MIN.max);
        console.log('JAN MEAN: ' + stat_M['01'].avgForMin + '  ' + stat_M['01'].avg + '  ' + stat_M['01'].avgForMax);
        console.log('JAN EXTREME: ' + stat_M['01'].min + '  ' + '  ' + stat_M['01'].max);
        console.log('JULY MEAN: ' + stat_M['07'].avgForMin + '  ' + stat_M['07'].avg + '  ' + stat_M['07'].avgForMax);
        console.log('JULY EXTREME: ' + stat_M['07'].min + '  ' + '  ' + stat_M['07'].max);
        console.log('ANNUAL MEAN: ' + overview.AVG.avg);
        console.log('MAX CONSEC: ' + stat_CONSEC[0].consecDays + ' [ ' + stat_CONSEC[0].startDate + ' - ' + stat_CONSEC[0].endDate + ' ] ') */
    }

    return {
        'station': consoleStation,
        'overview': consoleOverview,
        'yearRange': consoleRange,
        'M': consoleM,
        'YM': consoleYM,
        'consec': consoleConsec,
        'list': consoleList,
        'allRecords': consoleAllRecords,
        'multipleStation': consoleMutipleStation
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
    //获取csv行，进行以下处理：检查异常值(空、错误值等)、转换温度单位(华氏转摄氏)、限制数值小数点后位数、还有最复杂的排序(根据设置)
    function getSortedArrOfCsv(){
        let totalDays = 0;
        let totalThreshholdDays = 0;

        //站点概述
        let overview = {
            MIN: {
                min: undefined,
                minDate: [],
                max: undefined,
                maxDate: [],
                avg: undefined,
                total: 0,
                arr: []
            },
            AVG: {
                min: undefined,
                minDate: [],
                max: undefined,
                maxDate: [],
                avg: undefined,
                total: 0,
                arr: []
            },
            MAX: {
                min: undefined,
                minDate: [],
                max: undefined,
                maxDate: [],
                avg: undefined,
                total: 0,
                arr: []
            }
        };
        
        //以下统计功能的对象详细格式参考.txt文档，这些对象总计100多个细分属性
        let stat_YM = {}; //某年某月，比如'1960-01'
        
        let stat_M = {}; //某个月份，比如'01'
        let arrOfMonthStr = []; //月份字符数组，12个元素
        for(let i=1; i<=12; i++){ arrOfMonthStr.push(tools.FN(i, 12)); }

        let stat_Y = {}; //某年，比如'1969'
        let stat_MD = {}; //某月某日，比如'01-20'
        
        let stat_CONSEC = []; //连续记录

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
        let finalArr = [];
        arrOfCsv.forEach((v) => {
            let obj = {};
            config.options.forEach((vo) => {
                obj[vo] = v[vo];
            });
            finalArr.push(obj);
        });
        
        //检查气温相关项的值，是否为空、是否正常，并转换温度单位
        finalArr.forEach((v) => {
            v['MIN'] = tools.isValidTempF(v['MIN']) ? tools.TFC(v['MIN']).toFixed(1) : undefined;
            v['TEMP'] = tools.isValidTempF(v['TEMP']) ? tools.TFC(v['TEMP']).toFixed(1) : undefined;
            v['MAX'] = tools.isValidTempF(v['MAX']) ? tools.TFC(v['MAX']).toFixed(1) : undefined;
        });
        
        /******************* 对统计连续很重要 *************/
        //这里提前额外按日期从早到晚排序一次，确保后面统计连续记录时没有错误
        finalArr.sort((a, b) => Date.parse(a.DATE) - Date.parse(b.DATE));


        /************************ START START ************************/
        /************************ 超复杂统计部分 ************************/
        /************************ START START ************************/
        /************************ START START ************************/
        //临时存储对象
        
        //某年某月
        let vObj_YM = {};
        
        //某个月份
        arrOfMonthStr.forEach((v) => {
            stat_M[v] = {};
            stat_M[v].dayCount = 0;
            stat_M[v].yearArr = [],
            stat_M[v].yearCount = 0;
            stat_M[v].dayCountForMin = 0;
            stat_M[v].dayCountForAvg = 0;
            stat_M[v].dayCountForMax = 0;
            stat_M[v].minYearArr = [],
            stat_M[v].avgYearArr = [],
            stat_M[v].maxYearArr = [],
            stat_M[v].yearCountForMin = 0;
            stat_M[v].yearCountForAvg = 0;
            stat_M[v].yearCountForMax = 0;
            stat_M[v].minArr = [];
            stat_M[v].avgArr = [];
            stat_M[v].maxArr = [];
            stat_M[v].valid = {
                'minArr': [],
                'avgArr': [],
                'maxArr': [],
                'dayCountForMin': 0,
                'dayCountForAvg': 0,
                'dayCountForMax': 0,
                'minYearArr': [],
                'avgYearArr': [],
                'maxYearArr': [],
                'yearCountForMin': 0,
                'yearCountForAvg': 0,
                'yearCountForMax': 0,
                'avgForMin': undefined,
                'avg': undefined,
                'avgForMax': undefined
            }
        }); //给每个月份key装填value
        
        //某年
        let vObj_Y = {};
        let vObj_MD = {}; //某月某日

        //连续记录
        let consecCount = 0;
        let consecArrIndex = 0;
        let consecLastDate = ''; //最近一个满足阈值条件的DATE

        finalArr.forEach((v, i) => {
            //overview概述
            if(v['MIN'] !== undefined){ overview.MIN.total += 1; overview.MIN.arr.push( Number(v['MIN']) ) }
            if(v['TEMP'] !== undefined){ overview.AVG.total += 1; overview.AVG.arr.push( Number(v['TEMP']) ) }
            if(v['MAX'] !== undefined){ overview.MAX.total += 1; overview.MAX.arr.push( Number(v['MAX']) ) }

            //拆分日期字符
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
                    'minValid': false,
                    'avgValid': false,
                    'maxValid': false,
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
                if(vObj_YM.minArr.length >= config.monthValidCount){
                    vObj_YM.valid.minValid = true;
                    vObj_YM.valid.avgForMin = tools.getAvgForNumberArr(vObj_YM.minArr);
                }
            }
            if(v['TEMP'] !== undefined){
                vObj_YM.avgArr.push( Number(v['TEMP']) );
                vObj_YM.dayCountForAvg += 1;
                vObj_YM.minForAvg = Math.min(...vObj_YM.avgArr);
                vObj_YM.avg = tools.getAvgForNumberArr(vObj_YM.avgArr);
                vObj_YM.maxForAvg = Math.max(...vObj_YM.avgArr);
                if(vObj_YM.avgArr.length >= config.monthValidCount){
                    vObj_YM.valid.avgValid = true;
                    vObj_YM.valid.avg = tools.getAvgForNumberArr(vObj_YM.avgArr);
                }
            }
            if(v['MAX'] !== undefined){
                vObj_YM.maxArr.push( Number(v['MAX']) );
                vObj_YM.dayCountForMax += 1;
                vObj_YM.minForMax = Math.min(...vObj_YM.maxArr);
                vObj_YM.avgForMax = tools.getAvgForNumberArr(vObj_YM.maxArr);
                vObj_YM.max = Math.max(...vObj_YM.maxArr);
                if(vObj_YM.maxArr.length >= config.monthValidCount){
                    vObj_YM.valid.maxValid = true;
                    vObj_YM.valid.avgForMax = tools.getAvgForNumberArr(vObj_YM.maxArr);
                }
            }
            stat_YM[temp_YM_Str] = vObj_YM; //完成一个键值对

            //某个月份
            if( !(arrOfMonthStr.includes(temp_M_Str)) ){console.log('月份Str错误！');} //确保月份Str不出错
            stat_M[temp_M_Str].dayCount += 1;
            if( !(stat_M[temp_M_Str].yearArr.includes(temp_Y_Str)) ){
                stat_M[temp_M_Str].yearArr.push(temp_Y_Str);
                stat_M[temp_M_Str].yearCount += 1;
            }
            if(v['MIN'] !== undefined){
                stat_M[temp_M_Str].minArr.push( Number(v['MIN']) );
                stat_M[temp_M_Str].dayCountForMin += 1;
                if( !(stat_M[temp_M_Str].minYearArr.includes(temp_Y_Str)) ){
                    stat_M[temp_M_Str].minYearArr.push(temp_Y_Str);
                    stat_M[temp_M_Str].yearCountForMin += 1;
                }
                stat_M[temp_M_Str].min = Math.min(...stat_M[temp_M_Str].minArr);
                stat_M[temp_M_Str].avgForMin = tools.getAvgForNumberArr(stat_M[temp_M_Str].minArr);
                stat_M[temp_M_Str].maxForMin = Math.max(...stat_M[temp_M_Str].minArr);
                if( stat_YM[temp_YM_Str].valid.minValid ){ //'valid': {} 部分，这里必须引入外部YM对象的属性来判断！！！这一部分逻辑最复杂
                    if( !(stat_M[temp_M_Str].valid.minYearArr.includes(temp_Y_Str)) ){
                        stat_M[temp_M_Str].valid.minYearArr.push(temp_Y_Str);
                        stat_M[temp_M_Str].valid.yearCountForMin += 1;
                    }
                    if( stat_M[temp_M_Str].valid.yearCountForMin > 0 ){
                        let tempArrM = [];
                        stat_M[temp_M_Str].valid.minYearArr.forEach((vm1) => {
                            if(stat_YM.hasOwnProperty(vm1 + '-' + temp_M_Str)){ tempArrM = tempArrM.concat(stat_YM[vm1 + '-' + temp_M_Str].minArr); }
                        });
                        stat_M[temp_M_Str].valid.minArr = tempArrM;
                    }
                    stat_M[temp_M_Str].valid.dayCountForMin = stat_M[temp_M_Str].valid.minArr.length;
                    stat_M[temp_M_Str].valid.avgForMin = tools.getAvgForNumberArr(stat_M[temp_M_Str].valid.minArr);
                }
            }
            if(v['TEMP'] !== undefined){
                stat_M[temp_M_Str].avgArr.push( Number(v['TEMP']) );
                stat_M[temp_M_Str].dayCountForAvg += 1;
                if( !(stat_M[temp_M_Str].avgYearArr.includes(temp_Y_Str)) ){
                    stat_M[temp_M_Str].avgYearArr.push(temp_Y_Str);
                    stat_M[temp_M_Str].yearCountForAvg += 1;
                }
                stat_M[temp_M_Str].minForAvg = Math.min(...stat_M[temp_M_Str].avgArr);
                stat_M[temp_M_Str].avg = tools.getAvgForNumberArr(stat_M[temp_M_Str].avgArr);
                stat_M[temp_M_Str].maxForAvg = Math.max(...stat_M[temp_M_Str].avgArr);
                if( stat_YM[temp_YM_Str].valid.avgValid ){ //'valid': {} 部分，这里必须引入外部YM对象的属性来判断！！！这一部分逻辑最复杂
                    if( !(stat_M[temp_M_Str].valid.avgYearArr.includes(temp_Y_Str)) ){
                        stat_M[temp_M_Str].valid.avgYearArr.push(temp_Y_Str);
                        stat_M[temp_M_Str].valid.yearCountForAvg += 1;
                    }
                    if( stat_M[temp_M_Str].valid.yearCountForAvg > 0 ){
                        let tempArrM = [];
                        stat_M[temp_M_Str].valid.avgYearArr.forEach((vm1) => {
                            if(stat_YM.hasOwnProperty(vm1 + '-' + temp_M_Str)){ tempArrM = tempArrM.concat(stat_YM[vm1 + '-' + temp_M_Str].avgArr); }
                        });
                        stat_M[temp_M_Str].valid.avgArr = tempArrM;
                    }
                    stat_M[temp_M_Str].valid.dayCountForAvg = stat_M[temp_M_Str].valid.avgArr.length;
                    stat_M[temp_M_Str].valid.avg = tools.getAvgForNumberArr(stat_M[temp_M_Str].valid.avgArr);
                }
            }
            if(v['MAX'] !== undefined){
                stat_M[temp_M_Str].maxArr.push( Number(v['MAX']) );
                stat_M[temp_M_Str].dayCountForMax += 1;
                if( !(stat_M[temp_M_Str].maxYearArr.includes(temp_Y_Str)) ){
                    stat_M[temp_M_Str].maxYearArr.push(temp_Y_Str);
                    stat_M[temp_M_Str].yearCountForMax += 1;
                }
                stat_M[temp_M_Str].minForMax = Math.min(...stat_M[temp_M_Str].maxArr);
                stat_M[temp_M_Str].avgForMax = tools.getAvgForNumberArr(stat_M[temp_M_Str].maxArr);
                stat_M[temp_M_Str].max = Math.max(...stat_M[temp_M_Str].maxArr);
                if( stat_YM[temp_YM_Str].valid.maxValid ){ //'valid': {} 部分，这里必须引入外部YM对象的属性来判断！！！这一部分逻辑最复杂
                    if( !(stat_M[temp_M_Str].valid.maxYearArr.includes(temp_Y_Str)) ){
                        stat_M[temp_M_Str].valid.maxYearArr.push(temp_Y_Str);
                        stat_M[temp_M_Str].valid.yearCountForMax += 1;
                    }
                    if( stat_M[temp_M_Str].valid.yearCountForMax > 0 ){
                        let tempArrM = [];
                        stat_M[temp_M_Str].valid.maxYearArr.forEach((vm1) => {
                            if(stat_YM.hasOwnProperty(vm1 + '-' + temp_M_Str)){ tempArrM = tempArrM.concat(stat_YM[vm1 + '-' + temp_M_Str].maxArr); }
                        });
                        stat_M[temp_M_Str].valid.maxArr = tempArrM;
                    }
                    stat_M[temp_M_Str].valid.dayCountForMax = stat_M[temp_M_Str].valid.maxArr.length;
                    stat_M[temp_M_Str].valid.avgForMax = tools.getAvgForNumberArr(stat_M[temp_M_Str].valid.maxArr);
                }
            }
            
            //某年
            if(!stat_Y.hasOwnProperty(temp_Y_Str)){ stat_Y[temp_Y_Str] = {}; }
            
            //某月某日
            if(!stat_MD.hasOwnProperty(temp_MD_Str)){ stat_MD[temp_MD_Str] = {}; }
            
            //连续记录
            //确定大于或小于临界值
            let orderIf = false;
            if(co === 'asc'){
                orderIf = (Number(v[focusedAttr]) <= Number(config.consecValue));
            }else{
                orderIf = (Number(v[focusedAttr]) >= Number(config.consecValue));
            }
            if(i === 0){
                if(orderIf){ //这里不需要额外考虑undefined??
                    consecCount += 1;
                    //创建新对象
                    let tempConsecObj = {};
                    tempConsecObj.startDate = v['DATE'];
                    tempConsecObj.endDate = v['DATE'];
                    tempConsecObj.consecDays = consecCount;
                    tempConsecObj.minArr = [];
                    tempConsecObj.avgArr = [];
                    tempConsecObj.maxArr = [];
                    tempConsecObj.minArr.push(v['MIN']);
                    tempConsecObj.avgArr.push(v['TEMP']);
                    tempConsecObj.maxArr.push(v['MAX']);
                    //添加tempObj到statArr
                    stat_CONSEC.push(tempConsecObj);
                    //最近一个满足阈值条件的DATE，新值最好放在段落最后面，因为前面判断要用旧值
                    consecLastDate = v['DATE'];
                }
            }else{ //index > 0
                if(orderIf){ //当天满足阈值条件
                    totalThreshholdDays += 1; //统计满足阈值的所有天数
                    if( tools.getDateDiff( consecLastDate, v['DATE'] ) === 1){ //前一天也满足阈值条件
                        consecCount += 1;
                        stat_CONSEC[consecArrIndex].endDate = v['DATE'];
                        stat_CONSEC[consecArrIndex].consecDays = consecCount;
                        stat_CONSEC[consecArrIndex].minArr.push(v['MIN']);
                        stat_CONSEC[consecArrIndex].avgArr.push(v['TEMP']);
                        stat_CONSEC[consecArrIndex].maxArr.push(v['MAX']);
                    }else{ //前一天不满足阈值条件
                        consecCount = 1;
                        //创建新对象
                        let tempConsecObj = {};
                        tempConsecObj.startDate = v['DATE'];
                        tempConsecObj.endDate = v['DATE'];
                        tempConsecObj.consecDays = consecCount;
                        tempConsecObj.minArr = [];
                        tempConsecObj.avgArr = [];
                        tempConsecObj.maxArr = [];
                        tempConsecObj.minArr.push(v['MIN']);
                        tempConsecObj.avgArr.push(v['TEMP']);
                        tempConsecObj.maxArr.push(v['MAX']);
                        //添加tempObj到statArr
                        stat_CONSEC.push(tempConsecObj);
                        consecArrIndex = stat_CONSEC.length - 1;
                    }
                    //最近一个满足阈值条件的DATE，新值最好放在段落最后面，因为前面判断要用旧值
                    consecLastDate = v['DATE'];
                }else{
                    consecCount = 0;
                }
            }
        });
        /************************ END END END ************************/
        /************************ END END END ************************/
        /************************ 超复杂统计部分 ************************/
        /************************ END END END ************************/

        //overview概述统计
        //overview极端温度
        overview.MIN.min = Math.min(...overview.MIN.arr);
        overview.MIN.max = Math.max(...overview.MIN.arr);
        overview.AVG.min = Math.min(...overview.AVG.arr);
        overview.AVG.max = Math.max(...overview.AVG.arr);
        overview.MAX.min = Math.min(...overview.MAX.arr);
        overview.MAX.max = Math.max(...overview.MAX.arr);
        //overview均温
        overview.MIN.avg = tools.getAvgForNumberArr(overview.MIN.arr);
        delete overview.MIN.arr; //数组用完删掉
        overview.AVG.avg = tools.getAvgForNumberArr(overview.AVG.arr);
        delete overview.AVG.arr; //数组用完删掉
        overview.MAX.avg = tools.getAvgForNumberArr(overview.MAX.arr);
        delete overview.MAX.arr; //数组用完删掉
        //填装overview min,max日期到数组
        finalArr.forEach((v) => {
            if(Number(v['MIN']) === overview.MIN.min){ overview.MIN.minDate.push(v['DATE']) }
            if(Number(v['MIN']) === overview.MIN.max){ overview.MIN.maxDate.push(v['DATE']) }
            if(Number(v['TEMP']) === overview.AVG.min){ overview.AVG.minDate.push(v['DATE']) }
            if(Number(v['TEMP']) === overview.AVG.max){ overview.AVG.maxDate.push(v['DATE']) }
            if(Number(v['MAX']) === overview.MAX.min){ overview.MAX.minDate.push(v['DATE']) }
            if(Number(v['MAX']) === overview.MAX.max){ overview.MAX.maxDate.push(v['DATE']) }
        });

        //单独给stat_CONSEC数组排序，毫无疑问，应该从大到小排，数字最大的记录排前面
        stat_CONSEC.sort((a, b) => { return b.consecDays - a.consecDays; });

        //按气温相关列(低温、均温、高温)的值排序，正序或倒序
        itemsAttrRefer.forEach((vs, is) => {
            if(vs['condition']){
                finalArr.sort((a, b) => {
                    return tools.sortUndefinedObj( a[`${itemsAttrRefer[is]['attrName']}`], b[`${itemsAttrRefer[is]['attrName']}`], config.order);
                });    
            }
        });

        //按记录日期顺序排序，需要先将日期转化为毫秒，再排序
        if(ci === 'date'){
            if(co === 'asc'){
                finalArr.sort((a, b) => Date.parse(a.DATE) - Date.parse(b.DATE));
            }else if(co === 'desc'){
                finalArr.sort((a, b) => Date.parse(b.DATE) - Date.parse(a.DATE));
            }
        }

        /************************ 这个return返回所有数据，量超大 ************************/
        return {
            'arr': finalArr,
            'stat_YM': stat_YM,
            'stat_M': stat_M,
            'stat_CONSEC': stat_CONSEC,
            'overview':  overview,
            'totalDaysBeforeSort': totalDays,
            'totalThreshholdDays': totalThreshholdDays
        };
    }

    //定义私有方法等号右边函数后面没有括号！
    this.getArrOfTitles = getArrOfTitles;
    this.getSortedArrOfCsv = getSortedArrOfCsv;
}

}

//所有需要的各类简单工具函数
function Tools(){
    //创建一个包含12个月份数字的数组，从特定月份开头，比如从11开头，11,12,1,2,3...
    function getArrOfNumberMonthBegin(startN){
        let tempNArr = [];
        for(let i=1; i<=12; i++){
            if(i > (12 - startN + 1)){
                tempNArr.push(i - (12 - startN + 1));
            }else{
                tempNArr.push(i + startN - 1);
            }
        }
        return tempNArr;
    }
    //求均值
    function getAvgForNumberArr(arr){
        let sum = 0;
        let len = arr.length;
        arr.forEach((v) => {
            sum += Number(v);
        });
        return len > 0 ? (sum/len).toFixed(1) : undefined;
    }
    //获取2个日期相隔多少天
    function getDateDiff(dateStr1, dateStr2){
        let regExp = /\d{4}\-\d{2}\-\d{2}/;
        if(regExp.test(dateStr1) === false || regExp.test(dateStr2) === false){ return undefined; } //判断输入格式
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

    //根据config stationNumber设置按特定规则返回站号
    function getStationNumber(stationNumberObj){
        let USAF = stationNumberObj.USAF.trim();
        let originalWBAN = stationNumberObj.WBAN.trim();

        //根据个性化输入得到格式化WBAN
        let WBAN = '';
        if(originalWBAN === ''){
            WBAN = '99999';
        }else{
            let tempZeroStr = '0';
            let finalZeroStr = '';
            for(let i = 0; i < 5 - originalWBAN.length; i++){
                finalZeroStr += tempZeroStr;
            }
            WBAN = finalZeroStr + originalWBAN;
        }
        
        //声明return项
        let tempCsvFileName = '';
        let tempStationNumberToPrint = ''; //WBAN='99999'一律忽略不打印
        if(USAF.length === 5){
            tempCsvFileName = USAF + '0' + WBAN;
            if(WBAN !== '99999'){
                tempStationNumberToPrint = USAF + '-' + WBAN;
            }else{
                tempStationNumberToPrint = USAF;
            }
        }else if(USAF.length === 6){
            tempCsvFileName = USAF + WBAN;
            if(USAF.substring(5, 6) !== '0'){
                if(WBAN !== '99999'){
                    tempStationNumberToPrint = USAF + '-' + WBAN;
                }else{
                    tempStationNumberToPrint = USAF;
                }
            }else{
                if(WBAN !== '99999'){ //这种情况实际应该是不存在的。根据观察，USAF最后一位是0的，WBAN都是99999
                    tempStationNumberToPrint = USAF + '-' + WBAN;
                }else{
                    tempStationNumberToPrint = USAF.substring(0, 5);
                }
            }
        }
        return {
            'csvFileName': tempCsvFileName,
            'stationNumberToPrint': tempStationNumberToPrint
        }
    }

    this.getArrOfNumberMonthBegin = getArrOfNumberMonthBegin,
    this.getAvgForNumberArr = getAvgForNumberArr;
    this.getDateDiff = getDateDiff;
    this.getCurrentDate = getCurrentDate;
    this.sortUndefinedObj = sortUndefinedObj;
    this.isValidTempF = isValidTempF;
    this.FN = FN;
    this.TFC = TFC;
    this.getStationNumber = getStationNumber;
}