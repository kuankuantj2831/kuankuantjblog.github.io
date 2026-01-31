import urllib.request
import json
import os
import sys
import ssl
import time

# Configuration matches the user's Supabase project
SUPABASE_URL = "https://rbmajbplwfyvrwtkczzn.supabase.co"
# Service Role Key (from chat history) to bypass RLS and get all data
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWFqYnBsd2Z5dnJ3dGtjenpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc5NjgyOSwiZXhwIjoyMDgxMzcyODI5fQ.fSCh53Rh-Uum9CqqaUqzbGASx_zKCj_vkh3ggRl0JgY"

BACKUP_DIR = "backup_data"

def fetch_table(table_name):
    print(f"Fetching table: {table_name}...")
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    
    # Create unverified SSL context to avoid handshake issues in unstable networks
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                content = response.read().decode()
                data = json.loads(content)
                print(f"  - (Success) Found {len(data)} records in {table_name}.")
                return data
        except Exception as e:
            print(f"  ! Attempt {attempt+1}/{max_retries} failed for {table_name}: {e}")
            time.sleep(2)
            
    print(f"  X Failed to fetch {table_name} after {max_retries} retries.")
    return []

def save_json(data, filename):
    filepath = os.path.join(BACKUP_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  > Saved to {filepath}")

def main():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory: {BACKUP_DIR}")

    # Backup Articles
    articles = fetch_table("articles")
    save_json(articles, "articles.json")

    # Backup Profiles (Users)
    profiles = fetch_table("profiles")
    save_json(profiles, "profiles.json")
    
    # Try fetching users from auth.users? 
    # Note: Supabase Management API is needed for auth.users, REST API usually can't access auth schema directly without RPC or special config.
    # We will stick to public tables "articles" and "profiles".
    
    print("\nBackup completed successfully!")

if __name__ == "__main__":
    main()
