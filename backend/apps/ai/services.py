from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, time as time_cls
from typing import List, Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

import torch
from sentence_transformers import SentenceTransformer, util

from apps.ai.models import TutorEmbedding
from apps.skills.models import UserSkill
from apps.availability.models import Availability

User = get_user_model()

# ✅ SBERT model: Sentence Transformers (SBERT) with all-MiniLM-L6-v2
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model: Optional[SentenceTransformer] = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


# ✅ Minimum cosine similarity for a tutor to be considered relevant at all.
# With SBERT all-MiniLM-L6-v2, < 0.20 is essentially unrelated.
MIN_SIMILARITY = 0.20

# ✅ Urgency keywords (you can adjust this list)
URGENCY_KEYWORDS = [
    "exam",
    "baccalaureate",
    "bac",
    "test",
    "quiz",
    "tomorrow",
    "urgent",
    "deadline",
    "final",
    "midterm",
]


def is_urgent_query(text: str) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in URGENCY_KEYWORDS)


@dataclass
class AIService:
    """
    AI Recommendation Engine:
    - Semantic search with embeddings (SBERT all-MiniLM-L6-v2)
    - Urgency detection
    - Rating-aware ranking
    """

    @staticmethod
    @transaction.atomic
    def build_tutor_embedding(tutor: User) -> TutorEmbedding:
        """
        Phase 1: Pre-computation.
        Called when tutor skills change (or via management command).
        """
        if tutor.role != "tutor":
            raise ValueError("Embeddings are only for tutors.")

        # Collect tutor skills (names + categories)
        user_skills = (
            UserSkill.objects
            .filter(user=tutor, skill_type="teaches")
            .select_related("skill")
        )

        if not user_skills.exists():
            # If tutor has no skills, delete any existing embedding.
            TutorEmbedding.objects.filter(tutor=tutor).delete()
            raise ValueError("Tutor has no teaching skills to embed.")

        skill_texts = [
            f"{us.skill.name} ({us.skill.category})"
            for us in user_skills
        ]
        combined_text = " | ".join(skill_texts)

        model = get_model()
        embedding_vector = model.encode(combined_text, convert_to_numpy=True)

        # Save or update embedding
        obj, _ = TutorEmbedding.objects.update_or_create(
            tutor=tutor,
            defaults={"embedding": embedding_vector},
        )
        return obj

    @staticmethod
    def _has_urgent_availability_within_24h(tutor: User) -> bool:
        """
        For urgent queries without explicit day/time:
        Check if tutor has any availability in the next 24 hours.
        """
        now = timezone.localtime()
        end = now + timedelta(hours=24)

        today = now.date()
        tomorrow = end.date()

        # Slots for today or tomorrow
        slots = Availability.objects.filter(tutor=tutor)

        for slot in slots:
            slot_date = slot.week_start_date + timedelta(days=slot.day_of_week)
            if slot_date < today or slot_date > tomorrow:
                continue

            # If slot_date is today, ensure time is in the future
            if slot_date == today and slot.end_time <= now.time():
                continue

            return True

        return False

    @staticmethod
    def _matches_day_time(
        tutor: User,
        day: Optional[int],
        time_value: Optional[time_cls],
    ) -> bool:
        """
        If day/time are provided, check if tutor has availability that matches.
        """
        if day is None or time_value is None:
            return False

        return Availability.objects.filter(
            tutor=tutor,
            day_of_week=day,
            start_time__lte=time_value,
            end_time__gt=time_value,
        ).exists()

    @staticmethod
    def recommend_tutors(
        query: str,
        day: Optional[int] = None,
        time_value: Optional[time_cls] = None,
        skill_id: Optional[int] = None,
    ) -> List[dict]:
        """
        Phase 2: Query-time recommendation.

        Steps:
        1. Encode student query with SBERT (all-MiniLM-L6-v2).
        2. If skill_id is provided, keep only tutors who teach that exact skill.
        3. Compute cosine similarity with tutor embeddings.
        4. Apply rating boost (rating / 10).
        5. Apply urgency boost (+0.3) if urgent and tutor is available soon.
        6. Return top 3 tutors.
        """
        model = get_model()
        query_embedding = model.encode(query, convert_to_tensor=True)

        urgent = is_urgent_query(query)

        # Base queryset: all tutors with embeddings
        embeddings = (
            TutorEmbedding.objects
            .select_related("tutor")
            .filter(tutor__role="tutor")
        )

        # ⭐️ If the student picked a specific skill from the dropdown,
        # only recommend tutors who are verified to teach that exact skill.
        if skill_id is not None:
            tutor_ids_with_skill = (
                UserSkill.objects
                .filter(skill_id=skill_id, skill_type="teaches")
                .values_list("user_id", flat=True)
            )
            embeddings = embeddings.filter(tutor_id__in=tutor_ids_with_skill)

        if not embeddings.exists():
            return []

        results = []

        for emb in embeddings:
            tutor = emb.tutor

            # Cosine similarity between query and tutor embedding
            tutor_embedding_tensor = torch.tensor(
                emb.embedding, dtype=torch.float32, device=query_embedding.device
            )
            similarity_tensor = util.cos_sim(query_embedding, tutor_embedding_tensor)
            similarity = float(similarity_tensor.item())

            # ⛔ For free-text searches (no skill_id), use a similarity gate
            # so a 5-star tutor in an unrelated subject doesn't outrank everyone.
            if skill_id is None and similarity < MIN_SIMILARITY:
                continue

            # Rating boost
            rating = float(tutor.average_rating or 0)
            rating_boost = rating / 30.0

            # Urgency boost
            urgency_boost = 0.0
            if urgent:
                if day is not None and time_value is not None:
                    if AIService._matches_day_time(tutor, day, time_value):
                        urgency_boost = 0.3
                else:
                    if AIService._has_urgent_availability_within_24h(tutor):
                        urgency_boost = 0.3

            # Combine multiplicatively so rating/urgency *amplify* similarity
            # instead of overriding a poor semantic match.
            final_score = similarity * (1 + rating_boost + urgency_boost)

            results.append(
                {
                    "tutor": tutor,
                    "similarity": similarity,
                    "rating_boost": rating_boost,
                    "urgency_boost": urgency_boost,
                    "final_score": final_score,
                }
            )

        # Sort by final_score descending and take top 3
        results.sort(key=lambda r: r["final_score"], reverse=True)
        top3 = results[:3]

        return top3
