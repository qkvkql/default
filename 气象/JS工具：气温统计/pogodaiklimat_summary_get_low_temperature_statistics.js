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
let indexOfDate = 2;
let indexOfColumnAvg = indexOfColumnAvgName + 3;
let indexOfColumnMin = indexOfColumnMinName + 3;
let indexOfColumnMax = indexOfColumnMaxName + 3;
//获取行
let trs = document.getElementById('summary_table').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
//获取均、低、高温标题名称
/*
let nameOfAvg = trs[1].getElementsByTagName('td')[indexOfColumnAvgName].innerText.trim().split('\n')[0].trim();
let nameOfMin = trs[1].getElementsByTagName('td')[indexOfColumnMinName].innerText.trim().split('\n')[0].trim();
let nameOfMax = trs[1].getElementsByTagName('td')[indexOfColumnMaxName].innerText.trim().split('\n')[0].trim();
*/
//基本信息
let basicInfo = {};
basicInfo['wmo'] = trs[2].getElementsByTagName('td')[0].innerText.trim();
basicInfo['name'] = trs[2].getElementsByTagName('td')[1].innerText.trim();
basicInfo['year'] = trs[2].getElementsByTagName('td')[2].innerText.trim().split('.')[2];
//数据数组
let dataArr = [];
//填数组
for(let i=2; i<trs.length; i++){
    let tempObj = {};
    tempObj['date'] = convertDateFormatFotPogodaiklimat(trs[i].getElementsByTagName('td')[indexOfDate].innerText.trim());
    tempObj['avg'] = trs[i].getElementsByTagName('td')[indexOfColumnAvg].innerText.trim();
    tempObj['min'] = trs[i].getElementsByTagName('td')[indexOfColumnMin].innerText.trim();
    tempObj['max'] = trs[i].getElementsByTagName('td')[indexOfColumnMax].innerText.trim();
    dataArr.push(tempObj);
}
//寒冷天数统计
let objOfColdDays = getStatistics(dataArr);
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
        //均温天数
        if(Number(arr[i]['avg']) <= -50){ countA50 += 1; }
        if(Number(arr[i]['avg']) <= -45){ countA45 += 1; }
        if(Number(arr[i]['avg']) <= -40){ countA40 += 1; }
        if(Number(arr[i]['avg']) <= -35){ countA35 += 1; }
        if(Number(arr[i]['avg']) <= -30){ countA30 += 1; }
        //低温天数
        if(Number(arr[i]['min']) <= -55){ countN55 += 1; }
        if(Number(arr[i]['min']) <= -50){ countN50 += 1; }
        if(Number(arr[i]['min']) <= -45){ countN45 += 1; }
        if(Number(arr[i]['min']) <= -40){ countN40 += 1; }
        if(Number(arr[i]['min']) <= -35){ countN35 += 1; }
        //高温天数
        if(Number(arr[i]['max']) <= -45){ countX45 += 1; }
        if(Number(arr[i]['max']) <= -40){ countX40 += 1; }
        if(Number(arr[i]['max']) <= -35){ countX35 += 1; }
        if(Number(arr[i]['max']) <= -30){ countX30 += 1; }
        if(Number(arr[i]['max']) <= -25){ countX25 += 1; }
    }
    //均温天数
    coldDaysStatistics['A50'] = countA50;
    coldDaysStatistics['A45'] = countA45;
    coldDaysStatistics['A40'] = countA40;
    coldDaysStatistics['A35'] = countA35;
    coldDaysStatistics['A30'] = countA30;
    //低温天数
    coldDaysStatistics['N55'] = countN55;
    coldDaysStatistics['N50'] = countN50;
    coldDaysStatistics['N45'] = countN45;
    coldDaysStatistics['N40'] = countN40;
    coldDaysStatistics['N35'] = countN35;
    //高温天数
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
//console.log(dataArr);
//console.log(objOfColdDays);
console.log('站点：' + basicInfo['name'] + '\n站号：' + basicInfo['wmo'] + '\n年份：' + basicInfo['year'] + '\n记录日数：' + dataArr.length
 + '\n\n低温天数：\n低温<=-55℃天数: ' + objOfColdDays['N55']
 + '\n低温<=-50℃天数: ' + objOfColdDays['N50']
 + '\n低温<=-45℃天数: ' + objOfColdDays['N45']
 + '\n低温<=-40℃天数: ' + objOfColdDays['N40']
 + '\n低温<=-35℃天数: ' + objOfColdDays['N35']
 + '\n\n均温天数：\n均温<=-50℃天数: ' + objOfColdDays['A50']
 + '\n均温<=-45℃天数: ' + objOfColdDays['A45']
 + '\n均温<=-40℃天数: ' + objOfColdDays['A40']
 + '\n均温<=-35℃天数: ' + objOfColdDays['A35']
 + '\n均温<=-30℃天数: ' + objOfColdDays['A30']
 + '\n\n高温天数：\n高温<=-45℃天数: ' + objOfColdDays['X45']
 + '\n高温<=-40℃天数: ' + objOfColdDays['X40']
 + '\n高温<=-35℃天数: ' + objOfColdDays['X35']
 + '\n高温<=-30℃天数: ' + objOfColdDays['X30']
 + '\n高温<=-25℃天数: ' + objOfColdDays['X25']);