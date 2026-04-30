from rest_framework import serializers

from apps.bookings.models import Booking


class BookingRequestSerializer(serializers.Serializer):
    tutor_id = serializers.UUIDField()
    skill_id = serializers.IntegerField()
    availability_id = serializers.IntegerField()


class BookingResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "student",
            "tutor",
            "skill",
            "availability",
            "booking_date",
            "start_time",
            "end_time",
            "status",
            "request_date",
            "confirmed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class BookingStatusResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "booking_date",
            "start_time",
            "end_time",
            "confirmed_at",
            "updated_at",
        ]
        read_only_fields = fields


class BookingSummarySerializer(serializers.ModelSerializer):
    tutor_email = serializers.EmailField(source="tutor.email", read_only=True)
    student_email = serializers.EmailField(source="student.email", read_only=True)
    student_username = serializers.CharField(source="student.username", read_only=True)
    skill_name = serializers.CharField(source="skill.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "tutor_email",
            "student_email",
            "student_username",
            "skill_name",
            "booking_date",
            "start_time",
            "end_time",
            "status",
            "request_date",
            "confirmed_at",
            "updated_at",
        ]
        read_only_fields = fields
