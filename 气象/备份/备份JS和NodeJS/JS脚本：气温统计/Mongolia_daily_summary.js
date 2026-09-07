let trs = document.getElementById('customers').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
//获取标题
let arrOfThStrs = [];
let ths = trs[0].getElementsByTagName('th');
for(let i=0; i<ths.length; i++){
    arrOfThStrs.push(ths[i].innerText.toString().trim());
}
//填装数组
let arrOfObj = [];
for(let i=1; i<trs.length; i++){
    let tempObj = {};
    let tempTds = trs[i].getElementsByTagName('td');
    for(let j=0; j<ths.length; j++){
        tempObj[arrOfThStrs[j]] = tempTds[j].innerText.toString().trim();
    }
    arrOfObj.push(tempObj);
}

let resultStr = '';
//打印标题
for(let i=0; i<ths.length; i++){
    if(i < ths.length - 1){
        resultStr += arrOfThStrs[i] + '\t';
    }else{
        resultStr += arrOfThStrs[i] + '\n';
    }
}
//打印数据
for(let i=0; i<arrOfObj.length; i++){
    for(let j=0; j<ths.length; j++){
        if(j < ths.length - 1){
            resultStr += arrOfObj[i][arrOfThStrs[j]] + '\t';
        }else{
            if(i < arrOfObj.length - 1){
                resultStr += arrOfObj[i][arrOfThStrs[j]] + '\n';
            }else{
                resultStr += arrOfObj[i][arrOfThStrs[j]];
            }
        }
    }
}
//打印结果
console.log(resultStr);