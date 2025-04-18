//导入必要的包
let fs = require('fs');
let readMultipleFiles = require('read-multiple-files');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//配置对象，用于设置筛选条件
const config = {
    stationObj: {
        USAF: '44212',
        //留空则默认为99999，长度小于5则前面自动补0
        WBAN: '99999'
    },

    dateStart: '1929-01-01',
    dateEnd: '2025-12-31',
    month: 0, //0 = 全年, 1 = 一月, ... , 12 = 十二月。这个月份不能填错，不然报错都找不到错误
    
    multipleStation: 0, //是否切换到打印邻近站点模式
    order: 'asc', //asc(从小到大、从低到高，从早到晚), desc
    item: 'min', //date, min, avg, max，只能是这几个值！！！必须小写！！！
    consecValue: '-40', //连续记录的临界值
    showNumber: 10, //显示多少个结果
    console: { //设置console打印哪些
        station: 1,
        overview: 1,
        M: 1,
        YM: 1,
        consec: 1,
        list: 1,
        yearRange: 0,
        allRecords: 0
    },

    //获取邻站信息
    //决定console哪一类信息
    //00=最低夜温(最低气温),01=夜温平均,02=最高夜温; 10=最低均温,11=均温,12=最高均温; 20=最低昼温,21=昼温平均,22=最高昼温(最高气温)
    //30=月份低温平均,31=月份均温,32=月份高温平均; 40=极端单月低温平均,41=极端单月均温,42极端单月高温平均; 50=单个冬季最多阈值天数
    //60=最长连续记录; 70=年平均气温(用overview)
    multipleTarget: '40',
    arrOfStations: [{"NAME":"JIAN-LI","USAF":"575730","WBAN":"99999"},{"NAME":"YUEYANG","USAF":"575840","WBAN":"99999"},{"NAME":"ZHI-ZHOU","USAF":"575720","WBAN":"99999"},{"NAME":"JIANGLING","USAF":"574760","WBAN":"99999"},{"NAME":"PUQI","USAF":"575830","WBAN":"99999"},{"NAME":"NAN XIAN SOUTH","USAF":"575760","WBAN":"99999"},{"NAME":"FENSUIZUI NORTH","USAF":"574830","WBAN":"99999"},{"NAME":"ANXIANG","USAF":"575740","WBAN":"99999"},{"NAME":"ZHONGXIANG","USAF":"573780","WBAN":"99999"},{"NAME":"HANKOW CHINA","USAF":"749348","WBAN":"99999"},{"NAME":"WU-JIA-CHI(CHI-AFB)","USAF":"573770","WBAN":"99999"},{"NAME":"YUANJIANG","USAF":"576710","WBAN":"99999"},{"NAME":"TIANHE","USAF":"574940","WBAN":"99999"},{"NAME":"PINGJIANG","USAF":"576820","WBAN":"99999"},{"NAME":"CHANGDE","USAF":"576620","WBAN":"99999"},{"NAME":"YI-CHANG (CHI-AFB)","USAF":"574620","WBAN":"99999"},{"NAME":"SHI-MEN","USAF":"575620","WBAN":"99999"},{"NAME":"YICHANG","USAF":"574610","WBAN":"99999"},{"NAME":"XIUSHUI","USAF":"575980","WBAN":"99999"},{"NAME":"SUIZHOU","USAF":"573850","WBAN":"99999"},{"NAME":"YINGSHAN NORTH","USAF":"573940","WBAN":"99999"},{"NAME":"CHANGSHA/DATUOPU","USAF":"576790","WBAN":"99999"},{"NAME":"HUANGHUA","USAF":"592871","WBAN":"99999"},{"NAME":"CHANGSHA","USAF":"576870","WBAN":"99999"},{"NAME":"SHI-MEN-LOU","USAF":"576930","WBAN":"99999"},{"NAME":"APPROXIMATE LOCALE","USAF":"573670","WBAN":"99999"},{"NAME":"QIZHOU","USAF":"584070","WBAN":"99999"},{"NAME":"MACHENG","USAF":"573990","WBAN":"99999"},{"NAME":"WU-FENG","USAF":"574580","WBAN":"99999"},{"NAME":"XIANG-TAN","USAF":"577730","WBAN":"99999"},{"NAME":"MEI-CHENG-ZHEN","USAF":"576690","WBAN":"99999"},{"NAME":"ZIGUI","USAF":"574500","WBAN":"99999"},{"NAME":"MEI-CHUAN","USAF":"584080","WBAN":"99999"},{"NAME":"XIANG-XIANG","USAF":"577720","WBAN":"99999"},{"NAME":"DARONGTANG SOUTHEAST","USAF":"576670","WBAN":"99999"},{"NAME":"DAYONG","USAF":"564625","WBAN":"99999"},{"NAME":"YINGSHAN","USAF":"584020","WBAN":"99999"},{"NAME":"LU-CONG-PO","USAF":"574510","WBAN":"99999"},{"NAME":"LEI-CHIA-TIEN WEST","USAF":"584030","WBAN":"99999"},{"NAME":"YICHUN","USAF":"577930","WBAN":"99999"},{"NAME":"SANGZHI","USAF":"575540","WBAN":"99999"},{"NAME":"FENLU SOUTHEAST","USAF":"585020","WBAN":"99999"},{"NAME":"APPROXIMATE LOCALE","USAF":"576590","WBAN":"99999"},{"NAME":"LU SHAN","USAF":"585060","WBAN":"99999"},{"NAME":"SHUANG-FENG","USAF":"577740","WBAN":"99999"},{"NAME":"SHA-DI-QI","USAF":"575570","WBAN":"99999"},{"NAME":"NANYUE","USAF":"577760","WBAN":"99999"},{"NAME":"XINGANG","USAF":"749329","WBAN":"99999"},{"NAME":"YUANLING","USAF":"576550","WBAN":"99999"},{"NAME":"CHANGBEI INTL","USAF":"586060","WBAN":"99999"},{"NAME":"SHIH-PU-SA NORTH","USAF":"573550","WBAN":"99999"},{"NAME":"APPROXIMATE LOCALE","USAF":"577650","WBAN":"99999"},{"NAME":"QINGJIANG/ZHANGSHUZ","USAF":"586080","WBAN":"99999"},{"NAME":"XU-BU","USAF":"577530","WBAN":"99999"},{"NAME":"HSUPU CHINA AAB","USAF":"749327","WBAN":"99999"},{"NAME":"APPROXIMATE LOCALE","USAF":"574450","WBAN":"99999"},{"NAME":"EN-SHI (CHI-AFB)","USAF":"574480","WBAN":"99999"},{"NAME":"ENSHI","USAF":"574470","WBAN":"99999"},{"NAME":"SHAOYANG","USAF":"577660","WBAN":"99999"},{"NAME":"APPROXIMATE LOCALE","USAF":"576460","WBAN":"99999"},{"NAME":"FENGJIE","USAF":"573480","WBAN":"99999"},{"NAME":"LAIFENG","USAF":"575450","WBAN":"99999"},{"NAME":"HUOSHAN","USAF":"583140","WBAN":"99999"},{"NAME":"LONG-HUI-ANG","USAF":"577590","WBAN":"99999"},{"NAME":"JI'AN","USAF":"577990","WBAN":"99999"},{"NAME":"QIAN-ZHOU-ZHEN","USAF":"576490","WBAN":"99999"},{"NAME":"ANQING","USAF":"584240","WBAN":"99999"},{"NAME":"GU-XIAN-DU","USAF":"585190","WBAN":"99999"},{"NAME":"HUAIHUA","USAF":"577490","WBAN":"99999"},{"NAME":"APPROXIMATE LOCATIO","USAF":"585210","WBAN":"99999"},{"NAME":"JINGDEZHEN","USAF":"585270","WBAN":"99999"},{"NAME":"LE-PING (?)","USAF":"586210","WBAN":"99999"},{"NAME":"WEN-TOU","USAF":"575320","WBAN":"99999"},{"NAME":"YOUYANG","USAF":"576330","WBAN":"99999"},{"NAME":"ZHIJIANG","USAF":"577450","WBAN":"99999"},{"NAME":"LUOGANG","USAF":"583210","WBAN":"99999"},{"NAME":"KOMATSUSHIMA AB","USAF":"585280","WBAN":"99999"},{"NAME":"NANCHENG","USAF":"587150","WBAN":"99999"},{"NAME":"TONGREN NORTHWEST","USAF":"577410","WBAN":"99999"},{"NAME":"XIONGSHI NORTHEAST","USAF":"586270","WBAN":"99999"},{"NAME":"WANXIAN","USAF":"574320","WBAN":"99999"},{"NAME":"NAME UNKNOWN (ONC)","USAF":"587210","WBAN":"99999"},{"NAME":"PENG-SHUI","USAF":"575370","WBAN":"99999"},{"NAME":"APPROXIMATE LOCATIO","USAF":"585290","WBAN":"99999"},{"NAME":"CHAOHU WEST","USAF":"583260","WBAN":"99999"},{"NAME":"HUANG SHAN","USAF":"584370","WBAN":"99999"},{"NAME":"GUANBA NORTH","USAF":"749340","WBAN":"99999"},{"NAME":"LIANGPING","USAF":"574260","WBAN":"99999"},{"NAME":"TUNXI","USAF":"585310","WBAN":"99999"},{"NAME":"SHANGRAO","USAF":"586260","WBAN":"99999"},{"NAME":"SINAN","USAF":"577310","WBAN":"99999"},{"NAME":"QIXIAN SHAN","USAF":"587260","WBAN":"99999"},{"NAME":"SHAOWU","USAF":"587250","WBAN":"99999"},{"NAME":"YUSHAN","USAF":"586340","WBAN":"99999"},{"NAME":"YU-SHAN","USAF":"586310","WBAN":"99999"},{"NAME":"WU-HU","USAF":"583340","WBAN":"99999"},{"NAME":"FOU-LING","USAF":"575220","WBAN":"99999"},{"NAME":"DA XIAN","USAF":"573280","WBAN":"99999"},{"NAME":"CHANG-SHAN","USAF":"586320","WBAN":"99999"},{"NAME":"WUYISHAN","USAF":"587300","WBAN":"99999"},{"NAME":"WUHUXIAN","USAF":"583380","WBAN":"99999"},{"NAME":"CHEN-YUAN","USAF":"577380","WBAN":"99999"},{"NAME":"HELIXI","USAF":"584360","WBAN":"99999"},{"NAME":"JINFO SHAN (MOUNT)","USAF":"576220","WBAN":"99999"},{"NAME":"QU XIAN","USAF":"586330","WBAN":"99999"},{"NAME":"CHUN AN","USAF":"585430","WBAN":"99999"},{"NAME":"PUCHENG","USAF":"587310","WBAN":"99999"},{"NAME":"APPROXIMATE LOCATIO","USAF":"587320","WBAN":"99999"},{"NAME":"LUKOU","USAF":"582380","WBAN":"99999"},{"NAME":"MEITAN SOUTHWEST","USAF":"577220","WBAN":"99999"},{"NAME":"APPROXIMATE LOCALE","USAF":"573210","WBAN":"99999"},{"NAME":"APPROXIMATE LOCATIO","USAF":"587350","WBAN":"99999"},{"NAME":"JIANGBEI","USAF":"575160","WBAN":"99999"},{"NAME":"JIAN'OU","USAF":"587370","WBAN":"99999"},{"NAME":"TIANMU SHAN (MTNS)","USAF":"584450","WBAN":"99999"},{"NAME":"LONGQUAN","USAF":"586470","WBAN":"99999"},{"NAME":"CHONG-QING","USAF":"575150","WBAN":"99999"},{"NAME":"BAZHONG","USAF":"573130","WBAN":"99999"},{"NAME":"LIYANG","USAF":"583450","WBAN":"99999"},{"NAME":"HUICHUAN","USAF":"577120","WBAN":"99999"},{"NAME":"ZUNYI","USAF":"577130","WBAN":"99999"},{"NAME":"JINHUA","USAF":"585490","WBAN":"99999"},{"NAME":"AN-REN","USAF":"586480","WBAN":"99999"},{"NAME":"APPROXIMATE LOCALE","USAF":"577160","WBAN":"99999"},{"NAME":"GAOPING","USAF":"574110","WBAN":"99999"},{"NAME":"YIWU","USAF":"585540","WBAN":"99999"},{"NAME":"CHIU-HSI-SHUI SOUTH","USAF":"576140","WBAN":"99999"},{"NAME":"HANGCHOW CHINA","USAF":"749350","WBAN":"99999"},{"NAME":"CHANGZHOU","USAF":"583430","WBAN":"99999"},{"NAME":"SHOU-NING","USAF":"587450","WBAN":"99999"},{"NAME":"LISHUI","USAF":"586460","WBAN":"99999"},{"NAME":"LANGZHONG","USAF":"573060","WBAN":"99999"},{"NAME":"DA-ZU","USAF":"575060","WBAN":"99999"},{"NAME":"CH'IH-SHUI HO","USAF":"576060","WBAN":"99999"},{"NAME":"SUINING","USAF":"574050","WBAN":"99999"},{"NAME":"XIAOSHAN","USAF":"584570","WBAN":"99999"},{"NAME":"SUZHOU","USAF":"583580","WBAN":"99999"},{"NAME":"LUZHOU","USAF":"576020","WBAN":"99999"},{"NAME":"NAXI","USAF":"576040","WBAN":"99999"},{"NAME":"SHENGXIAN","USAF":"585560","WBAN":"99999"},{"NAME":"XUYONG/YONGNING","USAF":"576080","WBAN":"99999"},{"NAME":"NEIJIANG","USAF":"575030","WBAN":"99999"},{"NAME":"FUDING","USAF":"587540","WBAN":"99999"},{"NAME":"SANTAI","USAF":"573070","WBAN":"99999"},{"NAME":"NEIJIANG","USAF":"575040","WBAN":"99999"},{"NAME":"WENZHOU","USAF":"586590","WBAN":"99999"},{"NAME":"KUOCANG SHAN","USAF":"586530","WBAN":"99999"},{"NAME":"ZHA-PU","USAF":"584640","WBAN":"99999"},{"NAME":"TIAN-TAI","USAF":"585590","WBAN":"99999"},{"NAME":"RUIAN","USAF":"587520","WBAN":"99999"},{"NAME":"DA-FANG","USAF":"577080","WBAN":"99999"},{"NAME":"LINHAI (REPLACED BY 58652 - XIANJU)","USAF":"586600","WBAN":"99999"},{"NAME":"MIANYANG","USAF":"561960","WBAN":"99999"},{"NAME":"ZIYANG SOUTHWEST","USAF":"562980","WBAN":"99999"},{"NAME":"HONGQIAO INTL","USAF":"583670","WBAN":"99999"},{"NAME":"BIJIE","USAF":"577070","WBAN":"99999"},{"NAME":"NINGBO","USAF":"585620","WBAN":"99999"},{"NAME":"LISHE","USAF":"582390","WBAN":"99999"},{"NAME":"HUNG CHIA","USAF":"999999","WBAN":"43204"},{"NAME":"TAISHAN","USAF":"588530","WBAN":"99999"},{"NAME":"SHANGHAI","USAF":"583620","WBAN":"99999"},{"NAME":"YIBIN","USAF":"564920","WBAN":"99999"},{"NAME":"YU-HUAN","USAF":"586670","WBAN":"99999"},{"NAME":"CHA-YIN-LU SOUTHWEST","USAF":"749351","WBAN":"99999"},{"NAME":"DONG-GUA ISLAND","USAF":"587640","WBAN":"99999"},{"NAME":"HONGJIA","USAF":"586650","WBAN":"99999"},{"NAME":"NANJI SHAN","USAF":"587650","WBAN":"99999"},{"NAME":"PUDONG","USAF":"583211","WBAN":"99999"},{"NAME":"REN-SHOU","USAF":"562970","WBAN":"99999"},{"NAME":"CHING-SHUI-PU NORTH","USAF":"749336","WBAN":"99999"},{"NAME":"SONGMEN SOUTHEAST","USAF":"586690","WBAN":"99999"},{"NAME":"SHIPU","USAF":"585690","WBAN":"99999"},{"NAME":"AO-CHIA-CHANG NORTH","USAF":"749338","WBAN":"99999"},{"NAME":"SHUANGLIU","USAF":"562940","WBAN":"99999"},{"NAME":"HUA-CHIAO SOUTHEAST","USAF":"749345","WBAN":"99999"},{"NAME":"DINGHAI","USAF":"584770","WBAN":"99999"},{"NAME":"DACHEN DAO","USAF":"586660","WBAN":"99999"},{"NAME":"WENJIANG","USAF":"561870","WBAN":"99999"},{"NAME":"HSIA-TA-CHEN SHAN CHINA SEA","USAF":"465890","WBAN":"99999"},{"NAME":"LESHAN","USAF":"563860","WBAN":"99999"},{"NAME":"DACHU SHAN","USAF":"584740","WBAN":"99999"},{"NAME":"HAI-MEN","USAF":"586620","WBAN":"99999"},{"NAME":"ZHOUSHAN AIRPORT","USAF":"583213","WBAN":"99999"},{"NAME":"HUINAN EAST","USAF":"583780","WBAN":"99999"},{"NAME":"SHENGSI","USAF":"584720","WBAN":"99999"},{"NAME":"QIONGLAI NORTHEAST","USAF":"749339","WBAN":"99999"},{"NAME":"WENCHUAN","USAF":"561880","WBAN":"99999"},{"NAME":"HU-JIA-PU-ZIIA","USAF":"564850","WBAN":"99999"},{"NAME":"EMEI SHAN","USAF":"563850","WBAN":"99999"},{"NAME":"SHENG SHANG","USAF":"584730","WBAN":"99999"},{"NAME":"ZHAOTONG","USAF":"565860","WBAN":"99999"},{"NAME":"LANG-GANG ISLAND","USAF":"584760","WBAN":"99999"},{"NAME":"YA'AN","USAF":"562870","WBAN":"99999"},{"NAME":"JIAGU NORTH","USAF":"564790","WBAN":"99999"}],
    
    winterConfig: {
        showWinter: 1, //打印冬夏周期信息 0=不打印, 1=打印
        winterWhichHemisphere: 0, //确定研究哪个半球的冬夏周期，0=北半球冬季周期，1=北半球夏季=南半球冬季周期
        sortBy: 1, //0=不额外排序, 1=满足阈值个数从多到少, 2=最低温, 3=最低均温, 4=最低昼温, 5=冬三月低温平均, 6=冬三月均温, 7=冬三月高温平均
        showExtreme: 1, //1=打印冬周期或夏周期最低、最高三项温度
        showAvg: 1 //1=打印冬三月或夏三月均温
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
        if(config.winterConfig.showWinter > 0){ result.winter(); }
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
            console.log('CLIMATE OF AIR TEMPERATURE BY MONTH:');
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
    //这里单独写一个方法给ymArr排序，除了这里会用到，后面多站点也会用到
    function sortYM_Arr(ymArr, item){
        ymArr.sort((a, b) => { //排序
            let tempSortItem;
            if(item === 'min'){ //按YM低温平均排序
                tempSortItem = 'avgForMin';
            }else if(item === 'max'){ //按YM高温平均排序
                tempSortItem = 'avgForMax';
            }else{ //item是均温或日期则按YM均温排序，即默认按YM均温排序
                tempSortItem = 'avg';
            }
            return co.toLowerCase() === 'asc' ? stat_YM[a][tempSortItem] - stat_YM[b][tempSortItem] : stat_YM[b][tempSortItem] - stat_YM[a][tempSortItem];
        });
        return ymArr; //排序后原数组顺序被改变
    }
    function consoleYM(){
        let tempYMArr = sortYM_Arr(Object.keys(stat_YM), ci);
        console.log('EVERY MONTH SORTED BY AVG OF ' + focusedAttr + ', ' + co.toUpperCase() + ':');
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
        console.log('STATISTICS BY PERIOD:');
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
        //0=不额外排序, 1=满足阈值个数从多到少, 2=最低温, 3=最低均温, 4=最低昼温, 5=冬三月低温平均, 6=冬三月均温, 7=冬三月高温平均
        let tempSortBy = config.winterConfig.sortBy;
        if(tempSortBy === 0){ //不排序，即按日期顺序
            tempSortByStr = 'DATE';
        }else if(tempSortBy === 1){
            tempSortByStr = 'MOST DAYS MATCHED THRESHHOLD VALUE';
            tempArr.sort((a, b) => b.fullPeriod.threshHoldDays - a.fullPeriod.threshHoldDays); //按满足阈值天数排序，从多到少
        }else if(tempSortBy === 2){
            tempSortByStr = 'MIN';
            tempArr.sort((a, b) => a.fullPeriod.min - b.fullPeriod.min); //按最低温
        }else if(tempSortBy === 3){
            tempSortByStr = 'MIN OF AVG';
            tempArr.sort((a, b) => a.fullPeriod.minForAvg - b.fullPeriod.minForAvg); //按最低均温
        }else if(tempSortBy === 4){
            tempSortByStr = 'MIN OF MAX';
            tempArr.sort((a, b) => a.fullPeriod.minForMax - b.fullPeriod.minForMax); //按最低昼温
        }else if(tempSortBy === 5){
            tempSortByStr = 'AVG OF MIN FOR PERIOD 3 MONTHS';
            tempArr.sort((a, b) => a.winterM3.avgForMin - b.winterM3.avgForMin); //按冬三月低温平均
        }else if(tempSortBy === 6){
            tempSortByStr = 'AVG FOR PERIOD 3 MONTHS';
            tempArr.sort((a, b) => a.winterM3.avg - b.winterM3.avg); //按冬三月均温
        }else if(tempSortBy === 7){
            tempSortByStr = 'AVG OF MAX FOR PERIOD 3 MONTHS';
            tempArr.sort((a, b) => a.winterM3.avgForMax - b.winterM3.avgForMax); //按冬三月高温平均
        }
        
        //打印
        console.log(focusedAttr + ' ' + focusedOrderSymbolStr + ' ' + config.consecValue + ' TOTAL: ' + totalThreshholdDays);
        console.log('SINGLE PERIOD '+ focusedAttr + ' ' + focusedOrderSymbolStr + ' ' + config.consecValue + ' MOST DAYS: ' + winter_MaxTHR + ' ( ' + maxTHR_winter + ' )');
        console.log('PERIOD LIST SORTED BY ' + tempSortByStr + ':');
        for(let i=0; i<len; i++){
            let tempExtraStr = co.toLowerCase() === 'asc' ? '\t |\t MIN: ' + tempArr[i].fullPeriod.min : '\t |\t MAX: ' + tempArr[i].fullPeriod.max;
            console.log(
                '─── ' + tempArr[i].period + ' ───\t |\t ' + focusedAttr + ' ' + focusedOrderSymbolStr + ' ' + config.consecValue + ' TOTAL DAYS: ' +
                tempArr[i].fullPeriod.threshHoldDays + tempExtraStr
            );
            
            if(config.winterConfig.showExtreme > 0){
                if(co.toLowerCase() === 'asc'){ //MIN三项
                    console.log('MIN FOR MIN: ' + tempArr[i].fullPeriod.min + ' ( ' + tempArr[i].fullPeriod.dateMin + ' )');
                    console.log('MIN FOR AVG: ' + tempArr[i].fullPeriod.minForAvg + ' ( ' + tempArr[i].fullPeriod.dateMinForAvg + ' )');
                    console.log('MIN FOR MAX: ' + tempArr[i].fullPeriod.minForMax + ' ( ' + tempArr[i].fullPeriod.dateMinForMax + ' )');
                }else{ //MAX三项
                    console.log('MAX FOR MAX: ' + tempArr[i].fullPeriod.max + ' ( ' + tempArr[i].fullPeriod.dateMax + ' )');
                    console.log('MAX FOR AVG: ' + tempArr[i].fullPeriod.maxForAvg + ' ( ' + tempArr[i].fullPeriod.dateMaxForAvg + ' )');
                    console.log('MAX FOR MIN: ' + tempArr[i].fullPeriod.maxForMin + ' ( ' + tempArr[i].fullPeriod.dateMaxForMin + ' )');
                }
            }
            //AVG三项
            if(config.winterConfig.showAvg > 0){
                if(co.toLowerCase() === 'asc'){ //MIN三项
                    console.log('PERIOD 3 MONTHS AVG FOR MIN: ' + tempArr[i].winterM3.avgForMin + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForMin + ' )');
                    console.log('PERIOD 3 MONTHS AVG FOR AVG: ' + tempArr[i].winterM3.avg + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForAvg + ' )');
                    console.log('PERIOD 3 MONTHS AVG FOR MAX: ' + tempArr[i].winterM3.avgForMax + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForMax + ' )');
                }else{
                    console.log('PERIOD 3 MONTHS AVG FOR MAX: ' + tempArr[i].winterM3.avgForMax + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForMax + ' )');
                    console.log('PERIOD 3 MONTHS AVG FOR AVG: ' + tempArr[i].winterM3.avg + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForAvg + ' )');
                    console.log('PERIOD 3 MONTHS AVG FOR MIN: ' + tempArr[i].winterM3.avgForMin + '\t( avg = sum / ' + tempArr[i].winterM3.dayCountForMin + ' )');
                }
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
        console.log('EVERY DAY SORTED BY ' + config.item.toUpperCase() + ', ' + co.toUpperCase() + ':');
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
        //月份低温平均、均温、高温平均
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

        //40 极端冷/热月低温平均、均温、高温平均
        if(config.multipleTarget === '40' || config.multipleTarget === '41' || config.multipleTarget === '42'){
            let tempItem;
            let tempAvg;
            let tempDayCount;
            if(config.multipleTarget === '40'){
                tempItem = 'MIN';
                tempAvg = 'avgForMin';
                tempDayCount = 'dayCountForMin';
            }else if(config.multipleTarget === '41'){
                tempItem = 'AVG';
                tempAvg = 'avg';
                tempDayCount = 'dayCountForAvg';
            }else if(config.multipleTarget === '42'){
                tempItem = 'MAX';
                tempAvg = 'avgForMax';
                tempDayCount = 'dayCountForMax';
            }
            let tempYM_Arr = sortYM_Arr(Object.keys(stat_YM), tempItem.toLowerCase());
            if(tempYM_Arr.length === 0){ //如果数据源为空，则跳过这个气象站
                return;
            }
            let tempYM = tempYM_Arr[0];
            
            if(co.toLowerCase() === 'asc'){
                tempAttr0 = 'MIN FOR AVG OF ' + tempItem;
            }else{
                tempAttr0 = 'MAX FOR AVG OF ' + tempItem;
            }

            tempObj[tempAttr0] = stat_YM[tempYM][tempAvg];
            tempObj['Y-M'] = tempYM;
            tempObj['AVG ='] = 'sum/' + stat_YM[tempYM][tempDayCount];
        }

        //50 单个冬季最多满足阈值天数
        if(config.multipleTarget === '50'){
            tempAttr0 = 'PERIOD MAX'; //这个属性key在后面排序需要用到，所以单独用变量表示
            tempObj[tempAttr0] = winter_MaxTHR;
            tempObj['MAX PERIOD'] = maxTHR_winter;
            tempObj['TOTAL MATCHED'] = totalThreshholdDays;
        }

        //60 最大连续日数
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
            let strOfRows = v.trim(); //console.log(strOfRows);
            let arrayOfRowCells = [];
            let tempArrOfRowCells = strOfRows.replace(regExp, '\t').replace(/\"\,\,\"/g, '\tundefined\t').trim().split('\t');
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
                period: tools.getWinter(v['DATE'], config.winterConfig.winterWhichHemisphere).period,
                isInWinterM3: tools.getWinter(v['DATE'], config.winterConfig.winterWhichHemisphere).isInWinterM3
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
                        'minArr': [], //对象数组，数组里面是{value: xx.x, date: 'xxxx-xx-xx'}对象
                        'avgArr': [], //对象数组
                        'maxArr': [], //对象数组
                        'dateMin': [],
                        'dateMinForAvg': [],
                        'dateMinForMax': [],
                        'dateMaxForMin': [],
                        'dateMaxForAvg': [],
                        'dateMax': [],
                        'min': undefined,
                        'minForAvg': undefined,
                        'minForMax': undefined,
                        'maxForMin': undefined,
                        'maxForAvg': undefined,
                        'max': undefined,
                        'threshHoldDays': 0
                    },
                    'winterM3': {
                        'dayCount': 0,
                        'dayCountForMin': 0,
                        'dayCountForAvg': 0,
                        'dayCountForMax': 0,
                        'minArr': [], //对象数组
                        'avgArr': [], //对象数组
                        'maxArr': [], //对象数组
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
                let tempObj = {value: Number(v['MIN']), date: v['DATE']}
                vObj_WINTER.fullPeriod.minArr.push(tempObj);
                if(tempWinter.isInWinterM3){
                    vObj_WINTER.winterM3.dayCount += 1;
                    vObj_WINTER.winterM3.dayCountForMin += 1;
                    vObj_WINTER.winterM3.minArr.push(Number(v['MIN']));
                }
            }
            if(v['TEMP'] !== undefined){
                let tempObj = {value: Number(v['TEMP']), date: v['DATE']}
                vObj_WINTER.fullPeriod.avgArr.push(tempObj);
                if(tempWinter.isInWinterM3){
                    vObj_WINTER.winterM3.dayCount += 1;
                    vObj_WINTER.winterM3.dayCountForAvg += 1;
                    vObj_WINTER.winterM3.avgArr.push(Number(v['TEMP']));
                }
            }
            if(v['MAX'] !== undefined){
                let tempObj = {value: Number(v['MAX']), date: v['DATE']}
                vObj_WINTER.fullPeriod.maxArr.push(tempObj);
                if(tempWinter.isInWinterM3){
                    vObj_WINTER.winterM3.dayCount += 1;
                    vObj_WINTER.winterM3.dayCountForMax += 1;
                    vObj_WINTER.winterM3.maxArr.push(Number(v['MAX']));
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

        //stat_WINTER
        //统计逐冬最大满足阈值天数
        let objWinterK = Object.keys(stat_WINTER);
        let objWinterV = Object.values(stat_WINTER);
        for(let i=0; i<objWinterK.length; i++){
            if(objWinterV[i].fullPeriod.threshHoldDays > winter_MaxTHR){ //获取最大满足阈值天数(可能不止一个，获取第一个)
                winter_MaxTHR = objWinterV[i].fullPeriod.threshHoldDays;
                maxTHR_winter = objWinterK[i];
            }
            //遍历之后再求极值和均值，这样可以极大提高效率
            //冬夏长周期(时长一年)
            //MIN
            let tempAN = objWinterV[i].fullPeriod.minArr;
            let tempVN = [];
            tempAN.forEach((vw) => {
                tempVN.push(vw.value);
            });
            objWinterV[i].fullPeriod.min = Math.min(...tempVN);
            objWinterV[i].fullPeriod.maxForMin = Math.max(...tempVN);
            let tempEN1 = objWinterV[i].fullPeriod.min;
            let tempEX1 = objWinterV[i].fullPeriod.maxForMin;
            tempVN.forEach((vw, iw) => {
                if(vw === tempEN1){ objWinterV[i].fullPeriod.dateMin.push(tempAN[iw].date); }
                if(vw === tempEX1){ objWinterV[i].fullPeriod.dateMaxForMin.push(tempAN[iw].date); }
            });
            //AVG
            let tempAG = objWinterV[i].fullPeriod.avgArr;
            let tempVG = [];
            tempAG.forEach((vw) => {
                tempVG.push(vw.value);
            });
            objWinterV[i].fullPeriod.minForAvg = Math.min(...tempVG);
            objWinterV[i].fullPeriod.maxForAvg = Math.max(...tempVG);
            let tempEN2 = objWinterV[i].fullPeriod.minForAvg;
            let tempEX2 = objWinterV[i].fullPeriod.maxForAvg;
            tempVG.forEach((vw, iw) => {
                if(vw === tempEN2){ objWinterV[i].fullPeriod.dateMinForAvg.push(tempAG[iw].date); }
                if(vw === tempEX2){ objWinterV[i].fullPeriod.dateMaxForAvg.push(tempAG[iw].date); }
            });
            //MAX
            let tempAX = objWinterV[i].fullPeriod.maxArr;
            let tempVX = [];
            tempAX.forEach((vw) => {
                tempVX.push(vw.value);
            });
            objWinterV[i].fullPeriod.minForMax = Math.min(...tempVX);
            objWinterV[i].fullPeriod.max = Math.max(...tempVX);
            let tempEN3 = objWinterV[i].fullPeriod.minForMax;
            let tempEX3 = objWinterV[i].fullPeriod.max;
            tempVX.forEach((vw, iw) => {
                if(vw === tempEN3){ objWinterV[i].fullPeriod.dateMinForMax.push(tempAX[iw].date); }
                if(vw === tempEX3){ objWinterV[i].fullPeriod.dateMax.push(tempAX[iw].date); }
            });
            /* objWinterV[i].fullPeriod.min = Math.min(...objWinterV[i].fullPeriod.minArr);
            objWinterV[i].fullPeriod.maxForMin = Math.max(...objWinterV[i].fullPeriod.minArr);
            objWinterV[i].fullPeriod.minForAvg = Math.min(...objWinterV[i].fullPeriod.avgArr);
            objWinterV[i].fullPeriod.maxForAvg = Math.max(...objWinterV[i].fullPeriod.avgArr);
            objWinterV[i].fullPeriod.minForMax = Math.min(...objWinterV[i].fullPeriod.maxArr);
            objWinterV[i].fullPeriod.max = Math.max(...objWinterV[i].fullPeriod.maxArr); */
            //winterM3 冬三月或夏三月
            //低温
            objWinterV[i].winterM3.min = Math.min(...objWinterV[i].winterM3.minArr);
            objWinterV[i].winterM3.avgForMin = tools.getAvgForNumberArr(objWinterV[i].winterM3.minArr);
            objWinterV[i].winterM3.maxForMin = Math.max(...objWinterV[i].winterM3.minArr);
            //均温
            objWinterV[i].winterM3.minForAvg = Math.min(...objWinterV[i].winterM3.avgArr);
            objWinterV[i].winterM3.avg = tools.getAvgForNumberArr(objWinterV[i].winterM3.avgArr);
            objWinterV[i].winterM3.maxForAvg = Math.max(...objWinterV[i].winterM3.avgArr);
            //高温
            objWinterV[i].winterM3.minForMax = Math.min(...objWinterV[i].winterM3.maxArr);
            objWinterV[i].winterM3.avgForMax = tools.getAvgForNumberArr(objWinterV[i].winterM3.maxArr);
            objWinterV[i].winterM3.max = Math.max(...objWinterV[i].winterM3.maxArr);
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
    function getWinter(dateStr, winterWhichHemisphere){
        let regExp = /\d{4}\-\d{2}\-\d{2}/;
        if(regExp.test(dateStr) === false){ return undefined; } //判断输入格式
        
        let periodStr = '';
        let isInWinterM3 = false;
        let YMD_Arr = dateStr.split('-');
        if(winterWhichHemisphere === 0){ //针对北半球冬季，为0则针对南半球冬季(对应北半球夏天)
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
        }else{ //针对北半球夏季/南半球冬季
            //判断给定日期所处冬季周期
            if( Date.parse(dateStr) <= Date.parse(YMD_Arr[0] + '-01-15') ){
                periodStr = (Number(YMD_Arr[0]) - 1).toString() + '/' + YMD_Arr[0];
            }else{
                periodStr = YMD_Arr[0] + '/' + (Number(YMD_Arr[0]) + 1).toString();
            }
            //判断给定日期是否处于冬三月, 这里判断里面是用或，和前面的判断 && 相反, 这里花了我20分钟才找出原因...
            if( Date.parse(dateStr) <= Date.parse(YMD_Arr[0] + '-05-31') || Date.parse(dateStr) >= Date.parse(YMD_Arr[0] + '-09-01') ){
                isInWinterM3 = false;
            }else{
                isInWinterM3 = true;
            }
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