from django.apps import AppConfig
from django.db.models.signals import post_migrate


class UsersConfig(AppConfig):
    name = 'apps.users'

    def ready(self):
        post_migrate.connect(seed_demo_data, sender=self, dispatch_uid="yt2utor_seed_demo_data")


def seed_demo_data(sender, **kwargs):
    import os
    import sys

    from django.db import OperationalError, ProgrammingError

    if os.getenv("YT2UTOR_AUTO_SEED", "true").lower() in {"0", "false", "no"}:
        return
    if "test" in sys.argv:
        return

    try:
        from .seed import seed_initial_data

        seed_initial_data()
    except (OperationalError, ProgrammingError):
        # Database tables may not exist yet in partial setup commands.
        return
