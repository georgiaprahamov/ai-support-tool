try:
    from duckduckgo_search import DDGS
    HAS_DDGS = True
except ImportError as e:
    HAS_DDGS = False
    print(f"Warning: duckduckgo_search not installed or failed to import. Error: {e}")

def generate_title(message):
    """Generates a short title from the first message."""
    title = message[:50].strip()
    if len(message) > 50:
        title += "..."
    return title

def fetch_internet_results(query):
    if not HAS_DDGS:
        return ">>> ERROR: The internet search module (duckduckgo-search) is not loaded. Tell the user the feature is temporarily unavailable. <<<\n\n"
    try:
        results = DDGS().text(query, max_results=3)
        if not results:
            return ">>> INTERNET RESULT: No information found on the topic. <<<\n\n"
        text = ">>> HERE ARE RECENT INTERNET RESULTS ON THE TOPIC:\n"
        for i, r in enumerate(results):
            text += f"{i+1}. Title: {r.get('title')}\nText: {r.get('body')}\nLink: {r.get('href')}\n\n"
        text += "WARNING: Use the ABOVE INFORMATION to answer the user! DO NOT say you don't have internet access.<<<\n\n"
        return text
    except Exception as e:
        print(f"Internet search error: {e}")
        return f">>> Search ERROR: {str(e)}. Tell the user there is a connection problem. <<<\n\n"
