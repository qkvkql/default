# ******** ******** ******** 保证各种语言、特殊符号解码正常 ******** ******** ********
import sys
sys.stdout.reconfigure(encoding='utf-8')

# ******** ******** ******** ******** 引入依赖包 ******** ******** ******** ********
import openpyxl
import webbrowser
import time
from datetime import datetime, timedelta, timezone
import json

# ******** ******** ******** ******** 读取配置文件 ******** ******** ******** ********
with open('config.json', 'r', encoding='utf-8') as file:
    config = json.load(file)

# ******** ******** ******** ******** 配置 ******** ******** ******** ********
station_list_path = config['station_list_path']
scraped_path = config['scraped_path']

# ******** ******** ******** ******** 获取、准备日期、时间字符串 ******** ******** ******** ********
def get_utc_datetime_parts():
    now = datetime.now(timezone.utc)
    return {
        "YYYY": now.strftime("%Y"),
        "MM": now.strftime("%m"),
        "DD": now.strftime("%d"),
        "hh": now.strftime("%H"),
        # "mm": now.strftime("%M") 分钟
    }
dt = get_utc_datetime_parts()
# target_date = '2025-11-28'
# target_date =dt['YYYY'] + '-' + dt['MM'] + '-' + dt['DD'] # 当前UTC时区日期

# ******** ******** ******** ******** 读取站点列表, ogimet不需要读取站点列表，直接用站号就能打开页面，但是rp5需要，rp5的url需要专属英文 ******** ******** ******** ********
workbook = openpyxl.load_workbook(station_list_path)
sheet = workbook['站点信息和记录']
rows = list(sheet.values)
station_list = [] #站点列表
if rows:
    headers = rows[0]
    content_rows = rows[1:]
    station_list = [dict(zip(headers, row)) for row in content_rows]
    station_list = [o for o in station_list if o['source'] is not None] #得到初始 station_list, 默认一定是按list id排序的
else:
    print("The sheet of station list is empty.")
# ogimet_list = [e['USAF'] for e in station_list if e['source'] == 'ogimet']

# ******** ******** ******** ******** 读取 bad_list ******** ******** ******** ********
with open(scraped_path, 'r', encoding='utf-8') as f:
    bad_list = reversed(json.load(f)['bad_list']) # 使用Python打开页面，似乎无法后台打开新页面，无法保持在第一个Tab，这里reverse一下数组实现第一个站是可见Tab
# ******** ******** ******** ******** 功能函数 ******** ******** ******** ********
def get_ogimet_hourly_url(usaf):
    return 'https://ogimet.com/cgi-bin/gsynres?ind=' + usaf + '&decoded=yes&ndays=7&ano=' + dt['YYYY'] + '&mes=' +dt['MM'] + '&day=' + dt['DD'] + '&hora=' + dt['hh']
def get_rp5_hourly_url(usaf):
    for o in station_list:
        if str(o['USAF']) == usaf:
            #如果参数usaf站号不在 station_list 内, 那么循环结束也没有return 一个url, 函数最终返回的是 None，可能遇到 TypeError: startfile: filepath should be string, bytes or os.PathLike, not NoneType 
            return 'https://rp5.ru/Weather_archive_in_' + o['rp5']

# ******** ******** ******** ******** 读取 打开多个页面 ******** ******** ******** ********
def open_bad_stations(arr, source):
    for usaf in arr:
        url = ''
        if source == 'ogimet':
            url = get_ogimet_hourly_url(usaf)
        elif source == 'rp5':
            url = get_rp5_hourly_url(usaf)
        webbrowser.open(url)
        time.sleep(2)
# ******** ******** ******** ******** 运行 ******** ******** ******** ********
# open_bad_stations(bad_list, 'rp5')
open_bad_stations(bad_list, 'ogimet')