try:
    from duckduckgo_search import DDGS
    HAS_DDGS = True
except ImportError as e:
    HAS_DDGS = False
    print(f"Warning: duckduckgo_search not installed or failed to import. Error: {e}")

def generate_title(message):
    """Генерира кратко заглавие от първото съобщение."""
    title = message[:50].strip()
    if len(message) > 50:
        title += "..."
    return title

def fetch_internet_results(query):
    if not HAS_DDGS:
        return ">>> ГРЕШКА: Модулът за интернет търсене (duckduckgo-search) не е зареден. Кажи на потребителя, че функцията временно не е налична. <<<\n\n"
    try:
        results = DDGS().text(query, max_results=3)
        if not results:
            return ">>> ИНТЕРНЕТ РЕЗУЛТАТ: Не е намерена информация по темата. <<<\n\n"
        text = ">>> ЕТО АКТУАЛНИ РЕЗУЛТАТИ ОТ ИНТЕРНЕТ ПО ТЕМАТА:\n"
        for i, r in enumerate(results):
            text += f"{i+1}. Заглавие: {r.get('title')}\nТекст: {r.get('body')}\nЛинк: {r.get('href')}\n\n"
        text += "ВНИМАНИЕ: Използвай ГОРНАТА ИНФОРМАЦИЯ, за да отговориш на потребителя! НЕ казвай, че нямаш достъп до интернет.<<<\n\n"
        return text
    except Exception as e:
        print(f"Internet search error: {e}")
        return f">>> ГРЕШКА при търсене: {str(e)}. Съобщи на потребителя, че има проблем с връзката. <<<\n\n"
