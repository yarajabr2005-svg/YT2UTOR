import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.skills.models import Qualification, Skill

User = get_user_model()


class SkillApiTests(APITestCase):
    def test_search_returns_empty_array_when_no_tutors_match(self):
        student = User.objects.create_user(
            email="student@example.com",
            username="student",
            password="pass",
            role="student",
        )
        self.client.force_authenticate(student)

        response = self.client.get("/api/search/?skill=Python")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class QualificationApiTests(APITestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media_root)
        self.override.enable()

        self.admin = User.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="pass",
            role="admin",
        )
        self.tutor = User.objects.create_user(
            email="tutor@example.com",
            username="tutor",
            password="pass",
            role="tutor",
            bio="Tutor bio",
        )
        self.skill = Skill.objects.create(name="Python", category="Programming")

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.media_root, ignore_errors=True)

    def _create_qualification(self, status_value="pending"):
        path = default_storage.save(
            "qualifications/certificate.pdf",
            ContentFile(b"certificate"),
        )
        return Qualification.objects.create(
            tutor=self.tutor,
            skill=self.skill,
            file_url=default_storage.url(path),
            file_name="certificate.pdf",
            file_size=11,
            status=status_value,
        )

    def test_approval_sets_tutor_verified_true(self):
        qualification = self._create_qualification()
        self.client.force_authenticate(self.admin)

        response = self.client.put(
            f"/api/qualifications/{qualification.id}/verify/",
            {"status": "approved"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tutor.refresh_from_db()
        self.assertTrue(self.tutor.verified)

    def test_deleting_last_approved_qualification_unverifies_tutor_and_deletes_file(self):
        qualification = self._create_qualification(status_value="approved")
        self.tutor.verified = True
        self.tutor.save(update_fields=["verified"])
        storage_path = qualification.file_url.removeprefix("/media/")
        self.assertTrue(default_storage.exists(storage_path))

        self.client.force_authenticate(self.tutor)
        response = self.client.delete(f"/api/qualifications/{qualification.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tutor.refresh_from_db()
        self.assertFalse(self.tutor.verified)
        self.assertFalse(default_storage.exists(storage_path))
