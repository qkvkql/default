//导入必要的包
let fs = require('fs');
let readMultipleFiles = require('read-multiple-files');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//配置对象，用于设置筛选条件
const config = {
    stationObj: {
        USAF: '701780',
        //留空则默认为99999，长度小于5则前面自动补0
        WBAN: '26529'
    },

    dateStart: '1929-01-01',
    dateEnd: '2025-12-31',
    month: 0, //0 = 全年, 1 = 一月, ... , 12 = 十二月。这个月份不能填错，不然报错都找不到错误
    
    order: 'asc', //asc(从小到大、从低到高，从早到晚), desc
    item: 'max', //date, min, avg, max
    consecValue: '-20', //连续记录的临界值
    showNumber: 20, //显示多少个结果
    console: { //设置console打印哪些
        station: 1,
        overview: 1,
        M: 0,
        YM: 1,
        consec: 0,
        list: 1,
        yearRange: 0,
        allRecords: 0
    },

    //获取邻站信息
    multipleStation: 1, //是否切换到打印邻近站点模式
    arrOfStations: [{
        "USAF": "202910",
        "WBAN": "99999",
        "DISTANCE": "2132.7"
      },
      {
        "USAF": "249080",
        "WBAN": "99999",
        "DISTANCE": "2135.3"
      },
      {
        "USAF": "202940",
        "WBAN": "99999",
        "DISTANCE": "2136.3"
      },
      {
        "USAF": "203890",
        "WBAN": "99999",
        "DISTANCE": "2143.0"
      },
      {
        "USAF": "248070",
        "WBAN": "99999",
        "DISTANCE": "2175.1"
      },
      {
        "USAF": "203860",
        "WBAN": "99999",
        "DISTANCE": "2184.3"
      },
      {
        "USAF": "209820",
        "WBAN": "99999",
        "DISTANCE": "2196.9"
      },
      {
        "USAF": "236991",
        "WBAN": "99999",
        "DISTANCE": "2197.6"
      },
      {
        "USAF": "200970",
        "WBAN": "99999",
        "DISTANCE": "2208.2"
      },
      {
        "USAF": "202890",
        "WBAN": "99999",
        "DISTANCE": "2229.8"
      },
      {
        "USAF": "201860",
        "WBAN": "99999",
        "DISTANCE": "2239.9"
      },
      {
        "USAF": "203880",
        "WBAN": "99999",
        "DISTANCE": "2248.8"
      },
      {
        "USAF": "236910",
        "WBAN": "99999",
        "DISTANCE": "2253.6"
      },
      {
        "USAF": "204810",
        "WBAN": "99999",
        "DISTANCE": "2289.4"
      },
      {
        "USAF": "233830",
        "WBAN": "99999",
        "DISTANCE": "2298.7"
      },
      {
        "USAF": "206790",
        "WBAN": "99999",
        "DISTANCE": "2318.0"
      },
      {
        "USAF": "235850",
        "WBAN": "99999",
        "DISTANCE": "2327.4"
      },
      {
        "USAF": "239920",
        "WBAN": "99999",
        "DISTANCE": "2348.7"
      },
      {
        "USAF": "238910",
        "WBAN": "99999",
        "DISTANCE": "2358.1"
      },
      {
        "USAF": "209730",
        "WBAN": "99999",
        "DISTANCE": "2365.3"
      },
      {
        "USAF": "235890",
        "WBAN": "99999",
        "DISTANCE": "2371.2"
      },
      {
        "USAF": "204760",
        "WBAN": "99999",
        "DISTANCE": "2390.6"
      },
      {
        "USAF": "202770",
        "WBAN": "99999",
        "DISTANCE": "2397.4"
      },
      {
        "USAF": "237890",
        "WBAN": "99999",
        "DISTANCE": "2425.0"
      },
      {
        "USAF": "200850",
        "WBAN": "99999",
        "DISTANCE": "2434.7"
      },
      {
        "USAF": "200870",
        "WBAN": "99999",
        "DISTANCE": "2436.3"
      },
      {
        "USAF": "230780",
        "WBAN": "99999",
        "DISTANCE": "2451.8"
      },
      {
        "USAF": "205780",
        "WBAN": "99999",
        "DISTANCE": "2455.9"
      },
      {
        "USAF": "230770",
        "WBAN": "99999",
        "DISTANCE": "2463.4"
      },
      {
        "USAF": "234840",
        "WBAN": "99999",
        "DISTANCE": "2485.7"
      },
      {
        "USAF": "238830",
        "WBAN": "99999",
        "DISTANCE": "2487.4"
      },
      {
        "USAF": "319811",
        "WBAN": "99999",
        "DISTANCE": "2487.7"
      },
      {
        "USAF": "206750",
        "WBAN": "99999",
        "DISTANCE": "2496.4"
      },
      {
        "USAF": "231790",
        "WBAN": "99999",
        "DISTANCE": "2501.4"
      },
      {
        "USAF": "233760",
        "WBAN": "99999",
        "DISTANCE": "2511.8"
      },
      {
        "USAF": "237880",
        "WBAN": "99999",
        "DISTANCE": "2528.7"
      },
      {
        "USAF": "230740",
        "WBAN": "99999",
        "DISTANCE": "2530.2"
      },
      {
        "USAF": "239820",
        "WBAN": "99999",
        "DISTANCE": "2530.4"
      },
      {
        "USAF": "231740",
        "WBAN": "99999",
        "DISTANCE": "2545.9"
      },
      {
        "USAF": "204710",
        "WBAN": "99999",
        "DISTANCE": "2556.4"
      },
      {
        "USAF": "234720",
        "WBAN": "99999",
        "DISTANCE": "2567.8"
      },
      {
        "USAF": "384010",
        "WBAN": "99999",
        "DISTANCE": "2568.0"
      },
      {
        "USAF": "232740",
        "WBAN": "99999",
        "DISTANCE": "2568.9"
      },
      {
        "USAF": "233750",
        "WBAN": "99999",
        "DISTANCE": "2578.3"
      },
      {
        "USAF": "202740",
        "WBAN": "99999",
        "DISTANCE": "2580.0"
      },
      {
        "USAF": "239860",
        "WBAN": "99999",
        "DISTANCE": "2583.7"
      },
      {
        "USAF": "230660",
        "WBAN": "99999",
        "DISTANCE": "2590.9"
      },
      {
        "USAF": "234750",
        "WBAN": "99999",
        "DISTANCE": "2594.8"
      },
      {
        "USAF": "209700",
        "WBAN": "99999",
        "DISTANCE": "2595.7"
      },
      {
        "USAF": "208710",
        "WBAN": "99999",
        "DISTANCE": "2602.3"
      },
      {
        "USAF": "209780",
        "WBAN": "99999",
        "DISTANCE": "2625.6"
      },
      {
        "USAF": "234711",
        "WBAN": "99999",
        "DISTANCE": "2640.4"
      },
      {
        "USAF": "235780",
        "WBAN": "99999",
        "DISTANCE": "2649.3"
      },
      {
        "USAF": "206740",
        "WBAN": "99999",
        "DISTANCE": "2649.9"
      },
      {
        "USAF": "238840",
        "WBAN": "99999",
        "DISTANCE": "2662.4"
      },
      {
        "USAF": "237760",
        "WBAN": "99999",
        "DISTANCE": "2665.5"
      },
      {
        "USAF": "200660",
        "WBAN": "99999",
        "DISTANCE": "2667.4"
      },
      {
        "USAF": "236780",
        "WBAN": "99999",
        "DISTANCE": "2681.4"
      },
      {
        "USAF": "207660",
        "WBAN": "99999",
        "DISTANCE": "2700.7"
      },
      {
        "USAF": "200690",
        "WBAN": "99999",
        "DISTANCE": "2705.6"
      },
      {
        "USAF": "239730",
        "WBAN": "99999",
        "DISTANCE": "2710.2"
      },
      {
        "USAF": "233630",
        "WBAN": "99999",
        "DISTANCE": "2710.6"
      },
      {
        "USAF": "234630",
        "WBAN": "99999",
        "DISTANCE": "2715.9"
      },
      {
        "USAF": "239870",
        "WBAN": "99999",
        "DISTANCE": "2724.4"
      },
      {
        "USAF": "233650",
        "WBAN": "99999",
        "DISTANCE": "2767.1"
      },
      {
        "USAF": "209630",
        "WBAN": "99999",
        "DISTANCE": "2771.8"
      },
      {
        "USAF": "206650",
        "WBAN": "99999",
        "DISTANCE": "2786.8"
      },
      {
        "USAF": "237740",
        "WBAN": "99999",
        "DISTANCE": "2790.2"
      },
      {
        "USAF": "233680",
        "WBAN": "99999",
        "DISTANCE": "2795.3"
      },
      {
        "USAF": "234650",
        "WBAN": "99999",
        "DISTANCE": "2806.9"
      },
      {
        "USAF": "239750",
        "WBAN": "99999",
        "DISTANCE": "2807.6"
      },
      {
        "USAF": "208620",
        "WBAN": "99999",
        "DISTANCE": "2845.5"
      },
      {
        "USAF": "232560",
        "WBAN": "99999",
        "DISTANCE": "2883.9"
      },
      {
        "USAF": "230580",
        "WBAN": "99999",
        "DISTANCE": "2892.1"
      },
      {
        "USAF": "236620",
        "WBAN": "99999",
        "DISTANCE": "2902.6"
      },
      {
        "USAF": "203530",
        "WBAN": "99999",
        "DISTANCE": "2918.4"
      },
      {
        "USAF": "209640",
        "WBAN": "99999",
        "DISTANCE": "2943.2"
      },
      {
        "USAF": "234530",
        "WBAN": "99999",
        "DISTANCE": "2964.2"
      },
      {
        "USAF": "207640",
        "WBAN": "99999",
        "DISTANCE": "2971.9"
      },
      {
        "USAF": "206670",
        "WBAN": "99999",
        "DISTANCE": "2974.3"
      },
      {
        "USAF": "208640",
        "WBAN": "99999",
        "DISTANCE": "2981.2"
      },
      {
        "USAF": "209670",
        "WBAN": "99999",
        "DISTANCE": "3007.2"
      },
      {
        "USAF": "239660",
        "WBAN": "99999",
        "DISTANCE": "3009.2"
      },
      {
        "USAF": "238620",
        "WBAN": "99999",
        "DISTANCE": "3017.8"
      },
      {
        "USAF": "233580",
        "WBAN": "99999",
        "DISTANCE": "3023.2"
      },
      {
        "USAF": "207560",
        "WBAN": "99999",
        "DISTANCE": "3030.7"
      },
      {
        "USAF": "353944",
        "WBAN": "99999",
        "DISTANCE": "3035.6"
      },
      {
        "USAF": "231460",
        "WBAN": "99999",
        "DISTANCE": "3038.2"
      },
      {
        "USAF": "235520",
        "WBAN": "99999",
        "DISTANCE": "3038.6"
      },
      {
        "USAF": "235580",
        "WBAN": "99999",
        "DISTANCE": "3057.1"
      },
      {
        "USAF": "203570",
        "WBAN": "99999",
        "DISTANCE": "3063.9"
      },
      {
        "USAF": "236560",
        "WBAN": "99999",
        "DISTANCE": "3097.8"
      },
      {
        "USAF": "232420",
        "WBAN": "99999",
        "DISTANCE": "3101.9"
      },
      {
        "USAF": "208560",
        "WBAN": "99999",
        "DISTANCE": "3123.0"
      },
      {
        "USAF": "234430",
        "WBAN": "99999",
        "DISTANCE": "3129.0"
      },
      {
        "USAF": "238670",
        "WBAN": "99999",
        "DISTANCE": "3141.6"
      },
      {
        "USAF": "233450",
        "WBAN": "99999",
        "DISTANCE": "3151.1"
      },
      {
        "USAF": "237580",
        "WBAN": "99999",
        "DISTANCE": "3211.0"
      },
      {
        "USAF": "232202",
        "WBAN": "99999",
        "DISTANCE": "3212.1"
      },
      {
        "USAF": "239530",
        "WBAN": "99999",
        "DISTANCE": "3217.2"
      },
      {
        "USAF": "234450",
        "WBAN": "99999",
        "DISTANCE": "3222.3"
      },
      {
        "USAF": "233410",
        "WBAN": "99999",
        "DISTANCE": "3222.8"
      },
      {
        "USAF": "238590",
        "WBAN": "99999",
        "DISTANCE": "3224.7"
      },
      {
        "USAF": "230320",
        "WBAN": "99999",
        "DISTANCE": "3227.2"
      },
      {
        "USAF": "236570",
        "WBAN": "99999",
        "DISTANCE": "3243.9"
      },
      {
        "USAF": "238520",
        "WBAN": "99999",
        "DISTANCE": "3247.0"
      },
      {
        "USAF": "239550",
        "WBAN": "99999",
        "DISTANCE": "3290.5"
      },
      {
        "USAF": "233330",
        "WBAN": "99999",
        "DISTANCE": "3299.7"
      },
      {
        "USAF": "230290",
        "WBAN": "99999",
        "DISTANCE": "3313.7"
      },
      {
        "USAF": "234710",
        "WBAN": "99999",
        "DISTANCE": "3320.8"
      },
      {
        "USAF": "239331",
        "WBAN": "99999",
        "DISTANCE": "3320.8"
      },
      {
        "USAF": "235410",
        "WBAN": "99999",
        "DISTANCE": "3331.0"
      },
      {
        "USAF": "237480",
        "WBAN": "99999",
        "DISTANCE": "3331.0"
      },
      {
        "USAF": "232203",
        "WBAN": "99999",
        "DISTANCE": "3331.5"
      },
      {
        "USAF": "233320",
        "WBAN": "99999",
        "DISTANCE": "3345.7"
      },
      {
        "USAF": "233390",
        "WBAN": "99999",
        "DISTANCE": "3349.6"
      },
      {
        "USAF": "233380",
        "WBAN": "99999",
        "DISTANCE": "3368.1"
      },
      {
        "USAF": "238430",
        "WBAN": "99999",
        "DISTANCE": "3374.5"
      },
      {
        "USAF": "237450",
        "WBAN": "99999",
        "DISTANCE": "3375.5"
      },
      {
        "USAF": "236440",
        "WBAN": "99999",
        "DISTANCE": "3388.9"
      },
      {
        "USAF": "232200",
        "WBAN": "99999",
        "DISTANCE": "3397.8"
      },
      {
        "USAF": "232201",
        "WBAN": "99999",
        "DISTANCE": "3398.0"
      },
      {
        "USAF": "233300",
        "WBAN": "99999",
        "DISTANCE": "3399.2"
      },
      {
        "USAF": "230220",
        "WBAN": "99999",
        "DISTANCE": "3400.0"
      },
      {
        "USAF": "233310",
        "WBAN": "99999",
        "DISTANCE": "3416.2"
      },
      {
        "USAF": "237410",
        "WBAN": "99999",
        "DISTANCE": "3420.3"
      },
      {
        "USAF": "230210",
        "WBAN": "99999",
        "DISTANCE": "3428.2"
      },
      {
        "USAF": "238490",
        "WBAN": "99999",
        "DISTANCE": "3432.8"
      },
      {
        "USAF": "230200",
        "WBAN": "99999",
        "DISTANCE": "3437.5"
      },
      {
        "USAF": "232260",
        "WBAN": "99999",
        "DISTANCE": "3444.2"
      },
      {
        "USAF": "236350",
        "WBAN": "99999",
        "DISTANCE": "3450.9"
      },
      {
        "USAF": "239460",
        "WBAN": "99999",
        "DISTANCE": "3459.5"
      },
      {
        "USAF": "230240",
        "WBAN": "99999",
        "DISTANCE": "3460.7"
      },
      {
        "USAF": "231210",
        "WBAN": "99999",
        "DISTANCE": "3467.3"
      },
      {
        "USAF": "234310",
        "WBAN": "99999",
        "DISTANCE": "3467.8"
      },
      {
        "USAF": "238480",
        "WBAN": "99999",
        "DISTANCE": "3476.9"
      },
      {
        "USAF": "234230",
        "WBAN": "99999",
        "DISTANCE": "3502.7"
      },
      {
        "USAF": "238470",
        "WBAN": "99999",
        "DISTANCE": "3527.4"
      },
      {
        "USAF": "238410",
        "WBAN": "99999",
        "DISTANCE": "3529.0"
      },
      {
        "USAF": "234260",
        "WBAN": "99999",
        "DISTANCE": "3535.7"
      },
      {
        "USAF": "235310",
        "WBAN": "99999",
        "DISTANCE": "3538.6"
      },
      {
        "USAF": "233220",
        "WBAN": "99999",
        "DISTANCE": "3547.2"
      },
      {
        "USAF": "236320",
        "WBAN": "99999",
        "DISTANCE": "3566.5"
      },
      {
        "USAF": "239470",
        "WBAN": "99999",
        "DISTANCE": "3600.6"
      },
      {
        "USAF": "236310",
        "WBAN": "99999",
        "DISTANCE": "3619.3"
      },
      {
        "USAF": "233240",
        "WBAN": "99999",
        "DISTANCE": "3626.1"
      },
      {
        "USAF": "239330",
        "WBAN": "99999",
        "DISTANCE": "3641.0"
      },
      {
        "USAF": "238380",
        "WBAN": "99999",
        "DISTANCE": "3659.1"
      },
      {
        "USAF": "237340",
        "WBAN": "99999",
        "DISTANCE": "3675.0"
      },
      {
        "USAF": "237370",
        "WBAN": "99999",
        "DISTANCE": "3686.9"
      },
      {
        "USAF": "236290",
        "WBAN": "99999",
        "DISTANCE": "3689.6"
      },
      {
        "USAF": "237230",
        "WBAN": "99999",
        "DISTANCE": "3691.9"
      },
      {
        "USAF": "239390",
        "WBAN": "99999",
        "DISTANCE": "3693.0"
      },
      {
        "USAF": "236280",
        "WBAN": "99999",
        "DISTANCE": "3735.5"
      },
      {
        "USAF": "236250",
        "WBAN": "99999",
        "DISTANCE": "3755.0"
      },
      {
        "USAF": "238230",
        "WBAN": "99999",
        "DISTANCE": "3756.0"
      },
      {
        "USAF": "235270",
        "WBAN": "99999",
        "DISTANCE": "3760.4"
      },
      {
        "USAF": "237290",
        "WBAN": "99999",
        "DISTANCE": "3778.4"
      },
      {
        "USAF": "239230",
        "WBAN": "99999",
        "DISTANCE": "3830.5"
      },
      {
        "USAF": "238290",
        "WBAN": "99999",
        "DISTANCE": "3857.3"
      },
      {
        "USAF": "237240",
        "WBAN": "99999",
        "DISTANCE": "3887.2"
      },
      {
        "USAF": "238200",
        "WBAN": "99999",
        "DISTANCE": "3888.7"
      },
      {
        "USAF": "239290",
        "WBAN": "99999",
        "DISTANCE": "3898.1"
      },
      {
        "USAF": "239250",
        "WBAN": "99999",
        "DISTANCE": "3937.9"
      },
      {
        "USAF": "238270",
        "WBAN": "99999",
        "DISTANCE": "3984.2"
      },
      {
        "USAF": "239210",
        "WBAN": "99999",
        "DISTANCE": "4029.0"
      },
      {
        "USAF": "239270",
        "WBAN": "99999",
        "DISTANCE": "4086.0"
      }
    ],
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
let expectedStationCount = 0;
let notFoundCount = 0;
let failedToParseCount = 0;
let normalStationCount = 0;
let resultArrForStations = [];

//确定站号
if(config.multipleStation > 0){
    //定义用于异步循环的Promise对象(第一个Promise对象)
    let promise0 = new Promise((resolve) => { resolve(); })
    //异步循环
    consoleStations(promise0, config.arrOfStations.length);
    function consoleStations(pro, len){
        console.log(); //console一次换行
        for(let i=0; i<len; i++){
            pro = pro.then(() => {
                return new Promise((resolve) => {
                    stationObj = config.arrOfStations[i];
                    getAllOfWeatherStation(stationObj);
                    resolve(); //resolve放在最后
                })
            });
        }
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
        expectedStationCount += 1;
        if(sourceStr.trim().length < 1){ //如果没有找到站点
            notFoundCount += 1;
            return;
        }
        consoleResult();
    }
});

