from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import os, openai

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500"])

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

#API call for chatbot
@app.route('/chat', methods=['POST'])
def chat():
    message = request.json['message']
    response = openai.ChatCompletion.create(
      model="gpt-3.5-turbo",
      messages=[
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": message},
      ]
    )
    return jsonify(response.choices[0].message['content'])

#error handling here:
if __name__ == '__main__':
    if not os.path.exists('users.txt'):
        open('users.txt', 'w').close()
    app.run(debug=True)
