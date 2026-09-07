let tbodys = document.getElementById('customers').getElementsByTagName('tbody');
//获取标题
let arrOfThStrs = [];
let ths = tbodys[0].getElementsByTagName('tr')[0].getElementsByTagName('th');
for(let i=0; i<ths.length; i++){
    arrOfThStrs.push(ths[i].innerText.toString().trim());
}
//填装数组
let arrOfObj = [];
for(let i=1; i<tbodys.length; i++){
    let tempObj = {};
    let tempTds = tbodys[i].getElementsByTagName('tr')[0].getElementsByTagName('td');
    let tempValues = []
    for(let j=0; j<ths.length; j++){
        tempObj[arrOfThStrs[j]] = tempTds[j].innerText.toString().trim();
        if(j > 3){
            tempValues.push(Number(tempTds[j].innerText.toString().trim()))
        }
    }

    let tempSum = 0;
    let total = tempValues.length; //数据个数
    for(let j=0; j<total; j++){
        tempSum += tempValues[j];
    }
    let avg = (tempSum/total).toFixed(2).toString();
    tempObj['avg_of8'] = avg;
    tempObj['total'] = total;
    arrOfObj.push(tempObj);
}

let resultStr = '';
let tempK = Object.keys(arrOfObj[0]);
//打印标题
for(let i=0; i<tempK.length; i++){
    if(i < tempK.length - 1){
        resultStr += tempK[i] + '\t';
    }else{
        resultStr += tempK[i] + '\n';
    }
}
//打印数据
for(let i=0; i<arrOfObj.length; i++){
    for(let j=0; j<tempK.length; j++){
        if(j < tempK.length - 1){
            resultStr += arrOfObj[i][tempK[j]] + '\t';
        }else{
            if(i < arrOfObj.length - 1){
                resultStr += arrOfObj[i][tempK[j]] + '\n';
            }else{
                resultStr += arrOfObj[i][tempK[j]];
            }
        }
    }
}
//打印结果
//console.log(arrOfObj)
console.log(resultStr);