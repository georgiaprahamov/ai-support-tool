# AI Support Tool

AI Support Tool е уеб-базиран ИТ диагностичен асистент, изграден с Python и Flask. Той използва Mistral AI за анализиране на технически грешки и предоставяне на стъпка-по-стъпка решения за хардуерни и софтуерни проблеми.

## Характеристики
- **ИТ Диагностика:** Професионален анализ на системни грешки и хардуерни проблеми.
- **Модерен Widget Дизайн:** Интерфейс с чат балончета, оптимизиран за вграждане в корпоративни сайтове.
- **Персистентност:** Пълна история на чатовете, съхранявана локално в JSON база данни.
- **Bulgarian Language Support:** Всички анализи и решения се предоставят на български език.

## Инсталация

1. Клонирайте хранилището:
   ```bash
   git clone https://github.com/georgiaprahamov/ai-support-tool.git
   cd ai-support-tool
   ```

2. Създайте виртуална среда и я активирайте:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # За MacOS/Linux
   ```

3. Инсталирайте зависимостите:
   ```bash
   pip install -r requirements.txt
   ```

4. Конфигурация:
   Копирайте `config.example.py` в `config.py` и поставете вашия Mistral API ключ.
   ```bash
   cp config.example.py config.py
   ```

5. Стартирайте приложението:
   ```bash
   python3 main.py
   ```

Отворете браузъра на [http://localhost:5001](http://localhost:5001).
