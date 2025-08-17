let trsOfData = document.getElementById('provincial-extremes-table').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
let resultStr = '';
for(let i=0; i<trsOfData.length; i++){
    let tdsOfCurrentTr = trsOfData[i].getElementsByTagName('td');
    for(let j=0; j<tdsOfCurrentTr.length; j++){
        if(j < tdsOfCurrentTr.length - 1){
            resultStr += tdsOfCurrentTr[j].innerText.trim() + '\t';
        }else{
            resultStr += tdsOfCurrentTr[j].innerText.trim();
        }
    }
    if(i < trsOfData.length - 1){
        resultStr += '\n';
    }
}
console.log(resultStr);