from django.db import models
from django.contrib.auth import get_user_model
from pgvector.django import VectorField

User = get_user_model()


class TutorEmbedding(models.Model):
    """
    Table 8: Tutor_Embeddings

    - tutor_id: UUID (PK, FK to users.id, ON DELETE CASCADE)
    - embedding: VECTOR(384) NOT NULL
    - updated_at: TIMESTAMP NOT NULL DEFAULT NOW()
    """

    tutor = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="embedding",
    )
    embedding = VectorField(dimensions=384)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tutor_embeddings"

    def __str__(self):
        return f"Embedding for {self.tutor.email}"
