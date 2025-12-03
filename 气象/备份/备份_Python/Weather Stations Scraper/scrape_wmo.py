# ******** ******** ******** 保证各种语言、特殊符号解码正常 ******** ******** ********
import sys
sys.stdout.reconfigure(encoding='utf-8')

# ******** ******** ******** ******** 引入依赖包 ******** ******** ******** ********
import time
from datetime import datetime, timedelta, timezone
from timezonefinder import TimezoneFinder
from zoneinfo import ZoneInfo # Python 3.9+
import math
import re
import json
import openpyxl
import random
import re
from DrissionPage import ChromiumPage

# ******** ******** ******** ******** 读取配置文件 ******** ******** ******** ********
with open('config.json', 'r', encoding='utf-8') as file:
    config = json.load(file)

# ******** ******** ******** ******** 配置 ******** ******** ******** ********
max_for_compare = 10
station_list_path = config['station_list_path']
scraped_path = config['scraped_path']
rp5_stations = {
    '44224': {
        'en_name': 'Tsetsen-Uul',
        'cn_name': '车臣乌拉',
        'regiion': '蒙古 扎布汗省',
        'rp5_url_str': 'Tsetsen-Uul'
    }
}

source_alias_map = {
    "mn": {
        "orig_format": "MM/DD", 
        "parse_format": "%Y/%m/%d",
        "needs_year_prefix": True,
        "needs_year_suffix": False
    },
    "rp5": {
        "orig_format": "YYYY-Month-DD", 
        "parse_format": "%Y-%B-%d", # %B matches full English month name (e.g., November)
        "needs_year_prefix": False,
        "needs_year_suffix": False
    },
    "pogodaiklimat": {
        "orig_format": "DD.MM", 
        "parse_format": "%d.%m.%Y",
        "needs_year_prefix": False,
        "needs_year_suffix": True
    },
    "ogimet": {
        "orig_format": "DD/MM/YYYY", 
        "parse_format": "%d/%m/%Y",
        "needs_year_prefix": False,
        "needs_year_suffix": True
    }
}

# ******** ******** ******** ******** 获取、准备日期、时间字符串, 获取UTC时区数字 ******** ******** ******** ********
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
# target_date = '2025-12-01'
target_date =dt['YYYY'] + '-' + dt['MM'] + '-' + dt['DD'] # 当前UTC时区日期
current_year_str = datetime.now().year # 获取当前年份，后面转换日期可能要用到

# Get time zone
def get_timezone_offset(lat, lng):
    # Step 1: Find the Timezone Name (e.g., "America/New_York")
    tf = TimezoneFinder()
    tz_name = tf.timezone_at(lng=lng, lat=lat)
    
    if tz_name is None:
        print("Coordinates are likely in the ocean.")
        return None

    # Step 2: Get the current time in that timezone
    # We must check "now" because the offset changes with Daylight Saving Time
    zone = ZoneInfo(tz_name)
    current_time_in_zone = datetime.now(zone)

    # Step 3: Extract the offset
    # utcoffset() returns a timedelta (e.g., -1 day, 19:00:00)
    offset_timedelta = current_time_in_zone.utcoffset()
    
    # Convert timedelta to total hours (float)
    offset_hours = offset_timedelta.total_seconds() / 3600
    
    # Return as integer (if you want -5) or keep as float (for -5.5 like India)
    return int(offset_hours)

# ******** ******** ******** ******** ******** ******** 读取站点列表 ******** ******** ******** ******** ******** ********
workbook = openpyxl.load_workbook(station_list_path)
# sheet = workbook['仅供测试']
sheet = workbook['站点信息和记录']
rows = list(sheet.values)
station_list = [] #站点列表
if rows:
    headers = rows[0]
    content_rows = rows[1:]
    station_list = [dict(zip(headers, row)) for row in content_rows]
    station_list = [o for o in station_list if o['id'] is not None and o['cn_name'] is not None] #得到初始 station_list, 默认一定是按list id排序的
else:
    print("The sheet of station list is empty.")
accessible_list = [e['USAF'] for e in station_list if e['source'] == 'ogimet' or e['source'] == 'rp5'] # station list for ogimet use

