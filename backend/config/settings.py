import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()


# 1. BASE DIRECTORY CONFIGURATION
# Since settings.py is in 'backend/config/', we go up TWO levels to reach 'backend/'
BASE_DIR = Path(__file__).resolve().parent.parent

# 2. SECURITY SETTINGS
SECRET_KEY = 'django-insecure-your-temp-key-here'  # Hardcoded since no .env
DEBUG = True
ALLOWED_HOSTS = []

# 3. APPLICATION DEFINITION
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "pgvector.django",

    # Your custom apps
    "apps.users",
    "apps.skills",
    "apps.availability",
    "apps.bookings",
    "apps.reviews",
    "apps.notifications",
    "apps.ai",

]

# 4. AUTHENTICATION CONFIG
AUTH_USER_MODEL = "users.User"
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

# 5. MIDDLEWARE
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
    }
}

# 7. PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# 8. INTERNATIONALIZATION
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Damascus"
USE_I18N = True
USE_TZ = True

# 9. STATIC AND MEDIA FILES
STATIC_URL = "static/"
# Leading slash so FileField.url is path-absolute (/media/...). A relative
# "media/..." breaks request.build_absolute_uri (it joins under the current
# API path) and path-only URLs would load from the Vite origin in the browser.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# 10. REST FRAMEWORK & JWT SETTINGS
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOW_ALL_ORIGINS = True

# 11. EMAIL & NOTIFICATION SETTINGS
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
EMAIL_PAGE_LINE_WIDTH = 999
DEFAULT_FROM_EMAIL = "no-reply@yt2utor.com"
FRONTEND_BASE_URL = "http://localhost:5173"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
