# CodeX Chatbot

CodeX is a web-based chatbot application built with Python and Flask. It uses Mistral AI for generating responses and is designed for educational purposes.

## Features
- **Minimalist design (Claude-like):** Convenient interface with a dark theme.
- **Chat history:** Management of multiple sessions and history saving.
- **Web search:** Ability to enrich answers with up-to-date data.
- **Developer tools:** Proper code formatting, markdown support, lists, etc.
- **Reasoning mode:** Option for step-by-step reasoning before generating the final response.

## Installation

1. Clone the repository:
   ```bash
   git clone <URL>
   cd Chat
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # For MacOS/Linux
   # .venv\Scripts\activate   # For Windows
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configuration:
   Copy `config.example.py` to `config.py` and insert your Mistral API key.
   ```bash
   cp config.example.py config.py
   ```

5. Run the application:
   ```bash
   python main.py
   ```

Open your browser at [http://localhost:5001](http://localhost:5001).