# ogimet_1 = [{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44212,"rp5":"Ulaangom","timezone":12},{"source":"ogimet","USAF":44221,"rp5":"Gandan_Huryee","timezone":12},{"source":"ogimet","USAF":44224,"rp5":"Tsetsen-Uul","timezone":12},{"source":"ogimet","USAF":44225,"rp5":"Tosontsengel","timezone":12},{"source":"ogimet","USAF":44203,"rp5":"Rinchinlhumbe","timezone":12},{"source":"ogimet","USAF":44292,"rp5":"Ulan_Bator","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44291,"rp5":"Ulan_Bator,_Songiin_(airport)","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44275,"rp5":"Bayanbulag","timezone":12},{"source":"ogimet","USAF":44284,"rp5":"Galut","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44265,"rp5":"Baitag","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44277,"rp5":"Altai,_Mongolia","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44207,"rp5":"Hatgal","timezone":12},{"source":"ogimet","USAF":44231,"rp5":"Moron","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44215,"rp5":"Umnu-Gobi","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44213,"rp5":"Baruunturuun","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44263,"rp5":"Jargalant","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":44229,"rp5":"Tariat","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":31702,"rp5":"Obluchye","timezone":15},{"source":"ogimet","USAF":31532,"rp5":"Cekunda","timezone":15},{"source":"ogimet","USAF":31478,"rp5":"Sofiysk","timezone":15},{"source":"ogimet","USAF":31329,"rp5":"Ekimchan","timezone":12},{"source":"ogimet","USAF":31348,"rp5":"Burukan","timezone":15},{"source":"ogimet","USAF":30673,"rp5":"Mogocha","timezone":12},{"source":"rp5","USAF":30565,"rp5":"Ust-Karenga","timezone":12},{"source":"ogimet","USAF":30664,"rp5":"Tungokochen","timezone":12},{"source":"ogimet","USAF":30636,"rp5":"Barguzin","timezone":12},{"source":"ogimet","USAF":30622,"rp5":"Kachug","timezone":12},{"source":"ogimet","USAF":36104,"rp5":"Saryg-Sep","timezone":12},{"source":"ogimet","USAF":36096,"rp5":"Kyzyl","timezone":12},{"source":"ogimet","USAF":36307,"rp5":"Erzin","timezone":12},{"source":"ogimet","USAF":36259,"rp5":"Kosh-Agach","timezone":12},{"source":"ogimet","USAF":30781,"rp5":"Uryupino","timezone":12},{"source":"ogimet","USAF":36535,"rp5":"Kokpekty","timezone":12},{"source":"ogimet","USAF":36566,"rp5":"Markakol_Lake","timezone":12},{"source":"ogimet","USAF":47005,"rp5":"Samjiyon","timezone":12},{"source":"ogimet","USAF":54342,"rp5":"Shenyang","timezone":12},{"source":"","USAF":54252,"rp5":"","timezone":12},{"source":"ogimet","USAF":54161,"rp5":"Changchun_(airport)","timezone":12},{"source":"ogimet","USAF":54273,"rp5":"Huadian","timezone":12},{"source":"ogimet","USAF":50953,"rp5":"Harbin_(airport)","timezone":12},{"source":"","USAF":50673,"rp5":"","timezone":12},{"source":"ogimet","USAF":50353,"rp5":"Huma","timezone":12},{"source":"","USAF":50246,"rp5":"","timezone":12},{"source":"","USAF":50247,"rp5":"","timezone":12},{"source":"ogimet","USAF":50136,"rp5":"Xilinji","timezone":12},{"source":"","USAF":50137,"rp5":"","timezone":12},{"source":"","USAF":50431,"rp5":"","timezone":12},{"source":"ogimet","USAF":50434,"rp5":"Tulihe","timezone":12},{"source":"","USAF":50425,"rp5":"","timezone":12},{"source":"","USAF":50524,"rp5":"","timezone":12},{"source":"ogimet","USAF":50527,"rp5":"Zhengyang","timezone":12},{"source":"","USAF":50525,"rp5":"","timezone":12},{"source":"","USAF":50526,"rp5":"","timezone":12},{"source":"ogimet","USAF":50727,"rp5":"Arxan","timezone":12},{"source":"","USAF":53392,"rp5":"","timezone":12},{"source":"","USAF":55294,"rp5":"","timezone":12},{"source":"","USAF":56034,"rp5":"","timezone":12},{"source":"ogimet","USAF":52908,"rp5":"Udaolyan","timezone":12},{"source":"ogimet","USAF":52323,"rp5":"Mazong_Shan","timezone":12},{"source":"","USAF":52101,"rp5":"","timezone":12},{"source":"","USAF":51186,"rp5":"","timezone":12},{"source":"ogimet","USAF":51076,"rp5":"Aletai","timezone":12},{"source":"ogimet","USAF":51573,"rp5":"Turfan","timezone":12},{"source":"ogimet","USAF":51463,"rp5":"Urumqi","timezone":12},{"source":"ogimet","USAF":51542,"rp5":"Baianbulak","timezone":12},{"source":"","USAF":51437,"rp5":"","timezone":12},{"source":"ogimet","USAF":53463,"rp5":"Hohhot","timezone":12},{"source":"ogimet","USAF":54511,"rp5":"Beijing,_Peking","timezone":12},{"source":"","USAF":54517,"rp5":"","timezone":12},{"source":"ogimet","USAF":53614,"rp5":"Yinchuan","timezone":12},{"source":"ogimet","USAF":53698,"rp5":"Shijiazhuang","timezone":12},{"source":"ogimet","USAF":53772,"rp5":"Taiyuan_(airport)","timezone":12},{"source":"ogimet","USAF":52866,"rp5":"Xining","timezone":12},{"source":"ogimet","USAF":54823,"rp5":"Jinan","timezone":12},{"source":"ogimet","USAF":57083,"rp5":"Zhengzhou","timezone":12},{"source":"ogimet","USAF":57131,"rp5":"Xi'an","timezone":12},{"source":"ogimet","USAF":57245,"rp5":"Ankang","timezone":12},{"source":"ogimet","USAF":57687,"rp5":"Xingsha","timezone":12},{"source":"ogimet","USAF":58606,"rp5":"Liantang","timezone":12},{"source":"ogimet","USAF":57494,"rp5":"Wuhan_(airport)","timezone":12},{"source":"ogimet","USAF":58321,"rp5":"Hefei,_Liugang_(airport)","timezone":12},{"source":"ogimet","USAF":58238,"rp5":"Nanjing_(airport)","timezone":12},{"source":"ogimet","USAF":58457,"rp5":"Hangzhou_(airport)","timezone":12},{"source":"ogimet","USAF":58646,"rp5":"Lishui","timezone":12},{"source":"ogimet","USAF":58847,"rp5":"Fuzhou","timezone":12},{"source":"ogimet","USAF":59287,"rp5":"Guangzhou_(airport)","timezone":12},{"source":"ogimet","USAF":59758,"rp5":"Haikou","timezone":12},{"source":"ogimet","USAF":59948,"rp5":"Sanya_(weather_station)","timezone":12},{"source":"ogimet","USAF":59838,"rp5":"Dongfang","timezone":12},{"source":"ogimet","USAF":59431,"rp5":"Nanning_(airport)","timezone":12},{"source":"ogimet","USAF":56966,"rp5":"Lijiang","timezone":12},{"source":"ogimet","USAF":56778,"rp5":"Kunming","timezone":12},{"source":"ogimet","USAF":57816,"rp5":"Guiyang","timezone":12},{"source":"ogimet","USAF":57516,"rp5":"Chongqing,_Jiulongpo_(airport)","timezone":12},{"source":"","USAF":57413,"rp5":"","timezone":12},{"source":"ogimet","USAF":56187,"rp5":"Chengdu_(AWS)","timezone":12},{"source":"ogimet","USAF":55591,"rp5":"Lhasa","timezone":12},{"source":"","USAF":52267,"rp5":"","timezone":12},{"source":"","USAF":53478,"rp5":"","timezone":12},{"source":"","USAF":58367,"rp5":"","timezone":12},{"source":"","USAF":58826,"rp5":"","timezone":12},{"source":"","USAF":58623,"rp5":"","timezone":12},{"source":"","USAF":57778,"rp5":"","timezone":12},{"source":"","USAF":52889,"rp5":"","timezone":12},{"source":"","USAF":50341,"rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"ogimet","USAF":58437,"rp5":"Kuan_Shan","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":"","rp5":"","timezone":12},{"source":"","USAF":58968,"rp5":"Taipei","timezone":12},{"source":"","USAF":45007,"rp5":"Hong_Kong_(airport)","timezone":12},{"source":"","USAF":45011,"rp5":"Taipa_(airport)","timezone":12},{"source":"ogimet","USAF":31137,"rp5":"Toko","timezone":12},{"source":"ogimet","USAF":24688,"rp5":"Oymyakon","timezone":15},{"source":"ogimet","USAF":24585,"rp5":"Ust-Nera","timezone":15},{"source":"ogimet","USAF":24588,"rp5":"Yurty","timezone":15},{"source":"ogimet","USAF":24691,"rp5":"Delyankir","timezone":15},{"source":"ogimet","USAF":24266,"rp5":"Verkhoyansk","timezone":15},{"source":"ogimet","USAF":24684,"rp5":"Agayakan","timezone":15},{"source":"ogimet","USAF":24382,"rp5":"Ust-Moma","timezone":15},{"source":"ogimet","USAF":24959,"rp5":"Yakutsk","timezone":12},{"source":"ogimet","USAF":24477,"rp5":"Iema","timezone":15},{"source":"ogimet","USAF":25428,"rp5":"Omolon","timezone":15},{"source":"ogimet","USAF":25700,"rp5":"Taskan","timezone":15},{"source":"ogimet","USAF":24507,"rp5":"Tura","timezone":12}]

