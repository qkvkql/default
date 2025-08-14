let climateYearStart = 1961;

let climateYears = 30;
let monthsText = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月', '全年'];
let objOfMonthlyDataForClimate = {};
let resultArr = [];
for(let i = 0; i < monthsText.length; i++){ //初始化两个对象，按特定格式
    objOfMonthlyDataForClimate[monthsText[i]] = [];
}

let leftColumns = document.getElementsByClassName("chronicle-table-left-column")[0].getElementsByTagName('tr');
for(let lcy = 0; lcy < leftColumns.length; lcy++){
    let tempYear = Number(leftColumns[lcy].getElementsByTagName('font')[0].getElementsByTagName('font')[0].innerText.trim());
    
    let dataDiv = document.getElementsByClassName("chronicle-table")[0];
    let dataOfYears = dataDiv.getElementsByTagName('tr');
    let dataOfTheYear = dataOfYears[lcy].getElementsByTagName('td');
    for(let m = 0; m < dataOfTheYear.length; m++){
        let dataOfTheMonth = Number(dataOfTheYear[m].getElementsByTagName('font')[0].getElementsByTagName('font')[0].innerText.trim());
        let startYear = Number(climateYearStart);
        if( tempYear >= startYear && tempYear < (startYear + climateYears) ){
            if(dataOfTheMonth > -100 && dataOfTheMonth < 60){
                objOfMonthlyDataForClimate[monthsText[m]].push(dataOfTheMonth);
            }
        }
    }
}

let tempStartY = Number(climateYearStart);
let tempStr = '[ ' + tempStartY.toString() + '-' +(tempStartY + climateYears - 1).toString() + ' ] ';

let arrOfObjK = Object.keys(objOfMonthlyDataForClimate);
let arrOfObjV = Object.values(objOfMonthlyDataForClimate);
for(let i = 0; i < arrOfObjK.length; i++){
    let tempAvg = 0;
    let tempSum = 0;
    for(let j=0; j<arrOfObjV[i].length; j++){
        tempSum += arrOfObjV[i][j];
    }
    tempAvg = Number((tempSum/(arrOfObjV[i].length)).toFixed(1));
    resultArr.push([]);
    resultArr[i][tempStr + '气候'] = arrOfObjK[i];
    resultArr[i]['平均气温'] = tempAvg;
    resultArr[i]['年数'] = (arrOfObjV[i].length).toString() + ' / ' + climateYears.toString().trim();
}
console.log(objOfMonthlyDataForClimate);
console.table(resultArr);