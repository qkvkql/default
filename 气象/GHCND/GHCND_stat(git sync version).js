const fs = require('fs');
const config = {
    'item': 'date', //item = date, min, avg, max
    'threshHold': -40, //阈值用数字，数据源单位℃
    'order': 'asc', //order = asc, desc
    //先设置一个模式
    'mode': 2, //mode: 0=history, 1=yearRange, 2=dateRange, 3=y, 4=m, 5=ym
    'yearRange': [1961, 1990], //搭配singleMonthNormals使用
    'dateRange': [20181201, 20190228], //主要计算冬季周期，比如冬三月、冬五月、甚至完整冬季周期的平均气温和阈值天数。夜可以计算常年【年平均气温】(填日期麻烦，不推荐)
    'y': '1969', //统计单年气温
    'm': '01', //统计所有年份的某个月份，比如历史一均，实际用的比较少
    'ym': '201001', //统计单月气温
    'singleMonthNormals': 1 //搭配yearRange使用，主要统计常年月份平均(尤其一均、七均)，也可计算【【【【常年年均(设为0)】】】】
};
//文件地址
const FN1 = 'RSM';
const WMO = '00030565';
const rootPath = 'C:/Users/龙治洲/Desktop/GHCND_Download/';
const nameExtension = '.csv';
//声明数据数组
let dataObj = {};
let dateList = [];
let dataArr = [];
//读取CSV文件
fs.readFile(rootPath + FN1 + WMO + nameExtension, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    // Split the data into rows
    const rows = data.split('\n');
    //去除末尾空行
    while(rows[rows.length - 1].trim() === ''){ rows.pop(); }
    // Process each subsequent row
    for (let i = 0; i < rows.length; i++) {
        let values = rows[i].split(','), v0 = values[0].trim(), v1 = values[1].trim(), v2 = values[2].trim(), v3 = values[3].trim();
        // Map values to headers to create an object for each row
        if(dateList.indexOf(v1) < 0){
            dateList.push(v1);
            dataObj[v1] = {};
            dataObj[v1]['y'] = v1.substring(0,4);
            dataObj[v1]['m'] = v1.substring(4,6);
            dataObj[v1]['d'] = v1.substring(6,8);
        }
        //填充对象非日期属性
        if(v2 === 'TMIN'){
            dataObj[v1][v2] = (Number(v3)/10).toFixed(1);
        }else if(v2 === 'TAVG'){
            dataObj[v1][v2] = (Number(v3)/10).toFixed(1);
        }else if(v2 === 'TMAX'){
            dataObj[v1][v2] = (Number(v3)/10).toFixed(1);
        }
    }
    //obj转arr，方便后面排序
    let keys = Object.keys(dataObj);
    for(let i=0; i<keys.length; i++){
        let tempObj = {};
        tempObj['date'] = keys[i];
        if(dataObj[keys[i]]['TMIN'] !== undefined){ tempObj['min'] = dataObj[keys[i]]['TMIN']; }else{ tempObj['min'] = undefined }
        if(dataObj[keys[i]]['TAVG'] !== undefined){ tempObj['avg'] = dataObj[keys[i]]['TAVG']; }else{ tempObj['avg'] = undefined }
        if(dataObj[keys[i]]['TMAX'] !== undefined){ tempObj['max'] = dataObj[keys[i]]['TMAX']; }else{ tempObj['max'] = undefined }
        dataArr.push(tempObj);
    }
    //打印结果
    console.log('Station Recorded Days Total: ' + dataArr.length);
    //console.log(veiwDate(dataArr, '19870109'));
    //console.log(viewWinters(dataArr));
    printResult();
    function printResult(){
        if(config.mode === 2){ //每冬阈值天数和每冬极端低温，最常用的一个！！！
            getColdThreshHold();
        }else{
            console.log(viewDateRange(dataArr, config.dateRange));
        }
    }
    //fs.readFile内部函数
    //皮包函数，统计某个站点所有冬季周期各类冷相关阈值天数
    function getColdThreshHold(){
        let arrR = viewWinters(dataArr).resultArr;
        let tempStr = '';
        console.log(viewWinters(dataArr).mostThDays);
        for(let i=0; i<arrR.length; i++){
            tempStr += arrR[i].period[0].toString().substring(0, 4) + '~' + arrR[i].period[1].toString().substring(0, 4) + '冬\t'
            + arrR[i].thDays.toString() + '\t' + arrR[i].min.toString() + '\t' + printDateArr(arrR[i].minDates) + '\n';
        }
        console.log(tempStr);
    }
});