# ******** ******** ******** ******** 自定义函数 ******** ******** ******** ********
def is_ogimet_date_format(date_str):
    
    try:
        datetime.strptime(date_str, "%d/%m/%Y")
        return True
    except ValueError:
        return False

def is_valid_time(time_str):
    try:
        datetime.strptime(time_str, "%H:%M")
        return True
    except ValueError:
        return False

def check_datetime(utc_date_str, utc_time_str, target_date_str, timezone_offset=12):
    if not (is_ogimet_date_format(utc_date_str) and is_valid_time(utc_time_str)):
        return {
        'in24': False,
        'in_half_2': False,
        'start': False,
        '03': False,
        '06': False,
        '09': False,
        'mid': False,
        '15': False,
        '18': False,
        '21': False,
        'end': False
    }

    utc_datetime_str = f"{utc_date_str} {utc_time_str}"
    utc_dt_naive = datetime.strptime(utc_datetime_str, "%d/%m/%Y %H:%M")
    utc_dt_aware = utc_dt_naive.replace(tzinfo=timezone.utc)
    datetimeOfA_timestamp = utc_dt_aware.timestamp()

    target_date_local = datetime.strptime(target_date_str, "%Y-%m-%d")
    local_start_dt = target_date_local
    local_03_dt = target_date_local + timedelta(hours=3)
    local_06_dt = target_date_local + timedelta(hours=6)
    local_09_dt = target_date_local + timedelta(hours=9)
    local_mid_dt = target_date_local + timedelta(hours=12)
    local_15_dt = target_date_local + timedelta(hours=15)
    local_18_dt = target_date_local + timedelta(hours=18)
    local_21_dt = target_date_local + timedelta(hours=21)
    local_end_dt = target_date_local + timedelta(days=1)

    offset_delta = timedelta(hours=timezone_offset)
    utc_start_boundary = local_start_dt - offset_delta
    utc_03_boundary = local_03_dt - offset_delta
    utc_06_boundary = local_06_dt - offset_delta
    utc_09_boundary = local_09_dt - offset_delta
    utc_mid_boundary = local_mid_dt - offset_delta
    utc_15_boundary = local_15_dt - offset_delta
    utc_18_boundary = local_18_dt - offset_delta
    utc_21_boundary = local_21_dt - offset_delta
    utc_end_boundary = local_end_dt - offset_delta

    utc_start_boundary = utc_start_boundary.replace(tzinfo=timezone.utc)
    utc_03_boundary = utc_03_boundary.replace(tzinfo=timezone.utc)
    utc_06_boundary = utc_06_boundary.replace(tzinfo=timezone.utc)
    utc_09_boundary = utc_09_boundary.replace(tzinfo=timezone.utc)
    utc_mid_boundary = utc_mid_boundary.replace(tzinfo=timezone.utc)
    utc_15_boundary = utc_15_boundary.replace(tzinfo=timezone.utc)
    utc_18_boundary = utc_18_boundary.replace(tzinfo=timezone.utc)
    utc_21_boundary = utc_21_boundary.replace(tzinfo=timezone.utc)
    utc_end_boundary = utc_end_boundary.replace(tzinfo=timezone.utc)
    
    startTimeStamp = utc_start_boundary.timestamp()
    timeStamp03 = utc_03_boundary.timestamp()
    timeStamp06 = utc_06_boundary.timestamp()
    timeStamp09 = utc_09_boundary.timestamp()
    midPointTimeStamp = utc_mid_boundary.timestamp()
    timeStamp15 = utc_15_boundary.timestamp()
    timeStamp18 = utc_18_boundary.timestamp()
    timeStamp21 = utc_21_boundary.timestamp()
    endTimeStamp = utc_end_boundary.timestamp()
    
    ckIn24 = (datetimeOfA_timestamp >= startTimeStamp) and (datetimeOfA_timestamp <= endTimeStamp)
    ckInHalf2 = (datetimeOfA_timestamp >= midPointTimeStamp) and (datetimeOfA_timestamp <= endTimeStamp)
    #整点情况
    ckStart = (datetimeOfA_timestamp == startTimeStamp) #计算均温应该排除的整点行(要排除的是晚8点对应的行)
    ck03 = (datetimeOfA_timestamp == timeStamp03)
    ck06 = (datetimeOfA_timestamp == timeStamp06)
    ck09 = (datetimeOfA_timestamp == timeStamp09)
    ckMidPoint = (datetimeOfA_timestamp == midPointTimeStamp)
    ck15 = (datetimeOfA_timestamp == timeStamp15)
    ck18 = (datetimeOfA_timestamp == timeStamp18)
    ck21 = (datetimeOfA_timestamp == timeStamp21)
    ckEnd = (datetimeOfA_timestamp == endTimeStamp) #国内站点日高低温所在的行

    return {
        'in24': ckIn24,
        'in_half_2': ckInHalf2,
        'start': ckStart,
        '03': ck03,
        '06': ck06,
        '09': ck09,
        'mid': ckMidPoint,
        '15': ck15,
        '18': ck18,
        '21': ck21,
        'end': ckEnd
    }

