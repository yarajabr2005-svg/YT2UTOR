"""Absolute profile picture URL for API responses."""


def build_profile_picture_url(user, request):
    pic = getattr(user, "profile_picture", None)
    if not pic or not getattr(pic, "name", None):
        return None
    url = pic.url
    # Path-absolute (/media/...) is required: build_absolute_uri otherwise
    # urljoin()s under the current request path (e.g. /api/.../media/...).
    if not url.startswith(("http://", "https://", "/")):
        url = "/" + url.lstrip("/")
    if request is not None:
        return request.build_absolute_uri(url)
    return url
