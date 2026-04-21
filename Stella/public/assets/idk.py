import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

base_url = "https://in-the-sky.org/data/catalogue.php?cat=HD&page="
all_data = []

# Calculate total pages (9,213 objects / 100 per page = ~93 pages)
total_pages = 93

for page in range(1, total_pages + 1):
    print(f"Scraping page {page}/{total_pages}")
    
    url = base_url + str(page)
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find the data table
    table = soup.find('table')
    rows = table.find_all('tr')[1:]  # Skip header row
    
    for row in rows:
        cols = row.find_all('td')
        if len(cols) >= 7:
            data = {
                'Name': cols.text.strip(),
                'Type': cols.text.strip(),
                'Magnitude': cols.text.strip(),
                'Distance_kpc': cols.text.strip(),
                'Constellation': cols.text.strip(),
                'RA': cols.text.strip(),
                'Decl': cols.text.strip(),
                'Other_names': cols.text.strip() if len(cols) > 7 else ''
            }
            all_data.append(data)
    
    # Be respectful - add delay between requests
    time.sleep(1)

# Save to CSV
df = pd.DataFrame(all_data)
df.to_csv('henry_draper_catalogue.csv', index=False)
print(f"Downloaded {len(all_data)} objects")