def transfer_date_format(alias, date_string, year_string = current_year_str):
    temp_year = current_year_str if year_string == current_year_str else year_string
    if alias not in source_alias_map:
        return f"Error: Alias '{alias}' not recognized."
    
    temp_source = source_alias_map[alias]
    string_to_parse = date_string
    if temp_source["needs_year_prefix"]:
        string_to_parse = f"{temp_year}/{date_string}"
        
    elif temp_source["needs_year_suffix"]:
        string_to_parse = f"{date_string}.{temp_year}"
    try:
        dt_object = datetime.strptime(string_to_parse, temp_source["parse_format"])
        return dt_object.strftime("%d/%m/%Y")
    except ValueError as e:
        return f"Error parsing date '{date_string}': {e}"

# 需要根据经纬度确定所处时区。时区可能涉及拐弯的线，必须借助相关package来判断)
def transfer_datetime_to_utc_date(date_str, time_str, utc_offset): #目前只有rp5.ru需要用到这个函数
    try:
        full_str = f"{date_str} {time_str}"
        dt_local = datetime.strptime(full_str, "%d/%m/%Y %H:%M")
        tz_local = timezone(timedelta(hours=utc_offset))
        dt_local = dt_local.replace(tzinfo=tz_local)
        dt_utc = dt_local.astimezone(timezone.utc)
        return {
            'date': dt_utc.strftime("%d/%m/%Y"),
            'time': dt_utc.strftime("%H:%M")
        }
        # return dt_utc.strftime("%d/%m/%Y")
    except ValueError:
        return "Error: Invalid format. Expected 'DD/MM/YYYY' and 'HH:MM'."