function consoleResult(){
    let result = consoleDetails();
    if(config.multipleStation === 0){
        if(config.console.station > 0){ result.station(); }
        if(config.console.overview > 0){ result.overview(); }
        if(config.console.M > 0){ result.M(); }
        if(config.console.YM > 0){ result.YM(); }
        if(config.console.consec > 0){ result.consec(); }
        if(config.console.list > 0){ result.list(); }
        if(config.console.yearRange > 0){ result.yearRange(); } //这个适合放在最后面，年份字太多了，影响观看
        if(config.console.allRecords > 0){ result.allRecords(); }
    }else if(config.multipleStation > 0){
        result.multipleStation();
    }
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
        if(tempRegExp.test(lon.toString())){ //如果错误解析某站点csv
            failedToParseCount += 1;
            console.log('FAILED TO PARSE STATION: ' + stationNumberToPrint);
        }else{ //正确解析某站点csv
            normalStationCount += 1;
            let tempObj = {};
            tempObj.NAME = name;
            tempObj['STATION NUMBER'] = stationNumberToPrint;

            //自定义属性，给输出对象的属性起名字(key)
            /* //极端低温
            let tempAttr1 = 'MIN';
            let tempAttr2 = 'TOTAL';
            let tempAttr3 = 'MIN DATE';
            tempObj[tempAttr1] = overview.MIN.min;
            tempObj[tempAttr2] = overview.MIN.total;
            tempObj[tempAttr3] = overview.MIN.minDate; */
            
            //最大连续日数
            if(stat_CONSEC.length === 0){ return } //这里必须提前判断数组是否为空，否则后面会报错
            let tempAttr1 = 'MAX CONSEC';
            let tempAttr2 = 'START';
            let tempAttr3 = 'END';
            let tempAttr4 = 'TOTAL';
            tempObj[tempAttr1] = stat_CONSEC[0].consecDays;
            tempObj[tempAttr2] = stat_CONSEC[0].startDate;
            tempObj[tempAttr3] = stat_CONSEC[0].endDate;
            tempObj[tempAttr4] = totalThreshholdDays;

            //基本属性
            tempObj['ELEV(m)'] = elev;
            tempObj.LATITUDE = lat;
            tempObj.LONGITUDE = lon;
            
            //填装对象到数组
            resultArrForStations.push(tempObj);
            if(expectedStationCount === config.arrOfStations.length){ //读取完数组最后一个站点
                console.log('\n****** STATIONS NEARBY ******')
                console.log('EXPECTED: ' + expectedStationCount);
                console.log('NOT FOUND: ' + notFoundCount);
                console.log('FAILED TO PARSE: ' + failedToParseCount);
                console.log('SUCCEED TO RETRIEVE: ' + normalStationCount + '\n');

                //给结果数组排序
                resultArrForStations.sort((a, b) => { return b[tempAttr1] - a[tempAttr1]; });

                //打印结果
                console.table(resultArrForStations);
                //打印CSV字符文本
                console.log('\n' + tools.getCsvStringFromArrOfObj(resultArrForStations));
            }
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

    //把对象数组转换成带制表符和换行符的文本字符串
    function getCsvStringFromArrOfObj(arr){
        if(arr.length === 0){
            return 'NO CSV STRING!';
        }
        let str = '';
        let keyArr = Object.keys(arr[0]);
        keyArr.forEach((v, i) => {
            if(i < keyArr.length - 1){
                str += v + '\t';
            }else{
                str += v + '\n';
            }
        });
        //let valueArr = Object.values(arr);
        arr.forEach((v) => {
            keyArr.forEach((v1, i1) => {
                if(i1 < keyArr.length - 1){
                    str += arrToStr(v[v1]) + '\t';
                }else{
                    str += arrToStr(v[v1]) + '\n';
                }
            });
        });
        
        return str;
        
        function arrToStr(arg){
            if(!Array.isArray(arg)){
                return arg;
            }
            let tempStr = '';
            if(arg.length === 1){
                tempStr = arg[0].toString();
            }else if(arg.length > 1){
                for(let i=0; i<arg.length; i++){
                    if(i < arg.length - 1){
                        tempStr += arg[i].toString() + '、';
                    }else{
                        tempStr += arg[i].toString();
                    }
                }
            }else{
                return 'EMPTY ARRAY!';
            }
            return tempStr;
        }
    }

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
    this.getCsvStringFromArrOfObj = getCsvStringFromArrOfObj;
    this.FN = FN;
    this.TFC = TFC;
    this.getStationNumber = getStationNumber;
}