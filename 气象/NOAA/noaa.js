//导入必要的包
let fs = require('fs');
let readMultipleFiles = require('read-multiple-files');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//配置对象，用于设置筛选条件
const config = {
    stationObj: {
        USAF: '36096',
        //留空则默认为99999，长度小于5则前面自动补0
        WBAN: '99999'
    },

    dateStart: '1929-01-01',
    dateEnd: '2025-12-31',
    month: 0, //0 = 全年, 1 = 一月, ... , 12 = 十二月。这个月份不能填错，不然报错都找不到错误
    
    multipleStation: 1, //是否切换到打印邻近站点模式
    order: 'asc', //asc(从小到大、从低到高，从早到晚), desc
    item: 'min', //date, min, avg, max
    consecValue: '-40', //连续记录的临界值
    showNumber: 5, //显示多少个结果
    console: { //设置console打印哪些
        station: 1,
        overview: 1,
        M: 1,
        YM: 1,
        winter: 1,
        consec: 1,
        list: 1,
        yearRange: 1,
        allRecords: 0
    },

    //获取邻站信息
    //决定console哪一类信息
    //00=最低夜温(最低气温),01=夜温平均,02=最高夜温; 10=最低均温,11=均温,12=最高均温; 20=最低昼温,21=昼温平均,22=最高昼温(最高气温)
    //30=月份低温平均,31=月份均温,32=月份高温平均; 40=极端单月低温平均,41=极端单月均温,42极端单月高温平均; 50=单个冬季最多阈值天数
    //60=最长连续记录; 70=年平均气温(用overview)
    multipleTarget: '50',
    arrOfStations: [{"NAME":"SELEMDZA","USAF":"313380","WBAN":"99999"},{"NAME":"EKIMCAN","USAF":"313290","WBAN":"99999"},{"NAME":"SEVLI","USAF":"313250","WBAN":"99999"},{"NAME":"BOLODEK","USAF":"313310","WBAN":"99999"},{"NAME":"SOFIJSKIJ PRIISK","USAF":"314780","WBAN":"99999"},{"NAME":"BURUKAN","USAF":"313480","WBAN":"99999"},{"NAME":"UDSKOE","USAF":"312850","WBAN":"99999"},{"NAME":"STOJBA","USAF":"313920","WBAN":"99999"},{"NAME":"VESELAJA GORKA","USAF":"314180","WBAN":"99999"},{"NAME":"TOROM","USAF":"312880","WBAN":"99999"},{"NAME":"UST'-UMAL'TA","USAF":"314740","WBAN":"99999"},{"NAME":"IM POLINY OSIPENKO","USAF":"314160","WBAN":"99999"},{"NAME":"SREDNYAYA IPPATA","USAF":"314750","WBAN":"99999"},{"NAME":"CUMIKAN","USAF":"312860","WBAN":"99999"},{"NAME":"SELEMDZINSKOE","USAF":"313940","WBAN":"99999"},{"NAME":"HULARIN","USAF":"314840","WBAN":"99999"},{"NAME":"DUKI","USAF":"314820","WBAN":"99999"},{"NAME":"TUGUR","USAF":"313460","WBAN":"99999"},{"NAME":"BYSSA","USAF":"313970","WBAN":"99999"},{"NAME":"CEGDOMYN","USAF":"314690","WBAN":"99999"},{"NAME":"GUGA","USAF":"314210","WBAN":"99999"},{"NAME":"JANA","USAF":"312350","WBAN":"99999"},{"NAME":"DUGDA","USAF":"313180","WBAN":"99999"},{"NAME":"LEVAJA KOSMUN","USAF":"315410","WBAN":"99999"},{"NAME":"IRUMKA-IN-KHABAROV","USAF":"315450","WBAN":"99999"},{"NAME":"CEKUNDA","USAF":"315320","WBAN":"99999"},{"NAME":"NORSK","USAF":"313880","WBAN":"99999"},{"NAME":"GORIN","USAF":"314890","WBAN":"99999"},{"NAME":"VERKHOVYE GORINA","USAF":"315520","WBAN":"99999"},{"NAME":"LOKSAK","USAF":"312630","WBAN":"99999"},{"NAME":"OSTROV BELICHIY","USAF":"311830","WBAN":"99999"},{"NAME":"BOL'SHOJ SHANTAR","USAF":"311740","WBAN":"99999"},{"NAME":"VERHNJAJA TOM","USAF":"314590","WBAN":"99999"},{"NAME":"BICHI-IN-KHABAROV","USAF":"314920","WBAN":"99999"},{"NAME":"BAKTOR","USAF":"314970","WBAN":"99999"},{"NAME":"UDINSKOJE","USAF":"314230","WBAN":"99999"},{"NAME":"CAPE UKOY","USAF":"311730","WBAN":"99999"},{"NAME":"GAR","USAF":"313840","WBAN":"99999"},{"NAME":"OGORON","USAF":"313110","WBAN":"99999"},{"NAME":"VERHOVJE URMI","USAF":"315480","WBAN":"99999"},{"NAME":"DEP-DOLBIR","USAF":"313060","WBAN":"99999"},{"NAME":"OKTJABR'SKIJ PRIISK","USAF":"313730","WBAN":"99999"},{"NAME":"KOMSOMOLSK-NA-AMURE","USAF":"315610","WBAN":"99999"},{"NAME":"KUR","USAF":"316320","WBAN":"99999"},{"NAME":"SOMNITELNIJ-PRIISK","USAF":"314370","WBAN":"99999"},{"NAME":"OSTROV REYNEK SW","USAF":"313610","WBAN":"99999"},{"NAME":"SEKTAGLI","USAF":"315340","WBAN":"99999"},{"NAME":"SUTUR","USAF":"315380","WBAN":"99999"},{"NAME":"BOMNAK","USAF":"312530","WBAN":"99999"},{"NAME":"AMURSK","USAF":"315500","WBAN":"99999"},{"NAME":"NIZNETAMBOVSKOE","USAF":"315620","WBAN":"99999"},{"NAME":"KULCI","USAF":"313640","WBAN":"99999"},{"NAME":"BOLON","USAF":"316510","WBAN":"99999"},{"NAME":"MAZANOVO","USAF":"314430","WBAN":"99999"},{"NAME":"TOKO","USAF":"311370","WBAN":"99999"},{"NAME":"SUHANOVKA","USAF":"315040","WBAN":"99999"},{"NAME":"NERAN","USAF":"316360","WBAN":"99999"},{"NAME":"ALEKSANDRA","USAF":"313620","WBAN":"99999"},{"NAME":"VOSKRESENSKOJE","USAF":"314320","WBAN":"99999"},{"NAME":"VERKHNIY NERGEN NW","USAF":"316530","WBAN":"99999"},{"NAME":"BRATOLJUBOVKA","USAF":"315210","WBAN":"99999"},{"NAME":"VERHNI NERGEN","USAF":"316610","WBAN":"99999"},{"NAME":"AYAK (?)","USAF":"313720","WBAN":"99999"},{"NAME":"URMI","USAF":"316240","WBAN":"99999"},{"NAME":"PAD","USAF":"314330","WBAN":"99999"},{"NAME":"BATOMGA","USAF":"311580","WBAN":"99999"},{"NAME":"PAYKAN-IN-AMUR","USAF":"315280","WBAN":"99999"},{"NAME":"KHARA-IN-AMUR","USAF":"315930","WBAN":"99999"},{"NAME":"LITOVKO","USAF":"316470","WBAN":"99999"},{"NAME":"DAMBUKI","USAF":"312570","WBAN":"99999"},{"NAME":"SEGZEMA","USAF":"315660","WBAN":"99999"},{"NAME":"SVOBODNYJ","USAF":"314450","WBAN":"99999"},{"NAME":"BOGORODSKOE","USAF":"314390","WBAN":"99999"},{"NAME":"SIMANOVSK","USAF":"314420","WBAN":"99999"},{"NAME":"ZEJA","USAF":"313000","WBAN":"99999"},{"NAME":"TROICKOE","USAF":"316550","WBAN":"99999"},{"NAME":"NIKOLAEVSK-ON-AMUR","USAF":"313690","WBAN":"99999"},{"NAME":"BELOGORSK","USAF":"315130","WBAN":"99999"},{"NAME":"IVANKOVTSI","USAF":"316380","WBAN":"99999"},{"NAME":"AYAN","USAF":"311680","WBAN":"99999"},{"NAME":"ZAVITAJA","USAF":"315270","WBAN":"99999"},{"NAME":"MARIINSKOJE","USAF":"315020","WBAN":"99999"},{"NAME":"PETROVSK NW","USAF":"313660","WBAN":"99999"},{"NAME":"MUHINO","USAF":"313770","WBAN":"99999"},{"NAME":"MALINOVKA","USAF":"315830","WBAN":"99999"},{"NAME":"BIRA","USAF":"316180","WBAN":"99999"},{"NAME":"...","USAF":"311250","WBAN":"99999"},{"NAME":"NOVOKUROVKA","USAF":"317230","WBAN":"99999"},{"NAME":"SIHOTE","USAF":"315770","WBAN":"99999"},{"NAME":"BIRAKAN","USAF":"317030","WBAN":"99999"},{"NAME":"UARKI","USAF":"314360","WBAN":"99999"},{"NAME":"ARHARA","USAF":"315940","WBAN":"99999"},{"NAME":"BIROBIDZHAN","USAF":"317130","WBAN":"99999"},{"NAME":"DE-KASTRI","USAF":"315090","WBAN":"99999"},{"NAME":"ELABUGA","USAF":"317330","WBAN":"99999"},{"NAME":"OBLUC'E","USAF":"317020","WBAN":"99999"},{"NAME":"SMIDOVICH","USAF":"317250","WBAN":"99999"},{"NAME":"PYRKI SAKHALIN","USAF":"320210","WBAN":"99999"},{"NAME":"TYGDA","USAF":"312990","WBAN":"99999"},{"NAME":"ASTASIHA","USAF":"315860","WBAN":"99999"},{"NAME":"...","USAF":"311320","WBAN":"99999"},{"NAME":"ASTASHIKNA","USAF":"315880","WBAN":"99999"},{"NAME":"UNAHA","USAF":"311990","WBAN":"99999"},{"NAME":"SIZEMAN","USAF":"315730","WBAN":"99999"},{"NAME":"USAKOVO","USAF":"314410","WBAN":"99999"},{"NAME":"HABAROVSK","USAF":"317360","WBAN":"99999"},{"NAME":"KUMARA","USAF":"314440","WBAN":"99999"},{"NAME":"NOVY","USAF":"317350","WBAN":"99999"},{"NAME":"HUMA","USAF":"503530","WBAN":"99999"},{"NAME":"NEL' KAN","USAF":"311520","WBAN":"99999"},{"NAME":"SERGEJEVKA","USAF":"315110","WBAN":"99999"},{"NAME":"POGIBI","USAF":"320270","WBAN":"99999"},{"NAME":"KHABAROVSK","USAF":"999999","WBAN":"44301"},{"NAME":"RYBNOVSK","USAF":"320040","WBAN":"99999"},{"NAME":"CHERNJAEVO","USAF":"313710","WBAN":"99999"},{"NAME":"POJARKOVO","USAF":"315870","WBAN":"99999"},{"NAME":"NADEZHDINSKOYE","USAF":"317270","WBAN":"99999"},{"NAME":"IGNATYEVO","USAF":"313289","WBAN":"99999"},{"NAME":"MAGDAGACI","USAF":"312950","WBAN":"99999"},{"NAME":"AMURSKAYA NORTH","USAF":"311870","WBAN":"99999"},{"NAME":"BLAGOVESCENSK","USAF":"315100","WBAN":"99999"},{"NAME":"TIVJAKU","USAF":"317540","WBAN":"99999"},{"NAME":"CJUL'BJU","USAF":"311230","WBAN":"99999"},{"NAME":"AIHUI","USAF":"504680","WBAN":"99999"},{"NAME":"DICHUN","USAF":"317050","WBAN":"99999"},{"NAME":"VIAHTU","USAF":"320450","WBAN":"99999"},{"NAME":"SOLEKUL","USAF":"316770","WBAN":"99999"},{"NAME":"CAPE SYURKUM","USAF":"315790","WBAN":"99999"},{"NAME":"TUMNIN","USAF":"316830","WBAN":"99999"},{"NAME":"MOSKALVO","USAF":"320140","WBAN":"99999"},{"NAME":"POMPEYEVKA","USAF":"317040","WBAN":"99999"},{"NAME":"VERINO","USAF":"317900","WBAN":"99999"},{"NAME":"...","USAF":"311130","WBAN":"99999"},{"NAME":"NORTHEAST","USAF":"507410","WBAN":"99999"},{"NAME":"NYVROVO","USAF":"320110","WBAN":"99999"},{"NAME":"LENINSKOE","USAF":"317100","WBAN":"99999"},{"NAME":"OLENEVOD NORTHEAST","USAF":"320430","WBAN":"99999"},{"NAME":"KAJGAN","USAF":"320130","WBAN":"99999"},{"NAME":"KHOR","USAF":"317910","WBAN":"99999"},{"NAME":"CAPE YELIZAVETI","USAF":"320120","WBAN":"99999"},{"NAME":"OHA","USAF":"320100","WBAN":"99999"},{"NAME":"OKHA RUSSIAN FEDERAT","USAF":"353943","WBAN":"99999"},{"NAME":"ALEKSEYEVKA WEST","USAF":"316890","WBAN":"99999"},{"NAME":"CHERINAY","USAF":"317490","WBAN":"99999"},{"NAME":"TALDAN","USAF":"306930","WBAN":"99999"},{"NAME":"BICEVAJA","USAF":"317920","WBAN":"99999"},{"NAME":"IOLI","USAF":"317660","WBAN":"99999"},{"NAME":"ALEKSANDROVSK-SAHALINSKIJ","USAF":"320610","WBAN":"99999"},{"NAME":"TIGAN-URKAN","USAF":"305990","WBAN":"99999"},{"NAME":"SUNWU","USAF":"505640","WBAN":"99999"},{"NAME":"TA-HE","USAF":"502460","WBAN":"99999"},{"NAME":"VJAZEMSKAJA","USAF":"317860","WBAN":"99999"},{"NAME":"CAJVO","USAF":"320360","WBAN":"99999"},{"NAME":"GVASJUGI","USAF":"318010","WBAN":"99999"},{"NAME":"GROSSEVICHI WEST","USAF":"317670","WBAN":"99999"},{"NAME":"ADO-TYMOVO","USAF":"320570","WBAN":"99999"},{"NAME":"NOGLIKI","USAF":"320530","WBAN":"99999"},{"NAME":"EKATERINO-NIKOL'SKOE","USAF":"317070","WBAN":"99999"},{"NAME":"SOVETSKAYA GAVAN","USAF":"317700","WBAN":"99999"},{"NAME":"SVETLYY WEST","USAF":"311120","WBAN":"99999"},{"NAME":"KURUN-URJAKAH","USAF":"310670","WBAN":"99999"},{"NAME":"TYNDA","USAF":"304990","WBAN":"99999"},{"NAME":"ENKAN","USAF":"311630","WBAN":"99999"},{"NAME":"MATAY-IN-KHABAROV","USAF":"317980","WBAN":"99999"},{"NAME":"SUKPAY","USAF":"318150","WBAN":"99999"},{"NAME":"TYMOVSKOE","USAF":"320710","WBAN":"99999"},{"NAME":"UCHUR","USAF":"310260","WBAN":"99999"},{"NAME":"PIL'VO","USAF":"320690","WBAN":"99999"},{"NAME":"NAGORNYJ","USAF":"304930","WBAN":"99999"},{"NAME":"LERMONTOVKA","USAF":"317880","WBAN":"99999"},{"NAME":"SKOVORODINO","USAF":"306920","WBAN":"99999"},{"NAME":"DZALINDA","USAF":"306950","WBAN":"99999"},{"NAME":"FUJIN","USAF":"507880","WBAN":"99999"},{"NAME":"ONOR","USAF":"320770","WBAN":"99999"},{"NAME":"UST'-JUDOMA","USAF":"310540","WBAN":"99999"},{"NAME":"KOPPI SOUTH","USAF":"317760","WBAN":"99999"},{"NAME":"TAKHTAMYGDA NE","USAF":"305980","WBAN":"99999"},{"NAME":"AGZU","USAF":"318250","WBAN":"99999"},{"NAME":"KONGI","USAF":"320590","WBAN":"99999"},{"NAME":"GROSSEVICHI","USAF":"318230","WBAN":"99999"},{"NAME":"HE-GANG","USAF":"507750","WBAN":"99999"},{"NAME":"UGINO","USAF":"310160","WBAN":"99999"},{"NAME":"LESOGORSK SOUTHEAST","USAF":"320850","WBAN":"99999"},{"NAME":"BIKIN","USAF":"318320","WBAN":"99999"},{"NAME":"YICHUN","USAF":"507740","WBAN":"99999"},{"NAME":"CULMAN/NERIUGRI","USAF":"303930","WBAN":"99999"},{"NAME":"KANKU","USAF":"311020","WBAN":"99999"},{"NAME":"XIAO-YANG-QI","USAF":"504420","WBAN":"99999"},{"NAME":"JIU-HAI-LAI","USAF":"503490","WBAN":"99999"},{"NAME":"LONG-ZHEN","USAF":"506560","WBAN":"99999"},{"NAME":"SREDNAYAYA NYUKZHA","USAF":"304980","WBAN":"99999"},{"NAME":"SMIRNYKH","USAF":"320910","WBAN":"99999"},{"NAME":"UGLEGORSK","USAF":"320880","WBAN":"99999"},{"NAME":"UST'-MIL'","USAF":"310410","WBAN":"99999"},{"NAME":"GAMCANZA","USAF":"318510","WBAN":"99999"},{"NAME":"URUSA","USAF":"305970","WBAN":"99999"},{"NAME":"ZOLOTOJ","USAF":"318290","WBAN":"99999"},{"NAME":"POGRANICHNOE","USAF":"320760","WBAN":"99999"},{"NAME":"KRASNYJ JAR","USAF":"318450","WBAN":"99999"},{"NAME":"UST-URKIMA","USAF":"304970","WBAN":"99999"},{"NAME":"CHIA-MU-SSU /CHIAMUEZE","USAF":"508730","WBAN":"99999"},{"NAME":"NENJIANG","USAF":"505570","WBAN":"99999"},{"NAME":"MOHE","USAF":"501360","WBAN":"99999"},{"NAME":"PESKOYSKIY NORTHWEST","USAF":"320930","WBAN":"99999"},{"NAME":"ULUNGA-IN-PRIMOR","USAF":"318560","WBAN":"99999"},{"NAME":"BAOQING","USAF":"508880","WBAN":"99999"},{"NAME":"IGNASINO","USAF":"306860","WBAN":"99999"},{"NAME":"PORONAJSK","USAF":"320980","WBAN":"99999"},{"NAME":"YUGORENOK","USAF":"310620","WBAN":"99999"},{"NAME":"KRASHOGORSK","USAF":"321050","WBAN":"99999"},{"NAME":"USMUN","USAF":"310070","WBAN":"99999"},{"NAME":"GLUBINNOYE NORTH","USAF":"318480","WBAN":"99999"},{"NAME":"TIE-LI","USAF":"508620","WBAN":"99999"},{"NAME":"MAKAROV","USAF":"321160","WBAN":"99999"},{"NAME":"SOSUNOVO","USAF":"318660","WBAN":"99999"},{"NAME":"UL' YA","USAF":"310870","WBAN":"99999"},{"NAME":"EROFEJ PAVLOVIC","USAF":"306830","WBAN":"99999"}],
    
    winterConfig: {
        sortBy: 3, //0=满足阈值个数从多到少, 1=最低温, 2=最低均温, 3=最低昼温, 4=冬三月低温平均, 5=冬三月均温, 6=冬三月高温平均
        showMin: 1, //打印冬季周期最低温
        showMinForAvg: 1, //打印冬季周期最低均温
        showMinForMax: 1, //打印冬季周期最低昼温
        showAvgForMin: 1, //打印冬三月低均
        showAvg: 1, //打印冬三月均温
        showAvgForMax: 1 //打印冬三月高均S
    },
    M: {
        showValid: 0 //0 not show, 1 show valid
    },
    monthValidCount: 18, //某个月的avg/min/max至少有20个正常记录，才算一个有效avg/min/max月,才会计算有参考价值的月度均值

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
    if(Object.keys(result).length === 0){
        console.log(stationNumberToPrint + ': NO RECORDS THIS MONTH');
        return;
    }
    if(config.multipleStation === 0){
        if(config.console.station > 0){ result.station(); }
        if(config.console.overview > 0){ result.overview(); }
        if(config.console.M > 0){ result.M(); }
        if(config.console.YM > 0){ result.YM(); }
        if(config.console.winter > 0){ result.winter(); }
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
    let stat_WINTER = startObj.stat_WINTER;
    let winter_MaxTHR = startObj.winter_MaxTHR;
    let maxTHR_winter = startObj.maxTHR_winter;
    let stat_CONSEC = startObj.stat_CONSEC;
    let totalThreshholdDays = startObj.totalThreshholdDays;
    
    //站点信息
    if(startObj.arr.length === 0){ return {}; } //判断筛选后的对象数组是否为空，为空是因为目标月份没有任何记录
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

    //console逐冬周期数据
    function consoleWinter(){
        console.log('STATISTICS BY WINTER:');
        let objK = Object.keys(stat_WINTER);
        let objV = Object.values(stat_WINTER);
        let len = objK.length;
        
        if(len === 0){ return; } //如果数据源为空，则跳过
        
        //因为数据源是对象，无法排序，这里把对象内容放到数组里再排序
        let tempArr = [];
        for(let i=0; i<len; i++){
            let tempObj = {};
            tempObj.period = objK[i];
            tempObj.fullPeriod = objV[i].fullPeriod;
            tempObj.winterM3 = objV[i].winterM3;
            tempArr.push(tempObj);
        }
        //根据什么排序
        let tempSortByStr = '';
        let tempSortBy = config.winterConfig.sortBy; //0=满足阈值个数从多到少, 1=最低温, 2=最低均温, 3=最低昼温, 4=冬三月低温平均, 5=冬三月均温, 6=冬三月高温平均
        if(tempSortBy === 0){
            tempSortByStr = 'MOST DAYS MATCHED THRESHHOLD VALUE';
            tempArr.sort((a, b) => b.fullPeriod.threshHoldDays - a.fullPeriod.threshHoldDays); //按满足阈值天数排序，从多到少
        }else if(tempSortBy === 1){
            tempSortByStr = 'MIN';
            tempArr.sort((a, b) => a.fullPeriod.min - b.fullPeriod.min); //按最低温
        }else if(tempSortBy === 2){
            tempSortByStr = 'MIN OF AVG';
            tempArr.sort((a, b) => a.fullPeriod.minForAvg - b.fullPeriod.minForAvg); //按最低均温
        }else if(tempSortBy === 3){
            tempSortByStr = 'MIN OF MAX';
            tempArr.sort((a, b) => a.fullPeriod.minForMax - b.fullPeriod.minForMax); //按最低昼温
        }else if(tempSortBy === 4){
            tempSortByStr = 'AVG OF MIN FOR WINTER 3 MONTHS';
            tempArr.sort((a, b) => a.winterM3.avgForMin - b.winterM3.avgForMin); //按冬三月低温平均
        }else if(tempSortBy === 5){
            tempSortByStr = 'AVG FOR WINTER 3 MONTHS';
            tempArr.sort((a, b) => a.winterM3.avg - b.winterM3.avg); //按冬三月均温
        }else if(tempSortBy === 6){
            tempSortByStr = 'AVG OF MAX FOR WINTER 3 MONTHS';
            tempArr.sort((a, b) => a.winterM3.avgForMax - b.winterM3.avgForMax); //按冬三月高温平均
        }
        
        //打印
        console.log('IN ONLY 1 WINTER '+ focusedAttr + ' ' + focusedOrderSymbolStr + ' ' + config.consecValue + ' MOST DAYS: ' + winter_MaxTHR + ' ( ' + maxTHR_winter + ' )');
        console.log('WINTER LIST SORTED BY ' + tempSortByStr + ':');
        for(let i=0; i<len; i++){
            console.log('─── ' + tempArr[i].period + ' ─── | ' + focusedAttr + ' ' + focusedOrderSymbolStr + ' ' + config.consecValue + ' TOTAL DAYS: ' + tempArr[i].fullPeriod.threshHoldDays);
            if(config.winterConfig.showMin > 0){
                console.log('MIN FOR MIN: ' + tempArr[i].fullPeriod.min);
            }
            if(config.winterConfig.showMinForAvg > 0){
                console.log('MIN FOR AVG: ' + tempArr[i].fullPeriod.minForAvg);
            }
            if(config.winterConfig.showMinForMax > 0){
                console.log('MIN FOR MAX: ' + tempArr[i].fullPeriod.minForMax);
            }
            if(config.winterConfig.showAvgForMin > 0){
                console.log('WINTER 3 MONTHS AVG FOR MIN: ' + tempArr[i].winterM3.avgForMin + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForMin + ' )');
            }
            if(config.winterConfig.showAvg > 0){
                console.log('WINTER 3 MONTHS AVG FOR AVG: ' + tempArr[i].winterM3.avg + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForAvg + ' )');
            }
            if(config.winterConfig.showAvgForMax > 0){
                console.log('WINTER 3 MONTHS AVG FOR MAX: ' + tempArr[i].winterM3.avgForMax + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForMax + ' )');
            }
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
            console.log(stationNumberToPrint + ': FAILED TO PARSE STATION');
        }else{ //正确解析某站点csv
            normalStationCount += 1;
            let tempObj = {};
            
            //给 tempObj 添加属性,中间包含几个自定义属性
            //基本属性
            tempObj.NAME = name;
            tempObj['STATION NUMBER'] = stationNumberToPrint;
            let tempAttr0; //自定义属性预定义，到这一步还不确定对应哪一项

            /****************** 自定义属性 START ******************/
            //夜温MIN
            //00 最低夜温(最低气温)
            if(config.multipleTarget === '00'){
                tempAttr0 = 'MIN'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.MIN.min;
                tempObj['MIN DATE'] = overview.MIN.minDate;
                tempObj['MIN TOTAL'] = overview.MIN.total;
            }
            //01 夜温平均
            if(config.multipleTarget === '01'){
                tempAttr0 = 'AVG OF MIN'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.MIN.avg;
                tempObj['AVG TOTAL'] = overview.MIN.total;
            }
            //02 最高夜温
            if(config.multipleTarget === '02'){
                tempAttr0 = 'MAX OF MIN'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.MIN.max;
                tempObj['MAX DATE'] = overview.MIN.maxDate;
                tempObj['MAX TOTAL'] = overview.MIN.total;
            }
            
            //均温AVG
            //10 最低日均温
            if(config.multipleTarget === '10'){
                tempAttr0 = 'MIN OF AVG'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.AVG.min;
                tempObj['MIN DATE'] = overview.AVG.minDate;
                tempObj['MIN TOTAL'] = overview.AVG.total;
            }
            //11 平均气温
            if(config.multipleTarget === '11'){
                tempAttr0 = 'AVG'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.AVG.avg;
                tempObj['AVG TOTAL'] = overview.AVG.total;
            }
            //12 最高日均温
            if(config.multipleTarget === '12'){
                tempAttr0 = 'MAX OF AVG'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.AVG.max;
                tempObj['MAX DATE'] = overview.AVG.maxDate;
                tempObj['MAX TOTAL'] = overview.AVG.total;
            }
            
            //昼温MAX
            //20 最低昼温
            if(config.multipleTarget === '20'){
                tempAttr0 = 'MIN OF MAX'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.MAX.min;
                tempObj['MIN DATE'] = overview.MAX.minDate;
                tempObj['MIN TOTAL'] = overview.MAX.total;
            }
            //21 昼温平均
            if(config.multipleTarget === '21'){
                tempAttr0 = 'AVG OF MAX'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.MAX.avg;
                tempObj['AVG TOTAL'] = overview.MAX.total;
            }
            //22 最高昼温(最高气温)
            if(config.multipleTarget === '22'){
                tempAttr0 = 'MAX'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = overview.MAX.max;
                tempObj['MAX DATE'] = overview.MAX.maxDate;
                tempObj['MAX TOTAL'] = overview.MAX.total;
            }

            //月份
            //月份低温平均
            if(config.multipleTarget === '30' || config.multipleTarget === '31' || config.multipleTarget === '32'){
                let tempK = '';
                let targetText = ''; //标题文本, AVG OF MIN, AVG, AVG OF MAX
                let totalText = ''; //MIN, AVG, MAX有记录总天数
                if(config.multipleTarget === '30'){
                    tempK = 'avgForMin';
                    targetText = 'AVG OF MIN';
                    totalText = 'MONTH MIN TOTAL';
                }else if(config.multipleTarget === '31'){
                    tempK = 'avg';
                    targetText = 'AVG';
                    totalText = 'MONTH AVG TOTAL';
                }else{
                    tempK = 'avgForMax';
                    targetText = 'AVG OF MAX';
                    totalText = 'MONTH MAX TOTAL';
                }
                let tempV = undefined;
                let tempArr = []; //月平均低温(最低或最高如果相同，则不止一个月份，所以要用数组)
                let tempArrM = []; //对应月份
                let tempArrTotal = 0; //对应valid dayCount,如果有多个月比如12、1、2月低温平均都是-40，那么对应这三个月的低温dayCount之和
                tools.getArrOfMonthStr().forEach((v) => {
                    let tempMonthObj = config.M.showValid > 0 ? stat_M[v].valid : stat_M[v];
                    if(typeof tempMonthObj[tempK] !== 'undefined' && tempMonthObj[tempK] !== undefined){
                        tempArr.push(tempMonthObj[tempK]);
                    }
                });
                if(tempArr.length > 0){
                    if(co.toLowerCase() === 'asc'){
                        tempV = Math.min(...tempArr);
                    }else{
                        tempV = Math.max(...tempArr);
                    }
                    tools.getArrOfMonthStr().forEach((v) => {
                        let tempMonthObj = config.M.showValid > 0 ? stat_M[v].valid : stat_M[v];
                        if(Number(tempMonthObj[tempK]) === tempV){
                            tempArrM.push(v);
                            tempArrTotal += tempMonthObj.dayCountForMin;
                        }
                    })
                }else{
                    return;
                }
                tempAttr0 = targetText; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = tempV;
                tempObj['MONTH'] = tempArrM;
                tempObj[totalText] = tempArrTotal;
            }

            //50 单个冬季最多满足阈值天数
            if(config.multipleTarget === '50'){
                tempAttr0 = 'WINTER MAX'; //这个属性key在后面排序需要用到，所以单独用变量表示
                tempObj[tempAttr0] = winter_MaxTHR;
                tempObj['MAX WINTER'] = maxTHR_winter;
                tempObj['TOTAL MATCHED'] = totalThreshholdDays;
            }

            //50 最大连续日数
            if(config.multipleTarget === '60'){
                if(stat_CONSEC.length > 0){ //这里必须提前判断数组是否为空，否则后面会报错
                    tempAttr0 = 'MAX CONSEC'; //这个属性key在后面排序需要用到，所以单独用变量表示
                    tempObj[tempAttr0] = stat_CONSEC[0].consecDays;
                    tempObj['1ST START'] = stat_CONSEC[0].startDate;
                    tempObj['1ST END'] = stat_CONSEC[0].endDate;
                    tempObj['TOTAL MATCHED'] = totalThreshholdDays;
                }else{
                    return;
                }
            }
            /****************** 自定义属性 END ******************/

            //常用属性
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
                resultArrForStations.sort((a, b) => {
                    return config.multipleTarget === '50' ?
                    b[tempAttr0] - a[tempAttr0] :
                    tools.sortUndefinedObj(a[tempAttr0], b[tempAttr0], config.order);
                });
                //resultArrForStations.sort((a, b) => { return b[tempAttr0] - a[tempAttr0]; });

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
        'winter': consoleWinter,
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

        let stat_WINTER = {}; //某个冬天，比如23/24冬，从7月16日到次年7月15日算1个冬天周期

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

                //如果日期不在设置范围内，则忽略本次循环
                let tc1 = Date.parse(arrayOfRowCells[1]) >= Date.parse(d1);
                let tc2 = Date.parse(arrayOfRowCells[1]) <= Date.parse(d2);
                if(!tc1 || !tc2){ return; } //forEach函数忽略本次循环不用continue，用return

                if(config.month !== 0){//0 = 全年，非0则是筛选到单月
                    if(monthRegExp.test( arrayOfRowCells[1] )){
                        for(let i=0; i<lenOfRowArr; i++){
                            tempObj[getArrOfTitles()[i]] = arrayOfRowCells[i];
                        }
                        arrOfCsv.push(tempObj);
                    }
                }else{ //全年
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
        tools.getArrOfMonthStr().forEach((v) => {
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
        
        //某个冬天 7月16日到次年7月15日算1个冬天
        let vObj_WINTER = {};
        let winter_MaxTHR = 0; //单个冬季周期最大满足阈值天数, 比如38(仁钦隆勃2009/2010冬一共38次-40)
        let maxTHR_winter = ''; //哪个冬季周期，比如 2023/2024

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
            let tempWinter = {
                period: tools.getWinter(v['DATE']).period,
                isInWinterM3: tools.getWinter(v['DATE']).isInWinterM3
            };
            
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
            if( !(tools.getArrOfMonthStr().includes(temp_M_Str)) ){console.log('月份Str错误！');} //确保月份Str不出错
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
            
            //某个冬天
            if(!stat_WINTER.hasOwnProperty(tempWinter.period)){ //先判断stat_WINTER对象中是否包含某个winter周期的属性，如果没有则添加
                vObj_WINTER = {
                    'fullPeriod': {
                        'minArr': [],
                        'avgArr': [],
                        'maxArr': [],
                        'min': undefined,
                        'minForAvg': undefined,
                        'minForMax': undefined,
                        'threshHoldDays': 0
                    },
                    'winterM3': {
                        'dayCount': 0,
                        'dayCountForMin': 0,
                        'dayCountForAvg': 0,
                        'dayCountForMax': 0,
                        'minArr': [],
                        'avgArr': [],
                        'maxArr': [],
                        'min': undefined,
                        'minForAvg': undefined,
                        'minForMax': undefined,
                        'avgForMin': undefined,
                        'avg': undefined,
                        'avgForMax': undefined,
                        'maxForMin': undefined,
                        'maxForAvg': undefined,
                        'max': undefined
                    }
                }
            }

            if(v['MIN'] !== undefined){
                vObj_WINTER.fullPeriod.minArr.push(Number(v['MIN']));
                vObj_WINTER.fullPeriod.min = Math.min(...vObj_WINTER.fullPeriod.minArr);
                if(tempWinter.isInWinterM3){
                    vObj_WINTER.winterM3.dayCount += 1;
                    vObj_WINTER.winterM3.dayCountForMin += 1;
                    vObj_WINTER.winterM3.minArr.push(Number(v['MIN']));
                    vObj_WINTER.winterM3.min = Math.min(...vObj_WINTER.winterM3.minArr);
                    vObj_WINTER.winterM3.avgForMin = tools.getAvgForNumberArr(vObj_WINTER.winterM3.minArr);
                    vObj_WINTER.winterM3.maxForMin = Math.max(...vObj_WINTER.winterM3.minArr);
                }
            }
            if(v['TEMP'] !== undefined){
                vObj_WINTER.fullPeriod.avgArr.push(Number(v['TEMP']));
                vObj_WINTER.fullPeriod.minForAvg = Math.min(...vObj_WINTER.fullPeriod.avgArr);
                if(tempWinter.isInWinterM3){
                    vObj_WINTER.winterM3.dayCount += 1;
                    vObj_WINTER.winterM3.dayCountForAvg += 1;
                    vObj_WINTER.winterM3.avgArr.push(Number(v['TEMP']));
                    vObj_WINTER.winterM3.minForAvg = Math.min(...vObj_WINTER.winterM3.avgArr);
                    vObj_WINTER.winterM3.avg = tools.getAvgForNumberArr(vObj_WINTER.winterM3.avgArr);
                    vObj_WINTER.winterM3.maxForAvg = Math.max(...vObj_WINTER.winterM3.avgArr);
                }
            }
            if(v['MAX'] !== undefined){
                vObj_WINTER.fullPeriod.maxArr.push(Number(v['MAX']));
                vObj_WINTER.fullPeriod.minForMax = Math.min(...vObj_WINTER.fullPeriod.maxArr);
                if(tempWinter.isInWinterM3){
                    vObj_WINTER.winterM3.dayCount += 1;
                    vObj_WINTER.winterM3.dayCountForMax += 1;
                    vObj_WINTER.winterM3.maxArr.push(Number(v['MAX']));
                    vObj_WINTER.winterM3.minForMax = Math.min(...vObj_WINTER.winterM3.maxArr);
                    vObj_WINTER.winterM3.avgForMax = tools.getAvgForNumberArr(vObj_WINTER.winterM3.maxArr);
                    vObj_WINTER.winterM3.max = Math.max(...vObj_WINTER.winterM3.maxArr);
                }
            }
            let tempCondition = co.toLowerCase() === 'asc' ? Number(v[focusedAttr]) <= Number(config.consecValue) : Number(v[focusedAttr]) >= Number(config.consecValue);
            if(tempCondition){ vObj_WINTER.fullPeriod.threshHoldDays += 1; } //统计这个冬天的临界值满足情况
            stat_WINTER[tempWinter.period] = vObj_WINTER; //完成一个键值对

            //某年
            if(!stat_Y.hasOwnProperty(temp_Y_Str)){ stat_Y[temp_Y_Str] = {}; }
            
            //某月某日
            if(!stat_MD.hasOwnProperty(temp_MD_Str)){ stat_MD[temp_MD_Str] = {}; }
            
            //连续记录
            //确定大于或小于临界值
            let orderIf = false;
            if(co.toLowerCase() === 'asc'){
                orderIf = (Number(v[focusedAttr]) <= Number(config.consecValue));
            }else{
                orderIf = (Number(v[focusedAttr]) >= Number(config.consecValue));
            }
            if(i === 0){
                if(orderIf){ //这里不需要额外考虑undefined??
                    totalThreshholdDays += 1; //统计满足阈值的所有天数
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

        //统计逐冬最大满足阈值天数
        let objK = Object.keys(stat_WINTER);
        let objV = Object.values(stat_WINTER);
        for(let i=0; i<objK.length; i++){
            if(objV[i].fullPeriod.threshHoldDays > winter_MaxTHR){
                winter_MaxTHR = objV[i].fullPeriod.threshHoldDays;
                maxTHR_winter = objK[i];
            }
        }

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
            if(co.toLowerCase() === 'asc'){
                finalArr.sort((a, b) => Date.parse(a.DATE) - Date.parse(b.DATE));
            }else{
                finalArr.sort((a, b) => Date.parse(b.DATE) - Date.parse(a.DATE));
            }
        }

        /************************ 这个return返回所有数据，量超大 ************************/
        return {
            'arr': finalArr,
            'stat_YM': stat_YM,
            'stat_M': stat_M,
            'stat_WINTER': stat_WINTER,
            'winter_MaxTHR': winter_MaxTHR,
            'maxTHR_winter': maxTHR_winter,
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
    //获取月份字符数组
    function getArrOfMonthStr(){
        let arrOfMonthStr = []; //月份字符数组，12个元素
        for(let i=1; i<=12; i++){ arrOfMonthStr.push(tools.FN(i, 12)); }
        return arrOfMonthStr;
    }
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

    //获取特定日期所处的冬季周期，比如判断2023-07-18属于哪个冬季周期，这里2023-07-18属于 '2023/2024' 冬季周期。同时判断该日期是否处于冬三月
    function getWinter(dateStr){
        let regExp = /\d{4}\-\d{2}\-\d{2}/;
        if(regExp.test(dateStr) === false){ return undefined; } //判断输入格式
        
        let periodStr = '';
        let isInWinterM3 = false;
        let YMD_Arr = dateStr.split('-');
        //判断给定日期所处冬季周期
        if( Date.parse(dateStr) <= Date.parse(YMD_Arr[0] + '-07-15') ){
            periodStr = (Number(YMD_Arr[0]) - 1).toString() + '/' + YMD_Arr[0];
        }else{
            periodStr = YMD_Arr[0] + '/' + (Number(YMD_Arr[0]) + 1).toString();
        }
        //判断给定日期是否处于冬三月
        if( Date.parse(dateStr) <= Date.parse(YMD_Arr[0] + '-11-30') && Date.parse(dateStr) >= Date.parse(YMD_Arr[0] + '-03-01') ){
            isInWinterM3 = false;
        }else{
            isInWinterM3 = true;
        }

        return {
            period: periodStr,
            isInWinterM3: isInWinterM3
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
            return order.toLowerCase() === 'asc' ? a - b : b - a;
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

    this.getArrOfMonthStr = getArrOfMonthStr,
    this.getArrOfNumberMonthBegin = getArrOfNumberMonthBegin,
    this.getAvgForNumberArr = getAvgForNumberArr;
    this.getDateDiff = getDateDiff;
    this.getCurrentDate = getCurrentDate;
    this.getWinter = getWinter;
    this.sortUndefinedObj = sortUndefinedObj;
    this.isValidTempF = isValidTempF;
    this.getCsvStringFromArrOfObj = getCsvStringFromArrOfObj;
    this.FN = FN;
    this.TFC = TFC;
    this.getStationNumber = getStationNumber;
}