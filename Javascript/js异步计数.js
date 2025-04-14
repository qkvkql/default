//使用Promise实现循环异步，感觉自己真是个天才
let promise0 = new Promise((resolve) => { resolve(); })
let count = 0;
showNumberBySecond(promise0, 10);
function showNumberBySecond(pro, len){
    for(let i=0; i<len; i++){
        pro = pro.then(() => {
            return new Promise((resolve) => {
                count += 1;
                setTimeout(() => {
                    console.log(count);
                    resolve();
                }, 1000)
            })
        });
    }
}