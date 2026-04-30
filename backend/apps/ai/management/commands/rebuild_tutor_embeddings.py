from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.ai.services import AIService

User = get_user_model()


class Command(BaseCommand):
    help = "Rebuild embeddings for all tutors (AI Recommendation Engine Phase 1)."

    def handle(self, *args, **options):
        self.stdout.write("Rebuilding tutor embeddings...")
        tutors = User.objects.filter(role="tutor")

        count = 0
        for tutor in tutors:
            try:
                AIService.build_tutor_embedding(tutor)
                count += 1
            except Exception as e:
                # We log but do not stop the whole process
                self.stderr.write(f"Failed to build embedding for {tutor.email}: {e}")

        self.stdout.write(self.style.SUCCESS(f"Done. Embeddings rebuilt for {count} tutors."))
