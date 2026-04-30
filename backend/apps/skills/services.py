from typing import List

from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import IntegrityError, transaction
from django.db.models import Prefetch, Q
from django.utils import timezone

# ⭐️ NEW — needed for availability filtering
from apps.availability.models import Availability
from datetime import time as time_parse

from .models import Skill, UserSkill, Qualification

User = get_user_model()


class DuplicateSkillError(Exception):
    pass


class FileUploadError(Exception):
    pass


class TutorSkillService:
    @staticmethod
    def add_skills_for_tutor(tutor: User, skill_ids: List[int]) -> List[UserSkill]:
        if tutor.role != "tutor":
            raise PermissionError("Only tutors can add skills.")

        skills = list(Skill.objects.filter(id__in=skill_ids))
        if not skills:
            raise ValueError("No valid skills found for the given IDs.")

        created_user_skills: List[UserSkill] = []

        with transaction.atomic():
            for skill in skills:
                try:
                    us, created = UserSkill.objects.get_or_create(
                        user=tutor,
                        skill=skill,
                        defaults={"skill_type": "teaches"},
                    )
                    if created:
                        created_user_skills.append(us)
                    else:
                        raise DuplicateSkillError(f"Skill '{skill.name}' already added.")
                except IntegrityError:
                    raise DuplicateSkillError(f"Skill '{skill.name}' already added.")

        # ✅ AI hook: rebuild embedding for this tutor (non-blocking)
        try:
            from apps.ai.services import AIService
            AIService.build_tutor_embedding(tutor)
        except Exception:
            # If AI fails, we silently ignore to avoid breaking skills slice
            pass

        return created_user_skills

    @staticmethod
    def edit_skills_for_tutor(tutor: User, skill_ids: List[int]) -> List[UserSkill]:
        if tutor.role != "tutor":
            raise PermissionError("Only tutors can edit skills.")

        skills = list(Skill.objects.filter(id__in=skill_ids))
        if not skills:
            raise ValueError("No valid skills found for the given IDs.")

        with transaction.atomic():
            current_user_skills = list(
                UserSkill.objects.filter(user=tutor, skill_type="teaches").select_related("skill")
            )
            current_skill_ids = {us.skill_id for us in current_user_skills}
            new_skill_ids = set(skill_ids)

            to_add_ids = new_skill_ids - current_skill_ids
            to_remove_ids = current_skill_ids - new_skill_ids

            if to_remove_ids:
                UserSkill.objects.filter(
                    user=tutor,
                    skill_id__in=to_remove_ids,
                    skill_type="teaches"
                ).delete()

            for sid in to_add_ids:
                skill = next((s for s in skills if s.id == sid), None)
                if skill:
                    UserSkill.objects.create(
                        user=tutor,
                        skill=skill,
                        skill_type="teaches",
                    )

        # ✅ AI hook: rebuild embedding for this tutor (non-blocking)
        try:
            from apps.ai.services import AIService
            AIService.build_tutor_embedding(tutor)
        except Exception:
            # If AI fails, we silently ignore to avoid breaking skills slice
            pass

        return list(
            UserSkill.objects.filter(user=tutor, skill_type="teaches").select_related("skill")
        )


class QualificationService:
    @staticmethod
    def _storage_path_from_url(file_url: str) -> str:
        if file_url.startswith(settings.MEDIA_URL):
            return file_url[len(settings.MEDIA_URL):]
        return file_url.lstrip("/")

    @staticmethod
    def upload_qualification(tutor: User, skill_id: int, file) -> Qualification:
        if tutor.role != "tutor":
            raise PermissionError("Only tutors can upload qualifications.")

        try:
            skill = Skill.objects.get(id=skill_id)
        except Skill.DoesNotExist:
            raise ValueError("Skill not found.")

        try:
            path = default_storage.save(f"qualifications/{file.name}", file)
            file_url = default_storage.url(path)
        except Exception as e:
            raise FileUploadError("Upload failed. Please try again.") from e

        qualification = Qualification.objects.create(
            tutor=tutor,
            skill=skill,
            file_url=file_url,
            file_name=file.name,
            file_size=file.size,
            status="pending",
        )
        return qualification
    @staticmethod
    def delete_qualification(tutor: User, qual_id: int):
        try:
            qualification = Qualification.objects.get(id=qual_id, tutor=tutor)
        except Qualification.DoesNotExist:
            return None

        was_approved = qualification.status == "approved"
        storage_path = QualificationService._storage_path_from_url(qualification.file_url)

        qualification.delete()
        if storage_path:
            default_storage.delete(storage_path)

        if was_approved and not Qualification.objects.filter(
            tutor=tutor,
            status="approved",
        ).exists():
            tutor.verified = False
            tutor.save(update_fields=["verified", "updated_at"])

        return True

    @staticmethod
    def list_pending_qualifications():
        return (
            Qualification.objects.filter(status="pending")
            .select_related("tutor", "skill")
            .order_by("uploaded_at")
        )

    @staticmethod
    def verify_qualification(admin_user: User, qual_id: int, status: str, notes: str = "") -> Qualification:
        if admin_user.role != "admin":
            raise PermissionError("Only admins can verify qualifications.")

        try:
            qualification = Qualification.objects.select_related("tutor", "skill").get(id=qual_id)
        except Qualification.DoesNotExist:
            raise ValueError("Qualification not found.")

        if qualification.status in ["approved", "rejected"]:
            raise ValueError("Qualification has already been reviewed.")

        qualification.status = status
        qualification.notes = notes
        qualification.admin = admin_user
        qualification.reviewed_at = timezone.now()
        qualification.save()

        if status == "approved" and not qualification.tutor.verified:
            qualification.tutor.verified = True
            qualification.tutor.save(update_fields=["verified", "updated_at"])

        return qualification


class SkillService:
    @staticmethod
    def search_tutors(skill_name: str = "", tutor_name: str = "", day=None, time=None):
        tutors = (
            User.objects.filter(role="tutor")
            .prefetch_related(
                Prefetch(
                    "userskill_set",
                    queryset=UserSkill.objects.filter(skill_type="teaches").select_related("skill"),
                )
            )
        )

        if skill_name:
            tutors = tutors.filter(
                userskill__skill__name__icontains=skill_name
            ).distinct()

        if tutor_name:
            tutors = tutors.filter(
                Q(username__icontains=tutor_name) | Q(email__icontains=tutor_name)
            ).distinct()

        # ⭐️ NEW — availability filter (ONLY change)
        if day and time:
            try:
                parsed_time = time_parse.fromisoformat(time)
            except ValueError:
                return User.objects.none()

            tutors = tutors.filter(
                availability__day_of_week=day,
                availability__start_time__lte=parsed_time,
                availability__end_time__gt=parsed_time,
            ).distinct()

        return tutors

    @staticmethod
    def get_tutor_public_profile(tutor_id):
        try:
            tutor = (
                User.objects.filter(id=tutor_id, role="tutor")
                .prefetch_related(
                    Prefetch(
                        "userskill_set",
                        queryset=UserSkill.objects.filter(skill_type="teaches").select_related("skill"),
                    ),
                    Prefetch(
                        "qualification_set",
                        queryset=Qualification.objects.filter(status="approved").select_related("skill"),
                    ),
                )
                .get()
            )
        except User.DoesNotExist:
            raise ValueError("Tutor not found.")

        tutor.skills = [us.skill for us in tutor.userskill_set.all()]
        tutor.qualifications = list(tutor.qualification_set.all())
        return tutor