def is_valid_simple_number(s):
    pattern = r'^[+-]?(\d+(\.\d*)?|\.\d+)$'
    return bool(re.match(pattern, s))

def safe_convert_to_float(text_num):
    try:
        return round(float(text_num), 1)
    except ValueError:
        print(f"Error: '{text_num}' is not a valid number.")
        return None

def get_min_max(arr):
    if not arr:  # Handle empty list
        return {"min": -999, "max": -999}
    return {
        "min": min(arr),
        "max": max(arr)
    }
def calculate_average(values):
    if not isinstance(values, list) or len(values) == 0:
        return 'error'
    total = 0
    for v in values:
        total += float(v)
    return round(total/len(values), 2)

def get_ogimet_hourly_url(str_of_USAF):
    return 'https://ogimet.com/cgi-bin/gsynres?ind=' + str_of_USAF + '&decoded=yes&ndays=7&ano=' + dt['YYYY'] + '&mes=' +dt['MM'] + '&day=' + dt['DD'] + '&hora=' + dt['hh']
def get_rp5_hourly_url(str_of_USAF):
    for o in station_list:
        temp_rp5 = ''
        has_the_station = False
        if str(o['USAF']) == str(str_of_USAF):
            temp_rp5 = o['rp5']
            has_the_station = True
            break
    if has_the_station:
        return 'https://rp5.ru/Weather_archive_in_' + temp_rp5
    else:
        print(f'{str_of_USAF}: Station not found')