//整合函数，高度自定义
function viewWinters(arr){
    let resultArr = [];
    //得到periodsArr
    let periodsArr = [];
    let tempStartDate = arr[0]['date'];
    let tempEndDate = arr[arr.length - 1]['date'];
    let startYear = Number(tempStartDate.substring(0, 4));
    let endYear = Number(tempEndDate.substring(0, 4));
    let count = 0;
    for(let i = 0; i < endYear - startYear + 2; i++){
        let tempS = Number( (startYear + count - 1).toString() + '0716' );
        let tempE = Number( (startYear + count).toString() + '0715' );
        let tempArr = [tempS, tempE];
        periodsArr.push(tempArr);
        count += 1;
    }
    //period循环处理
    let tempMostThDays = {
        'mostThDays': 0,
        'whichWinter': '',
        'min': -999,
        'minDates': ''
    }
    for(let i=0; i<periodsArr.length; i++){
        //临时声明
        let inputObj = viewDateRange(arr, periodsArr[i]);
        let tempPeriod = periodsArr[i];
        let tempMin = inputObj.extremes.min;
        let tempTh = inputObj.thDays;
        let tempDates = inputObj.extremes.minDates;
        //判断最大th
        if(tempTh > tempMostThDays.mostThDays){
            tempMostThDays.mostThDays = tempTh;
            tempMostThDays.whichWinter = tempPeriod;
            tempMostThDays.min = tempMin;
            tempMostThDays.minDates = tempDates;
        }
        //填充对象
        let tempObj = { 'period': tempPeriod, 'min': tempMin, 'thDays': tempTh, 'minDates': tempDates };
        resultArr.push(tempObj);
    }
    return {'resultArr': resultArr, 'mostThDays': tempMostThDays};
}

