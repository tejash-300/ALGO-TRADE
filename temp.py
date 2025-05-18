import pandas as pd
import requests

url = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"

response = requests.get(url)
for i in response.json():
    with open("instruments.csv", "a") as file:
        file.write(f"{i['symbol']},{i['token']}\n")
print("Instrument list downloaded successfully.")

