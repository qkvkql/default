//标题
let thsOfTitle = document.getElementsByClassName('ant-table-thead')[0].getElementsByTagName('th');
let arrOfTitles = []; //标题数组
for(let i=0; i<thsOfTitle.length; i++){
    arrOfTitles.push(thsOfTitle[i].innerText.trim());
}
//数据
let trsOfDataRow = document.getElementsByClassName('ant-table-tbody')[0].getElementsByTagName('tr');
let arrOfDataRows = []; //结果数组
for(let i=0; i<trsOfDataRow.length; i++){
    let tdsOfCurrentTr = trsOfDataRow[i].getElementsByTagName('td');
    let tempObj = {};
    for(let j=0; j<tdsOfCurrentTr.length; j++){
        let tempContent = tdsOfCurrentTr[j].innerText.trim();
        if(tempContent.toString().length > 0){
            tempObj[arrOfTitles[j]] = tempContent;
        }
    }
    arrOfDataRows.push(tempObj);
}
//打印结果(\t间隔)
//console.table(arrOfDataRows);
let resultStr = '';
//填入标题行
for(let i=0; i<arrOfTitles.length; i++){
    if(i < arrOfTitles.length - 1){
        resultStr += arrOfTitles[i] + '\t';
    }else{
        resultStr += arrOfTitles[i] + '\n';
    }
}
//填入数据
for(let i=0; i<arrOfDataRows.length; i++){
    let keys = Object.keys(arrOfDataRows[i]);
    let values = Object.values(arrOfDataRows[i]);
    for(let j=0; j<keys.length; j++){
        if(j < keys.length - 1){
            resultStr += values[j] + '\t';
        }else{
            resultStr += values[j];
        }
    }
    if(i < arrOfDataRows.length - 1){
        resultStr += '\n';
    }
}
console.log(resultStr);