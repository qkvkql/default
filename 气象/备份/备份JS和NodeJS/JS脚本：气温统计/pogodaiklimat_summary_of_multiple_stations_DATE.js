//温度单位：摄氏度
/*
let nameOfAvgShouldBe = 'Т ср';
let nameOfMinShouldBe = 'Т мин';
let nameOfMaxShouldBe = 'Т макс';
*/
//均、低、高温标题列index(不是数据列index，数据列index应该加3，因为标题前两行span了)
let indexOfColumnAvgName = 0;
let indexOfColumnMinName = 3;
let indexOfColumnMaxName = 4;
//数据列index
let indexOfWmoNo = 0;
let indexOfStationName = 1;
let indexOfDate = 2;
let indexOfColumnAvg = indexOfColumnAvgName + 3;
let indexOfColumnMin = indexOfColumnMinName + 3;
let indexOfColumnMax = indexOfColumnMaxName + 3;
//自定义项名
let customedNameMin = '24h最低(20~20)';
let customedNameAvg = '八点均温(~20)';
let customedNameMax = '24h最高(20~20)';
//获取行
let trs = document.getElementById('summary_table').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
//获取均、低、高温标题名称
/*
let nameOfAvg = trs[1].getElementsByTagName('td')[indexOfColumnAvgName].innerText.trim().split('\n')[0].trim();
let nameOfMin = trs[1].getElementsByTagName('td')[indexOfColumnMinName].innerText.trim().split('\n')[0].trim();
let nameOfMax = trs[1].getElementsByTagName('td')[indexOfColumnMaxName].innerText.trim().split('\n')[0].trim();
*/
//数据数组
let dataArr = [];
//填数组
for(let i=2; i<trs.length; i++){
    let tempObj = {};
    tempObj['WMO站号'] = trs[i].getElementsByTagName('td')[indexOfWmoNo].innerText.trim();
    tempObj['站名'] = trs[i].getElementsByTagName('td')[indexOfStationName].innerText.trim();
    tempObj['日期'] = convertDateFormatFotPogodaiklimat(trs[i].getElementsByTagName('td')[indexOfDate].innerText.trim());
    tempObj[customedNameMin] = Number(trs[i].getElementsByTagName('td')[indexOfColumnMin].innerText.trim());
    tempObj[customedNameAvg] = Number(trs[i].getElementsByTagName('td')[indexOfColumnAvg].innerText.trim());
    tempObj[customedNameMax] = Number(trs[i].getElementsByTagName('td')[indexOfColumnMax].innerText.trim());
    dataArr.push(tempObj);
}
//字符串结果(表格形式)
let resultStr = '';
let tempK = Object.keys(dataArr[0]);
let kLen = tempK.length;
for(let i=0; i<dataArr.length; i++){
    for(j=0; j<kLen; j++){
        resultStr += dataArr[i][tempK[j]] + '\t';
    }
    resultStr += '\n';
}
//寒冷站数统计
let objOfColdStations = getStatistics(dataArr);
//统计函数
function getStatistics(arr){
    let coldDaysStatistics = {};
    //均温
    let countA50 = 0;
    let countA45 = 0;
    let countA40 = 0;
    let countA35 = 0;
    let countA30 = 0;
    //低温
    let countN55 = 0;
    let countN50 = 0;
    let countN45 = 0;
    let countN40 = 0;
    let countN35 = 0;
    //高温
    let countX45 = 0;
    let countX40 = 0;
    let countX35 = 0;
    let countX30 = 0;
    let countX25 = 0;
    //遍历统计
    for(let i=0; i<arr.length; i++){
        //均温站数
        if(Number(arr[i][customedNameAvg]) <= -50){ countA50 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -45){ countA45 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -40){ countA40 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -35){ countA35 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -30){ countA30 += 1; }
        //低温站数
        if(Number(arr[i][customedNameMin]) <= -55){ countN55 += 1; }
        if(Number(arr[i][customedNameMin]) <= -50){ countN50 += 1; }
        if(Number(arr[i][customedNameMin]) <= -45){ countN45 += 1; }
        if(Number(arr[i][customedNameMin]) <= -40){ countN40 += 1; }
        if(Number(arr[i][customedNameMin]) <= -35){ countN35 += 1; }
        //高温站数
        if(Number(arr[i][customedNameMax]) <= -45){ countX45 += 1; }
        if(Number(arr[i][customedNameMax]) <= -40){ countX40 += 1; }
        if(Number(arr[i][customedNameMax]) <= -35){ countX35 += 1; }
        if(Number(arr[i][customedNameMax]) <= -30){ countX30 += 1; }
        if(Number(arr[i][customedNameMax]) <= -25){ countX25 += 1; }
    }
    //均温站数
    coldDaysStatistics['A50'] = countA50;
    coldDaysStatistics['A45'] = countA45;
    coldDaysStatistics['A40'] = countA40;
    coldDaysStatistics['A35'] = countA35;
    coldDaysStatistics['A30'] = countA30;
    //低温站数
    coldDaysStatistics['N55'] = countN55;
    coldDaysStatistics['N50'] = countN50;
    coldDaysStatistics['N45'] = countN45;
    coldDaysStatistics['N40'] = countN40;
    coldDaysStatistics['N35'] = countN35;
    //高温站数
    coldDaysStatistics['X45'] = countX45;
    coldDaysStatistics['X40'] = countX40;
    coldDaysStatistics['X35'] = countX35;
    coldDaysStatistics['X30'] = countX30;
    coldDaysStatistics['X25'] = countX25;
    //返回值
    return coldDaysStatistics;
}
//日期格式转换
function convertDateFormatFotPogodaiklimat(str){
    let arr = str.split('.');
    let y = arr[2].trim();
    let m = arr[1].trim();
    let d = arr[0].trim();
    return y + '-' + m + '-' + d;
}
//打印
//阈值
console.log('记录站数：' + dataArr.length
 + '\n\n低温站数：\n低温<=-55℃站数: ' + objOfColdStations['N55']
 + '\n低温<=-50℃站数: ' + objOfColdStations['N50']
 + '\n低温<=-45℃站数: ' + objOfColdStations['N45']
 + '\n低温<=-40℃站数: ' + objOfColdStations['N40']
 + '\n低温<=-35℃站数: ' + objOfColdStations['N35']
 + '\n\n均温站数：\n均温<=-50℃站数: ' + objOfColdStations['A50']
 + '\n均温<=-45℃站数: ' + objOfColdStations['A45']
 + '\n均温<=-40℃站数: ' + objOfColdStations['A40']
 + '\n均温<=-35℃站数: ' + objOfColdStations['A35']
 + '\n均温<=-30℃站数: ' + objOfColdStations['A30']
 + '\n\n高温站数：\n高温<=-45℃站数: ' + objOfColdStations['X45']
 + '\n高温<=-40℃站数: ' + objOfColdStations['X40']
 + '\n高温<=-35℃站数: ' + objOfColdStations['X35']
 + '\n高温<=-30℃站数: ' + objOfColdStations['X30']
 + '\n高温<=-25℃站数: ' + objOfColdStations['X25']);
//console表格形式
//console.table(dataArr);
//字符串(tab制表符)
console.log(resultStr);