# ******** ******** ******** ******** 爬取网页数据 ******** ******** ******** ********
page = ChromiumPage()
#从ogimet最新逐时页面为【一个】交换站获取数据
def get_daily_temperature_ogimet(wmo, tz): #中国和蒙古20-20时区是12，不是8！，东西伯利亚很多站是15，哈萨克斯坦统一为12
    min = -999
    max = -999
    avg = -999

    temperature_dict = {
        'temperature_of_HHmm_arr': [],
        'temperature_of_HHmm_3h_arr': [],
        'temperature_of_max_arr': [],
        'temperature_of_min_arr': []
    }

    try:
        url = get_ogimet_hourly_url(wmo)
        page.get(url)
        rows = page.eles('tag:thead')[0].eles('tag:tr')

        is_perfect_data_like_china_station = False
        count_3h_valid_value_for_avg = 0
        for row in rows:
            cols = row.eles('tag:td')
            if len(cols) >= 7:
                c1 = cols[0].text.strip()
                c2 = cols[1].text.strip()
                c3 = cols[2].text.strip()
                c6 = cols[5].text.strip()
                c7 = cols[6].text.strip()
                
                if check_datetime(c1, c2, target_date, tz)['in24']:
                    if is_valid_simple_number(c3) and float(c3) > -100 and float(c3) < 60:
                        temperature_dict['temperature_of_HHmm_arr'].append(safe_convert_to_float(c3))
                        if check_datetime(c1, c2, target_date, tz)['03']: #均温从23:00开始考虑
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['06']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['09']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['mid']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['15']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['18']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['21']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['end']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                    if check_datetime(c1, c2, target_date, tz)['in_half_2']:
                        if not is_perfect_data_like_china_station:
                            if check_datetime(c1, c2, target_date, tz)['end'] and is_valid_simple_number(c6) and is_valid_simple_number(c7):
                                is_perfect_data_like_china_station = True
                                max = round(float(c6), 1)
                                min = round(float(c7), 1)
                            if is_valid_simple_number(c6):
                                temperature_dict['temperature_of_max_arr'].append(safe_convert_to_float(c6))
                            if is_valid_simple_number(c7):
                                temperature_dict['temperature_of_min_arr'].append(safe_convert_to_float(c7))
        
        # print(type(temperature_dict['temperature_of_HHmm_arr'][0]), len(temperature_dict['temperature_of_HHmm_arr']), temperature_dict['temperature_of_HHmm_arr'])
        if not is_perfect_data_like_china_station:
            temp_combined_arr = temperature_dict['temperature_of_max_arr'] + temperature_dict['temperature_of_min_arr'] + temperature_dict['temperature_of_HHmm_arr']
            if not temperature_dict['temperature_of_min_arr']:
                min = get_min_max(temp_combined_arr)['min']
            else:
                if abs(get_min_max(temperature_dict['temperature_of_min_arr'])['min'] - get_min_max(temperature_dict['temperature_of_HHmm_arr'])['min']) >= max_for_compare:
                    min = -999
                else:
                    min = get_min_max(temp_combined_arr)['min']
            
            if not temperature_dict['temperature_of_max_arr']:
                max = get_min_max(temp_combined_arr)['max']
            else:
                if abs(get_min_max(temperature_dict['temperature_of_max_arr'])['max'] - get_min_max(temperature_dict['temperature_of_HHmm_arr'])['max']) >= max_for_compare:
                    max = -999
                else:
                    max = get_min_max(temp_combined_arr)['max']

        #这一步一定要在已经得到min和max之后执行，因为有一个pop()改变了原数组
        #print(temperature_dict['temperature_of_HHmm_arr'])
        if count_3h_valid_value_for_avg == 8: #有8个严格datetime的整点气温(对应23,2,5,8,11,14,17,20整点都有正常气温值)
            # temperature_dict['temperature_of_HHmm_arr'].pop() #去掉那日开始datetime对应的3h整点气温，因为计算均温从23:00开始(20-20)
            #print(temperature_dict['temperature_of_HHmm_arr'])
            avg = calculate_average(temperature_dict['temperature_of_HHmm_3h_arr'])
        # print(f'{wmo}\t{min}\t{max}\t{avg}')
        return {'wmo': wmo, 'min': min, 'max': max, 'avg': avg}

    except Exception as e:
        print(f'{wmo}\tPage No Data')
        return {'wmo': '', 'min': '', 'max': '', 'avg': ''}
    #finally:
        # Close the browser
        #driver.quit()

