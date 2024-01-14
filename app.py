from flask import Flask, request, Response, jsonify, make_response
from flask_cors import CORS, cross_origin
from config import config
from loopchat import run_conversation
from loopimg import gen_image
import os, openai

#Variable init
openai.api_key = os.getenv('OPENAI_API_KEY')
#Global variable to store messages
messages = []

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500"]}}, supports_credentials=True)

#sign up button
@app.route('/signup', methods=['POST'])
def signup():
    email = request.form.get('email')
    if email:
        with open('users.txt', 'a') as f:
            f.write(email + '\n')
        response = jsonify({"message":"Signup Successful!"})
        response.headers['Content-Type'] = 'application/json'
        return response
    else:
        response = jsonify({"message":"The form is missing arguments!"})
        response.headers['Content-Type'] = 'application/json'
        return response

#log in button (temp)
@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    if email:
        with open('users.txt', 'r') as f:
            users = f.readlines()
        if email + '\n' in users:
            return 'Login successful!'
        else:
            return 'Could not find user!'
    else:
        return 'The form is missing arguments!'

#-- ChatGPT api calls
#Initialize ChatGPT
@app.route('/initialize', methods=['POST'])
    # Header authorization attributes from CORS
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def initialize():
    api_key = request.json.get('api_key')
    if api_key is not None:
        config.set_api_key(api_key)
        return jsonify({"status": "initialized", "message": "API key set successfully"})
    else:
        return jsonify({"status": "failed", "message": "API key not found"}) 

@app.route('/selfstart', methods=['POST'])
    # Header authorization attributes from CORS
@cross_origin(origin='*', headers=['Content-Type', 'Authorization'])
def selfstart():
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key is not None:
        config.set_api_key(api_key)
        return jsonify({"status": "initialized", "message": "API key set successfully"})
    else:
        return jsonify({"status": "failed", "message": "API key not found"})    
    

#chatbot
@app.route('/chat', methods=['POST'])
@cross_origin(origin='*', headers=['Content-Type', 'application/json'])
def chat():
    if not config.get_api_key():
        return jsonify({"error": "API key not initialized"}), 401  # Unauthorized
    global messages
    data = request.get_json()
    input = data.get('input',0)
    if input.lower() in ['quit', 'exit', 'bye']:
        response = "Chat ended. Goodbye!"
        messages = []  # Reset messages
    else:
        response, messages = run_conversation(input, messages)
    return jsonify({"response": response, "history": messages})

#image generation

@app.route('/img', methods=['POST'])
@cross_origin(origin='*', headers=['Content-Type', 'application/json'])
def img():
    if not config.get_api_key():
        return jsonify({"error": "API key not initialized"}), 401  # Unauthorized
    data = request.get_json()
    input = data.get('input',0)
    if input.lower() in ['quit', 'exit', 'bye']:
        response = "<p>Image not found</p>"
    else:
        response = gen_image(input)
        response = f"<img src='{response}' alt='Generated Image'>"
    
    return make_response(response)

#error handling here:
if __name__ == '__main__':
    if not os.path.exists('users.txt'):
        open('users.txt', 'w').close()
    app.run(host="0.0.0.0",port=5000)
