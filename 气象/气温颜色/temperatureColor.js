document.addEventListener('DOMContentLoaded',function(event){
    createColorCubes(arrOfColors);
});
let arrOfColors = [
	{
	"rgb": "255,255,255",
	"text": "< -70"
	},
	{
	"rgb": "253,201,225",
	"text": "-65 ~ -70"
	},
	{
	"rgb": "251,146,194",
	"text": "-60 ~ -65"
	},
	{
	"rgb": "249,92,164",
	"text": "-55 ~ -60"
	},
	{
	"rgb": "247,37,133",
	"text": "-50 ~ -55"
	},
	{
	"rgb": "214,30,146",
	"text": "-45 ~ -50"
	},
	{
	"rgb": "181,23,158",
	"text": "-40 ~ -45"
	},
	{
	"rgb": "148,16,171",
	"text": "-35 ~ -40"
	},
	{
	"rgb": "114,9,183",
	"text": "-30 ~ -35"
	},
	{
	"rgb": "86,11,173",
	"text": "-25 ~ -30"
	},
	{
	"rgb": "72,12,168",
	"text": "-20 ~ -25"
	},
	{
	"rgb": "58,12,163",
	"text": "-15 ~ -20"
	},
	{
	"rgb": "63,55,201",
	"text": "-10 ~ -15"
	},
	{
	"rgb": "67,97,238",
	"text": "-5 ~ -10"
	},
	{
	"rgb": "72,149,239",
	"text": "0 ~ -5"
	},
	{
	"rgb": "76,201,240",
	"text": "0"
	},
	{
	"rgb": "243,233,209",
	"text": "0 ~ 5"
	},
	{
	"rgb": "230,211,163",
	"text": "5 ~ 10"
	},
	{
	"rgb": "216,209,116",
	"text": "10 ~ 15"
	},
	{
	"rgb": "182,196,84",
	"text": "15 ~ 20"
	},
	{
	"rgb": "142,166,4",
	"text": "20 ~ 25"
	},
	{
	"rgb": "245,187,0",
	"text": "25 ~ 30"
	},
	{
	"rgb": "215,106,3",
	"text": "30 ~ 35"
	},
	{
	"rgb": "191,49,0",
	"text": "35 ~ 40"
	},
	{
	"rgb": "105,20,14",
	"text": "40 ~ 45"
	},
	{
	"rgb": "60,21,24",
	"text": "45 ~ 50"
	},
	{
	"rgb": "0,0,0",
	"text": "> 50"
	}
]
function createColorCubes(colorArr){
    colorArr.forEach((v) => {
        createColorCube(v.rgb, v.text);
    });
}
function createColorCube(rgb, str){
    let colorCube = document.getElementById('colorCube');
    let colorText = document.getElementById('colorText');
    
    let cube = document.createElement('div');
    cube.setAttribute('class', 'cube');
    cube.style.backgroundColor = 'rgb(' + rgb + ')';
    colorCube.appendChild(cube);
    
    let text = document.createElement('div');
    text.setAttribute('class', 'text');
    text.innerText = str.replace(/\s/g, '\n');

    colorText.appendChild(text);
}