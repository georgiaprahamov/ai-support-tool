def generate_title(message):
    """Generates a short title from the first message."""
    title = message[:50].strip()
    if len(message) > 50:
        title += "..."
    return title