#从rp5最新逐时页面为【一个】交换站获取数据
def get_daily_temperature_rp5(wmo, tz):
    min = -999
    max = -999
    avg = -999

    # 这个可能是没用的，但是先留着
    current_local_dt = None
    
    #这些是有用的
    rp5_local_date_str = ''
    start = 0
    is_first_date = True
    future_year = ''
    future_month_en = ''
    rp5_lat = 91.0
    rp5_lng = 361.0
    for o in station_list:
        if str(o['USAF']) == wmo:
            rp5_lat = o['latitude']
            rp5_lng = o['longitude']
            break  # Stop looping once found lat and lng
    rp5_offset = get_timezone_offset(rp5_lat, rp5_lng)

    temperature_dict = {
        'temperature_of_HHmm_arr': [],
        'temperature_of_HHmm_3h_arr': [],
        'temperature_of_max_arr': [],
        'temperature_of_min_arr': []
    }

    try:
        url = get_rp5_hourly_url(wmo)
        page.get(url)
        rows = page.ele('#archiveTable').eles('tag:tr')[1:]

        is_perfect_data_like_china_station = False
        count_3h_valid_value_for_avg = 0
        for row in rows:
            cols = row.eles('tag:td')
            
            #如果td[1]包含字母,则td[0]是一个日期
            if re.match(r'\w+', cols[0].text.strip()):
                if is_first_date:
                    start = 1
                    dt_str0 = cols[0].text.strip().split(',')[0].strip()
                    dt_str1 = re.split(r'[\n\s,]', dt_str0)
                    dt_str = f'{dt_str1[0]}-{dt_str1[1]}-{dt_str1[2]}'
                    # 为后续跨年判断做准备
                    future_year = dt_str1[0]
                    future_month_en = dt_str1[1]

                    rp5_local_date_str = transfer_date_format('rp5', dt_str)
                    rp5_local_time_str = cols[1].text.strip() + ':00'
                    local_combined = f'{rp5_local_date_str} {rp5_local_time_str}'
                    current_local_dt = datetime.strptime(local_combined, '%d/%m/%Y %H:%M')

                    rp5_utc_date = transfer_datetime_to_utc_date(rp5_local_date_str, rp5_local_time_str, rp5_offset)['date']
                    rp5_utc_time = transfer_datetime_to_utc_date(rp5_local_date_str, rp5_local_time_str, rp5_offset)['time']
                    utc_combined = f'{rp5_utc_date} {rp5_utc_time}'
                    current_utc_dt = datetime.strptime(utc_combined, '%d/%m/%Y %H:%M')
                    is_first_date = False
                else:
                    start = 1
                    dt_str0 = cols[0].text.strip().split(',')[0].strip()
                    dt_str1 = re.split(r'[\n\s,]', dt_str0)
                    
                    # 如果上个日期的月份部分是一月，并且这个日期的月份和上个日期不同(这个日期的月份是十二月)，即跨年了
                    if dt_str1[0] is not future_month_en:
                        future_month_en = dt_str1[0]
                        if future_month_en == 'January':
                            future_year = str(int(future_year) - 1)
                    dt_str = f'{future_year}-{dt_str1[0]}-{dt_str1[1]}'
                    
                    rp5_local_date_str = transfer_date_format('rp5', dt_str)
                    rp5_local_time_str = cols[1].text.strip() + ':00'
                    local_combined = f'{rp5_local_date_str} {rp5_local_time_str}'
                    current_local_dt = datetime.strptime(local_combined, '%d/%m/%Y %H:%M')

                    rp5_utc_date = transfer_datetime_to_utc_date(rp5_local_date_str, rp5_local_time_str, rp5_offset)['date']
                    rp5_utc_time = transfer_datetime_to_utc_date(rp5_local_date_str, rp5_local_time_str, rp5_offset)['time']
                    utc_combined = f'{rp5_utc_date} {rp5_utc_time}'
                    current_utc_dt = datetime.strptime(utc_combined, '%d/%m/%Y %H:%M')
            else:
                start = 0
                rp5_local_time_str = cols[0].text.strip() + ':00'
                local_combined = f'{rp5_local_date_str} {rp5_local_time_str}'
                current_local_dt = datetime.strptime(local_combined, '%d/%m/%Y %H:%M')

                rp5_utc_date = transfer_datetime_to_utc_date(rp5_local_date_str, rp5_local_time_str, rp5_offset)['date']
                rp5_utc_time = transfer_datetime_to_utc_date(rp5_local_date_str, rp5_local_time_str, rp5_offset)['time']
                utc_combined = f'{rp5_utc_date} {rp5_utc_time}'
                current_utc_dt = datetime.strptime(utc_combined, '%d/%m/%Y %H:%M')

            if len(cols) >= 15:
                c1 = rp5_utc_date # date str
                c2 = rp5_utc_time # time str
                temp_c3 = re.split(r'[\n\s]', cols[1 + start].text.strip())
                c3 = temp_c3[0].strip()# hm value
                temp_c6 = re.split(r'[\n\s]', cols[start + 15].text.strip())
                c6 = temp_c6[0].strip() # max
                temp_c7 = re.split(r'[\n\s]', cols[start + 14].text.strip())
                c7 = temp_c7[0].strip() # min
                # print(c3, c6, c7)

                if check_datetime(c1, c2, target_date, tz)['in24']:
                    if is_valid_simple_number(c3) and float(c3) > -100 and float(c3) < 60:
                        temperature_dict['temperature_of_HHmm_arr'].append(safe_convert_to_float(c3))
                        if check_datetime(c1, c2, target_date, tz)['03']: #均温从23:00开始考虑
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['06']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['09']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['mid']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['15']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['18']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['21']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['end']:
                            temperature_dict['temperature_of_HHmm_3h_arr'].append(safe_convert_to_float(c3))
                            count_3h_valid_value_for_avg += 1
                    if check_datetime(c1, c2, target_date, tz)['in_half_2']:
                        if not is_perfect_data_like_china_station:
                            if check_datetime(c1, c2, target_date, tz)['end'] and is_valid_simple_number(c6) and is_valid_simple_number(c7):
                                is_perfect_data_like_china_station = True
                                max = round(float(c6), 1)
                                min = round(float(c7), 1)
                            if is_valid_simple_number(c6):
                                temperature_dict['temperature_of_max_arr'].append(safe_convert_to_float(c6))
                            if is_valid_simple_number(c7):
                                temperature_dict['temperature_of_min_arr'].append(safe_convert_to_float(c7))
            
        if not is_perfect_data_like_china_station:
            temp_combined_arr = temperature_dict['temperature_of_max_arr'] + temperature_dict['temperature_of_min_arr'] + temperature_dict['temperature_of_HHmm_arr']
            if not temperature_dict['temperature_of_min_arr']:
                min = get_min_max(temp_combined_arr)['min']
            else:
                if abs(get_min_max(temperature_dict['temperature_of_min_arr'])['min'] - get_min_max(temperature_dict['temperature_of_HHmm_arr'])['min']) >= max_for_compare:
                    min = -999
                else:
                    min = get_min_max(temp_combined_arr)['min']
            
            if not temperature_dict['temperature_of_max_arr']:
                max = get_min_max(temp_combined_arr)['max']
            else:
                if abs(get_min_max(temperature_dict['temperature_of_max_arr'])['max'] - get_min_max(temperature_dict['temperature_of_HHmm_arr'])['max']) >= max_for_compare:
                    max = -999
                else:
                    max = get_min_max(temp_combined_arr)['max']

        #这一步一定要在已经得到min和max之后执行，因为有一个pop()改变了原数组
        #print(temperature_dict['temperature_of_HHmm_arr'])
        if count_3h_valid_value_for_avg == 8: #有8个严格datetime的整点气温(对应23,2,5,8,11,14,17,20整点都有正常气温值)
            # temperature_dict['temperature_of_HHmm_arr'].pop() #去掉那日开始datetime对应的3h整点气温，因为计算均温从23:00开始(20-20)
            #print(temperature_dict['temperature_of_HHmm_arr'])
            avg = calculate_average(temperature_dict['temperature_of_HHmm_3h_arr'])
        print(f'{wmo}\t{min}\t{max}\t{avg}')
        return {'wmo': wmo, 'min': min, 'max': max, 'avg': avg}

    except Exception as e:
        print(f'{wmo}\tPage No Data')
        return {'wmo': '', 'min': '', 'max': '', 'avg': ''}
    #finally:
        # Close the browser
        #driver.quit()

