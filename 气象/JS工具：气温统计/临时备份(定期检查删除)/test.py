#非常重要，放最前面，保证解码西班牙语正常
import sys
sys.stdout.reconfigure(encoding='utf-8')

import time
from datetime import datetime, timedelta, timezone
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
target_date =dt['YYYY'] + '-' + dt['MM'] + '-' + dt['DD'] # '2025-11-25'

max_for_compare = 10

rp5_stations = {
    '44224': {
        'en_name': 'Tsetsen-Uul',
        'cn_name': '车臣乌拉',
        'regiion': '蒙古 扎布汗省',
        'rp5_url_str': 'Tsetsen-Uul'
    }
}
ogimet_1 = [{"Country":"俄罗斯","Region":"犹太自治州","USAF":31702,"Name":"奥布卢奇耶","Tool":"ogimet","Timezone":15},{"Country":"俄罗斯","Region":"哈巴罗夫斯克边疆区","USAF":31532,"Name":"切昆达","Tool":"ogimet","Timezone":15},{"Country":"俄罗斯","Region":"哈巴罗夫斯克边疆区","USAF":31478,"Name":"索菲斯克","Tool":"ogimet","Timezone":15},{"Country":"俄罗斯","Region":"阿穆尔州","USAF":31329,"Name":"埃基姆昌","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"哈巴罗夫斯克边疆区","USAF":31348,"Name":"布鲁坎","Tool":"ogimet","Timezone":15},{"Country":"俄罗斯","Region":"后贝加尔边疆区","USAF":30673,"Name":"莫戈恰","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"后贝加尔边疆区","USAF":30565,"Name":"乌斯季卡连加","Tool":"rp5","Timezone":12},{"Country":"俄罗斯","Region":"后贝加尔边疆区","USAF":30664,"Name":"通戈科琴","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"布里亚特共和国","USAF":30636,"Name":"巴尔古津","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"伊尔库茨克州","USAF":30622,"Name":"卡丘格","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"图瓦共和国","USAF":36104,"Name":"萨雷格谢普","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"图瓦共和国","USAF":36096,"Name":"克孜勒","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"图瓦共和国","USAF":36307,"Name":"埃尔津","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"阿尔泰共和国","USAF":36259,"Name":"科什阿加奇","Tool":"ogimet","Timezone":12},{"Country":"俄罗斯","Region":"后贝加尔边疆区","USAF":30781,"Name":"乌留皮诺","Tool":"ogimet","Timezone":12}]
ogimet_2 = [e['USAF'] for e in ogimet_1 if e['Tool'] == 'ogimet']
#temp_usaf = ['44225', '44224', '44221', '44203']
import random
import re
from DrissionPage import ChromiumPage

def is_valid_date(date_str):
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

def get_ogimet_hourly_url(str_of_USAF):
    return 'https://ogimet.com/cgi-bin/gsynres?ind=' + str_of_USAF + '&decoded=yes&ndays=7&ano=' + dt['YYYY'] + '&mes=' +dt['MM'] + '&day=' + dt['DD'] + '&hora=' + dt['hh']
def get_rp5_hourly_url(str_of_USAF):
    return 'https://rp5.ru/Weather_archive_in_' + rp5_stations[str_of_USAF]['rp5_url_str']

def check_datetime(utc_date_str, utc_time_str, target_date_str, timezone_offset=12):
    if not (is_valid_date(utc_date_str) and is_valid_time(utc_time_str)):
        return {
        'in24': False,
        'in_half_2': False,
        'end': False,
        'start': False
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

def transfer_date_format(alias, date_string):
    current_year = datetime.now().year
    alias_map = {
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
        }
    }
    if alias not in alias_map:
        return f"Error: Alias '{alias}' not recognized."
    config = alias_map[alias]
    string_to_parse = date_string
    if config["needs_year_prefix"]:
        string_to_parse = f"{current_year}/{date_string}"
        
    elif config["needs_year_suffix"]:
        string_to_parse = f"{date_string}.{current_year}"
    try:
        dt_object = datetime.strptime(string_to_parse, config["parse_format"])
        return dt_object.strftime("%d/%m/%Y")
    except ValueError as e:
        return f"Error parsing date '{date_string}': {e}"

def transfer_datetime_to_utc_date(date_str, time_str, utc_offset):
    try:
        full_str = f"{date_str} {time_str}"
        dt_local = datetime.strptime(full_str, "%d/%m/%Y %H:%M")
        tz_local = timezone(timedelta(hours=utc_offset))
        dt_local = dt_local.replace(tzinfo=tz_local)
        dt_utc = dt_local.astimezone(timezone.utc)
        return dt_utc.strftime("%d/%m/%Y")
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

#从ogimet最新逐时页面为【一个】交换站获取数据
def get_temperature_from_ogimet_latest_3h(wmo, tz): #中国和蒙古20-20时区是12，不是8！，东西伯利亚很多站是15，哈萨克斯坦统一为12
    page = ChromiumPage()
    
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
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['06']:
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['09']:
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['mid']:
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['15']:
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['18']:
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['21']:
                            count_3h_valid_value_for_avg += 1
                        if check_datetime(c1, c2, target_date, tz)['end']:
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
            temperature_dict['temperature_of_HHmm_arr'].pop() #去掉那日开始datetime对应的3h整点气温，因为计算均温从23:00开始(20-20)
            #print(temperature_dict['temperature_of_HHmm_arr'])
            avg = calculate_average(temperature_dict['temperature_of_HHmm_arr'])
        return {'wmo': wmo, 'min': min, 'max': max, 'avg': avg}
        #print(f'{wmo}\t{min}\t{max}\t{avg}')

    except Exception as e:
        print(f'{wmo}\tPage No Data')
        return {'wmo': '', 'min': '', 'max': '', 'avg': ''}
    #finally:
        # Close the browser
        #driver.quit()

def scrape_ogimet_by_usaf(usaf_list):
    results = []
    
    print(f"Starting scrape of {len(usaf_list)} URLs...")

    for ele in ogimet_1:
        if not isinstance(ele['USAF'], int):
            results.append({'wmo': '', 'min': '', 'max': '', 'avg': ''})
            continue
        try:
            # Call your existing function
            data = get_temperature_from_ogimet_latest_3h(str(ele['USAF']), ele['Timezone'])
            
            # Save the result
            results.append(data)
            
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
    #return results


#urls = [get_ogimet_hourly_url(usaf) for usaf in temp_usaf]

if __name__ == "__main__":
    scrape_ogimet_by_usaf(ogimet_2)
    #print(get_temperature_from_ogimet_latest_3h('30781', 12))