let climateAvgOf_30_Years_startYear = 1961;

let monthsText = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月', '全年'];
let objOfMonthlyDataForClimate = {};
let resultObj = {};
for(let i = 0; i < monthsText.length; i++){ //初始化两个对象，按特定格式
    objOfMonthlyDataForClimate[monthsText[i]] = [];
    //resultObj[monthsText[i]] = -100;
}

let leftColumns = document.getElementsByClassName("chronicle-table-left-column")[0].getElementsByTagName('tr');
for(let lcy = 0; lcy < leftColumns.length; lcy++){
    let tempYear = Number(leftColumns[lcy].getElementsByTagName('font')[0].getElementsByTagName('font')[0].innerText.trim());
    
    let dataDiv = document.getElementsByClassName("chronicle-table")[0];
    let dataOfYears = dataDiv.getElementsByTagName('tr');
    let dataOfTheYear = dataOfYears[lcy].getElementsByTagName('td');
    for(let m = 0; m < dataOfTheYear.length; m++){
        let dataOfTheMonth = Number(dataOfTheYear[m].getElementsByTagName('font')[0].getElementsByTagName('font')[0].innerText.trim());
        let startYear = Number(climateAvgOf_30_Years_startYear);
        if( tempYear >= startYear && tempYear < (startYear + 30) ){
            if(dataOfTheMonth > -100 && dataOfTheMonth < 60){
                objOfMonthlyDataForClimate[monthsText[m]].push(dataOfTheMonth);
            }
        }
    }
}

let arrOfObjK = Object.keys(objOfMonthlyDataForClimate);
let arrOfObjV = Object.values(objOfMonthlyDataForClimate);
for(let i = 0; i < arrOfObjK.length; i++){
    let tempAvg = 0;
    let tempSum = 0;
    for(let j=0; j<arrOfObjV[i].length; j++){
        tempSum += arrOfObjV[i][j];
    }
    tempAvg = (tempSum/(arrOfObjV[i].length)).toFixed(1);
    resultObj[arrOfObjK[i]] = tempAvg;
}
console.log(objOfMonthlyDataForClimate);
console.table(resultObj);