#循环爬取，爬取多个ogimet站点数据
def scrape_ogimet_by_usaf(usaf_list):
    results = []
    bad_list = []
    print(f"Starting scrape maximum reach {len(usaf_list)} URLs...")

    for ele in station_list:
        if not isinstance(ele['USAF'], int):
            results.append({'wmo': '', 'min': '', 'max': '', 'avg': ''})
            print(f'{ele['cn_name']}\t不是WMO交换站')
            continue
        elif ele['source'] != 'ogimet': # 有站号但是 ogimet 不提供数据(页面无数据)
            results.append({'wmo': '', 'min': '', 'max': '', 'avg': ''})
            print(f'{ele['USAF']}\t{ele['cn_name']}\togimet无数据')
            continue
        elif ele['use'] is None:
            results.append({'wmo': '', 'min': '', 'max': '', 'avg': ''})
            print(f'{ele['USAF']}\t{ele['cn_name']}\t被主动排除')
            continue
        try:
            # Call your existing function
            data = get_daily_temperature_ogimet(str(ele['USAF']), ele['timezone'])
            
            # Save the result
            results.append(data)

            # 单独拎出 -999站点
            if (data['min'] == -999) or (data['max'] == -999) or (data['avg'] == -999):
                bad_list.append(data['wmo'])
            
            # IMPORTANT: Wait a bit between requests to be polite to the server
            # Random sleep between 1 and 3 seconds is usually safe
            sleep_time = random.uniform(1, 3)
            time.sleep(sleep_time)

        except Exception as e:
            # If an error occurs, print it but keep going to the next URL
            print(f"XX Error scraping {ele['USAF']}: {e}")
            results.append({'wmo': '', 'min': '', 'max': '', 'avg': ''}) # Or keep track of failed URLs

    for e in results:
        print(f'{e['wmo']}\t{e['min']}\t{e['max']}\t{e['avg']}')
    return {'scrapedArr': results, 'bad_list': bad_list} #返回对象数组，后面写入文件要用到

# ******** ******** ******** ******** 结果导出 ******** ******** ******** ********
def exportJSON(resultArr, bad_list): # 导出为JSON
    result_json = json.dumps(resultArr, indent=4)
    bad_json = json.dumps(bad_list, indent=4)
    json_out = f'{{"scraped_data": {result_json}, "bad_list": {bad_json}}}'
    # js_all_stations = f'export const array_of_stations_by_different_filters = {{\n"汇总": {json_all_stations}, \n"东亚": {json_ea_stations}}};'
    with open(scraped_path, "w", encoding="utf-8") as f:
        f.write(json_out)
    print(f"Successfully export scraped data to .json")

# ******** ******** ******** ******** 执行 ******** ******** ******** ********
if __name__ == "__main__":
    # print(len(station_list))
    # get_daily_temperature_ogimet('44224', 12) #爬取单站 ********************************
    # scrape_ogimet_by_usaf(accessible_list) #循环爬取
    
    resultObj = scrape_ogimet_by_usaf(accessible_list)
    exportJSON( resultObj['scrapedArr'], resultObj['bad_list'] )