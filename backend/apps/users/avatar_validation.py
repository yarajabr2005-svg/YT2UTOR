from PIL import Image

MAX_AVATAR_BYTES = 2 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_avatar_file(uploaded):
    """
    Ensure file is a readable image within size limits. Resets read pointer to 0.
    Raises ValueError with a user-facing message on failure.
    """
    if uploaded.size > MAX_AVATAR_BYTES:
        raise ValueError("Image must be 2MB or smaller.")

    uploaded.seek(0)
    try:
        with Image.open(uploaded) as img:
            fmt = img.format
            if fmt not in ALLOWED_FORMATS:
                raise ValueError("Use a JPEG, PNG, or WebP image.")
            img.verify()
    except ValueError:
        raise
    except Exception:
        raise ValueError("Invalid image file.")
    uploaded.seek(0)
