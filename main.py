import uuid
import requests
from datetime import datetime
from flask import Flask, render_template, jsonify, request

from config import MISTRAL_API_KEY, MISTRAL_API_URL, TEXT_MODEL, SYSTEM_PROMPT, REASONING_PROMPT
from utils import generate_title, fetch_internet_results

app = Flask(__name__)

# Съхранява всички разговори
chats = {}


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/chats', methods=['GET'])
def list_chats():
    chat_list = []
    for cid, chat in chats.items():
        chat_list.append({
            'id': cid,
            'title': chat['title'],
            'created': chat['created'],
            'messageCount': len(chat['messages'])
        })
    chat_list.sort(key=lambda x: x['created'], reverse=True)
    return jsonify(chat_list)


@app.route('/api/chats', methods=['POST'])
def create_chat():
    chat_id = str(uuid.uuid4())[:8]
    chats[chat_id] = {
        'title': 'New chat',
        'created': datetime.now().isoformat(),
        'messages': []
    }
    return jsonify({'id': chat_id, 'title': chats[chat_id]['title']})


@app.route('/api/chats/<chat_id>', methods=['GET'])
def get_chat(chat_id):
    if chat_id not in chats:
        return jsonify({'error': 'Chat not found.'}), 404
    return jsonify({
        'id': chat_id,
        'title': chats[chat_id]['title'],
        'messages': chats[chat_id]['messages']
    })


@app.route('/api/chats/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    if chat_id in chats:
        del chats[chat_id]
    return jsonify({'status': 'ok'})


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '').strip()
    chat_id = data.get('chatId', '')
    reasoning = data.get('reasoning', False)
    web_search = data.get('webSearch', False)

    if not user_message:
        return jsonify({'error': 'Please enter a message.'}), 400

    # Създаваме нов чат ако няма
    if not chat_id or chat_id not in chats:
        chat_id = str(uuid.uuid4())[:8]
        chats[chat_id] = {
            'title': generate_title(user_message),
            'created': datetime.now().isoformat(),
            'messages': []
        }

    chat_data = chats[chat_id]

    if len(chat_data['messages']) == 0:
        chat_data['title'] = generate_title(user_message)

    # Записваме съобщението в историята
    chat_data['messages'].append({
        'role': 'user',
        'content': user_message,
        'time': datetime.now().strftime('%H:%M')
    })

    # Избираме системен промпт
    system_prompt = REASONING_PROMPT if reasoning else SYSTEM_PROMPT

    # Подготвяме API съобщенията
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    # Изграждаме историята за API-то (последните 20 съобщения)
    api_messages = [{"role": "system", "content": system_prompt}]

    for i, msg in enumerate(chat_data['messages'][-20:]):
        if msg['role'] == 'user':
            content = msg['content']
            # Добавяме интернет контекст само към последното съобщение, ако е активирано
            if web_search and i == len(chat_data['messages'][-20:]) - 1:
                search_ctx = fetch_internet_results(user_message)
                if search_ctx:
                    content = search_ctx + content
            api_messages.append({"role": "user", "content": content})
        else:
            api_messages.append({"role": "assistant", "content": msg.get('fullContent', msg['content'])})

    payload = {
        "model": TEXT_MODEL,
        "messages": api_messages
    }

    try:
        response = requests.post(MISTRAL_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()
        assistant_message = result['choices'][0]['message']['content']

        # Записваме пълния отговор (с think тагове) в историята
        chat_data['messages'].append({
            'role': 'assistant',
            'content': assistant_message,
            'fullContent': assistant_message,
            'time': datetime.now().strftime('%H:%M')
        })

        return jsonify({
            'reply': assistant_message,
            'chatId': chat_id,
            'title': chat_data['title']
        })

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request took too long. Please try again.'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Error connecting to Mistral AI: {str(e)}'}), 500
    except (KeyError, IndexError):
        return jsonify({'error': 'Unexpected response from Mistral AI.'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)