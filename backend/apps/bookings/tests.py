from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.availability.models import Availability
from apps.bookings.models import Booking
from apps.skills.models import Skill, UserSkill

User = get_user_model()


class BookingApiTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email="student@example.com",
            username="student",
            password="pass",
            role="student",
        )
        self.tutor = User.objects.create_user(
            email="tutor@example.com",
            username="tutor",
            password="pass",
            role="tutor",
            bio="Tutor bio",
        )
        self.python = Skill.objects.create(name="Python", category="Programming")
        self.math = Skill.objects.create(name="Math", category="STEM")
        UserSkill.objects.create(user=self.tutor, skill=self.python, skill_type="teaches")
        self.availability = Availability.objects.create(
            tutor=self.tutor,
            week_start_date=date.today() + timedelta(days=7),
            day_of_week=1,
            start_time=time(10, 0),
            end_time=time(11, 0),
        )

    def test_create_booking_requires_tutor_to_teach_requested_skill(self):
        self.client.force_authenticate(self.student)

        response = self.client.post(
            "/api/bookings/",
            {
                "tutor_id": str(self.tutor.id),
                "skill_id": self.math.id,
                "availability_id": self.availability.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")

    def test_confirm_booking_returns_slot_already_booked_when_slot_was_confirmed(self):
        first = Booking.objects.create(
            student=self.student,
            tutor=self.tutor,
            skill=self.python,
            availability=self.availability,
            booking_date=self.availability.week_start_date + timedelta(days=1),
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            status="pending",
        )
        second_student = User.objects.create_user(
            email="student2@example.com",
            username="student2",
            password="pass",
            role="student",
        )
        second = Booking.objects.create(
            student=second_student,
            tutor=self.tutor,
            skill=self.python,
            availability=self.availability,
            booking_date=self.availability.week_start_date + timedelta(days=1),
            start_time=self.availability.start_time,
            end_time=self.availability.end_time,
            status="pending",
        )

        self.client.force_authenticate(self.tutor)
        first_response = self.client.patch(f"/api/bookings/{first.id}/confirm/")
        second_response = self.client.patch(f"/api/bookings/{second.id}/confirm/")

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(second_response.data["code"], "SLOT_ALREADY_BOOKED")

    def test_list_bookings_returns_empty_array(self):
        self.client.force_authenticate(self.student)

        response = self.client.get("/api/bookings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_bookings_supports_date_filters_and_pending_upcoming_types(self):
        future_date = date.today() + timedelta(days=8)
        later_date = date.today() + timedelta(days=9)
        pending = Booking.objects.create(
            student=self.student,
            tutor=self.tutor,
            skill=self.python,
            availability=self.availability,
            booking_date=future_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            status="pending",
        )
        confirmed = Booking.objects.create(
            student=self.student,
            tutor=self.tutor,
            skill=self.python,
            availability=Availability.objects.create(
                tutor=self.tutor,
                week_start_date=date.today() + timedelta(days=7),
                day_of_week=2,
                start_time=time(12, 0),
                end_time=time(13, 0),
            ),
            booking_date=later_date,
            start_time=time(12, 0),
            end_time=time(13, 0),
            status="confirmed",
        )

        self.client.force_authenticate(self.student)
        pending_response = self.client.get("/api/bookings/?type=pending")
        upcoming_response = self.client.get("/api/bookings/?type=upcoming")
        filtered_response = self.client.get(
            f"/api/bookings/?date_from={later_date.isoformat()}&date_to={later_date.isoformat()}"
        )

        self.assertEqual([item["id"] for item in pending_response.data], [str(pending.id)])
        self.assertEqual([item["id"] for item in upcoming_response.data], [str(confirmed.id)])
        self.assertEqual([item["id"] for item in filtered_response.data], [str(confirmed.id)])
