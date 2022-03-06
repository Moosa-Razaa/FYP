from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import sys

def Function():
    def Dow():
        def directory(name):
            _dir = "F:\\Projects\\FYP\\Download"       
            _dir = os.path.join(_dir, 'User-%s' % name)
            if not os.path.exists(_dir):
                os.makedirs(_dir)
                _dir = os.path.join(_dir, 'DowLab-%s' % name)
                if not os.path.exists(_dir):
                    os.makedirs(_dir)
            elif os.path.exists(_dir):
                _dir = os.path.join(_dir, 'DowLab-%s' % name)
                if not os.path.exists(_dir):
                    os.makedirs(_dir)
            return _dir

        User = str(sys.argv[2])
        Uname = str(sys.argv[3])
        Pswd = str(sys.argv[4])
        download_dir = directory(User)
        option = webdriver.ChromeOptions()
        option.add_argument("--start-maximized")
        profile = {"profile.default_content_settings.popups": 0, "download.default_directory": download_dir, "directory_upgrade": True}
                
        option.add_experimental_option("prefs", profile)



        Path = "C:\Program Files (x86)\chromedriver.exe"
        driver = webdriver.Chrome(Path, chrome_options=option)
        driver.get("http://emr.duhs.edu.pk/")
        username = driver.find_element_by_id("MrNumber")
        username.send_keys(Uname)
        password = driver.find_element_by_id("Password")
        password.send_keys(Pswd)
        password.send_keys(Keys.RETURN)

        try:
            element = WebDriverWait(driver,30).until(
                EC.presence_of_element_located((By.ID, "reportList"))
            )
            Status = "True"
            element = driver.find_elements(By.XPATH, "//a[contains(@href, '.pdf')]")
            link = [elem.get_attribute('href') for elem in element]
            name = []
            for i in link:
                name.append(i[42:])
            f = -1
            for j in range(len(name)):
                path = download_dir + "\\" + name[j]
                f = f + 1
                if not os.path.isfile(path):
                    element[f].click()
            time.sleep(10)
            driver.quit()
        except:
            Status = "False"
            driver.quit()
        print(Status)
    def Sindlab():
        def directory(name):
            _dir = "F:\\Projects\\FYP\\Download"       
            _dir = os.path.join(_dir, 'User-%s' % name)
            if not os.path.exists(_dir):
                os.makedirs(_dir)
                _dir = os.path.join(_dir, 'SindLab-%s' % name)
                if not os.path.exists(_dir):
                    os.makedirs(_dir)
            elif os.path.exists(_dir):
                _dir = os.path.join(_dir, 'SindLab-%s' % name)
                if not os.path.exists(_dir):
                    os.makedirs(_dir)
            return _dir
        User = str(sys.argv[2])
        Uname = str(sys.argv[3])
        Pswd = str(sys.argv[4])
        download_dir = directory(User)
        option = webdriver.ChromeOptions()
        option.add_argument("--start-maximized")
        profile = {"plugins.always_open_pdf_externally": True, "download.default_directory": download_dir , "download.extensions_to_open": "applications/pdf"}    
        option.add_experimental_option("prefs", profile)



        Path = "C:\Program Files (x86)\chromedriver.exe"
        driver = webdriver.Chrome(Path, chrome_options=option)
        driver.get("https://gh.olivecliq.com/index.php/site/login?id=Q5LDmYBZE1nQxH5uehLMuRbx6xwTEKlWDJEaZkydM4w")
        username = driver.find_element_by_id("LoginForm_username")
        username.send_keys(Uname)
        password = driver.find_element_by_id("LoginForm_password")
        password.send_keys(Pswd)
        password.send_keys(Keys.RETURN)

        try:
            element = WebDriverWait(driver,30).until(
                EC.presence_of_element_located((By.ID, "patient_reports"))
            )
            Status = "True"
            element = driver.find_elements(By.XPATH, "//a[contains(@href, '.pdf')]")
            link = [elem.get_attribute('href') for elem in element]
            name = []
            for i in link:
                name.append(i[97:])
            f = -1
            for j in range(len(name)):
                path = download_dir + "\\" + name[j]
                f = f + 1
                if not os.path.isfile(path):
                    element[f].click()
            time.sleep(100)
            driver.quit()
        except:
            Status = "False"
            print(Status)
            driver.quit()
        print(Status)
    def Agakhan():
        Uname = str(sys.argv[3])
        Pswd = str(sys.argv[4])
        Email = "pw3nh8+eug7eh3dzda1c@sharklasers.com"

        Path = "C:\Program Files (x86)\chromedriver.exe"
        driver = webdriver.Chrome(Path)
        driver.get("https://hospitals.aku.edu/pakistan/patients-families/Pages/reportlogin.aspx")
        username = driver.find_element_by_id("ctl00_ctl57_g_54dd8f31_4553_4814_88d2_b512421bc905_ctl00_txtUserID")
        username.send_keys(Uname)
        password = driver.find_element_by_id("ctl00_ctl57_g_54dd8f31_4553_4814_88d2_b512421bc905_ctl00_txtPassword")
        password.send_keys(Pswd)
        submit = driver.find_element_by_id("ctl00_ctl57_g_54dd8f31_4553_4814_88d2_b512421bc905_ctl00_btnLogin")
        submit.send_keys(Keys.RETURN)
        try:
            element = WebDriverWait(driver,30).until(
                EC.presence_of_element_located((By.ID, "divReport"))
            )
            Status = "True"
            elements = driver.find_elements(By.XPATH, "//input[@type='checkbox']")
            for e in elements:
                e.click()
            email1 = driver.find_element_by_id("ctl00_ctl57_g_d0413896_cc58_4276_8cd9_0454c5d920f0_ctl00_txtEmail")
            email1.send_keys(Email)
            email2 = driver.find_element_by_id("ctl00_ctl57_g_d0413896_cc58_4276_8cd9_0454c5d920f0_ctl00_txtEmailRetype")
            email2.send_keys(Email)
            submit = driver.find_element_by_id("ctl00_ctl57_g_d0413896_cc58_4276_8cd9_0454c5d920f0_ctl00_btnSubmit")
            submit.send_keys(Keys.RETURN)
            driver.quit()
        except:
            Status = "False"
            driver.quit()
        if(Status == "True"):
            time.sleep(150)
            def directory(name):
                _dir = "F:\\Projects\\FYP\\Download"       
                _dir = os.path.join(_dir, 'User-%s' % name)
                if not os.path.exists(_dir):
                    os.makedirs(_dir)
                    _dir = os.path.join(_dir, 'AgaKhanLab-%s' % name)
                    if not os.path.exists(_dir):
                        os.makedirs(_dir)
                elif os.path.exists(_dir):
                    _dir = os.path.join(_dir, 'AgaKhanLab-%s' % name)
                    if not os.path.exists(_dir):
                        os.makedirs(_dir)
                return _dir

            User = str(sys.argv[2])
            Uname = "fvufuvsv"
            download_dir = directory(User)
            option = webdriver.ChromeOptions()
            option.add_argument("--start-maximized")
            profile = {"profile.default_content_settings.popups": 0, "download.default_directory": download_dir, "directory_upgrade": True}
                    
            option.add_experimental_option("prefs", profile)
            Path = "C:\Program Files (x86)\chromedriver.exe"
            driver = webdriver.Chrome(Path, chrome_options=option)
            driver.get("https://www.guerrillamail.com/inbox")
            driver.find_element(By.XPATH, "//div[@class='col2']/span[@dir='ltr']/span[@title='Click to Edit']").click()
            username = driver.find_element(By.XPATH, "//div[@class='col2']/span[@dir='ltr']/span[@title='Click to Edit']/input[@type='text']")
            username.send_keys(Uname)
            driver.find_element(By.XPATH, "//div[@class='col2']/span[@dir='ltr']/span[@title='Click to Edit']/button[@class='save button small']").click()
            time.sleep(5)
            driver.find_element(By.XPATH, "//tr[starts-with(@id, 'mr_')]").click()
            time.sleep(5)
            links = []
            name = []
            element = driver.find_elements(By.XPATH, "//a[contains(@href, '?get_att&email')]")
            for i in element:
                links.append(i.get_attribute('href'))
                name.append(i.text)
            f = -1
            for j in range(len(name)):
                path = download_dir + "\\" + name[j]
                f = f + 1
                if not os.path.isfile(path):
                    driver.get(links[f])
            time.sleep(5)
            driver.quit()
            print(Status)
        else:
            print(Status)

    if str(sys.argv[1]) == "dow":
        Dow()
    elif str(sys.argv[1]) == "sindlab":
        Sindlab()
    elif str(sys.argv[1]) == "agakhan":
        Agakhan()
    else:
        return "invalid lab"

Function()