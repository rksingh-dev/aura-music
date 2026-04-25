# Scrape Billboard Hot 100 rankings
import json
import requests
from bs4 import BeautifulSoup


def parse_billboard_hot_100():
    url = "https://www.billboard.com/charts/hot-100/"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    
    # Target the charts section where song entries are listed
    charts = soup.find_all("div", class_="o-chart-listing-wrapper")[0].find_all("div", class_="o-chart-results-list-row")
    
    songs = []
    
    for entry in charts[:50]:
        rank_elem = entry.find("span", class_="c-label")
        rank = rank_elem.get_text(strip=True).split('\n')[0] if rank_elem else str(len(songs) + 1)

        # Extracting thumbnail (ensure full URL)
        thumb = entry.find("img", class_="o-chart-results-list__image")
        img_url = "https:" + thumb["src"] if thumb and "src" in thumb.attrs else ""
        
        # Extract title (in an h3 tag)
        title = entry.find("h3").get_text(strip=True) if entry.find("h3") else ""
        
        # Extract artist (ignore title, ensure artist name)
        artist = entry.find("span", class_="c-label-subtitle").get_text(strip=True)
        if not artist:
            artist_links = entry.find_all("a")
            artist = artist_links[1].get_text(strip=True) if len(artist_links) > 1 else ""
        
        # Ensure rank is not NaN and always string
        if not rank or rank == "--":
            rank = len(songs) + 1
        
        songs.append({
            "rank": rank,
            "thumbnail": img_url,
            "title": title,
            "artist": artist
        })
    
    return songs


if __name__ == "__main__":
    songs = parse_billboard_hot_100()
    
    # Save to JSON file
    with open("billboard_hot_100.json", "w") as f:
        json.dump(songs, f, indent=2)
    
    print(f"Successfully extracted {len(songs)} songs to billboard_hot_100.json")