//**************************************** 函数 ****************************************
//查询多日
//mode = history, normals, range, y, m, ym
function viewDateRange(arr, dateRange){
    //基础变量
    let filteredArr = [];
    //高阶变量
    let thDays = 0;
    let minArr = [];
    let avgArr = [];
    let maxArr = [];
    let dates = {
        'minDateArr': [],
        'avgDateArr': [],
        'maxDateArr': []
    };
    let minDays = 0;
    let avgDays = 0;
    let maxDays = 0;
    let avgOfMin;
    let avg;
    let avgOfMax;
    let extremes = {
        'min': -999,
        'minDates': [],
        'minOfAvg': -999,
        'minOfAvgDates': [],
        'minOfMax': -999,
        'minOfMaxDates': [],
        'maxOfMin': 999,
        'maxOfMinDates': [],
        'maxOfAvg': 999,
        'maxOfAvgDates': [],
        'max': 999,
        'maxDates': [],
    }
    //**************************************** 核心架构 ****************************************
    //******************************筛选装填数组******************************
    for(let i=0; i<arr.length; i++){
        //年份范围+指定月份,条件比较复杂
        let tempCdt = (arr[i]['date'].substring(4,6) === config.m);
        let cdt1 = config.singleMonthNormals > 0 ? 
        (Number(arr[i]['date'].substring(0,4)) >= config.yearRange[0] &&
            Number(arr[i]['date'].substring(0,4)) <= config.yearRange[1] &&
            tempCdt
        ) : ( Number(arr[i]['date'].substring(0,4)) >= config.yearRange[0] && Number(arr[i]['date'].substring(0,4)) <= config.yearRange[1] );
        //日期范围
        let cdt2 = (Number(arr[i]['date'].substring(0,8)) >= dateRange[0] && Number(arr[i]['date'].substring(0,8)) <= dateRange[1]);
        //单年
        let cdt3 = (arr[i]['date'].substring(0,4) === config.y);
        //历史单月
        let cdt4 = tempCdt;
        //特定年月
        let cdt5 = (arr[i]['date'].substring(0,6) === config.ym);
        //根据mode选择筛选填装数组
        if(config.mode === 0){ //mode=0, 不筛选，所有历史观测
            filteredArr.push(arr[i]);
            if(arr[i]['min'] !== undefined){ minArr.push(arr[i]['min']); dates.minDateArr.push(arr[i]['date']); }
            if(arr[i]['avg'] !== undefined){ avgArr.push(arr[i]['avg']); dates.avgDateArr.push(arr[i]['date']); }
            if(arr[i]['max'] !== undefined){ maxArr.push(arr[i]['max']); dates.maxDateArr.push(arr[i]['date']); }
        }else if(config.mode === 1){ //mode=1, yearRange, 多年(月份)平均(主要统计常年月份均温)
            if(cdt1){
                filteredArr.push(arr[i]);
                if(arr[i]['min'] !== undefined){ minArr.push(arr[i]['min']); dates.minDateArr.push(arr[i]['date']); }
                if(arr[i]['avg'] !== undefined){ avgArr.push(arr[i]['avg']); dates.avgDateArr.push(arr[i]['date']); }
                if(arr[i]['max'] !== undefined){ maxArr.push(arr[i]['max']); dates.maxDateArr.push(arr[i]['date']); }
            }
        }else if(config.mode === 2){ //mode=2, dateRange, 日期范围
            if(cdt2){
                filteredArr.push(arr[i]);
                if(arr[i]['min'] !== undefined){ minArr.push(arr[i]['min']); dates.minDateArr.push(arr[i]['date']); }
                if(arr[i]['avg'] !== undefined){ avgArr.push(arr[i]['avg']); dates.avgDateArr.push(arr[i]['date']); }
                if(arr[i]['max'] !== undefined){ maxArr.push(arr[i]['max']); dates.maxDateArr.push(arr[i]['date']); }
            }
        }else if(config.mode === 3){ //mode=3, y单年模式
            if(cdt3){
                filteredArr.push(arr[i]);
                if(arr[i]['min'] !== undefined){ minArr.push(arr[i]['min']); dates.minDateArr.push(arr[i]['date']); }
                if(arr[i]['avg'] !== undefined){ avgArr.push(arr[i]['avg']); dates.avgDateArr.push(arr[i]['date']); }
                if(arr[i]['max'] !== undefined){ maxArr.push(arr[i]['max']); dates.maxDateArr.push(arr[i]['date']); }
            }
        }else if(config.mode === 4){ //mode=4, m历史单月模式，实际用的比较少
            if(cdt4){
                filteredArr.push(arr[i]);
                if(arr[i]['min'] !== undefined){ minArr.push(arr[i]['min']); dates.minDateArr.push(arr[i]['date']); }
                if(arr[i]['avg'] !== undefined){ avgArr.push(arr[i]['avg']); dates.avgDateArr.push(arr[i]['date']); }
                if(arr[i]['max'] !== undefined){ maxArr.push(arr[i]['max']); dates.maxDateArr.push(arr[i]['date']); }
            }
        }else if(config.mode === 5){ //mode=5, ym特定年月模式
            if(cdt5){
                filteredArr.push(arr[i]);
                if(arr[i]['min'] !== undefined){ minArr.push(arr[i]['min']); dates.minDateArr.push(arr[i]['date']); }
                if(arr[i]['avg'] !== undefined){ avgArr.push(arr[i]['avg']); dates.avgDateArr.push(arr[i]['date']); }
                if(arr[i]['max'] !== undefined){ maxArr.push(arr[i]['max']); dates.maxDateArr.push(arr[i]['date']); }
            }
        }
        
    }
    //计算高阶统计
    //记录日数
    minDays = minArr.length;
    avgDays = avgArr.length;
    maxDays = maxArr.length;
    //临时声明总和
    let minSum = 0;
    let avgSum = 0;
    let maxSum = 0;
    //平均气温
    for(let i=0; i<minArr.length; i++){ minSum += Number(minArr[i]); }
    avgOfMin = minDays > 0 ? (minSum/minDays).toFixed(1) : undefined;
    for(let i=0; i<avgArr.length; i++){ avgSum += Number(avgArr[i]); }
    avg = avgDays > 0 ? (avgSum/avgDays).toFixed(1) : undefined;
    for(let i=0; i<maxArr.length; i++){ maxSum += Number(maxArr[i]); }
    avgOfMax = maxDays > 0 ? (maxSum/maxDays).toFixed(1) : undefined;
    //极端温度
    //min
    extremes.min = Math.min(...minArr);
    for(let i=0; i<minArr.length; i++){ if(Number(minArr[i]) === extremes.min){ extremes.minDates.push(dates.minDateArr[i]); } }
    //minOfAvg
    extremes.minOfAvg = Math.min(...avgArr);
    for(let i=0; i<avgArr.length; i++){ if(Number(avgArr[i]) === extremes.minOfAvg){ extremes.minOfAvgDates.push(dates.avgDateArr[i]); } }
    //minOfMax
    extremes.minOfMax = Math.min(...maxArr);
    for(let i=0; i<maxArr.length; i++){ if(Number(maxArr[i]) === extremes.minOfMax){ extremes.minOfMaxDates.push(dates.maxDateArr[i]); } }
    //maxOfMin
    extremes.maxOfMin = Math.max(...minArr);
    for(let i=0; i<minArr.length; i++){ if(Number(minArr[i]) === extremes.maxOfMin){ extremes.maxOfMinDates.push(dates.minDateArr[i]); } }
    //maxOfAvg
    extremes.maxOfAvg = Math.max(...avgArr);
    for(let i=0; i<avgArr.length; i++){ if(Number(avgArr[i]) === extremes.maxOfAvg){ extremes.maxOfAvgDates.push(dates.avgDateArr[i]); } }
    //max
    extremes.max = Math.max(...maxArr);
    for(let i=0; i<maxArr.length; i++){ if(Number(maxArr[i]) === extremes.max){ extremes.maxDates.push(dates.maxDateArr[i]); } }
    //数组排序
    let item = config.item;
    let th = config.threshHold;
    let order = config.order;
    //filteredArr.sort( (a, b) => order === 'asc' ? a[item] - b[item] : b[item] - a[item] );
    filteredArr.sort((a, b) => { return sortUndefinedObj(a[item], b[item], config.order); }); //这个是从noaa.js搬运过来的，暂且保留上一行注释
    //获取阈值天数
    let tempItem; //tempItem为date或min或其它意外值都默认统计min阈值天数，avg统计avg阈值天数，max统计max阈值天数
    if(item === 'avg'){tempItem = 'avg'}else if(item === 'max'){tempItem = 'max'}else{tempItem = 'min'};

    for(let i=0; i<filteredArr.length; i++){
        if(order === 'asc'){
            if(Number(filteredArr[i][tempItem]) <= th){
                thDays += 1;
            }
        }else{
            if(Number(filteredArr[i][tempItem]) >= th){
                thDays += 1;
            }
        }
    }
    //返回数组
    return {
        'avgOfMin': avgOfMin,
        'avg': avg,
        'avgOfMax': avgOfMax,
        'thDays': thDays,
        'extremes': extremes,
        'minDays': minDays,
        'avgDays': avgDays,
        'maxDays': maxDays,
        'filteredArr': filteredArr,
        'minArr': minArr,
        'avgArr': avgArr,
        'maxArr': maxArr,
        'dates': dates
    }
}

//查询单日
function veiwDate(arr, dateStr){
    let tempObj = {};
    for(let i=0; i<arr.length; i++){
        if(arr[i]['date'] === dateStr){
            tempObj = arr[i];
            break;
        }
    }
    return tempObj;
}

//解决undefined扰乱数组排序的问题，搬运自noaa.js
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

//把数组打印为字符串
function printDateArr(arr){
    let str = '';
    for(let i=0; i<arr.length; i++){
        if(i < arr.length - 1){
            str += beautifyDate(arr[i].toString()) + ' & ';
        }else{
            str += beautifyDate(arr[i].toString());
        }
    }
    return str;
}

//美化日期格式
function beautifyDate(date8){
    let tempStr = date8.toString();
    return tempStr.substring(0, 4) + '年' + tempStr.substring(4, 6) + '月' + tempStr.substring(6, 8) + '日';
}