> Create a virtualenv, activate it.

pip install -r backend/requirements.txt (install pythonocc-core — platform packages may be needed)

cd backend && uvicorn main:app --reload --host 127.0.0.1 --port 8000

