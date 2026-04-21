import http.server
import socketserver
import threading
import time
import urllib.request
import sys

def run_server(port=8080):
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Serving on port {port}")
        httpd.timeout = 1
        while not stop_server:
            httpd.handle_request()

stop_server = False

def test_game():
    global stop_server
    port = 8080
    # Start server in thread
    server_thread = threading.Thread(target=run_server, args=(port,))
    server_thread.daemon = True
    server_thread.start()
    
    time.sleep(2)  # give server time to start
    
    try:
        # Try to fetch the index page
        response = urllib.request.urlopen(f"http://localhost:{port}/index.html")
        if response.status == 200:
            print("✓ index.html served successfully")
            html = response.read().decode('utf-8')
            if '<canvas id="gameCanvas"' in html:
                print("✓ Canvas element found")
            else:
                print("✗ Canvas element missing")
        else:
            print(f"✗ Failed to fetch index.html: {response.status}")
    except Exception as e:
        print(f"✗ Error accessing server: {e}")
        sys.exit(1)
    
    # Stop server
    stop_server = True
    # Make one more request to trigger handle_request and exit
    try:
        urllib.request.urlopen(f"http://localhost:{port}/", timeout=1)
    except:
        pass
    
    print("Test completed.")

if __name__ == "__main__":
    test_game()